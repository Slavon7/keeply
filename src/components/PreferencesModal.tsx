import { useState, useEffect } from 'react'
import { X, Globe, Download, Info, Palette, Shield } from 'lucide-react'
import { AppPreferences, Lang, T } from '../i18n'

interface Props {
  prefs: AppPreferences
  t: T
  onSave: (prefs: AppPreferences) => void
  onClose: () => void
}

type Tab = 'general' | 'language' | 'downloads' | 'proxy' | 'about'

const SPEED_OPTIONS = ['Без лимита', '128 KB/s', '512 KB/s', '1 MB/s', '2 MB/s', '5 MB/s', '10 MB/s']

const LANGUAGES: { code: Lang; label: string; badge: string }[] = [
  { code: 'uk', label: 'Українська',  badge: 'UA' },
  { code: 'en', label: 'English',     badge: 'EN' },
  { code: 'ru', label: 'Русский',     badge: 'RU' },
]

export function PreferencesModal({ prefs, t, onSave, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('general')
  const [draft, setDraft]         = useState<AppPreferences>({ ...prefs })
  const appVersion = (window as any).__APP_VERSION__ ?? ''

  const handleSave = () => { onSave(draft); onClose() }

  const tabs: { key: Tab; icon: typeof Globe; label: string }[] = [
    { key: 'general',   icon: Palette,  label: t.general  },
    { key: 'language',  icon: Globe,    label: t.language  },
    { key: 'downloads', icon: Download, label: t.downloads },
    { key: 'proxy',     icon: Shield,   label: t.proxy     },
    { key: 'about',     icon: Info,     label: t.about     },
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
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:border-gray-600 dark:hover:bg-gray-800'
                    }`}
                  >
                    <span className={`flex h-8 w-10 items-center justify-center rounded-md text-xs font-bold ${
                      draft.lang === lang.code ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                    }`}>{lang.badge}</span>
                    <span className={`font-medium ${draft.lang === lang.code ? 'text-green-700 dark:text-green-400' : 'text-gray-800 dark:text-gray-200'}`}>
                      {lang.label}
                    </span>
                    {draft.lang === lang.code && (
                      <span className="ml-auto text-xs font-medium text-green-600 dark:text-green-400">✓</span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* ── Downloads ─────────────────────────────────────────── */}
            {activeTab === 'downloads' && (
              <div className="space-y-6">

                {/* Макс. одновременных загрузок */}
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t.max_concurrent_downloads}
                  </label>
                  <p className="mb-3 text-xs text-gray-400 dark:text-gray-500">{t.max_concurrent_downloads_hint}</p>
                  <div className="flex gap-2">
                    {[1, 2, 3, 5, 10].map(n => (
                      <button
                        key={n}
                        onClick={() => setDraft(d => ({ ...d, maxConcurrentDownloads: n }))}
                        className={`flex-1 rounded-xl border py-2.5 text-sm font-medium transition-all ${
                          draft.maxConcurrentDownloads === n
                            ? 'border-green-500 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800'
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="h-px bg-gray-100 dark:bg-gray-800" />

                {/* Лимит скорости */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t.speed_limit_default}
                  </label>
                  <div className="space-y-1.5">
                    {SPEED_OPTIONS.map(opt => (
                      <button
                        key={opt}
                        onClick={() => setDraft(d => ({ ...d, defaultSpeedLimit: opt }))}
                        className={`flex w-full items-center justify-between rounded-lg border px-4 py-2.5 text-sm transition-all ${
                          draft.defaultSpeedLimit === opt
                            ? 'border-green-500 bg-green-50 text-green-700 font-medium dark:bg-green-900/20 dark:text-green-400'
                            : 'border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800'
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

            {/* ── Proxy ─────────────────────────────────────────────── */}
            {activeTab === 'proxy' && (
              <div className="space-y-5">
                {/* Toggle */}
                <div className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3 dark:border-gray-700">
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{t.proxy_enable}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{t.proxy_hint}</p>
                  </div>
                  <button
                    onClick={() => setDraft(d => ({ ...d, proxyEnabled: !d.proxyEnabled }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      draft.proxyEnabled ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      draft.proxyEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                {draft.proxyEnabled && (
                  <div className="space-y-3">
                    {/* Тип */}
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">{t.proxy_type}</label>
                      <div className="flex gap-2">
                        {(['http', 'https', 'socks5'] as const).map(type => (
                          <button
                            key={type}
                            onClick={() => setDraft(d => ({ ...d, proxyType: type }))}
                            className={`flex-1 rounded-lg border py-2 text-sm font-medium transition-all ${
                              draft.proxyType === type
                                ? 'border-green-500 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                                : 'border-gray-200 text-gray-600 hover:border-gray-300 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800'
                            }`}
                          >
                            {type.toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Хост + Порт */}
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">{t.proxy_host}</label>
                        <input
                          type="text"
                          value={draft.proxyHost}
                          onChange={e => setDraft(d => ({ ...d, proxyHost: e.target.value }))}
                          placeholder="192.168.1.1"
                          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:placeholder-gray-500"
                        />
                      </div>
                      <div className="w-24">
                        <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">{t.proxy_port}</label>
                        <input
                          type="text"
                          value={draft.proxyPort}
                          onChange={e => setDraft(d => ({ ...d, proxyPort: e.target.value }))}
                          placeholder="8080"
                          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:placeholder-gray-500"
                        />
                      </div>
                    </div>

                    {/* Логин + Пароль */}
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">{t.proxy_login}</label>
                        <input
                          type="text"
                          value={draft.proxyLogin}
                          onChange={e => setDraft(d => ({ ...d, proxyLogin: e.target.value }))}
                          placeholder={t.proxy_login}
                          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:placeholder-gray-500"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">{t.proxy_password}</label>
                        <input
                          type="password"
                          value={draft.proxyPassword}
                          onChange={e => setDraft(d => ({ ...d, proxyPassword: e.target.value }))}
                          placeholder="••••••••"
                          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:placeholder-gray-500"
                        />
                      </div>
                    </div>
                  </div>
                )}
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
                    <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Keeply</h3>
                    <p className="text-sm text-gray-400 dark:text-gray-500">{t.version} {appVersion}</p>
                  </div>
                </div>
                <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">{t.app_description}</p>
                <div className="space-y-2 rounded-xl bg-gray-50 p-4 text-sm dark:bg-gray-800">
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">{t.developer}</span>
                    <span className="font-medium text-gray-800 dark:text-gray-200">Viacheslav</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">{t.version}</span>
                    <span className="font-medium text-gray-800 dark:text-gray-200">{appVersion}</span>
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