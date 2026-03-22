const { app, shell } = require('electron')
const https = require('https')
const fs = require('fs')
const path = require('path')
const { exec } = require('child_process')
const os = require('os')

// ── Настройки ────────────────────────────────────────────────────────────────
// Замени на свой репозиторий: 'username/repo'
const GITHUB_REPO = 'your-username/keeply'

// ── Вспомогалки ──────────────────────────────────────────────────────────────
function httpsGet(url) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: { 'User-Agent': 'Keeply-Updater' },
    }
    https.get(url, options, res => {
      // Следуем редиректам
      if (res.statusCode === 301 || res.statusCode === 302) {
        return httpsGet(res.headers.location).then(resolve).catch(reject)
      }
      let data = ''
      res.on('data', chunk => (data += chunk))
      res.on('end', () => resolve({ statusCode: res.statusCode, body: data, headers: res.headers }))
    }).on('error', reject)
  })
}

function compareVersions(a, b) {
  const pa = a.replace(/^v/, '').split('.').map(Number)
  const pb = b.replace(/^v/, '').split('.').map(Number)
  for (let i = 0; i < 3; i++) {
    if ((pa[i] || 0) > (pb[i] || 0)) return 1
    if ((pa[i] || 0) < (pb[i] || 0)) return -1
  }
  return 0
}

// ── Главная функция ───────────────────────────────────────────────────────────
async function checkForUpdates() {
  try {
    const currentVersion = app.getVersion()
    const url = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`
    const { body } = await httpsGet(url)
    const release = JSON.parse(body)

    if (!release.tag_name) return null

    const latestVersion = release.tag_name.replace(/^v/, '')

    if (compareVersions(latestVersion, currentVersion) <= 0) return null

    // Ищем .exe установщик в assets
    const asset = release.assets?.find(a =>
      a.name.endsWith('.exe') && a.name.toLowerCase().includes('setup')
    )

    return {
      version: latestVersion,
      notes: release.body || '',
      downloadUrl: asset?.browser_download_url || release.html_url,
      isDirectDownload: !!asset,
    }
  } catch (e) {
    console.error('[Updater] Check failed:', e.message)
    return null
  }
}

async function downloadAndInstall(downloadUrl, version) {
  return new Promise(async (resolve, reject) => {
    try {
      const fileName = `Keeply-Setup-${version}.exe`
      const destPath = path.join(os.tmpdir(), fileName)

      // Если не прямая ссылка — открываем браузер
      if (!downloadUrl.includes('.exe')) {
        shell.openExternal(downloadUrl)
        return resolve('browser')
      }

      // Получаем финальный URL (GitHub редиректит)
      const { headers, statusCode } = await httpsGet(downloadUrl)
      const finalUrl = headers.location || downloadUrl

      // Скачиваем файл
      const file = fs.createWriteStream(destPath)
      https.get(finalUrl, { headers: { 'User-Agent': 'Keeply-Updater' } }, res => {
        if (res.statusCode === 302 || res.statusCode === 301) {
          file.close()
          // Рекурсивно следуем редиректу
          downloadAndInstall(res.headers.location, version).then(resolve).catch(reject)
          return
        }
        res.pipe(file)
        file.on('finish', () => {
          file.close(() => {
            // Запускаем установщик и выходим
            exec(`"${destPath}"`, err => {
              if (err) reject(err)
            })
            setTimeout(() => app.quit(), 1000)
            resolve('installed')
          })
        })
      }).on('error', err => {
        fs.unlink(destPath, () => {})
        reject(err)
      })
    } catch (e) {
      reject(e)
    }
  })
}

module.exports = { checkForUpdates, downloadAndInstall }
