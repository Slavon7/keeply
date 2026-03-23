const { app, BrowserWindow, ipcMain, dialog, Menu, shell, clipboard, globalShortcut } = require('electron')
const path = require('path')
const { spawn } = require('child_process')

let mainWindow
let pythonProcess

const isDev = !app.isPackaged
const BACKEND_URL = 'http://127.0.0.1:7842'
const FRONTEND_URL = isDev
  ? 'http://localhost:5173'
  : `file://${path.join(__dirname, '../dist/index.html')}`

const { autoUpdater } = require('electron-updater');
const log = require('electron-log');

// Логи автообновления
autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';
autoUpdater.autoDownload = false; // скачивание только после согласия

// ─── Отправка событий в React ──────────────────────────────────────────────
function send(channel, ...args) {
  if (mainWindow) mainWindow.webContents.send(channel, ...args)
}

// ─── Python ────────────────────────────────────────────────────────────────
function startPython() {
  const scriptPath = path.join(__dirname, '../backend/server.py')
  pythonProcess = spawn('python', [scriptPath], {
    stdio: isDev ? 'pipe' : 'ignore',
    windowsHide: true,
  })
  if (isDev) {
    pythonProcess.stdout.on('data', d => console.log('[Python]', d.toString().trim()))
    pythonProcess.stderr.on('data', d => console.error('[Python ERR]', d.toString().trim()))
  }
  pythonProcess.on('close', code => { if (isDev) console.log('[Python] exited', code) })
}

async function waitForBackend(retries = 20) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(`${BACKEND_URL}/history`)
      if (res.ok) return true
    } catch (_) {}
    await new Promise(r => setTimeout(r, 300))
  }
  return false
}

// ─── Нативное меню ─────────────────────────────────────────────────────────
function buildMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Open Downloads Folder',
          accelerator: 'CmdOrCtrl+Shift+O',
          click: () => send('menu:open-downloads-folder'),
        },
        { type: 'separator' },
        {
          label: 'Exit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Alt+F4',
          click: () => app.quit(),
        },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        {
          label: 'Preferences',
          accelerator: 'CmdOrCtrl+,',
          click: () => send('menu:open-preferences'),
        },
        { type: 'separator' },
        {
          label: 'Clear History',
          click: () => send('menu:clear-history'),
        },
      ],
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Toggle Theme',
          accelerator: 'CmdOrCtrl+Shift+T',
          click: () => send('menu:toggle-theme'),
        },
        { type: 'separator' },
        {
          label: 'Zoom In',
          accelerator: 'CmdOrCtrl+Plus',
          click: () => mainWindow?.webContents.setZoomLevel(
            mainWindow.webContents.getZoomLevel() + 0.5
          ),
        },
        {
          label: 'Zoom Out',
          accelerator: 'CmdOrCtrl+-',
          click: () => mainWindow?.webContents.setZoomLevel(
            mainWindow.webContents.getZoomLevel() - 0.5
          ),
        },
        {
          label: 'Reset Zoom',
          accelerator: 'CmdOrCtrl+0',
          click: () => mainWindow?.webContents.setZoomLevel(0),
        },
        ...(isDev ? [
          { type: 'separator' },
          { label: 'DevTools', accelerator: 'F12', click: () => mainWindow?.webContents.toggleDevTools() },
          { label: 'Reload', accelerator: 'CmdOrCtrl+R', role: 'reload' },
        ] : []),
      ],
    },
    {
      label: 'Downloads',
      submenu: [
        {
          label: 'Paste & Download',
          accelerator: 'CmdOrCtrl+Shift+V',
          click: () => {
            const url = clipboard.readText().trim()
            if (url) send('menu:paste-and-download', url)
          },
        },
        { type: 'separator' },
        {
          label: 'Stop All Downloads',
          click: () => send('menu:stop-all'),
        },
        {
          label: 'Open Downloads Folder',
          click: () => send('menu:open-downloads-folder'),
        },
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Check for Updates',
          click: () => send('menu:check-updates'),
        },
        {
          label: 'Report a Bug',
          click: () => shell.openExternal('https://github.com/'),
        },
        { type: 'separator' },
        {
          label: 'About Keeply',
          click: () => send('menu:open-preferences', 'about'),
        },
      ],
    },
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

// ─── Окно ──────────────────────────────────────────────────────────────────
async function createWindow() {
  const isMac = process.platform === 'darwin'
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 750,
    minWidth: 800,
    minHeight: 550,
    // На Mac — hiddenInset оставляет traffic lights
    // На Windows — frame:false убирает рамку, меню рисуем в React
    frame: isMac ? true : false,
    titleBarStyle: isMac ? 'hiddenInset' : 'hidden',
    backgroundColor: '#ffffff',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  })

  mainWindow.loadURL(FRONTEND_URL)
  Menu.setApplicationMenu(null) // меню теперь кастомное в React
}

// ─── IPC ───────────────────────────────────────────────────────────────────
// Управление окном (frameless)
ipcMain.on('window:minimize', () => mainWindow?.minimize())
ipcMain.on('window:maximize', () => {
  if (mainWindow?.isMaximized()) mainWindow.unmaximize()
  else mainWindow?.maximize()
})
ipcMain.on('window:close', () => mainWindow?.close())
ipcMain.handle('window:is-maximized', () => mainWindow?.isMaximized() ?? false)
ipcMain.handle('browse-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
  })
  return result.canceled ? null : result.filePaths[0]
})

// ─── Старт ─────────────────────────────────────────────────────────────────
app.whenReady().then(async () => {
  startPython()
  await waitForBackend()
  await createWindow()
  if (!isDev) {
    autoUpdater.checkForUpdatesAndNotify();
  }
})

app.on('window-all-closed', () => {
  if (pythonProcess) pythonProcess.kill()
  globalShortcut.unregisterAll()
  if (process.platform !== 'darwin') app.quit()
})

app.on('before-quit', () => {
  if (pythonProcess) pythonProcess.kill()
})

// Отправка событий в renderer
autoUpdater.on('update-available', (info) => {
  send('update:available', info); // версию отправляем в UpdateBanner
});

autoUpdater.on('update-progress', (progress) => {
  send('update:progress', progress); // прогресс скачивания
});

autoUpdater.on('update-downloaded', (info) => {
  send('update:downloaded', info); // готово к перезапуску
});

autoUpdater.on('error', (err) => {
  send('update:error', err.message);
});

// IPC для кнопок
ipcMain.handle('downloadUpdate', () => {
  autoUpdater.downloadUpdate();
});

ipcMain.handle('installUpdate', () => {
  autoUpdater.quitAndInstall();
});