import json
import time
from pathlib import Path


HISTORY_FILE = Path.home() / ".yt_downloader_history.json"


def load_history() -> list:
    if not HISTORY_FILE.exists():
        return []
    try:
        with open(HISTORY_FILE, "r", encoding="utf-8") as f:
            history = json.load(f)
        # Помечаем файлы которых нет на диске
        for h in history:
            filepath = h.get("filepath", "")
            h["file_missing"] = bool(filepath) and not Path(filepath).exists()
        return history
    except Exception:
        return []


def save_entry(entry: dict):
    history = load_history()
    entry["downloaded_at"] = time.strftime("%Y-%m-%d %H:%M")
    entry.pop("file_missing", None)  # не сохраняем этот флаг в файл
    history.insert(0, entry)
    history = history[:100]
    _save(history)


def remove_entry(filepath: str):
    """Удалить запись из истории по пути файла."""
    history = load_history()
    history = [h for h in history if h.get("filepath") != filepath]
    _save(history)


def clear_history():
    if HISTORY_FILE.exists():
        HISTORY_FILE.unlink()


def _save(history: list):
    clean = [{k: v for k, v in h.items() if k != "file_missing"} for h in history]
    with open(HISTORY_FILE, "w", encoding="utf-8") as f:
        json.dump(clean, f, ensure_ascii=False, indent=2)