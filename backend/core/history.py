import json
import time
from pathlib import Path


HISTORY_FILE = Path.home() / ".yt_downloader_history.json"


def load_history() -> list:
    if not HISTORY_FILE.exists():
        return []
    try:
        with open(HISTORY_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return []


def save_entry(entry: dict):
    history = load_history()
    entry["downloaded_at"] = time.strftime("%Y-%m-%d %H:%M")
    history.insert(0, entry)
    # Держим максимум 100 записей
    history = history[:100]
    with open(HISTORY_FILE, "w", encoding="utf-8") as f:
        json.dump(history, f, ensure_ascii=False, indent=2)


def clear_history():
    if HISTORY_FILE.exists():
        HISTORY_FILE.unlink()
