# YT Downloader — Electron + React + FastAPI

## Структура проекта

```
yt_electron/
├── backend/
│   ├── server.py          # FastAPI сервер
│   ├── requirements.txt
│   ├── core/
│   │   ├── downloader.py  # yt-dlp логика
│   │   └── history.py     # JSON история
│   └── utils/
│       └── file_utils.py  # открыть файл/папку
├── electron/
│   ├── main.js            # Electron главный процесс
│   └── preload.js
├── src/
│   ├── App.tsx
│   ├── api.ts             # HTTP/WebSocket клиент
│   ├── main.tsx
│   ├── styles/index.css
│   └── components/
│       ├── Toolbar.tsx
│       ├── SearchBar.tsx
│       ├── FilterTabs.tsx
│       └── DownloadItem.tsx
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── index.html
```

## Установка и запуск

### 1. Python бэкенд
```bash
cd backend
pip install -r requirements.txt
```

### 2. Node зависимости
```bash
npm install
```

### 3. Запуск в dev режиме
```bash
# Терминал 1 — Python сервер
cd backend && python server.py

# Терминал 2 — Electron + Vite
npm run start
```

### Или всё сразу одной командой:
```bash
npm run start
# (Electron сам запустит Python через spawn)
```

## Продакшн сборка
```bash
npm run build
npm run electron
```

## Требования
- Python 3.10+
- Node.js 18+
- ffmpeg (для конвертации аудио и субтитров)
