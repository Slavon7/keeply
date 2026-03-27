import { useState, useCallback, useRef } from 'react'
import { X, Download, Music, CheckSquare, Square } from 'lucide-react'
import { fetchPlaylistInfo, PlaylistTrack } from '../api'
import { T } from '../i18n'

interface PlaylistData {
  url: string
  title: string
  tracks: PlaylistTrack[]
}

// ─── Хук для определения плейлиста ────────────────────────────────────────
export function usePlaylistDetect() {
  const [playlistData, setPlaylistData] = useState<PlaylistData | null>(null)
  const loadingRef = useRef(false)

  const checkUrl = useCallback(async (url: string): Promise<boolean> => {
    const isPlaylistUrl =
      url.includes('list=') ||
      url.includes('/playlist') ||
      url.includes('/sets/') ||
      url.includes('album')

    if (!isPlaylistUrl) return false
    if (loadingRef.current) return false
    loadingRef.current = true

    try {
      const info = await fetchPlaylistInfo(url)
      if (info.ok && info.is_playlist && info.entries.length > 1) {
        setPlaylistData({
          url,
          title: info.title ?? 'Плейлист',
          tracks: info.entries,
        })
        return true
      }
      return false
    } catch {
      return false
    } finally {
      loadingRef.current = false
    }
  }, [])

  const reset = useCallback(() => setPlaylistData(null), [])

  return { playlistData, checkUrl, reset }
}

// ─── Модалка плейлиста ─────────────────────────────────────────────────────
interface Props {
  url: string
  playlistTitle: string
  tracks: PlaylistTrack[]
  t: T
  onDownload: (urls: string[]) => void
  onCancel: () => void
}

export function PlaylistModal({ url, playlistTitle, tracks, t, onDownload, onCancel }: Props) {
  // Используем url трека как ключ — уникальный и стабильный
  const [selected, setSelected] = useState<Set<string>>(
    new Set(tracks.map(tr => tr.url))
  )

  const allSelected = selected.size === tracks.length

  const toggleAll = () => {
    setSelected(allSelected
      ? new Set()
      : new Set(tracks.map(tr => tr.url))
    )
  }

  const toggle = (trackUrl: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(trackUrl) ? next.delete(trackUrl) : next.add(trackUrl)
      return next
    })
  }

  const handleDownload = () => {
    const urls = tracks
      .filter(tr => selected.has(tr.url))
      .map(tr => tr.url)
    onDownload(urls)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onCancel}>
      <div className="flex h-[560px] w-[560px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-gray-900 dark:border dark:border-gray-800"
        onClick={e => e.stopPropagation()}>

        {/* Шапка */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-gray-800">
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
              🎵 {playlistTitle}
            </h2>
            <p className="mt-0.5 text-xs text-gray-400">{tracks.length} треков</p>
          </div>
          <button onClick={onCancel}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Выбрать все */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-2.5 dark:border-gray-800">
          <button
            type="button"
            onClick={toggleAll}
            className="flex items-center gap-2 text-sm text-green-600 hover:text-green-700 dark:text-green-400"
          >
            {allSelected
              ? <CheckSquare className="h-4 w-4" />
              : <Square className="h-4 w-4" />
            }
            {allSelected ? 'Снять все' : 'Выбрать все'}
          </button>
          <span className="text-xs text-gray-400">
            Выбрано: {selected.size} из {tracks.length}
          </span>
        </div>

        {/* Список треков */}
        <div className="flex-1 overflow-y-auto">
          {tracks.map(track => (
            <div
              key={track.url}
              onClick={() => toggle(track.url)}
              className={`flex cursor-pointer items-center gap-3 border-b border-gray-50 px-6 py-3 transition-colors dark:border-gray-800 ${
                selected.has(track.url)
                  ? 'bg-green-50/50 dark:bg-green-950/20'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              {/* Чекбокс */}
              <div className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border-2 transition-all ${
                selected.has(track.url)
                  ? 'border-green-600 bg-green-600'
                  : 'border-gray-300 dark:border-gray-600'
              }`}>
                {selected.has(track.url) && (
                  <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>

              {/* Превью */}
              <div className="h-10 w-16 flex-shrink-0 overflow-hidden rounded bg-gray-100 dark:bg-gray-800">
                {track.thumbnail
                  ? <img src={track.thumbnail} className="h-full w-full object-cover" alt="" />
                  : <div className="flex h-full w-full items-center justify-center">
                      <Music className="h-4 w-4 text-gray-400" />
                    </div>
                }
              </div>

              {/* Название */}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                  {track.index}. {track.title}
                </p>
                {track.duration && (
                  <p className="text-xs text-gray-400">{track.duration}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Футер */}
        <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4 dark:border-gray-800">
          <button onClick={onCancel}
            className="rounded-xl border border-gray-300 px-5 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800">
            Отмена
          </button>
          <button
            type="button"
            onClick={handleDownload}
            disabled={selected.size === 0}
            className="flex items-center gap-2 rounded-xl bg-green-600 px-5 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="h-4 w-4" />
            Скачать {selected.size > 0 ? `(${selected.size})` : ''}
          </button>
        </div>
      </div>
    </div>
  )
}