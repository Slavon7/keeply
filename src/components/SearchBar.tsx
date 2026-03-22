import { useRef, useEffect, useState } from 'react'
import { Search, X, ArrowUp, ArrowDown, Clock, Type, ArrowUpDown } from 'lucide-react'
import { T } from '../i18n'

type SortKey = 'date_desc' | 'date_asc' | 'name_asc' | 'name_desc' | 'size_desc' | 'size_asc'

interface SearchBarProps {
  query: string; onQuery: (q: string) => void
  sort: SortKey; onSort: (s: SortKey) => void
  total: number; searchOpen: boolean; onToggleSearch: () => void
  t: T
}

export function SearchBar({ query, onQuery, sort, onSort, total, searchOpen, onToggleSearch, t }: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [sortOpen, setSortOpen] = useState(false)
  const popupRef = useRef<HTMLDivElement>(null)

  const SORT_GROUPS = [
    { label: t.date, icon: Clock,       asc: 'date_asc' as SortKey, desc: 'date_desc' as SortKey },
    { label: t.name, icon: Type,        asc: 'name_asc' as SortKey, desc: 'name_desc' as SortKey },
    { label: t.size, icon: ArrowUpDown, asc: 'size_asc' as SortKey, desc: 'size_desc' as SortKey },
  ]

  useEffect(() => {
    if (searchOpen) inputRef.current?.focus()
    else onQuery('')
  }, [searchOpen])

  useEffect(() => {
    if (!sortOpen) return
    const handler = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) setSortOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [sortOpen])

  const activeGroup = SORT_GROUPS.find(g => g.asc === sort || g.desc === sort)
  const isDesc = sort.endsWith('_desc')

  return (
    <div className="flex items-center gap-3 border-b border-gray-200 bg-white px-6 py-3 dark:border-gray-800 dark:bg-gray-900">
      <span className="text-sm font-semibold text-gray-800 whitespace-nowrap dark:text-gray-200">{t.history_title}</span>
      <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500 whitespace-nowrap dark:bg-gray-800 dark:text-gray-400">{total}</span>
      <div className="flex-1" />

      <div className="flex items-center gap-2">
        {/* Инпут поиска */}
        <div className={`overflow-hidden transition-all duration-200 ${searchOpen ? 'w-56 opacity-100' : 'w-0 opacity-0'}`}>
          <div className="relative">
            <input ref={inputRef} type="text" value={query} onChange={e => onQuery(e.target.value)}
              onKeyDown={e => e.key === 'Escape' && onToggleSearch()}
              placeholder={t.search_placeholder}
              className="w-full rounded-lg border border-gray-300 py-1.5 pl-3 pr-7 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:placeholder-gray-500" />
            {query && (
              <button onClick={() => onQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Лупа */}
        <button onClick={onToggleSearch}
          className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border transition-all ${
            searchOpen
              ? 'border-green-500 bg-green-50 text-green-600 dark:bg-green-900/30'
              : 'border-gray-300 text-gray-500 hover:border-gray-400 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800'
          }`}>
          <Search className="h-4 w-4" />
        </button>

        {/* Сортировка */}
        <div className="relative" ref={popupRef}>
          <button onClick={() => setSortOpen(v => !v)}
            className={`flex h-8 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition-all ${
              sortOpen
                ? 'border-green-500 bg-green-50 text-green-600 dark:bg-green-900/30'
                : 'border-gray-300 text-gray-500 hover:border-gray-400 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800'
            }`}>
            {activeGroup ? (
              <>
                <activeGroup.icon className="h-3.5 w-3.5" />
                <span>{activeGroup.label}</span>
                {isDesc ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" />}
              </>
            ) : <ArrowUpDown className="h-4 w-4" />}
          </button>

          {sortOpen && (
            <div className="absolute right-0 top-full z-20 mt-1 w-44 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
              {SORT_GROUPS.map(group => {
                const isActive = group.asc === sort || group.desc === sort
                const currentIsDesc = group.desc === sort
                return (
                  <div key={group.label} className={`flex items-center justify-between px-3 py-2.5 ${isActive ? 'bg-green-50 dark:bg-green-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                    <div className="flex items-center gap-2">
                      <group.icon className={`h-3.5 w-3.5 ${isActive ? 'text-green-600' : 'text-gray-400 dark:text-gray-500'}`} />
                      <span className={`text-sm ${isActive ? 'font-medium text-green-700 dark:text-green-400' : 'text-gray-700 dark:text-gray-300'}`}>{group.label}</span>
                    </div>
                    <div className="flex gap-1">
                      {[{ key: group.asc, icon: ArrowUp, active: isActive && !currentIsDesc },
                        { key: group.desc, icon: ArrowDown, active: isActive && currentIsDesc }].map(btn => (
                        <button key={btn.key} onClick={() => { onSort(btn.key); setSortOpen(false) }}
                          className={`flex h-6 w-6 items-center justify-center rounded transition-all ${btn.active ? 'bg-green-600 text-white' : 'text-gray-400 hover:bg-gray-200 hover:text-gray-700 dark:hover:bg-gray-600 dark:hover:text-gray-300'}`}>
                          <btn.icon className="h-3 w-3" />
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
