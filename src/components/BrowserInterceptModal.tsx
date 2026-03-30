import { useEffect, useState } from 'react'
import { X, Loader2, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react'

interface Props {
  url: string
  onDownload: (videoUrl: string) => void
  onCancel: () => void
}

export function BrowserInterceptModal({ url, onDownload, onCancel }: Props) {
  const [status, setStatus] = useState<'waiting' | 'found' | 'error'>('waiting')
  const [foundUrl, setFoundUrl] = useState('')
  const [foundUrls, setFoundUrls] = useState<string[]>([])
  const api = (window as any).electronAPI

  useEffect(() => {
    // Запускаем скрытый браузер
    api?.browserIntercept(url)

    // Слушаем найденные видео ссылки
    api?.onBrowserFound((videoUrl: string) => {
      setFoundUrls(prev => {
        if (prev.includes(videoUrl)) return prev
        return [...prev, videoUrl]
      })
      setFoundUrl(videoUrl)
      setStatus('found')
    })

    return () => {
      api?.offBrowserFound()
    }
  }, [url])

  const handleDownload = (videoUrl: string) => {
    api?.browserClose()
    onDownload(videoUrl)
  }

  const handleCancel = () => {
    api?.browserClose()
    onCancel()
  }

  // Форматируем URL для отображения
  const formatUrl = (u: string) => {
    try {
      const parsed = new URL(u)
      return parsed.hostname + parsed.pathname.slice(0, 40) + (parsed.pathname.length > 40 ? '...' : '')
    } catch {
      return u.slice(0, 60) + '...'
    }
  }

  const getQuality = (u: string) => {
    const match = u.match(/(\d{3,4})[pP]/)
    return match ? match[1] + 'p' : null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-[520px] overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-gray-900 dark:border dark:border-gray-800">

        {/* Шапка */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-gray-800">
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
              🎬 Скачать видео
            </h2>
            <p className="mt-0.5 text-xs text-gray-400 truncate max-w-sm">{url}</p>
          </div>
          <button onClick={handleCancel}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Тело */}
        <div className="px-6 py-5 space-y-4">

          {/* Статус */}
          {status === 'waiting' && (
            <div className="flex items-center gap-3 rounded-xl bg-blue-50 px-4 py-3 dark:bg-blue-900/20">
              <Loader2 className="h-5 w-5 animate-spin text-blue-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-700 dark:text-blue-400">
                  Откроется окно браузера
                </p>
                <p className="text-xs text-blue-500 dark:text-blue-500 mt-0.5">
                  Нажмите ▶ Play в открывшемся окне — мы автоматически поймаем видео
                </p>
              </div>
            </div>
          )}

          {status === 'found' && (
            <div className="flex items-center gap-3 rounded-xl bg-green-50 px-4 py-3 dark:bg-green-900/20">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-green-700 dark:text-green-400">
                  Видео найдено! Выберите качество:
                </p>
              </div>
            </div>
          )}

          {/* Список найденных URL */}
          {foundUrls.length > 0 && (
            <div className="space-y-2">
              {foundUrls.map((u, i) => {
                const quality = getQuality(u)
                const isM3u8 = u.includes('.m3u8')
                return (
                  <button
                    key={i}
                    onClick={() => handleDownload(u)}
                    className="flex w-full items-center justify-between rounded-xl border border-gray-200 px-4 py-3 text-sm transition-all hover:border-green-500 hover:bg-green-50 dark:border-gray-700 dark:hover:bg-green-900/20"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex-shrink-0 rounded-md bg-gray-100 px-2 py-1 text-xs font-bold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                        {isM3u8 ? 'HLS' : 'MP4'}
                      </div>
                      <span className="truncate text-gray-600 dark:text-gray-400 text-xs">
                        {formatUrl(u)}
                      </span>
                    </div>
                    {quality && (
                      <span className="flex-shrink-0 ml-2 text-xs font-medium text-green-600 dark:text-green-400">
                        {quality}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          )}

          {/* Подсказка */}
          <div className="flex items-start gap-2 text-xs text-gray-400">
            <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
            <p>
              Браузер откроется отдельным окном. Нажмите Play — ссылка появится автоматически.
              Если видео не найдено, попробуйте кликнуть на сам плеер.
            </p>
          </div>
        </div>

        {/* Футер */}
        <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-4 dark:border-gray-800">
          <button onClick={handleCancel}
            className="rounded-xl border border-gray-300 px-5 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800">
            Отмена
          </button>
          {status === 'found' && (
            <button onClick={() => handleDownload(foundUrl)}
              className="rounded-xl bg-green-600 px-5 py-2 text-sm font-medium text-white hover:bg-green-700">
              Скачать лучшее качество
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
