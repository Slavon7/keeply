import { useEffect, useState } from 'react'
import { X, Download, RefreshCw } from 'lucide-react'

type UpdateState =
  | { type: 'hidden' }
  | { type: 'available'; version: string; notes: string }
  | { type: 'downloading'; percent: number; speed: number }
  | { type: 'ready'; version: string }
  | { type: 'error'; message: string }

export function UpdateBanner() {
  const [state, setState] = useState<UpdateState>({ type: 'hidden' })
  const [dismissed, setDismissed] = useState(false)
  const api = (window as any).electronAPI

  useEffect(() => {
    if (!api?.onUpdate) return

    api.onUpdate('update:available', (info: any) => {
      setState({ type: 'available', version: info.version, notes: info.releaseNotes || '' })
      setDismissed(false)
    })

    api.onUpdate('update:progress', (progress: any) => {
      setState({ type: 'downloading', percent: Math.round(progress.percent), speed: progress.bytesPerSecond })
    })

    api.onUpdate('update:downloaded', (info: any) => {
      setState({ type: 'ready', version: info.version })
      setDismissed(false)
    })

    api.onUpdate('update:error', (msg: string) => {
      setState({ type: 'error', message: msg })
    })

    return () => {
      ['update:available','update:progress','update:downloaded','update:error']
        .forEach(ch => api.offUpdate?.(ch))
    }
  }, [])

  if (state.type === 'hidden' || dismissed) return null

  const formatSpeed = (bps: number) => {
    if (bps > 1024 * 1024) return `${(bps / 1024 / 1024).toFixed(1)} MB/s`
    return `${(bps / 1024).toFixed(0)} KB/s`
  }

  return (
    <div className="flex items-center gap-3 bg-green-600 px-6 py-2 text-sm text-white select-none">

      {state.type === 'available' && (
        <>
          <span className="flex-1">
            🎉 Доступно обновление <strong>v{state.version}</strong> — скачивается в фоне...
          </span>
          <button onClick={() => setDismissed(true)}
            className="rounded p-1 opacity-70 hover:bg-white/20 hover:opacity-100 transition-all">
            <X className="h-4 w-4" />
          </button>
        </>
      )}

      {state.type === 'downloading' && (
        <>
          <Download className="h-4 w-4 animate-bounce flex-shrink-0" />
          <div className="flex flex-1 items-center gap-3">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/30">
              <div className="h-full rounded-full bg-white transition-all duration-300"
                style={{ width: `${state.percent}%` }} />
            </div>
            <span className="whitespace-nowrap opacity-80 text-xs">
              {state.percent}% · {formatSpeed(state.speed)}
            </span>
          </div>
        </>
      )}

      {state.type === 'ready' && (
        <>
          <span className="flex-1">
            ✅ Обновление <strong>v{state.version}</strong> готово — установится при закрытии
          </span>
          <button
            onClick={() => api?.installUpdate?.()}
            className="flex items-center gap-1.5 rounded-lg bg-white/20 px-3 py-1 font-medium transition-all hover:bg-white/30 active:scale-95"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Перезапустить сейчас
          </button>
          <button onClick={() => setDismissed(true)}
            className="rounded p-1 opacity-70 hover:bg-white/20 hover:opacity-100 transition-all">
            <X className="h-4 w-4" />
          </button>
        </>
      )}

      {state.type === 'error' && (
        <>
          <span className="flex-1 opacity-90">⚠ Ошибка обновления: {state.message}</span>
          <button onClick={() => setDismissed(true)}
            className="rounded p-1 opacity-70 hover:bg-white/20 hover:opacity-100 transition-all">
            <X className="h-4 w-4" />
          </button>
        </>
      )}
    </div>
  )
}
