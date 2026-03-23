import { T } from '../i18n'

interface Props {
  title: string   // если id === '__bulk__' то title = количество файлов
  isBulk?: boolean
  t: T
  onConfirm: () => void
  onCancel: () => void
}

export function DeleteConfirmModal({ title, isBulk = false, t, onConfirm, onCancel }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onCancel}>
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-900 dark:border dark:border-gray-800"
        onClick={e => e.stopPropagation()}>
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
          <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </div>
        <h2 className="text-center text-base font-semibold text-gray-900 dark:text-gray-100">
          {isBulk ? t.delete_bulk_title : t.delete_title}
        </h2>
        <p className="mt-1.5 text-center text-sm text-gray-500 dark:text-gray-400">
          {isBulk ? (
            <><span className="font-medium text-gray-700 dark:text-gray-300">{title}</span> {t.delete_bulk_body}</>
          ) : (
            <><span className="font-medium text-gray-700 dark:text-gray-300">«{title}»</span><br />{t.delete_body}</>
          )}
        </p>
        <div className="mt-6 flex gap-3">
          <button onClick={onCancel}
            className="flex-1 rounded-xl border border-gray-300 py-2.5 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50 active:scale-95 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">
            {t.delete_cancel}
          </button>
          <button onClick={onConfirm}
            className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-medium text-white transition-all hover:bg-red-700 active:scale-95">
            {t.delete_confirm}
          </button>
        </div>
      </div>
    </div>
  )
}
