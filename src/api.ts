const BASE = 'http://127.0.0.1:7842'
const WS   = 'ws://127.0.0.1:7842'

export interface DownloadItem {
  id?: string
  title: string
  filepath: string
  url: string
  thumbnail?: string
  extractor?: string
  downloaded_at?: string
  fileSize?: string
  format?: string
  resolution?: string
  duration?: string
  status: 'downloaded' | 'downloading' | 'failed'
  progress?: number
  downloaded_bytes?: number
  total_bytes?: number
  speed?: number
  paused?: boolean
  processing?: boolean
}

export interface DownloadSettings {
  url: string
  quality?: string
  format?: string
  platform?: string
  audio_codec?: string
  download_dir?: string
  speed_limit?: string
  subtitles?: boolean
  sub_lang?: string
  embed_subs?: boolean
  playlist?: boolean
  thumbnail?: boolean
  sponsorblock?: boolean
}

export async function fetchHistory(): Promise<DownloadItem[]> {
  const res = await fetch(`${BASE}/history`)
  const data = await res.json()
  return data.map((item: any, i: number) => ({
    ...item,
    id: `hist-${i}`,
    status: 'downloaded' as const,
  }))
}

export async function fetchDefaultFolders(): Promise<{ label: string; path: string }[]> {
  const res = await fetch(`${BASE}/default-folders`)
  return res.json()
}

// Открыть системный диалог выбора папки через Electron main process
export async function browseFolder(): Promise<string | null> {
  // Electron expose через preload — если недоступно, возвращаем null
  if ((window as any).electronAPI?.browseFolder) {
    return (window as any).electronAPI.browseFolder()
  }
  return null
}

export async function clearHistory(): Promise<void> {
  await fetch(`${BASE}/history`, { method: 'DELETE' })
}

export async function openFile(filepath: string): Promise<void> {
  await fetch(`${BASE}/open-file`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filepath }),
  })
}

export async function deleteFile(filepath: string): Promise<boolean> {
  const res = await fetch(`${BASE}/file`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filepath }),
  })
  const data = await res.json()
  return data.ok
}

export async function openFolder(filepath: string): Promise<void> {
  await fetch(`${BASE}/open-folder`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filepath }),
  })
}

export function startDownload(
  settings: DownloadSettings,
  onProgress: (percent: number, speed: number, downloaded: number, total: number) => void,
  onComplete: (item: DownloadItem) => void,
  onError: (msg: string) => void,
  onProcessing?: () => void,
): WebSocket {
  const ws = new WebSocket(`${WS}/ws/download`)
  ws.onopen = () => ws.send(JSON.stringify(settings))
  ws.onmessage = (e) => {
    const msg = JSON.parse(e.data)
    if (msg.type === 'progress')
      onProgress(msg.percent, msg.speed, msg.downloaded_bytes, msg.total_bytes)
    else if (msg.type === 'processing')
      onProcessing?.()
    else if (msg.type === 'complete')
      onComplete({ ...msg.item, status: 'downloaded' })
    else if (msg.type === 'error')
      onError(msg.message)
  }
  ws.onerror = () => onError('Ошибка соединения с бэкендом')
  return ws
}
