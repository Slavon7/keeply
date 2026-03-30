import yt_dlp
import threading
import traceback
import time as _time
from pathlib import Path

SPEED_MAP = {
    "Без лимита": None,
    "128 KB/s":   128  * 1024,
    "512 KB/s":   512  * 1024,
    "1 MB/s":     1024 * 1024,
    "2 MB/s":     2    * 1024 * 1024,
    "5 MB/s":     5    * 1024 * 1024,
    "10 MB/s":    10   * 1024 * 1024,
}

QUALITY_MAP = {
    "Лучшее": "bv*+ba[ext=m4a]/b",
    "4K":     "bv*[height<=2160]+ba[ext=m4a]/b[height<=2160]",
    "1440p":  "bv*[height<=1440]+ba[ext=m4a]/b[height<=1440]",
    "1080p":  "bv*[height<=1080]+ba[ext=m4a]/b[height<=1080]",
    "720p":   "bv*[height<=720]+ba[ext=m4a]/b[height<=720]",
    "480p":   "bv*[height<=480]+ba[ext=m4a]/b[height<=480]",
    "360p":   "bv*[height<=360]+ba[ext=m4a]/b[height<=360]",
    "240p":   "bv*[height<=240]+ba[ext=m4a]/b[height<=240]",
    "144p":   "bv*[height<=144]+ba[ext=m4a]/b[height<=144]",
}

AUDIO_FORMATS = {"mp3", "m4a", "opus", "wav"}


def unique_path(path: Path) -> Path:
    """Возвращает уникальный путь добавляя (1), (2) и тд если файл существует."""
    if not path.exists():
        return path
    stem   = path.stem
    suffix = path.suffix
    parent = path.parent
    i = 1
    while True:
        candidate = parent / f"{stem} ({i}){suffix}"
        if not candidate.exists():
            return candidate
        i += 1


class Downloader:
    def download(self, url: str, settings: dict = None,
                 on_progress=None, on_complete=None, on_error=None):
        thread = threading.Thread(
            target=self._worker,
            args=(url, settings or {}, on_progress, on_complete, on_error),
            daemon=True,
        )
        thread.start()

    def _worker(self, url, settings, on_progress, on_complete, on_error):
        import time
        try:
            fmt      = settings.get("format", "mp4")
            is_audio = fmt in AUDIO_FORMATS

            opts = self._build_opts(settings, on_progress)

            with yt_dlp.YoutubeDL(opts) as ydl:
                info     = None
                last_err = None
                for attempt in range(3):
                    try:
                        info = ydl.extract_info(url, download=True)
                        break
                    except Exception as e:
                        last_err = e
                        err_str  = str(e)
                        if attempt < 2 and (
                            "No video formats found" in err_str or
                            "Requested format is not available" in err_str
                        ):
                            time.sleep(2)
                            continue
                        raise
                if info is None:
                    raise last_err
                if "entries" in info:
                    info = info["entries"][0]

                # ─── Находим реальный путь файла ──────────────────────────────
                raw_filename = ydl.prepare_filename(info)
                base_path = Path(raw_filename)

                # 1. Определяем реальный скачанный файл
                if base_path.exists():
                    final_path = base_path
                else:
                    dl_dir = Path(settings.get("download_dir", str(Path.home() / "Downloads")))
                    matches = sorted(
                        dl_dir.glob(f"{base_path.stem}*"),
                        key=lambda p: p.stat().st_mtime,
                        reverse=True,
                    )
                    final_path = matches[0] if matches else base_path

                # 2. 🔥 ДЕЛАЕМ УНИКАЛЬНОЕ ИМЯ (video → video (1))
                unique = unique_path(final_path)

                if unique != final_path and final_path.exists():
                    final_path.rename(unique)
                    final_path = unique

                filename = str(final_path)

                if on_complete:
                    # ─── Длительность ─────────────────────────────────────────
                    duration_str  = None
                    duration_secs = info.get("duration")
                    if duration_secs:
                        mins, secs = divmod(int(duration_secs), 60)
                        hrs,  mins = divmod(mins, 60)
                        duration_str = f"{hrs}:{mins:02d}:{secs:02d}" if hrs else f"{mins}:{secs:02d}"

                    # ─── Размер файла ──────────────────────────────────────────
                    file_size = None
                    try:
                        size_bytes = final_path.stat().st_size
                        if size_bytes < 1024 * 1024:
                            file_size = f"{size_bytes / 1024:.0f} KB"
                        elif size_bytes < 1024 ** 3:
                            file_size = f"{size_bytes / 1024 / 1024:.1f} MB"
                        else:
                            file_size = f"{size_bytes / 1024 / 1024 / 1024:.2f} GB"
                    except Exception:
                        pass

                    # ─── Качество ─────────────────────────────────────────────
                    height     = info.get("height")
                    resolution = f"{height}p" if height else None
                    abr        = info.get("abr")
                    if is_audio and abr:
                        resolution = f"{int(abr)}kbps"

                    # ─── FPS ──────────────────────────────────────────────────
                    fps = None
                    if not is_audio:
                        raw_fps = info.get("fps")
                        if raw_fps:
                            fps = str(int(round(raw_fps)))

                    on_complete({
                        "title":      info.get("title", "Без названия"),
                        "filepath":   filename,
                        "url":        url,
                        "thumbnail":  info.get("thumbnail"),
                        "extractor":  info.get("extractor", ""),
                        "duration":   duration_str,
                        "fileSize":   file_size,
                        "format":     fmt.upper(),
                        "resolution": resolution,
                        "fps":        fps,
                    })

        except Exception as e:
            err_msg = str(e)
            if "cancelled by user" in err_msg.lower():
                return
            print(f"[Downloader ERROR] {e}")
            traceback.print_exc()
            if on_error:
                on_error(err_msg)

    def _build_opts(self, s: dict, on_progress) -> dict:
        fmt      = s.get("format", "mp4")
        quality  = s.get("quality", "Лучшее")
        dl_dir   = s.get("download_dir", str(Path.home() / "Downloads"))
        speed    = SPEED_MAP.get(s.get("speed_limit", "Без лимита"))
        platform = s.get("platform", "windows")
        is_audio = fmt in AUDIO_FORMATS
        need_aac = platform in ("windows", "macos", "ios", "android")

        # каждый файл будет уникальным (ID видео) дубли всегда будут качаться
        base_template = Path(dl_dir) / "%(title)s.%(ext)s"

        opts = {
            "quiet":            True,
            "no_warnings":      True,
            "outtmpl":          str(base_template),
            "progress_hooks":   [self._make_hook(on_progress, s.get("on_processing"), s.get("cancelled"), s.get("paused"))],
            "noplaylist":       not s.get("playlist", False),
            "retries":          3,
            "fragment_retries": 3,
            # Не перезаписываем — yt-dlp добавит .1.ext, .2.ext и тд
            "overwrites":       False,
        }

        if is_audio:
            opts["format"] = "bestaudio/best"
            opts["postprocessors"] = [{
                "key":            "FFmpegExtractAudio",
                "preferredcodec": fmt,
            }]
        else:
            base_fmt = QUALITY_MAP.get(quality, "bv*+ba[ext=m4a]/b")
            opts["format"] = f"{base_fmt}/bestvideo+bestaudio/best"
            opts["merge_output_format"] = fmt
            if need_aac:
                opts["postprocessor_args"] = {
                    "Merger": ["-c:v", "copy", "-c:a", "copy"],
                    "merger": ["-c:v", "copy", "-c:a", "copy"],
                }

        if speed:
            opts["ratelimit"] = speed

        if s.get("subtitles"):
            lang = s.get("sub_lang", "ru")
            opts["writesubtitles"]    = True
            opts["writeautomaticsub"] = True
            opts["subtitleslangs"]    = [lang]
            if s.get("embed_subs") and not is_audio:
                opts.setdefault("postprocessors", []).append({"key": "FFmpegEmbedSubtitle"})

        if s.get("thumbnail"):
            opts["writethumbnail"] = True
            opts.setdefault("postprocessors", []).append({"key": "EmbedThumbnail"})

        if s.get("sponsorblock"):
            pp = opts.setdefault("postprocessors", [])
            pp.append({"key": "SponsorBlock", "categories": ["sponsor", "selfpromo", "interaction"]})
            pp.append({"key": "ModifyChapters", "remove_sponsor_segments": ["sponsor", "selfpromo", "interaction"]})

        return opts

    def _make_hook(self, on_progress, on_processing=None, cancelled=None, paused=None):
        import time
        last_total = [0]
        def hook(d):
            if cancelled and cancelled[0]:
                raise Exception("Download cancelled by user")
            if paused:
                while paused[0]:
                    if cancelled and cancelled[0]:
                        raise Exception("Download cancelled by user")
                    time.sleep(0.2)
            if d["status"] == "downloading" and on_progress:
                total      = d.get("total_bytes") or d.get("total_bytes_estimate", 0)
                downloaded = d.get("downloaded_bytes", 0)
                if total:
                    last_total[0] = total
                else:
                    total = last_total[0]
                percent = (downloaded / total * 100) if total else 0
                speed   = d.get("speed", 0) or 0
                on_progress(percent, speed, downloaded, total)
            elif d["status"] == "finished" and on_processing:
                on_processing()
        return hook