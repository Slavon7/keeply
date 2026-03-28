<div align="center">
  <h1>⬇️ Keeply</h1>
  <p>Fast and beautiful video & audio downloader for YouTube, TikTok, Pinterest and 1000+ more sites</p>

  ![Electron](https://img.shields.io/badge/Electron-31-47848F?logo=electron)
  ![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)
  ![FastAPI](https://img.shields.io/badge/FastAPI-0.11-009688?logo=fastapi)
  ![yt-dlp](https://img.shields.io/badge/yt--dlp-latest-FF0000)
  ![License](https://img.shields.io/badge/license-MIT-green)
</div>

---

## ✨ Features

- 🎬 Download video & audio from YouTube, TikTok, Pinterest, SoundCloud and 1000+ sites
- 🎵 Extract audio in MP3, M4A, OPUS, WAV
- 📋 Playlist support with track selection — pick only the songs you want
- ⚡ Concurrent downloads queue — set your own limit (1, 2, 3, 5, 10)
- ⏸ Pause & resume downloads
- 🔍 SponsorBlock integration — skip ads automatically
- 🌐 Proxy support (HTTP, HTTPS, SOCKS5)
- 🍪 Browser cookies support for age-restricted content
- 🌙 Dark / Light / System theme
- 🌍 Multilingual: English, Українська, Русский
- 📁 Download history with search, filter and sort
- 🔄 Auto-updater via GitHub Releases

---

## 📸 Screenshots

<img width="1100" height="750" alt="image" src="https://github.com/user-attachments/assets/763c773f-3535-462f-923e-db2737489f39" />
<img width="1100" height="750" alt="image" src="https://github.com/user-attachments/assets/21af48aa-4b53-4c38-bb0d-a2fceca9a4b0" />



---

## 🚀 Getting Started

### Requirements

- [Node.js](https://nodejs.org/) 18+
- [Python](https://www.python.org/) 3.10+
- [ffmpeg](https://ffmpeg.org/) (for audio extraction and subtitles)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/Slavon7/keeply.git
cd keeply

# 2. Install Node dependencies
npm install

# 3. Install Python dependencies
cd backend
pip install -r requirements.txt
cd ..
```

### Development

```bash
# Start everything with one command
npm run start
# Electron will automatically launch the Python backend
```

### Production Build

```bash
npm run dist
```

The installer will be in the `dist/` folder.

---

## 🏗 Project Structure

```
keeply/
├── backend/
│   ├── server.py           # FastAPI server + WebSocket
│   ├── requirements.txt
│   ├── core/
│   │   ├── downloader.py   # yt-dlp wrapper with pause/queue support
│   │   └── history.py      # JSON download history
│   └── utils/
│       └── file_utils.py   # Open file / folder helpers
├── electron/
│   ├── main.js             # Electron main process
│   ├── preload.js          # Context bridge
│   └── updater.js          # Auto-updater (electron-updater)
├── src/
│   ├── App.tsx             # Main React component + download queue
│   ├── api.ts              # HTTP / WebSocket client
│   ├── i18n.ts             # Translations + preferences
│   └── components/
│       ├── Toolbar.tsx         # URL input + settings
│       ├── DownloadItem.tsx    # Download row with progress
│       ├── PlaylistModal.tsx   # Playlist track selector
│       ├── PreferencesModal.tsx
│       ├── SearchBar.tsx
│       ├── FilterTabs.tsx
│       ├── TitleBar.tsx
│       ├── UpdateBanner.tsx
│       └── BulkActionsBar.tsx
├── package.json
├── vite.config.ts
└── tailwind.config.js
```

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Desktop shell | Electron 31 |
| Frontend | React 18 + TypeScript + Tailwind CSS |
| Build tool | Vite |
| Backend | FastAPI + Uvicorn |
| Download engine | yt-dlp |
| Media processing | ffmpeg |
| Auto-updates | electron-updater + GitHub Releases |

---

## 📦 Releases

Download the latest installer from the [Releases](https://github.com/Slavon7/keeply/releases) page.

---

## 🤝 Contributing

Pull requests are welcome. For major changes, please open an issue first.

---

## 📄 License

MIT © [Viacheslav Omeniuk](https://github.com/Slavon7)
