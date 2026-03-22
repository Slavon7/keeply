import { useEffect, useRef, useState } from 'react'
import { Minus, Maximize2, Square, X } from 'lucide-react'

interface MenuItem {
  label: string
  accelerator?: string
  action?: string
  separator?: boolean
  disabled?: boolean
}

interface MenuGroup {
  label: string
  items: MenuItem[]
}

const MENU: MenuGroup[] = [
  {
    label: 'File',
    items: [
      { label: 'Open Downloads Folder', accelerator: 'Ctrl+Shift+O', action: 'menu:open-downloads-folder' },
      { separator: true, label: '' },
      { label: 'Exit', accelerator: 'Alt+F4', action: 'app:exit' },
    ],
  },
  {
    label: 'Edit',
    items: [
      { label: 'Preferences', accelerator: 'Ctrl+,', action: 'menu:open-preferences' },
      { separator: true, label: '' },
      { label: 'Clear History', action: 'menu:clear-history' },
    ],
  },
  {
    label: 'View',
    items: [
      { label: 'Toggle Theme', accelerator: 'Ctrl+Shift+T', action: 'menu:toggle-theme' },
      { separator: true, label: '' },
      { label: 'Zoom In',    accelerator: 'Ctrl++', action: 'view:zoom-in' },
      { label: 'Zoom Out',   accelerator: 'Ctrl+-', action: 'view:zoom-out' },
      { label: 'Reset Zoom', accelerator: 'Ctrl+0', action: 'view:zoom-reset' },
    ],
  },
  {
    label: 'Downloads',
    items: [
      { label: 'Paste & Download', accelerator: 'Ctrl+Shift+V', action: 'menu:paste-and-download-menu' },
      { separator: true, label: '' },
      { label: 'Stop All Downloads', action: 'menu:stop-all' },
      { label: 'Open Downloads Folder', action: 'menu:open-downloads-folder' },
    ],
  },
  {
    label: 'Help',
    items: [
      { label: 'Check for Updates', action: 'menu:check-updates' },
      { label: 'Report a Bug', action: 'app:report-bug' },
      { separator: true, label: '' },
      { label: 'About', action: 'menu:open-preferences' },
    ],
  },
]

interface Props {
  title?: string
}

export function TitleBar({ title = 'Keeply' }: Props) {
  const [isMaximized, setIsMaximized] = useState(false)
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const api = (window as any).electronAPI

  useEffect(() => {
    api?.isMaximized().then((v: boolean) => setIsMaximized(v))
  }, [])

  // Закрыть меню по клику вне
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

    // Zoom — через webContents напрямую не можем, шлём событие
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

    // Все остальные — через существующие кастомные события
    window.dispatchEvent(new CustomEvent(action))
  }

  return (
    <div
      className="flex h-10 flex-shrink-0 items-center bg-white dark:bg-gray-900 select-none border-b border-gray-200 dark:border-gray-800"
      style={{ WebkitAppRegion: 'drag' } as any}
    >
      {/* Меню */}
      <div
        ref={menuRef}
        className="flex items-center"
        style={{ WebkitAppRegion: 'no-drag' } as any}
      >
        {MENU.map(group => (
          <div key={group.label} className="relative">
            <button
              onClick={() => setOpenMenu(openMenu === group.label ? null : group.label)}
              onMouseEnter={() => openMenu && setOpenMenu(group.label)}
              className={`px-3 h-10 text-xs font-medium transition-colors ${
                openMenu === group.label
                  ? 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200'
              }`}
            >
              {group.label}
            </button>

            {openMenu === group.label && (
              <div className="absolute left-0 top-full z-50 mt-0 w-56 overflow-hidden rounded-b-xl rounded-tr-xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900">
                {group.items.map((item, i) =>
                  item.separator ? (
                    <div key={i} className="mx-3 my-1 h-px bg-gray-100 dark:bg-gray-800" />
                  ) : (
                    <button
                      key={i}
                      onClick={() => handleAction(item.action)}
                      disabled={item.disabled}
                      className="flex w-full items-center justify-between px-4 py-2 text-left text-sm transition-colors hover:bg-gray-50 disabled:opacity-40 dark:hover:bg-gray-800"
                    >
                      <span className="text-gray-700 dark:text-gray-300">{item.label}</span>
                      {item.accelerator && (
                        <span className="text-xs text-gray-400 dark:text-gray-600">{item.accelerator}</span>
                      )}
                    </button>
                  )
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Растяжка */}
      <div className="flex-1" />

      {/* Кнопки окна */}
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
