import { useEffect, useRef, useState } from 'react'
import { Minus, Maximize2, Square, X } from 'lucide-react'
import { T } from '../i18n'

interface MenuItem {
  label: (t: T) => string
  accelerator?: string
  action?: string
  separator?: boolean
}

interface MenuGroup {
  label: (t: T) => string
  items: MenuItem[]
}

const MENU: MenuGroup[] = [
  {
    label: t => t.menu_file,
    items: [
      { label: t => t.menu_open_downloads_folder, accelerator: 'Ctrl+Shift+O', action: 'menu:open-downloads-folder' },
      { separator: true, label: () => '' },
      { label: t => t.menu_exit, accelerator: 'Alt+F4', action: 'app:exit' },
    ],
  },
  {
    label: t => t.menu_edit,
    items: [
      { label: t => t.menu_preferences, accelerator: 'Ctrl+,', action: 'menu:open-preferences' },
      { separator: true, label: () => '' },
      { label: t => t.menu_clear_history, action: 'menu:clear-history' },
    ],
  },
  {
    label: t => t.menu_view,
    items: [
      { label: t => t.menu_toggle_theme, accelerator: 'Ctrl+Shift+T', action: 'menu:toggle-theme' },
      { separator: true, label: () => '' },
      { label: t => t.menu_zoom_in,    accelerator: 'Ctrl++', action: 'view:zoom-in' },
      { label: t => t.menu_zoom_out,   accelerator: 'Ctrl+-', action: 'view:zoom-out' },
      { label: t => t.menu_zoom_reset, accelerator: 'Ctrl+0', action: 'view:zoom-reset' },
    ],
  },
  {
    label: t => t.menu_downloads,
    items: [
      { label: t => t.menu_paste_download, accelerator: 'Ctrl+Shift+V', action: 'menu:paste-and-download-menu' },
      { separator: true, label: () => '' },
      { label: t => t.menu_stop_all, action: 'menu:stop-all' },
      { label: t => t.menu_open_downloads_folder, action: 'menu:open-downloads-folder' },
    ],
  },
  {
    label: t => t.menu_help,
    items: [
      { label: t => t.menu_check_updates, action: 'menu:check-updates' },
      { label: t => t.menu_report_bug, action: 'app:report-bug' },
      { separator: true, label: () => '' },
      { label: t => t.menu_about, action: 'menu:open-preferences' },
    ],
  },
]

interface Props {
  title?: string
  t: T
}

export function TitleBar({ title = 'Keeply', t }: Props) {
  const [isMaximized, setIsMaximized] = useState(false)
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const api = (window as any).electronAPI

  useEffect(() => {
    api?.isMaximized().then((v: boolean) => setIsMaximized(v))
  }, [])

  useEffect(() => {
    if (!openMenu) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenu(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [openMenu])

  const handleMaximize = async () => {
    api?.maximize()
    setTimeout(async () => {
      const v = await api?.isMaximized()
      setIsMaximized(v)
    }, 100)
  }

  const handleAction = (action?: string) => {
    setOpenMenu(null)
    if (!action) return

    if (action === 'view:zoom-in')    { (document.body as any).style.zoom = `${(parseFloat((document.body as any).style.zoom) || 1) + 0.1}`; return }
    if (action === 'view:zoom-out')   { (document.body as any).style.zoom = `${Math.max(0.5, (parseFloat((document.body as any).style.zoom) || 1) - 0.1)}`; return }
    if (action === 'view:zoom-reset') { (document.body as any).style.zoom = '1'; return }
    if (action === 'app:exit')        { api?.close(); return }
    if (action === 'app:report-bug')  { window.open('https://github.com/'); return }

    if (action === 'menu:paste-and-download-menu') {
      navigator.clipboard.readText().then(text => {
        const trimmed = text.trim()
        if (trimmed) {
          window.dispatchEvent(new CustomEvent('paste-url', { detail: trimmed }))
          setTimeout(() => window.dispatchEvent(new CustomEvent('trigger-download')), 100)
        }
      }).catch(() => {})
      return
    }

    window.dispatchEvent(new CustomEvent(action))
  }

  return (
    <div
      className="flex h-10 flex-shrink-0 items-center bg-white dark:bg-gray-900 select-none border-b border-gray-200 dark:border-gray-800"
      style={{ WebkitAppRegion: 'drag' } as any}
    >
      <div
        ref={menuRef}
        className="flex items-center"
        style={{ WebkitAppRegion: 'no-drag' } as any}
      >
        {MENU.map(group => {
          const groupLabel = group.label(t)
          return (
            <div key={groupLabel} className="relative">
              <button
                onClick={() => setOpenMenu(openMenu === groupLabel ? null : groupLabel)}
                onMouseEnter={() => openMenu && setOpenMenu(groupLabel)}
                className={`px-3 h-10 text-xs font-medium transition-colors ${
                  openMenu === groupLabel
                    ? 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200'
                }`}
              >
                {groupLabel}
              </button>

              {openMenu === groupLabel && (
                <div className="absolute left-0 top-full z-50 mt-0 w-56 overflow-hidden rounded-b-xl rounded-tr-xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900">
                  {group.items.map((item, i) =>
                    item.separator ? (
                      <div key={i} className="mx-3 my-1 h-px bg-gray-100 dark:bg-gray-800" />
                    ) : (
                      <button
                        key={i}
                        onClick={() => handleAction(item.action)}
                        className="flex w-full items-center justify-between px-4 py-2 text-left text-sm transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <span className="text-gray-700 dark:text-gray-300">{item.label(t)}</span>
                        {item.accelerator && (
                          <span className="text-xs text-gray-400 dark:text-gray-600">{item.accelerator}</span>
                        )}
                      </button>
                    )
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="flex-1" />

      <div
        className="flex items-center flex-shrink-0"
        style={{ WebkitAppRegion: 'no-drag' } as any}
      >
        <button
          onClick={() => api?.minimize()}
          className="flex h-10 w-10 items-center justify-center text-gray-400 transition-all hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-300"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={handleMaximize}
          className="flex h-10 w-10 items-center justify-center text-gray-400 transition-all hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-300"
        >
          {isMaximized ? <Square className="h-3 w-3" /> : <Maximize2 className="h-3.5 w-3.5" />}
        </button>
        <button
          onClick={() => api?.close()}
          className="flex h-10 w-10 items-center justify-center text-gray-400 transition-all hover:bg-red-500 hover:text-white"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}