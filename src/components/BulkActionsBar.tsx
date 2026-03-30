import { Trash2, Folder, X, CheckSquare, Square, History } from 'lucide-react'
import { T } from '../i18n'

interface Props {
  selectedCount: number
  totalCount: number
  onSelectAll: () => void
  onClearSelection: () => void
  onDeleteSelected: () => void
  onDeleteFromHistorySelected: () => void
  onOpenFolder: () => void
  t: T
}

export function BulkActionsBar({
  selectedCount, totalCount,
  onSelectAll, onClearSelection, onDeleteSelected, onDeleteFromHistorySelected, onOpenFolder, t
}: Props) {
  const allSelected = selectedCount === totalCount && totalCount > 0

  return (
    <div className="border-b border-green-200 bg-green-50 px-6 py-2.5 dark:border-green-900 dark:bg-green-950/30">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onSelectAll}
            className="flex items-center gap-2 text-sm text-green-700 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
          >
            {allSelected
              ? <CheckSquare className="h-4 w-4" />
              : <Square className="h-4 w-4" />
            }
            {t.select_all} ({totalCount})
          </button>

          {selectedCount > 0 && (
            <>
              <div className="h-4 w-px bg-green-300 dark:bg-green-800" />
              <div className="flex items-center gap-2">
                <span className="text-sm text-green-900 dark:text-green-300">
                  {t.selected}: <strong>{selectedCount}</strong>
                </span>
                <button
                  onClick={onClearSelection}
                  className="flex items-center gap-1 text-xs text-green-700 hover:text-green-900 dark:text-green-400"
                >
                  <X className="h-3 w-3" />
                  {t.deselect}
                </button>
              </div>
            </>
          )}
        </div>

        {selectedCount > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenFolder}
              className="flex items-center gap-2 rounded-lg border border-green-600 bg-white px-3 py-1.5 text-sm text-green-700 transition-all hover:bg-green-50 active:scale-95 dark:bg-transparent dark:text-green-400 dark:hover:bg-green-900/30"
            >
              <Folder className="h-4 w-4" />
              {t.open_folder}
            </button>
            <button
              onClick={onDeleteFromHistorySelected}
              className="flex items-center gap-2 rounded-lg border border-red-400 bg-white px-3 py-1.5 text-sm text-red-500 transition-all hover:bg-red-50 active:scale-95 dark:bg-transparent dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
            >
              <History className="h-4 w-4" />
              {t.delete_from_history} ({selectedCount})
            </button>
            <button
              onClick={onDeleteSelected}
              className="flex items-center gap-2 rounded-lg bg-red-600 px-3 py-1.5 text-sm text-white transition-all hover:bg-red-700 active:scale-95"
            >
              <Trash2 className="h-4 w-4" />
              {t.delete} ({selectedCount})
            </button>
          </div>
        )}
      </div>
    </div>
  )
}