import { useState, useEffect, useRef } from 'react'
import { Download, Settings, ChevronDown, Check, Loader2 } from 'lucide-react'
import { DownloadSettings, fetchPlaylistInfo, PlaylistTrack } from '../api'
import { FolderPicker } from './FolderPicker'
import { PlaylistModal } from './PlaylistModal'
import { BrowserInterceptModal } from './BrowserInterceptModal'
import { T } from '../i18n'

interface ToolbarProps {
  onDownload: (settings: DownloadSettings) => void
  isDownloading: boolean
  t: T
}

type Platform = 'auto' | 'windows' | 'macos' | 'linux' | 'ios' | 'android'

const PLATFORM_SETTINGS: Record<Platform, { label: string; format: string; audioCodec: string; qualityLimit?: string }> = {
  auto:    { label: 'Auto',    format: 'mp4', audioCodec: 'aac' },
  windows: { label: 'Windows', format: 'mp4', audioCodec: 'aac' },
  macos:   { label: 'Mac OS',  format: 'mp4', audioCodec: 'aac' },
  linux:   { label: 'Linux',   format: 'mkv', audioCodec: 'opus' },
  ios:     { label: 'iOS',     format: 'mp4', audioCodec: 'aac', qualityLimit: '1080p' },
  android: { label: 'Android', format: 'mp4', audioCodec: 'aac', qualityLimit: '1080p' },
}

const QUALITY_OPTIONS = ['Best', '4K', '1440p', '1080p', '720p', '480p', '360p']
const FORMAT_OPTIONS   = ['MP4', 'MKV', 'WEBM', 'MP3', 'M4A', 'OPUS']

// ─── Кастомный дропдаун ────────────────────────────────────────────────────
function Dropdown({ value, options, onChange, disabled }: {
  value: string; options: string[]; onChange: (v: string) => void; disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => !disabled && setOpen(v => !v)}
        disabled={disabled}
        className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm transition-all ${
          disabled
            ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed dark:border-gray-700 dark:bg-gray-800 dark:text-gray-600'
            : open
              ? 'border-green-500 bg-white text-gray-800 ring-2 ring-green-500/20 dark:bg-gray-800 dark:text-gray-200'
              : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-gray-600'
        }`}
      >
        <span className="font-medium">{value}</span>
        <ChevronDown className={`h-3.5 w-3.5 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 min-w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800">
          {options.map(opt => (
            <button
              key={opt}
              type="button"
              onClick={() => { onChange(opt); setOpen(false) }}
              className={`flex w-full items-center justify-between px-4 py-2 text-sm transition-colors ${
                value === opt
                  ? 'bg-green-50 text-green-700 font-medium dark:bg-green-900/20 dark:text-green-400'
                  : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              <span>{opt}</span>
              {value === opt && <Check className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Toolbar ───────────────────────────────────────────────────────────────
export function Toolbar({ onDownload, isDownloading, t }: ToolbarProps) {
  const [url, setUrl]             = useState('')
  const [quality, setQuality]     = useState('Best')
  const [format, setFormat]       = useState('MP4')
  const [platform, setPlatform]   = useState<Platform>('windows')
  const [showSettings, setShowSettings] = useState(false)
  const [sponsorblock, setSponsorblock] = useState(false)
  const [subtitles, setSubtitles]       = useState(false)
  const [playlist, setPlaylist]         = useState(false)
  const [downloadDir, setDownloadDir]   = useState('')
  const [playlistTracks, setPlaylistTracks] = useState<PlaylistTrack[]>([])
  const [playlistTitle, setPlaylistTitle]   = useState('')
  const [playlistUrl, setPlaylistUrl]       = useState('')
  const [showPlaylist, setShowPlaylist]     = useState(false)
  const [loadingPlaylist, setLoadingPlaylist] = useState(false)
  const [showBrowserModal, setShowBrowserModal] = useState(false)
  const [browserUrl, setBrowserUrl] = useState('')

  const SUPPORTED_DOMAINS = [
    'youtube.com', 'youtu.be', 'music.youtube.com',
    'tiktok.com', 'instagram.com', 'twitter.com', 'x.com',
    'facebook.com', 'fb.watch', 'vk.com', 'ok.ru',
    'rutube.ru', 'twitch.tv', 'vimeo.com', 'dailymotion.com',
    'reddit.com', 'rumble.com', 'odysee.com', 'bilibili.com',
    'soundcloud.com', 'pinterest.com', 'pinterest.ru', 'coub.com',
  ]

  const isSupportedByYtDlp = (url: string) => {
    try {
      const domain = new URL(url).hostname.replace('www.', '')
      return SUPPORTED_DOMAINS.some(d => domain === d || domain.endsWith('.' + d))
    } catch { return false }
  }

  useEffect(() => {
    const p = PLATFORM_SETTINGS[platform]
    setFormat(p.format.toUpperCase())
  }, [platform])

  useEffect(() => {
    const pasteHandler = (e: Event) => setUrl((e as CustomEvent<string>).detail)
    const downloadHandler = () => handleDownload()
    window.addEventListener('paste-url', pasteHandler)
    window.addEventListener('trigger-download', downloadHandler)
    return () => {
      window.removeEventListener('paste-url', pasteHandler)
      window.removeEventListener('trigger-download', downloadHandler)
    }
  }, [url, quality, format, platform, sponsorblock, subtitles, playlist, downloadDir])

  const buildSettings = (trackUrl: string): DownloadSettings => {
    const p = PLATFORM_SETTINGS[platform]
    return {
      url:          trackUrl,
      format:       format.toLowerCase(),
      quality:      p.qualityLimit ?? quality.toLowerCase(),
      audio_codec:  p.audioCodec,
      platform,
      sponsorblock,
      subtitles,
      playlist:     false,
      download_dir: downloadDir || undefined,
    }
  }

  const handleDownload = async () => {
    if (!url.trim()) return
    const trimmed = url.trim()

    const isPlaylistUrl = trimmed.includes('list=') || trimmed.includes('/playlist') ||
      trimmed.includes('/sets/') || trimmed.includes('album')

    if (isPlaylistUrl && !playlist) {
      setLoadingPlaylist(true)
      try {
        const info = await fetchPlaylistInfo(trimmed)
        if (info.ok && info.is_playlist && info.entries.length > 1) {
          setPlaylistTracks(info.entries)
          setPlaylistTitle(info.title ?? 'Плейлист')
          setPlaylistUrl(trimmed)
          setShowPlaylist(true)
          setLoadingPlaylist(false)
          return
        }
      } catch (_) {}
      setLoadingPlaylist(false)
    }

    // Если сайт не поддерживается yt-dlp — открываем браузер-перехватчик
    if (!isSupportedByYtDlp(trimmed)) {
      setBrowserUrl(trimmed)
      setShowBrowserModal(true)
      return
    }

    onDownload(buildSettings(trimmed))
    setUrl('')
  }

  const handlePlaylistDownload = (selectedUrls: string[]) => {
    setShowPlaylist(false)
    selectedUrls.forEach(trackUrl => onDownload(buildSettings(trackUrl)))
    setUrl('')
  }

  const qualityLocked = !!PLATFORM_SETTINGS[platform].qualityLimit
  const displayQuality = qualityLocked ? PLATFORM_SETTINGS[platform].qualityLimit!.toUpperCase() : quality

  return (
    <>
      <div className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center gap-2 px-6 py-3">
          <input
            type="text"
            value={url}
            onChange={e => setUrl(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleDownload()}
            placeholder={t.paste_placeholder}
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition-all focus:border-green-500 focus:ring-2 focus:ring-green-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:placeholder-gray-500"
          />

          <button
            onClick={handleDownload}
            disabled={!url.trim() || loadingPlaylist}
            className="flex flex-shrink-0 items-center gap-2 rounded-lg bg-green-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-green-700 hover:shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loadingPlaylist
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <Download className="h-4 w-4" />
            }
            {loadingPlaylist ? (t as any).playlist_loading ?? 'Загрузка...' : t.download}
          </button>

          <Dropdown value={format} options={FORMAT_OPTIONS} onChange={setFormat} />
          <Dropdown value={displayQuality} options={QUALITY_OPTIONS} onChange={setQuality} disabled={qualityLocked} />
          <Dropdown
            value={PLATFORM_SETTINGS[platform].label}
            options={Object.values(PLATFORM_SETTINGS).map(p => p.label)}
            onChange={label => {
              const key = Object.entries(PLATFORM_SETTINGS).find(([, v]) => v.label === label)?.[0] as Platform
              if (key) setPlatform(key)
            }}
          />

          <button
            onClick={() => setShowSettings(v => !v)}
            className={`flex-shrink-0 rounded-lg p-2.5 transition-all active:scale-95 ${
              showSettings
                ? 'bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-gray-100'
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800'
            }`}
          >
            <Settings className="h-5 w-5" />
          </button>
        </div>

        {showSettings && (
          <div className="flex flex-wrap items-center gap-4 border-t border-gray-100 px-6 py-3 text-sm text-gray-600 dark:border-gray-800 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <span className="text-gray-500 dark:text-gray-400">{t.save_to}</span>
              <FolderPicker value={downloadDir} onChange={setDownloadDir} />
            </div>
            <div className="h-4 w-px bg-gray-200 dark:bg-gray-700" />
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" checked={sponsorblock} onChange={e => setSponsorblock(e.target.checked)} className="accent-green-600" />
              {t.sponsorblock}
            </label>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" checked={subtitles} onChange={e => setSubtitles(e.target.checked)} className="accent-green-600" />
              {t.subtitles}
            </label>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" checked={playlist} onChange={e => setPlaylist(e.target.checked)} className="accent-green-600" />
              {t.full_playlist}
            </label>
          </div>
        )}
      </div>

      {showBrowserModal && (
        <BrowserInterceptModal
          t={t}
          url={browserUrl}
          onDownload={(videoUrl) => {
            setShowBrowserModal(false)
            const settings = buildSettings(videoUrl)
            // Берём slug из оригинальной страницы как имя файла (turbo, cap-zabuvajlo и т.д.)
            try {
              const segments = new URL(browserUrl).pathname.split('/').filter(Boolean)
              if (segments.length > 0) settings.page_title = segments[segments.length - 1]
            } catch {}
            onDownload(settings)
            setUrl('')
          }}
          onCancel={() => setShowBrowserModal(false)}
        />
      )}

      {showPlaylist && (
        <PlaylistModal
          url={playlistUrl}
          tracks={playlistTracks}
          playlistTitle={playlistTitle}
          onDownload={handlePlaylistDownload}
          onCancel={() => setShowPlaylist(false)}
          t={t}
        />
      )}
    </>
  )
}