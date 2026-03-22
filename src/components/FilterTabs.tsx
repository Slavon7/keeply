import { T } from '../i18n'

type FilterType = 'all' | 'video' | 'audio'

interface FilterTabsProps {
  active: FilterType
  onChange: (f: FilterType) => void
  counts: { all: number; video: number; audio: number }
  t: T
}

const TABS: { label: string; value: FilterType }[] = [
  { label: 'All',   value: 'all' },
  { label: 'Video', value: 'video' },
  { label: 'Audio', value: 'audio' },
]

export function FilterTabs({ active, onChange, counts, t }: FilterTabsProps) {
  return (
    <div className="border-b border-gray-200 bg-white px-6 dark:border-gray-800 dark:bg-gray-900">
      <div className="flex gap-1">
        {TABS.map(tab => (
          <button key={tab.value} onClick={() => onChange(tab.value)}
            className={`relative flex items-center gap-1.5 px-4 py-3 text-sm transition-all ${
              active === tab.value
                ? 'text-green-600 dark:text-green-400'
                : 'text-gray-500 hover:text-gray-800 dark:text-gray-500 dark:hover:text-gray-300'
            }`}>
            {tab.label}
            <span className={`rounded-full px-1.5 py-0.5 text-xs ${
              active === tab.value
                ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
                : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500'
            }`}>
              {counts[tab.value]}
            </span>
            {active === tab.value && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-600 rounded-t-full dark:bg-green-400" />
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
