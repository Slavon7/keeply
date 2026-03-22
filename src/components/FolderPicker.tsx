import { useEffect, useRef, useState } from 'react'
import { Folder, ChevronDown, Check } from 'lucide-react'
import { fetchDefaultFolders, browseFolder } from '../api'

interface Props {
  value: string
  onChange: (path: string) => void
}

function shortPath(full: string): string {
  const parts = full.replace(/\\/g, '/').split('/')
  return parts[parts.length - 1] || full
}

export function FolderPicker({ value, onChange }: Props) {
  const [folders, setFolders] = useState<{ label: string; path: string }[]>([])
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchDefaultFolders()
      .then(f => {
        setFolders(f)
        if (!value && f.length > 0) {
          const dl = f.find(x => x.label === 'Downloads') ?? f[0]
          onChange(dl.path)
        }
      })
      .catch(() => {
        // бэкенд недоступен — молча игнорируем
      })
  }, [])

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const handleBrowse = async () => {
    try {
      const path = await browseFolder()
      if (path) { onChange(path); setOpen(false) }
    } catch {}
  }

  const activeLabel = folders.find(f => f.path === value)?.label
    ?? (value ? shortPath(value) : 'Downloads')

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition-all ${
          open
            ? 'border-green-500 bg-green-50 text-green-700'
            : 'border-gray-300 text-gray-600 hover:border-gray-400 hover:bg-gray-50'
        }`}
      >
        <Folder className="h-4 w-4 flex-shrink-0" />
        <span className="max-w-[140px] truncate">{activeLabel}</span>
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-20 mt-1 w-52 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
          {folders.map(f => (
            <button
              key={f.path}
              type="button"
              onClick={() => { onChange(f.path); setOpen(false) }}
              className="flex w-full items-center justify-between px-4 py-2.5 text-sm transition-colors hover:bg-gray-50"
            >
              <span className={value === f.path ? 'font-medium text-gray-900' : 'text-gray-700'}>
                {f.label}
              </span>
              {value === f.path && <Check className="h-4 w-4 text-green-600" />}
            </button>
          ))}

          <div className="border-t border-gray-100" />

          <button
            type="button"
            onClick={handleBrowse}
            className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700"
          >
            <Folder className="h-4 w-4" />
            Browse...
          </button>
        </div>
      )}
    </div>
  )
}
