const { app, BrowserWindow, ipcMain, dialog, Menu, shell, clipboard, globalShortcut } = require('electron')
const path = require('path')
const { spawn, execSync } = require('child_process')
const { setupAutoUpdater, checkForUpdates, downloadUpdate, installUpdate } = require('./updater')

let mainWindow
let pythonProcess

// ─── Один экземпляр приложения ────────────────────────────────────────────
const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    // Второй запуск — фокусируем уже открытое окно
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })
}

const isDev = !app.isPackaged
const BACKEND_URL = 'http://127.0.0.1:7842'
const FRONTEND_URL = isDev
  ? 'http://localhost:5173'
  : `file://${path.join(__dirname, '../dist/index.html')}`

ipcMain.handle('app:version', () => app.getVersion())

// ─── Отправка событий в React ──────────────────────────────────────────────
function send(channel, ...args) {
  if (mainWindow) mainWindow.webContents.send(channel, ...args)
}

// ─── Python ────────────────────────────────────────────────────────────────
function startPython() {
  const isExe = app.isPackaged
  const serverPath = isExe
    ? path.join(process.resourcesPath, 'backend', 'server.exe')
    : path.join(__dirname, '../backend/server.py')

  pythonProcess = isExe
    ? spawn(serverPath, [], { windowsHide: true, stdio: 'ignore', detached: false })
    : spawn('python', [serverPath], { stdio: 'pipe', windowsHide: true })

  if (isDev) {
    pythonProcess.stdout.on('data', d => console.log('[Python]', d.toString().trim()))
    pythonProcess.stderr.on('data', d => console.error('[Python ERR]', d.toString().trim()))
  }
  pythonProcess.on('close', code => { if (isDev) console.log('[Python] exited', code) })
}

function killPython() {
  if (!pythonProcess) return
  try {
    if (process.platform === 'win32') {
      execSync(`taskkill /pid ${pythonProcess.pid} /T /F`, { windowsHide: true })
    } else {
      pythonProcess.kill('SIGTERM')
    }
  } catch (_) {}
  pythonProcess = null
}

async function waitForBackend(retries = 30) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(`${BACKEND_URL}/history`)
      if (res.ok) return true
    } catch (_) {}
    await new Promise(r => setTimeout(r, 150))
  }
  return false
}

// ─── Нативное меню ─────────────────────────────────────────────────────────
function buildMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        { label: 'Open Downloads Folder', accelerator: 'CmdOrCtrl+Shift+O', click: () => send('menu:open-downloads-folder') },
        { type: 'separator' },
        { label: 'Exit', accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Alt+F4', click: () => app.quit() },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { label: 'Preferences', accelerator: 'CmdOrCtrl+,', click: () => send('menu:open-preferences') },
        { type: 'separator' },
        { label: 'Clear History', click: () => send('menu:clear-history') },
      ],
    },
    {
      label: 'View',
      submenu: [
        { label: 'Toggle Theme', accelerator: 'CmdOrCtrl+Shift+T', click: () => send('menu:toggle-theme') },
        { type: 'separator' },
        { label: 'Zoom In',    accelerator: 'CmdOrCtrl+Plus', click: () => mainWindow?.webContents.setZoomLevel(mainWindow.webContents.getZoomLevel() + 0.5) },
        { label: 'Zoom Out',   accelerator: 'CmdOrCtrl+-',   click: () => mainWindow?.webContents.setZoomLevel(mainWindow.webContents.getZoomLevel() - 0.5) },
        { label: 'Reset Zoom', accelerator: 'CmdOrCtrl+0',   click: () => mainWindow?.webContents.setZoomLevel(0) },
        ...(isDev ? [
          { type: 'separator' },
          { label: 'DevTools', accelerator: 'F12', click: () => mainWindow?.webContents.toggleDevTools() },
          { label: 'Reload',   accelerator: 'CmdOrCtrl+R', role: 'reload' },
        ] : []),
      ],
    },
    {
      label: 'Downloads',
      submenu: [
        { label: 'Paste & Download', accelerator: 'CmdOrCtrl+Shift+V', click: () => { const url = clipboard.readText().trim(); if (url) send('menu:paste-and-download', url) } },
        { type: 'separator' },
        { label: 'Stop All Downloads',    click: () => send('menu:stop-all') },
        { label: 'Open Downloads Folder', click: () => send('menu:open-downloads-folder') },
      ],
    },
    {
      label: 'Help',
      submenu: [
        { label: 'Check for Updates', click: () => send('menu:check-updates') },
        { label: 'Report a Bug',      click: () => shell.openExternal('https://github.com/') },
        { type: 'separator' },
        { label: 'About Keeply', click: () => send('menu:open-preferences', 'about') },
      ],
    },
  ]
  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}

// ─── Окно ──────────────────────────────────────────────────────────────────
async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 750,
    minWidth: 800,
    minHeight: 550,
    frame: false,
    transparent: false,
    backgroundColor: '#ffffff',
    show: false,
    icon: path.join(__dirname, '../assets/icon.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  })

  mainWindow.loadURL(FRONTEND_URL)
  Menu.setApplicationMenu(null)

  // Показываем окно как только React отрендерился
  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
    if (isDev) mainWindow.webContents.openDevTools()
  })

  // Запускаем auto-updater только в prod
  if (!isDev) {
    setupAutoUpdater(mainWindow)
    setTimeout(() => checkForUpdates(), 5000)
  }
}

// ─── IPC ───────────────────────────────────────────────────────────────────
ipcMain.on('window:minimize', () => mainWindow?.minimize())
ipcMain.on('window:maximize', () => { if (mainWindow?.isMaximized()) mainWindow.unmaximize(); else mainWindow?.maximize() })
ipcMain.on('window:close',    () => mainWindow?.close())
ipcMain.handle('window:is-maximized', () => mainWindow?.isMaximized() ?? false)
ipcMain.handle('browse-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, { properties: ['openDirectory'] })
  return result.canceled ? null : result.filePaths[0]
})

ipcMain.on('drag:start', (event, filepath) => {
  event.sender.startDrag({
    file: filepath,
    icon: path.join(__dirname, '../assets/drag_icon.png')
  })
})

// IPC — обновления
ipcMain.handle('open-external', (event, url) => shell.openExternal(url))
ipcMain.on('update:check',    () => checkForUpdates())
ipcMain.on('update:download', () => downloadUpdate())
ipcMain.on('update:install',  () => installUpdate())

ipcMain.handle('pick-file', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'Video/Audio', extensions: ['mp4', 'mkv', 'webm', 'mp3', 'm4a', 'opus', 'wav'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  })
  return result.canceled ? null : result.filePaths[0]
})

// ─── Браузер-перехватчик ───────────────────────────────────────────────────
let interceptWindow = null

ipcMain.handle('browser:intercept', async (event, url) => {
  if (interceptWindow) {
    interceptWindow.destroy()
    interceptWindow = null
  }

  interceptWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    title: 'Keeply — нажмите Play для скачивания',
    icon: path.join(__dirname, '../assets/icon.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,
    },
  })

  interceptWindow.webContents.setAudioMuted(true)

  const VIDEO_REGEX = /\.(m3u8|mp4|mkv|webm)(\?|$|&)/i

  // Рекламные домены
  const AD_DOMAINS = [
    'googlesyndication.com', 'doubleclick.net', 'googletagmanager.com',
    'google-analytics.com', 'facebook.com/tr', 'moatads.com',
    'adnxs.com', 'rubiconproject.com', 'pubmatic.com', 'openx.net',
    'casalemedia.com', 'smartadserver.com', 'adsafeprotected.com',
    'scorecardresearch.com', 'imrworldwide.com', 'quantserve.com',
    'adform.net', 'serving-sys.com', 'cdn.ampproject.org',
    'servetraff.com', 'trafficjunky.net', 'exoclick.com',
    'ero-advertising.com', 'juicyads.com', 'trafficstars.com',
  ]

  // Паттерны в пути URL, которые выдают рекламный контент
  const AD_PATH_PATTERNS = [
    /\/banner[_s/]/i, /\/banners\//i, /\/ads?\//i, /\/advert/i,
    /\/promo[_/]/i, /\/commercial/i, /\/sponsor/i,
    /\bwelcome[_-]/i, /\/story[_-]stories/i, /\/bk_stories/i,
  ]

  const found = new Set()

  interceptWindow.webContents.session.webRequest.onBeforeRequest(
    { urls: ['*://*/*'] },
    (details, callback) => {
      const u = details.url
      if (!VIDEO_REGEX.test(u) || found.has(u)) { callback({}); return }

      // Фильтр по домену
      if (AD_DOMAINS.some(d => u.includes(d))) { callback({}); return }

      // Фильтр по пути (баннеры, промо и т.д.)
      try {
        const pathname = new URL(u).pathname
        if (AD_PATH_PATTERNS.some(r => r.test(pathname))) { callback({}); return }
      } catch { /* ignore */ }

      // Только реальные медиа-запросы браузера
      const type = details.resourceType
      if (type !== 'media' && type !== 'xhr' && type !== 'fetch' && type !== 'other') {
        callback({}); return
      }

      found.add(u)
      mainWindow?.webContents.send('browser:found', u)
      callback({})
      // Закрываем окно сразу после первой найденной ссылки
      if (found.size === 1 && interceptWindow) {
        interceptWindow.destroy()
        interceptWindow = null
      }
    }
  )

  interceptWindow.on('closed', () => { interceptWindow = null })
  interceptWindow.loadURL(url)
  return { ok: true }
})

ipcMain.on('browser:close', () => {
  if (interceptWindow) {
    interceptWindow.destroy()
    interceptWindow = null
  }
})

ipcMain.on('browser:volume', (_e, vol) => {
  if (!interceptWindow) return
  const v = Math.max(0, Math.min(1, vol))
  interceptWindow.webContents.setAudioMuted(v === 0)
  interceptWindow.webContents.executeJavaScript(
    `document.querySelectorAll('video,audio').forEach(el => el.volume = ${v})`
  ).catch(() => {})
})

// ─── Старт ─────────────────────────────────────────────────────────────────
app.whenReady().then(async () => {
  startPython()
  // Окно и бэкенд параллельно — быстрый старт
  createWindow()
  waitForBackend()
})

app.on('window-all-closed', () => {
  killPython()
  globalShortcut.unregisterAll()
  if (process.platform !== 'darwin') app.quit()
})

app.on('before-quit', () => {
  killPython()
})