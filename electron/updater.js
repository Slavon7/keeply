const { autoUpdater } = require('electron-updater')

let mainWindow = null

function setupAutoUpdater(win) {
  mainWindow = win

  autoUpdater.autoDownload = false        // ← не качаем без согласия
  autoUpdater.autoInstallOnAppQuit = true // ← если выбрал "позже" — установится при закрытии

  autoUpdater.on('checking-for-update', () => send('update:checking'))
  autoUpdater.on('update-available', (info) => send('update:available', info))
  autoUpdater.on('update-not-available', () => send('update:not-available'))
  autoUpdater.on('download-progress', (progress) => send('update:progress', progress))
  autoUpdater.on('update-downloaded', (info) => send('update:downloaded', info))
  autoUpdater.on('error', (err) => {
    console.error('[Updater] Error:', err)
    send('update:error', err.message)
  })
}

function send(channel, data) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(channel, data)
  }
}

function checkForUpdates() {
  autoUpdater.checkForUpdates().catch(err => {
    console.error('[Updater] checkForUpdates failed:', err.message)
  })
}

function downloadUpdate() {
  autoUpdater.downloadUpdate().catch(err => {
    console.error('[Updater] downloadUpdate failed:', err.message)
  })
}

function installUpdate() {
  autoUpdater.quitAndInstall(true, true) // silent=true, forceRunAfter=true
}

module.exports = { setupAutoUpdater, checkForUpdates, downloadUpdate, installUpdate }