import { useEffect, useState } from 'react'
import { X, Loader2, CheckCircle2, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { T } from '../i18n'

interface Props {
  url: string
  onDownload: (videoUrl: string) => void
  onCancel: () => void
  t: T
}

// Оценивает URL — чем выше балл, тем лучше
function scoreUrl(u: string): number {
  let score = 0
  const res = u.match(/(\d{3,4})[pP]/)
  if (res) score += parseInt(res[1]) // 1080 > 720 > 480...
  if (u.includes('.m3u8')) score += 200 // HLS предпочтительнее прямого MP4
  return score
}

function pickBest(urls: string[]): string {
  return [...urls].sort((a, b) => scoreUrl(b) - scoreUrl(a))[0]
}

function formatUrl(u: string) {
  try {
    const p = new URL(u)
    const path = p.pathname.slice(0, 45)
    return p.hostname + path + (p.pathname.length > 45 ? '…' : '')
  } catch {
    return u.slice(0, 60) + '…'
  }
}

function getQuality(u: string) {
  const m = u.match(/(\d{3,4})[pP]/)
  return m ? m[1] + 'p' : null
}

function deduplicateUrls(urls: string[]): string[] {
  const seen = new Set<string>()
  return urls.filter(u => {
    try {
      const p = new URL(u)
      const isHls = u.includes('.m3u8')
      let key: string
      if (isHls) {
        const segs = p.pathname.split('/').filter(Boolean)
        key = 'hls:' + p.hostname + '/' + segs.slice(0, 4).join('/').replace(/\d{3,4}p/gi, 'Qp')
      } else {
        key = 'mp4:' + p.hostname + p.pathname
          .replace(/\/\d+\//g, '/N/')
          .replace(/[_-]\d+/g, '-N')
          .replace(/\d{3,4}p/gi, 'Qp')
      }
      if (seen.has(key)) return false
      seen.add(key)
      return true
    } catch {
      return true
    }
  })
}

export function BrowserInterceptModal({ url, onDownload, onCancel, t }: Props) {
  const [status, setStatus] = useState<'waiting' | 'found'>('waiting')
  const [foundUrls, setFoundUrls] = useState<string[]>([])
  const [showAll, setShowAll] = useState(false)
  const api = (window as any).electronAPI

  useEffect(() => {
    api?.browserIntercept(url)
    api?.onBrowserFound((videoUrl: string) => {
      setFoundUrls(prev => prev.includes(videoUrl) ? prev : [...prev, videoUrl])
      setStatus('found')
    })
    return () => { api?.offBrowserFound() }
  }, [url])

  const handleDownload = (videoUrl: string) => {
    onDownload(videoUrl)
  }

  const handleCancel = () => {
    api?.browserClose()
    onCancel()
  }

  const deduplicated = deduplicateUrls(foundUrls)
  const bestUrl = deduplicated.length > 0 ? pickBest(deduplicated) : null
  const bestQuality = bestUrl ? getQuality(bestUrl) : null
  const bestIsHls = bestUrl?.includes('.m3u8') ?? false

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-[480px] overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-gray-900 dark:border dark:border-gray-800">

        {/* Шапка */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-gray-800">
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">🎬 {t.browser_title}</h2>
            <p className="mt-0.5 text-xs text-gray-400 truncate max-w-sm">{url}</p>
          </div>
          <button onClick={handleCancel}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Тело */}
        <div className="px-6 py-5 space-y-4">

          {status === 'waiting' && (
            <div className="flex items-center gap-3 rounded-xl bg-blue-50 px-4 py-3 dark:bg-blue-900/20">
              <Loader2 className="h-5 w-5 animate-spin text-blue-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-700 dark:text-blue-400">{t.browser_waiting_title}</p>
                <p className="text-xs text-blue-500 mt-0.5">{t.browser_waiting_hint}</p>
              </div>
            </div>
          )}

          {status === 'found' && bestUrl && (
            <>
              <div className="flex items-center gap-3 rounded-xl bg-green-50 px-4 py-3 dark:bg-green-900/20">
                <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                <p className="text-sm font-medium text-green-700 dark:text-green-400">{t.browser_found}</p>
              </div>

              {/* Лучшая ссылка */}
              <div className="rounded-xl border border-green-400 bg-green-50/50 px-4 py-3 dark:border-green-700 dark:bg-green-900/10">
                <div className="flex items-center gap-2 mb-1">
                  <span className="rounded-md bg-green-600 px-2 py-0.5 text-xs font-bold text-white">
                    {bestIsHls ? 'HLS' : 'MP4'}
                  </span>
                  {bestQuality && (
                    <span className="text-xs font-semibold text-green-600 dark:text-green-400">{bestQuality}</span>
                  )}
                  <span className="text-xs text-gray-400 ml-auto">{t.browser_best_quality}</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{formatUrl(bestUrl)}</p>
              </div>

              {/* Раскрыть другие варианты */}
              {deduplicated.length > 1 && (
                <div>
                  <button
                    onClick={() => setShowAll(v => !v)}
                    className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showAll ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    {showAll ? t.browser_hide : `${t.browser_other} (${deduplicated.length - 1})`}
                  </button>

                  {showAll && (
                    <div className="mt-2 space-y-1.5">
                      {deduplicated.filter(u => u !== bestUrl).map((u, i) => {
                        const q = getQuality(u)
                        const isHls = u.includes('.m3u8')
                        return (
                          <button
                            key={i}
                            onClick={() => handleDownload(u)}
                            className="flex w-full items-center gap-3 rounded-xl border border-gray-200 px-4 py-2.5 text-xs transition-all hover:border-gray-400 dark:border-gray-700 dark:hover:border-gray-500"
                          >
                            <span className="flex-shrink-0 rounded-md bg-gray-100 px-2 py-0.5 text-xs font-bold text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                              {isHls ? 'HLS' : 'MP4'}
                            </span>
                            <span className="truncate text-gray-500 dark:text-gray-400">{formatUrl(u)}</span>
                            {q && <span className="flex-shrink-0 ml-auto text-gray-400">{q}</span>}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          <div className="flex items-start gap-2 text-xs text-gray-400">
            <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
            <p>{t.browser_hint}</p>
          </div>
        </div>

        {/* Футер */}
        <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-4 dark:border-gray-800">
            <button onClick={handleCancel}
              className="rounded-xl border border-gray-300 px-5 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800">
              {t.cancel}
            </button>
            {bestUrl && (
              <button onClick={() => handleDownload(bestUrl)}
                className="rounded-xl bg-green-600 px-5 py-2 text-sm font-medium text-white hover:bg-green-700">
                {t.download}
              </button>
            )}
        </div>
      </div>
    </div>
  )
}
