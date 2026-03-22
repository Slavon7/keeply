const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('BACKEND', {
  url: 'http://127.0.0.1:7842',
  wsUrl: 'ws://127.0.0.1:7842',
})

contextBridge.exposeInMainWorld('electronAPI', {
  // Папка
  browseFolder: () => ipcRenderer.invoke('browse-folder'),

  // Управление окном
  minimize:    () => ipcRenderer.send('window:minimize'),
  maximize:    () => ipcRenderer.send('window:maximize'),
  close:       () => ipcRenderer.send('window:close'),
  isMaximized: () => ipcRenderer.invoke('window:is-maximized'),

  // Меню
  onMenu: (channel, callback) => {
    const valid = [
      'menu:open-preferences', 'menu:clear-history', 'menu:toggle-theme',
      'menu:paste-and-download', 'menu:stop-all', 'menu:open-downloads-folder',
      'menu:check-updates',
    ]
    if (valid.includes(channel)) {
      ipcRenderer.on(channel, (_event, ...args) => callback(...args))
    }
  },
  offMenu: (channel) => ipcRenderer.removeAllListeners(channel),

  // Обновления
  checkUpdates: () => ipcRenderer.send('update:check'),
  installUpdate: () => ipcRenderer.send('update:install'),
  onUpdate: (channel, callback) => {
    const channels = ['update:checking','update:available','update:not-available','update:progress','update:downloaded','update:error']
    if (channels.includes(channel)) ipcRenderer.on(channel, (_e, data) => callback(data))
  },
  offUpdate: (channel) => ipcRenderer.removeAllListeners(channel),
})
