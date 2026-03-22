import { useState } from 'react'
import { X, Globe, Download, Info, Palette } from 'lucide-react'
import { AppPreferences, Lang, T } from '../i18n'

interface Props {
  prefs: AppPreferences
  t: T
  onSave: (prefs: AppPreferences) => void
  onClose: () => void
}

type Tab = 'general' | 'language' | 'downloads' | 'about'

const SPEED_OPTIONS = ['Без лимита', '128 KB/s', '512 KB/s', '1 MB/s', '2 MB/s', '5 MB/s', '10 MB/s']

const LANGUAGES: { code: Lang; label: string; flag: string }[] = [
  { code: 'ru', label: 'Русский',     flag: '🇷🇺' },
  { code: 'uk', label: 'Українська',  flag: '🇺🇦' },
  { code: 'en', label: 'English',     flag: '🇬🇧' },
]

export function PreferencesModal({ prefs, t, onSave, onClose }: Props) {
  const [activeTab, setActiveTab]   = useState<Tab>('general')
  const [draft, setDraft]           = useState<AppPreferences>({ ...prefs })

  const handleSave = () => { onSave(draft); onClose() }

  const tabs: { key: Tab; icon: typeof Globe; label: string }[] = [
    { key: 'general',   icon: Palette,  label: t.general   },
    { key: 'language',  icon: Globe,    label: t.language   },
    { key: 'downloads', icon: Download, label: t.downloads  },
    { key: 'about',     icon: Info,     label: t.about      },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}>
      <div className="flex h-[480px] w-[680px] overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-gray-900 dark:border dark:border-gray-800"
        onClick={e => e.stopPropagation()}>

        {/* Сайдбар */}
        <div className="flex w-48 flex-col border-r border-gray-100 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-950">
          <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-600">
            {t.preferences}
          </p>
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all ${
                activeTab === tab.key
                  ? 'bg-white font-medium text-gray-900 shadow-sm dark:bg-gray-800 dark:text-gray-100'
                  : 'text-gray-500 hover:bg-white/60 hover:text-gray-700 dark:text-gray-500 dark:hover:bg-gray-800 dark:hover:text-gray-300'
              }`}
            >
              <tab.icon className="h-4 w-4 flex-shrink-0" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Контент */}
        <div className="flex flex-1 flex-col">
          {/* Шапка */}
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-gray-800">
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
              {tabs.find(t => t.key === activeTab)?.label}
            </h2>
            <button onClick={onClose}
              className="rounded-lg p-1.5 text-gray-400 transition-all hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Тело вкладки */}
          <div className="flex-1 overflow-y-auto px-6 py-5">

            {/* ── General ───────────────────────────────────────────── */}
            {activeTab === 'general' && (
              <div className="space-y-6">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">{t.theme}</label>
                  <div className="flex gap-2">
                    {(['light', 'system', 'dark'] as const).map(th => (
                      <button
                        key={th}
                        onClick={() => setDraft(d => ({ ...d, theme: th }))}
                        className={`flex-1 rounded-xl border py-3 text-sm transition-all ${
                          draft.theme === th
                            ? 'border-green-500 bg-green-50 font-medium text-green-700 dark:bg-green-900/20 dark:text-green-400'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800'
                        }`}
                      >
                        {th === 'light' ? '☀️ ' + t.theme_light
                          : th === 'dark' ? '🌙 ' + t.theme_dark
                          : '💻 ' + t.theme_system}
                      </button>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-gray-400">
                    {draft.theme === 'system' ? '* Следует за системной темой' : ''}
                  </p>
                </div>
              </div>
            )}

            {/* ── Language ──────────────────────────────────────────── */}
            {activeTab === 'language' && (
              <div className="space-y-2">
                <p className="mb-4 text-sm text-gray-500">{t.language_label}</p>
                {LANGUAGES.map(lang => (
                  <button
                    key={lang.code}
                    onClick={() => setDraft(d => ({ ...d, lang: lang.code }))}
                    className={`flex w-full items-center gap-4 rounded-xl border px-4 py-3.5 text-sm transition-all ${
                      draft.lang === lang.code
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-2xl">{lang.flag}</span>
                    <span className={`font-medium ${draft.lang === lang.code ? 'text-green-700' : 'text-gray-800'}`}>
                      {lang.label}
                    </span>
                    {draft.lang === lang.code && (
                      <span className="ml-auto text-xs font-medium text-green-600">✓ Активен</span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* ── Downloads ─────────────────────────────────────────── */}
            {activeTab === 'downloads' && (
              <div className="space-y-6">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    {t.speed_limit_default}
                  </label>
                  <div className="space-y-1.5">
                    {SPEED_OPTIONS.map(opt => (
                      <button
                        key={opt}
                        onClick={() => setDraft(d => ({ ...d, defaultSpeedLimit: opt }))}
                        className={`flex w-full items-center justify-between rounded-lg border px-4 py-2.5 text-sm transition-all ${
                          draft.defaultSpeedLimit === opt
                            ? 'border-green-500 bg-green-50 text-green-700 font-medium'
                            : 'border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <span>{opt}</span>
                        {draft.defaultSpeedLimit === opt && <span>✓</span>}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── About ─────────────────────────────────────────────── */}
            {activeTab === 'about' && (
              <div className="space-y-5">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-green-600 text-3xl shadow-lg">
                    ⬇️
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Keeply</h3>
                    <p className="text-sm text-gray-400">{t.version} 1.0.0</p>
                  </div>
                </div>
                <p className="text-sm leading-relaxed text-gray-600">{t.app_description}</p>
                <div className="space-y-2 rounded-xl bg-gray-50 p-4 text-sm dark:bg-gray-800">
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">{t.developer}</span>
                    <span className="font-medium text-gray-800 dark:text-gray-200">Viacheslav</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">{t.version}</span>
                    <span className="font-medium text-gray-800 dark:text-gray-200">1.0.0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Stack</span>
                    <span className="font-medium text-gray-800 dark:text-gray-200">Electron + React + FastAPI</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Engine</span>
                    <span className="font-medium text-gray-800 dark:text-gray-200">yt-dlp + ffmpeg</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Футер */}
          <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-4 dark:border-gray-800">
            <button onClick={onClose}
              className="rounded-xl border border-gray-300 px-5 py-2 text-sm font-medium text-gray-600 transition-all hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800">
              {t.cancel}
            </button>
            <button onClick={handleSave}
              className="rounded-xl bg-green-600 px-5 py-2 text-sm font-medium text-white transition-all hover:bg-green-700">
              {t.save}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
