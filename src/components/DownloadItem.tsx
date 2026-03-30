import { useState, useRef, useEffect } from 'react'
import { Folder, Play, CheckCircle2, XCircle, Loader2, Music, Square, Pause, PlayCircle, AlertTriangle, MoreVertical, Trash2, FolderOpen, ExternalLink, Copy } from 'lucide-react'
import { DownloadItem as Item, openFile, openFolder } from '../api'
import { T } from '../i18n'

interface Props {
  item: Item
  onDelete?: (id: string) => void
  onStop?:   (id: string) => void
  onPause?:  (id: string) => void
  onLocate?: (id: string) => void
  onDeleteFromHistory?: (id: string) => void
  isSelectionMode?: boolean
  isSelected?: boolean
  onToggleSelect?: (id: string) => void
  t: T
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 MB'
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`
}

function formatSpeed(bps: number): string {
  if (!bps || bps <= 0) return ''
  if (bps < 1024 * 1024) return `${(bps / 1024).toFixed(0)} KB/s`
  return `${(bps / 1024 / 1024).toFixed(1)} MB/s`
}

export function DownloadItem({ item, onDelete, onStop, onPause, onLocate, onDeleteFromHistory, isSelectionMode = false, isSelected = false, onToggleSelect, t }: Props) {
  const isDownloading = item.status === 'downloading'
  const isPaused      = item.paused ?? false
  const isProcessing  = item.processing ?? false
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const downloadedStr = formatBytes(item.downloaded_bytes ?? 0)
  const totalStr      = formatBytes(item.total_bytes ?? 0)
  const speedStr      = formatSpeed(item.speed ?? 0)

  useEffect(() => {
    if (!menuOpen) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  const handleDragStart = (e: React.DragEvent) => {
    if (!item.filepath || item.status !== 'downloaded' || item.file_missing) return
    const api = (window as any).electronAPI
    if (api?.startDrag) {
      e.preventDefault()
      api.startDrag(item.filepath)
    }
  }

  const handleCopyLink    = () => { navigator.clipboard.writeText(item.url); setMenuOpen(false) }
  const handleOpenSource = () => {
    const api = (window as any).electronAPI
    api?.openExternal?.(item.url) ?? window.open(item.url, '_blank')
    setMenuOpen(false)
  }
  const handleOpenFolder  = () => { openFolder(item.filepath); setMenuOpen(false) }
  const handleOpenFile    = () => { openFile(item.filepath); setMenuOpen(false) }
  const handleLocate      = () => { if (item.id) onLocate?.(item.id); setMenuOpen(false) }
  const handleDeleteFile  = () => { if (item.id) onDelete?.(item.id); setMenuOpen(false) }
  const handleDeleteHistory = () => { if (item.id) onDeleteFromHistory?.(item.id); setMenuOpen(false) }

  return (
    <div
      draggable={item.status === 'downloaded' && !isSelectionMode && !item.file_missing}
      onDragStart={handleDragStart}
      onClick={() => isSelectionMode && item.id && onToggleSelect?.(item.id)}
      className={`group flex items-center gap-4 border-b border-gray-100 px-6 py-3 transition-colors dark:border-gray-800 ${
        isSelectionMode
          ? isSelected
            ? 'bg-green-50 dark:bg-green-950/30 cursor-pointer'
            : 'bg-white dark:bg-gray-900 cursor-pointer hover:bg-green-50/50 dark:hover:bg-green-950/10'
          : 'bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800'
      }`}>

      {/* Чекбокс */}
      {isSelectionMode && (
        <div className="flex-shrink-0">
          <div className={`flex h-5 w-5 items-center justify-center rounded border-2 transition-all ${
            isSelected ? 'border-green-600 bg-green-600' : 'border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-800'
          }`}>
            {isSelected && (
              <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
        </div>
      )}

      {/* Thumbnail */}
      <div className="relative h-16 w-28 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
        {item.thumbnail ? (
          <img src={item.thumbnail} alt={item.title}
            className="h-full w-full object-cover"
            onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Music className="h-6 w-6 text-gray-400 dark:text-gray-600" />
          </div>
        )}
        {item.duration && (
          <div className="absolute bottom-1 right-1 rounded bg-black/70 px-1 py-0.5 text-xs text-white">
            {item.duration}
          </div>
        )}
      </div>

      {/* Контент */}
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">{item.title}</h3>
        {/* 3. Возвращаем kbps и fps */}
        <div className="mt-0.5 flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
          {item.fileSize   && <span>{item.fileSize}</span>}
          {item.format     && <><span>•</span><span>{item.format.toUpperCase()}</span></>}
          {item.resolution && <><span>•</span><span>{item.resolution}</span></>}
          {item.fps && <><span>•</span><span>{item.fps} fps</span></>}
          {item.downloaded_at && !isDownloading && <><span>•</span><span>{item.downloaded_at}</span></>}
        </div>

        {isDownloading && (
          <div className="mt-1.5">
            <div className="h-1 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
              {isProcessing ? (
                <div className="h-full w-full rounded-full bg-gradient-to-r from-green-400 to-green-600 animate-pulse" />
              ) : (
                <div className={`h-full rounded-full transition-all duration-300 ${isPaused ? 'bg-yellow-400' : 'bg-green-500'}`}
                  style={{ width: `${item.progress ?? 0}%` }} />
              )}
            </div>
            <div className="mt-1 flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
              {isProcessing ? (
                <span className="text-blue-500 font-medium">{t.processing}</span>
              ) : (
                <>
                  <span>{downloadedStr} / {totalStr}</span>
                  {isPaused
                    ? <span className="text-yellow-500 font-medium">{t.paused}</span>
                    : speedStr && <><span>•</span><span className="text-green-600 font-medium">{speedStr}</span></>
                  }
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Статус */}
      <div className="flex w-32 items-center justify-end gap-1.5 flex-shrink-0">
        {item.file_missing ? (
          <div className="flex items-center gap-1 text-yellow-500">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-xs">{t.file_not_found}</span>
          </div>
        ) : item.status === 'downloaded' ? (
          <div className="flex items-center gap-1 text-green-600">
            <CheckCircle2 className="h-4 w-4" />
            <span className="text-xs">{t.downloaded}</span>
          </div>
        ) : null}
        {isDownloading && !isPaused && (
          <div className="flex items-center gap-1.5 text-blue-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-xs font-medium">{item.progress?.toFixed(1)}%</span>
          </div>
        )}
        {isDownloading && isPaused && (
          <div className="flex items-center gap-1.5 text-yellow-500">
            <Pause className="h-4 w-4" />
            <span className="text-xs font-medium">{item.progress?.toFixed(1)}%</span>
          </div>
        )}
        {item.status === 'failed' && (
          <div className="flex items-center gap-1 text-red-500">
            <XCircle className="h-4 w-4" />
            <span className="text-xs">{t.failed}</span>
          </div>
        )}
      </div>

      {/* Действия */}
      <div className="flex items-center gap-0.5">
        {isDownloading ? (
          <div className="flex items-center gap-0.5">
            <button onClick={() => item.id && onPause?.(item.id)} title={isPaused ? t.resume : t.pause}
              className={`rounded-lg p-2 transition-all active:scale-95 ${isPaused ? 'hover:bg-green-100 dark:hover:bg-green-900/30' : 'hover:bg-yellow-100 dark:hover:bg-yellow-900/30'}`}>
              {isPaused ? <PlayCircle className="h-4 w-4 text-green-600" /> : <Pause className="h-4 w-4 text-yellow-500" />}
            </button>
            <button onClick={() => item.id && onStop?.(item.id)} title={t.stop}
              className="rounded-lg p-2 transition-all hover:bg-red-100 active:scale-95 dark:hover:bg-red-900/30">
              <Square className="h-4 w-4 text-red-500 fill-red-500" />
            </button>
          </div>
        ) : (
          <div className="relative flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100" ref={menuRef}>

            {/* 2. Placeholder для выравнивания когда файл missing */}
            {item.file_missing
              ?    <>
                    <div className="w-8 h-8" />
                    <button onClick={() => item.id && onLocate?.(item.id)} title="Найти файл"
                      className="rounded-lg p-2 transition-all hover:bg-yellow-100 active:scale-95 dark:hover:bg-yellow-900/30">
                      <FolderOpen className="h-4 w-4 text-yellow-500" />
                    </button>
                  </>
              : (
                <>
                  {/* Play */}
                  <button onClick={() => openFile(item.filepath)} title={t.play}
                    className="rounded-lg p-2 transition-all hover:bg-gray-200 active:scale-95 dark:hover:bg-gray-700">
                    <Play className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                  </button>
                  {/* Папка */}
                  <button onClick={() => openFolder(item.filepath)} title={t.open_folder}
                    className="rounded-lg p-2 transition-all hover:bg-gray-200 active:scale-95 dark:hover:bg-gray-700">
                    <Folder className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                  </button>
                </>
              )
            }

            {/* Три точки */}
            <button
              onClick={e => { e.stopPropagation(); setMenuOpen(v => !v) }}
              className={`rounded-lg p-2 transition-all active:scale-95 ${menuOpen ? 'bg-gray-200 dark:bg-gray-700' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
              <MoreVertical className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            </button>

            {/* Выпадающее меню */}
            {menuOpen && (
              <div className="absolute right-0 top-full z-50 mt-1 w-64 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800">

                {!item.file_missing ? (
                  <>
                    <button onClick={handleOpenFile}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700">
                      <Play className="h-4 w-4 text-gray-400" />
                      {t.menu_open_file}
                    </button>
                    <button onClick={handleOpenFolder}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700">
                      <Folder className="h-4 w-4 text-gray-400" />
                      {t.menu_go_to_file}
                    </button>
                  </>
                ) : (
                  <button onClick={handleLocate}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-yellow-600 hover:bg-yellow-50 dark:text-yellow-400 dark:hover:bg-yellow-900/20">
                    <FolderOpen className="h-4 w-4" />
                    {t.menu_find_file}
                  </button>
                )}

                <div className="mx-3 my-1 h-px bg-gray-100 dark:bg-gray-700" />

                <button onClick={handleCopyLink}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700">
                  <Copy className="h-4 w-4 text-gray-400" />
                  {t.menu_copy_link}
                </button>
                <button onClick={handleOpenSource}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700">
                  <ExternalLink className="h-4 w-4 text-gray-400" />
                  {t.menu_open_in_browser}
                </button>

                <div className="mx-3 my-1 h-px bg-gray-100 dark:bg-gray-700" />

                {!item.file_missing && (
                  <button onClick={handleDeleteFile}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
                    <Trash2 className="h-4 w-4" />
                    {t.menu_delete_file}
                  </button>
                )}
                <button onClick={handleDeleteHistory}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20">
                  <XCircle className="h-4 w-4" />
                  {t.menu_delete_from_history}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}