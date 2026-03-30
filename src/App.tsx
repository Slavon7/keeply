import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { Toolbar } from './components/Toolbar'
import { SearchBar } from './components/SearchBar'
import { FilterTabs } from './components/FilterTabs'
import { DownloadItem } from './components/DownloadItem'
import { DeleteConfirmModal } from './components/DeleteConfirmModal'
import { PreferencesModal } from './components/PreferencesModal'
import { fetchHistory, startDownload, deleteFile } from './api'
import type { DownloadItem as Item, DownloadSettings } from './api'
import { loadPrefs, savePrefs, applyTheme, t as getT, AppPreferences } from './i18n'
import { TitleBar } from './components/TitleBar'
import { UpdateBanner } from './components/UpdateBanner'
import { BulkActionsBar } from './components/BulkActionsBar'

type FilterType = 'all' | 'video' | 'audio'
type SortKey = 'date_desc' | 'date_asc' | 'name_asc' | 'name_desc' | 'size_desc' | 'size_asc'

const AUDIO_EXTS = ['mp3', 'm4a', 'opus', 'wav']
function isAudioItem(item: Item) {
  return AUDIO_EXTS.some(ext => item.filepath?.toLowerCase().endsWith(ext))
}

interface ActiveDownload { ws: WebSocket; paused: boolean }

export default function App() {
  const [items, setItems]               = useState<Item[]>([])
  const [activeFilter, setActiveFilter] = useState<FilterType>('all')
  const [query, setQuery]               = useState('')
  const [sort, setSort]                 = useState<SortKey>('date_desc')
  const [searchOpen, setSearchOpen]     = useState(false)
  const [showPrefs, setShowPrefs]       = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string; filepath: string } | null>(null)
  const [prefs, setPrefs]               = useState<AppPreferences>(loadPrefs)

  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds]         = useState<Set<string>>(new Set())

  const activeDownloads = useRef<Map<string, ActiveDownload>>(new Map())

  const T = getT(prefs)

  // Применяем тему при старте и смене
  useEffect(() => { applyTheme(prefs.theme) }, [prefs.theme])


  // ─── Слушаем нативное меню ────────────────────────────────────────────────
  useEffect(() => {
    const api = (window as any).electronAPI
    if (!api?.onMenu) return

    // Edit → Preferences  (и About из Help)
    api.onMenu('menu:open-preferences', (tab?: string) => {
      setShowPrefs(true)
    })

    // Edit → Clear History
    api.onMenu('menu:clear-history', () => {
      if (window.confirm('Очистить историю загрузок?')) {
        fetch('http://127.0.0.1:7842/history', { method: 'DELETE' })
          .then(() => setItems([]))
      }
    })

    // View → Toggle Theme
    api.onMenu('menu:toggle-theme', () => {
      setPrefs(prev => {
        const next = { ...prev, theme: prev.theme === 'dark' ? 'light' as const : 'dark' as const }
        savePrefs(next)
        applyTheme(next.theme)
        return next
      })
    })

    // Downloads → Paste & Download
    api.onMenu('menu:paste-and-download', (url: string) => {
      window.dispatchEvent(new CustomEvent('paste-url', { detail: url }))
      // Небольшая задержка чтобы URL успел вставиться в инпут
      setTimeout(() => window.dispatchEvent(new CustomEvent('trigger-download')), 100)
    })

    // Downloads → Stop All
    api.onMenu('menu:stop-all', () => {
      window.dispatchEvent(new CustomEvent('stop-all-downloads'))
    })

    // File/Downloads → Open Downloads Folder
    api.onMenu('menu:open-downloads-folder', () => {
      fetch('http://127.0.0.1:7842/open-folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filepath: '' }),
      })
    })

    // Help → Check for Updates
    api.onMenu('menu:check-updates', () => {
      alert('YT Downloader v1.0.0 — актуальная версия')
    })

    // Слушаем кастомные события из TitleBar меню
    const menuHandlers: Record<string, () => void> = {
      'menu:open-preferences': () => setShowPrefs(true),
      'menu:clear-history': () => {
        if (window.confirm('Очистить историю загрузок?')) {
          fetch('http://127.0.0.1:7842/history', { method: 'DELETE' })
            .then(() => setItems([]))
        }
      },
      'menu:toggle-theme': () => {
        setPrefs(prev => {
          const next = { ...prev, theme: prev.theme === 'dark' ? 'light' as const : 'dark' as const }
          savePrefs(next)
          applyTheme(next.theme)
          return next
        })
      },
      'menu:check-updates': () => alert('YT Downloader v1.0.0 — актуальная версия'),
      'menu:open-downloads-folder': () => {
        fetch('http://127.0.0.1:7842/open-folder', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filepath: '' }),
        })
      },
    }

    Object.entries(menuHandlers).forEach(([event, handler]) => {
      window.addEventListener(event, handler)
    })

    // Stop All из меню
    const stopAllHandler = () => {
      activeDownloads.current.forEach((active, id) => {
        try { active.ws.send(JSON.stringify({ type: 'cancel' })) } catch {}
        active.ws.close()
      })
      activeDownloads.current.clear()
      setItems(prev => prev.filter(i => i.status !== 'downloading'))
    }
    window.addEventListener('stop-all-downloads', stopAllHandler)

    return () => {
      Object.entries(menuHandlers).forEach(([event, handler]) => {
        window.removeEventListener(event, handler)
      })
      window.removeEventListener('stop-all-downloads', stopAllHandler)
      const channels = [
        'menu:open-preferences', 'menu:clear-history', 'menu:toggle-theme',
        'menu:paste-and-download', 'menu:stop-all', 'menu:open-downloads-folder',
        'menu:check-updates',
      ]
      channels.forEach(ch => api.offMenu?.(ch))
    }
  }, [])

  // Ctrl+V глобально
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        const active = document.activeElement
        const isInput = active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement
        if (!isInput) {
          e.preventDefault()
          navigator.clipboard.readText().then(text => {
            const trimmed = text.trim()
            if (trimmed) window.dispatchEvent(new CustomEvent('paste-url', { detail: trimmed }))
          }).catch(() => {})
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  useEffect(() => { fetchHistory().then(setItems) }, [])

  // ─── Фильтр + сортировка ───────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = items
    if (activeFilter === 'video') list = list.filter(i => !isAudioItem(i))
    if (activeFilter === 'audio') list = list.filter(i => isAudioItem(i))
    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter(i => i.title.toLowerCase().includes(q))
    }
    list = [...list].sort((a, b) => {
      if (a.status === 'downloading' && b.status !== 'downloading') return -1
      if (b.status === 'downloading' && a.status !== 'downloading') return 1
      if (sort === 'date_desc') return (b.downloaded_at ?? '') > (a.downloaded_at ?? '') ? 1 : -1
      if (sort === 'date_asc')  return (a.downloaded_at ?? '') > (b.downloaded_at ?? '') ? 1 : -1
      if (sort === 'name_asc')  return a.title.localeCompare(b.title)
      if (sort === 'name_desc') return b.title.localeCompare(a.title)
      return 0
    })
    return list
  }, [items, activeFilter, query, sort])

  const counts = useMemo(() => ({
    all:   items.filter(i => i.status !== 'downloading').length,
    video: items.filter(i => i.status !== 'downloading' && !isAudioItem(i)).length,
    audio: items.filter(i => i.status !== 'downloading' && isAudioItem(i)).length,
  }), [items])

  const isAnyDownloading = items.some(i => i.status === 'downloading')

  // ─── Скачивание ────────────────────────────────────────────────────────────
  const handleToggleSelection = useCallback(() => {
    setIsSelectionMode(v => {
      if (v) setSelectedIds(new Set())
      return !v
    })
  }, [])

  const handleToggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }, [])

  const handleSelectAll = useCallback(() => {
    setSelectedIds(prev =>
      prev.size === filtered.length
        ? new Set()
        : new Set(filtered.map(i => i.id).filter((id): id is string => id != null))
    )
  }, [filtered])

  const handleDeleteSelected = useCallback(() => {
    const count = selectedIds.size
    setDeleteTarget({ id: '__bulk__', title: `${count}`, filepath: JSON.stringify(
      items.filter(i => i.id != null && selectedIds.has(i.id!)).map(i => i.filepath ?? '')
    )})
  }, [selectedIds, items])

  const handleOpenFolderSelected = useCallback(() => {
    const item = items.find(i => i.id != null && selectedIds.has(i.id))
    if (item?.filepath) {
      fetch('http://127.0.0.1:7842/open-folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filepath: item.filepath }),
      })
    }
  }, [selectedIds, items])

  const handleLocate = useCallback(async (id: string) => {
    const api = (window as any).electronAPI
    if (!api?.pickFile) return
    const newPath = await api.pickFile()
    if (!newPath) return
    await fetch('http://127.0.0.1:7842/update-filepath', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, newPath }),
    })
    fetchHistory().then(setItems)
  }, [])

  const handleDeleteFromHistory = useCallback((id: string) => {
    const item = items.find(i => i.id === id)
    if (!item) return
    setDeleteTarget({ id: '__single_history__', title: item.title, filepath: id })
  }, [items])

  const handleDownload = useCallback((settings: DownloadSettings) => {
    // Проверяем лимит одновременных загрузок
    const activeCount = items.filter(i => i.status === 'downloading').length
    if (activeCount >= (prefs.maxConcurrentDownloads ?? 3)) {
      alert(`Максимум ${prefs.maxConcurrentDownloads ?? 3} загрузок одновременно`)
      return
    }
    const tempId = `downloading-${Date.now()}`
    const placeholder: Item = {
      id: tempId, title: T.connecting, filepath: '', url: settings.url,
      status: 'downloading', progress: 0, downloaded_bytes: 0, total_bytes: 0, speed: 0, paused: false,
    }
    setItems(prev => [placeholder, ...prev])

    const ws = startDownload(
      settings,
      (percent, speed, downloaded_bytes, total_bytes) => {
        setItems(prev => prev.map(i =>
          i.id === tempId
            ? { ...i, progress: percent, speed, downloaded_bytes, total_bytes,
                title: i.title === T.connecting ? T.loading : i.title }
            : i
        ))
      },
      (completed) => {
        setItems(prev => prev.map(i => i.id === tempId ? { ...completed, id: tempId, status: 'downloaded' } : i))
        activeDownloads.current.delete(tempId)
      },
      (_error) => {
        setItems(prev => prev.map(i =>
          i.id === tempId ? { ...i, status: 'failed', title: T.error_loading } : i
        ))
        activeDownloads.current.delete(tempId)
      },
      () => {
        setItems(prev => prev.map(i =>
          i.id === tempId ? { ...i, progress: 100, speed: 0, processing: true,
            title: i.title === T.connecting ? T.loading : i.title } : i
        ))
      }
    )
    activeDownloads.current.set(tempId, { ws, paused: false })
  }, [T])

  const handleDeleteFromHistorySelected = useCallback(() => {
    const count = selectedIds.size
    setDeleteTarget({
      id: '__bulk_history__',
      title: `${count}`,
      filepath: JSON.stringify([...selectedIds]),
    })
  }, [selectedIds])

  const handleDownloadUrls = useCallback((urls: string[], baseSettings: DownloadSettings) => {
    // Добавляем все треки напрямую в очередь с задержкой для уникального tempId
    urls.forEach((trackUrl, index) => {
      const startOne = () => {
        handleDownload({ ...baseSettings, url: trackUrl, playlist: false })
      }
      // Небольшая задержка чтобы tempId был уникальным
      setTimeout(startOne, index * 100)
    })
  }, [handleDownload])

  const handleStop = useCallback((id: string) => {
    const active = activeDownloads.current.get(id)
    if (active) {
      try { active.ws.send(JSON.stringify({ type: 'cancel' })) } catch {}
      active.ws.close()
      activeDownloads.current.delete(id)
    }
    setItems(prev => prev.filter(i => i.id !== id))
  }, [])

  const handlePause = useCallback((id: string) => {
    const active = activeDownloads.current.get(id)
    if (!active) return
    const nowPaused = !active.paused
    active.paused = nowPaused
    try { active.ws.send(JSON.stringify({ type: nowPaused ? 'pause' : 'resume' })) } catch {}
    setItems(prev => prev.map(i =>
      i.id === id ? { ...i, paused: nowPaused, speed: nowPaused ? 0 : i.speed } : i
    ))
  }, [])

  const handleDeleteRequest = useCallback((id: string) => {
    const item = items.find(i => i.id === id)
    if (!item) return
    setDeleteTarget({ id, title: item.title, filepath: item.filepath ?? '' })
  }, [items])

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return
    if (deleteTarget.id === '__bulk__') {
      const filepaths: string[] = JSON.parse(deleteTarget.filepath)
      await Promise.all(filepaths.map(fp => deleteFile(fp)))
      setItems(prev => prev.filter(i => !selectedIds.has(i.id ?? '')))
      setSelectedIds(new Set())
      setIsSelectionMode(false)
    } else if (deleteTarget.id === '__bulk_history__') {
      const ids: string[] = JSON.parse(deleteTarget.filepath)
      await Promise.all(ids.map(id =>
        fetch('http://127.0.0.1:7842/history/entry', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id }),
        })
      ))
      setItems(prev => prev.filter(i => !ids.includes(i.id ?? '')))
      setSelectedIds(new Set())
      setIsSelectionMode(false)
    } else if (deleteTarget.id === '__single_history__') {
      const id = deleteTarget.filepath
      await fetch('http://127.0.0.1:7842/history/entry', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      setItems(prev => prev.filter(i => i.id !== id))
    } else {
      await deleteFile(deleteTarget.filepath)
      setItems(prev => prev.filter(i => i.id !== deleteTarget.id))
    }
    setDeleteTarget(null)
  }, [deleteTarget, selectedIds])

  const handleSavePrefs = useCallback((newPrefs: AppPreferences) => {
    savePrefs(newPrefs)
    setPrefs(newPrefs)
    applyTheme(newPrefs.theme)
  }, [])

  return (
    <div className="flex h-screen flex-col bg-gray-50 select-none dark:bg-gray-950">
      <TitleBar t={T} />
      <div className="h-px bg-gray-200 dark:bg-gray-800 flex-shrink-0" />
      <UpdateBanner t={T} />
      <Toolbar onDownload={handleDownload} isDownloading={isAnyDownloading} t={T} />
      <SearchBar
        query={query} onQuery={setQuery}
        sort={sort} onSort={setSort}
        total={counts.all}
        searchOpen={searchOpen}
        onToggleSearch={() => setSearchOpen(v => !v)}
        isSelectionMode={isSelectionMode}
        onToggleSelection={handleToggleSelection}
        t={T}
      />
      <FilterTabs active={activeFilter} onChange={setActiveFilter} counts={counts} t={T} />

      {isSelectionMode && (
        <BulkActionsBar
          selectedCount={selectedIds.size}
          totalCount={filtered.length}
          onSelectAll={handleSelectAll}
          onClearSelection={() => setSelectedIds(new Set())}
          onDeleteSelected={handleDeleteSelected}
          onDeleteFromHistorySelected={handleDeleteFromHistorySelected}
          onOpenFolder={handleOpenFolderSelected}
          t={T}
        />
      )}

      <div className="flex-1 overflow-y-auto dark:bg-gray-950">
        {filtered.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-gray-400 dark:text-gray-600">
            <p className="text-sm">{query ? T.nothing_found : T.history_empty}</p>
          </div>
        ) : (
          filtered.map(item => (
            <DownloadItem key={item.id} item={item}
              onDelete={handleDeleteRequest} onStop={handleStop} onPause={handlePause}
              onLocate={handleLocate} onDeleteFromHistory={handleDeleteFromHistory}
              isSelectionMode={isSelectionMode}
              isSelected={selectedIds.has(item.id ?? '')}
              onToggleSelect={handleToggleSelect}
              t={T} />
          ))
        )}
      </div>

      {deleteTarget && (
        <DeleteConfirmModal
          title={deleteTarget.title}
          isBulk={deleteTarget.id === '__bulk__' || deleteTarget.id === '__bulk_history__'}
          isHistoryOnly={deleteTarget.id === '__bulk_history__' || deleteTarget.id === '__single_history__'}
          t={T}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)} />
      )}

      {showPrefs && (
        <PreferencesModal prefs={prefs} t={T}
          onSave={handleSavePrefs} onClose={() => setShowPrefs(false)} />
      )}
    </div>
  )
}