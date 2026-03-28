import sys
import os

# Если запущены как exe — ищем ffmpeg рядом с server.exe
if getattr(sys, 'frozen', False):
    base_dir = os.path.dirname(sys.executable)
    os.environ['PATH'] = base_dir + os.pathsep + os.environ.get('PATH', '')

import asyncio
import uuid
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

sys.path.insert(0, str(Path(__file__).parent))

from core.downloader import Downloader
from core.history import load_history, save_entry, clear_history
from utils.file_utils import open_file, open_folder

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

downloader = Downloader()

# Активные WebSocket соединения: job_id -> websocket
active_ws: dict[str, WebSocket] = {}


# ─── Модели ────────────────────────────────────────────────────────────────────

class DownloadRequest(BaseModel):
    url: str
    quality: str = "best"
    format: str = "mp4"
    platform: str = "windows"
    audio_codec: str = "aac"
    download_dir: Optional[str] = None
    speed_limit: Optional[str] = None
    subtitles: bool = False
    sub_lang: str = "ru"
    embed_subs: bool = True
    playlist: bool = False
    thumbnail: bool = False
    sponsorblock: bool = False

class OpenRequest(BaseModel):
    filepath: str


# ─── REST эндпоинты ────────────────────────────────────────────────────────────

@app.get("/history")
def get_history():
    return load_history()


@app.delete("/history")
def delete_history():
    clear_history()
    return {"ok": True}


@app.post("/open-file")
def api_open_file(req: OpenRequest):
    ok = open_file(req.filepath)
    return {"ok": ok}


@app.post("/open-folder")
def api_open_folder(req: OpenRequest):
    open_folder(req.filepath)
    return {"ok": True}


@app.get("/default-folders")
def get_default_folders():
    """Возвращает стандартные папки для текущего пользователя."""
    home = Path.home()
    folders = []
    candidates = [
        ("Videos",    home / "Videos"),
        ("Downloads", home / "Downloads"),
        ("Pictures",  home / "Pictures"),
        ("Documents", home / "Documents"),
        ("Desktop",   home / "Desktop"),
    ]
    for label, path in candidates:
        if path.exists():
            folders.append({"label": label, "path": str(path)})
    return folders


@app.delete("/file")
def api_delete_file(req: OpenRequest):
    """Удаляет файл с диска и запись из истории."""
    from core.history import load_history, HISTORY_FILE
    import json

    path = Path(req.filepath)
    # Удаляем файл
    if path.exists():
        try:
            path.unlink()
        except Exception as e:
            return {"ok": False, "error": str(e)}

    # Убираем запись из истории
    history = load_history()
    history = [h for h in history if h.get("filepath") != req.filepath]
    with open(HISTORY_FILE, "w", encoding="utf-8") as f:
        json.dump(history, f, ensure_ascii=False, indent=2)

    return {"ok": True}


# ─── Получение информации о плейлисте ─────────────────────────────────────────

class PlaylistInfoRequest(BaseModel):
    url: str

@app.post("/playlist-info")
async def get_playlist_info(req: PlaylistInfoRequest):
    """Возвращает список треков плейлиста без скачивания."""
    import yt_dlp
    try:
        opts = {
            "quiet": True,
            "no_warnings": True,
            "extract_flat": True,  # только метаданные, без скачивания
            "noplaylist": False,
        }
        with yt_dlp.YoutubeDL(opts) as ydl:
            info = ydl.extract_info(req.url, download=False)
            if not info:
                return {"ok": False, "error": "Не удалось получить информацию"}

            entries = info.get("entries", [])
            if not entries:
                # Это не плейлист — одно видео
                return {"ok": True, "is_playlist": False, "entries": []}

            tracks = []
            for entry in entries:
                if not entry:
                    continue
                tracks.append({
                    "id":        entry.get("id", ""),
                    "url":       entry.get("url") or entry.get("webpage_url") or f"https://www.youtube.com/watch?v={entry.get('id', '')}",
                    "title":     entry.get("title", "Без названия"),
                    "duration":  entry.get("duration"),
                    "thumbnail": entry.get("thumbnail"),
                })

            return {
                "ok": True,
                "is_playlist": True,
                "title": info.get("title", "Плейлист"),
                "entries": tracks,
            }
    except Exception as e:
        return {"ok": False, "error": str(e)}


# ─── Плейлист инфо ────────────────────────────────────────────────────────────

class PlaylistRequest(BaseModel):
    url: str

@app.post("/playlist-info")
def get_playlist_info(req: PlaylistRequest):
    import yt_dlp
    try:
        opts = {
            "quiet": True,
            "no_warnings": True,
            "extract_flat": True,  # не скачиваем, только мета
            "skip_download": True,
        }
        with yt_dlp.YoutubeDL(opts) as ydl:
            info = ydl.extract_info(req.url, download=False)

        if not info:
            return {"ok": False, "is_playlist": False, "entries": []}

        entries_raw = info.get("entries", [])
        if not entries_raw:
            return {"ok": True, "is_playlist": False, "entries": []}

        entries = []
        for i, entry in enumerate(entries_raw):
            if not entry:
                continue
            # Длительность
            dur = entry.get("duration")
            dur_str = None
            if dur:
                mins, secs = divmod(int(dur), 60)
                hrs, mins = divmod(mins, 60)
                dur_str = f"{hrs}:{mins:02d}:{secs:02d}" if hrs else f"{mins}:{secs:02d}"

            entries.append({
                "index":     i + 1,
                "url":       entry.get("url") or entry.get("webpage_url") or req.url,
                "title":     entry.get("title", f"Трек {i+1}"),
                "duration":  dur_str,
                "thumbnail": entry.get("thumbnail"),
            })

        return {
            "ok":          True,
            "is_playlist": len(entries) > 1,
            "title":       info.get("title") or info.get("playlist_title", "Плейлист"),
            "entries":     entries,
        }
    except Exception as e:
        return {"ok": False, "is_playlist": False, "entries": [], "error": str(e)}


# ─── WebSocket для скачивания ──────────────────────────────────────────────────

@app.websocket("/ws/download")
async def ws_download(ws: WebSocket):
    await ws.accept()
    loop = asyncio.get_event_loop()

    try:
        data = await ws.receive_json()
        req = DownloadRequest(**data)

        settings = req.model_dump(exclude={"url"})
        # Переименуем ключи под downloader.py
        settings["quality"] = _map_quality(req.quality)
        # Всегда ставим дефолтную папку если не передана
        settings["download_dir"] = req.download_dir or str(Path.home() / "Downloads")
        if req.speed_limit:
            settings["speed_limit"] = req.speed_limit

        await ws.send_json({"type": "started"})

        def on_progress(percent, speed, downloaded_bytes, total_bytes):
            asyncio.run_coroutine_threadsafe(
                ws.send_json({
                    "type": "progress",
                    "percent": round(percent, 1),
                    "speed": speed,
                    "downloaded_bytes": downloaded_bytes,
                    "total_bytes": total_bytes,
                }),
                loop,
            )

        def on_processing():
            asyncio.run_coroutine_threadsafe(
                ws.send_json({"type": "processing"}),
                loop,
            )

        settings["on_processing"] = on_processing

        def on_complete(info):
            save_entry(info)
            asyncio.run_coroutine_threadsafe(
                ws.send_json({"type": "complete", "item": info}),
                loop,
            )

        def on_error(error):
            asyncio.run_coroutine_threadsafe(
                ws.send_json({"type": "error", "message": error}),
                loop,
            )

        # Флаг отмены — передаём в downloader
        cancelled = [False]
        paused    = [False]
        settings["cancelled"] = cancelled
        settings["paused"]    = paused

        downloader.download(
            req.url,
            settings=settings,
            on_progress=on_progress,
            on_complete=on_complete,
            on_error=on_error,
        )

        # Держим соединение открытым пока не получим complete/error
        while True:
            msg = await ws.receive_json()
            if msg.get("type") == "cancel":
                # Реальная отмена — ставим флаг, yt-dlp остановится
                cancelled[0] = True
                break
            elif msg.get("type") == "pause":
                paused[0] = True
                asyncio.run_coroutine_threadsafe(
                    ws.send_json({"type": "paused"}), loop
                )
            elif msg.get("type") == "resume":
                paused[0] = False
                asyncio.run_coroutine_threadsafe(
                    ws.send_json({"type": "resumed"}), loop
                )

    except WebSocketDisconnect:
        pass
    except Exception as e:
        try:
            await ws.send_json({"type": "error", "message": str(e)})
        except Exception:
            pass


def _map_quality(q: str) -> str:
    mapping = {
        "best":  "Лучшее",
        "4k":    "4K",
        "1440p": "1440p",
        "1080p": "1080p",
        "720p":  "720p",
        "480p":  "480p",
        "360p":  "360p",
        "240p":  "240p",
        "144p":  "144p",
    }
    return mapping.get(q.lower(), "Лучшее")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=7842)