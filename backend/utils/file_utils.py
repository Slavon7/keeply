import subprocess
import platform
from pathlib import Path


def open_file(filepath: str):
    """Открывает файл в системном плеере по умолчанию."""
    path = Path(filepath)
    if not path.exists():
        return False
    system = platform.system()
    if system == "Windows":
        subprocess.run(["start", "", str(path)], shell=True)
    elif system == "Darwin":
        subprocess.run(["open", str(path)])
    else:
        subprocess.run(["xdg-open", str(path)])
    return True


def open_folder(filepath: str):
    """Открывает папку с файлом в проводнике."""
    path = Path(filepath)
    folder = path.parent if path.is_file() else path
    system = platform.system()
    if system == "Windows":
        if path.is_file():
            subprocess.run(["explorer", "/select,", str(path)])
        else:
            subprocess.run(["explorer", str(folder)])
    elif system == "Darwin":
        if path.is_file():
            subprocess.run(["open", "-R", str(path)])
        else:
            subprocess.run(["open", str(folder)])
    else:
        subprocess.run(["xdg-open", str(folder)])


def format_speed(bytes_per_sec: float) -> str:
    if bytes_per_sec < 1024:
        return f"{bytes_per_sec:.0f} B/s"
    elif bytes_per_sec < 1024 ** 2:
        return f"{bytes_per_sec / 1024:.1f} KB/s"
    else:
        return f"{bytes_per_sec / 1024 ** 2:.1f} MB/s"
