export type Lang = 'ru' | 'uk' | 'en'

export const TRANSLATIONS = {
  ru: {
    // Toolbar
    paste_placeholder: 'Вставьте ссылку на видео... (или Ctrl+V)',
    download: 'Скачать',
    downloading: 'Загрузка...',
    settings_title: 'Настройки',
    save_to: 'Сохранить в',
    sponsorblock: 'SponsorBlock',
    subtitles: 'Субтитры',
    full_playlist: 'Весь плейлист',
    // History
    history_title: 'История загрузок',
    search_placeholder: 'Поиск...',
    nothing_found: 'Ничего не найдено',
    history_empty: 'История пуста — скачай что-нибудь!',
    // Sort
    sort_date_desc: 'Дата ↓',
    sort_date_asc: 'Дата ↑',
    sort_name_asc: 'Название А-Я',
    sort_name_desc: 'Название Я-А',
    sort_size_desc: 'Размер ↓',
    sort_size_asc: 'Размер ↑',
    date: 'Дата',
    name: 'Название',
    size: 'Размер',
    // Status
    downloaded: 'Скачано',
    failed: 'Ошибка',
    processing: '⚙ Обработка файла...',
    paused: '⏸ Пауза',
    connecting: 'Подключаемся...',
    loading: 'Загружается...',
    error_loading: 'Ошибка загрузки',
    // Actions
    play: 'Воспроизвести',
    open_folder: 'Открыть папку',
    delete: 'Удалить',
    stop: 'Остановить',
    pause: 'Пауза',
    resume: 'Продолжить',
    // Delete modal
    delete_title: 'Удалить файл?',
    delete_body: 'будет безвозвратно удалён с устройства.',
    delete_confirm: 'Удалить',
    delete_cancel: 'Оставить',
    // Preferences
    preferences: 'Настройки',
    general: 'Основные',
    language: 'Язык',
    downloads: 'Загрузки',
    about: 'О программе',
    theme: 'Тема',
    theme_light: 'Светлая',
    theme_dark: 'Тёмная',
    theme_system: 'Системная',
    language_label: 'Язык интерфейса',
    speed_limit_default: 'Лимит скорости по умолчанию',
    no_limit: 'Без лимита',
    save: 'Сохранить',
    cancel: 'Отмена',
    version: 'Версия',
    developer: 'Разработчик',
    description: 'Описание',
    app_description: 'Быстрый и удобный загрузчик видео и аудио с YouTube, TikTok и других платформ.',
  },
  uk: {
    paste_placeholder: 'Вставте посилання на відео... (або Ctrl+V)',
    download: 'Завантажити',
    downloading: 'Завантаження...',
    settings_title: 'Налаштування',
    save_to: 'Зберегти в',
    sponsorblock: 'SponsorBlock',
    subtitles: 'Субтитри',
    full_playlist: 'Весь плейлист',
    history_title: 'Історія завантажень',
    search_placeholder: 'Пошук...',
    nothing_found: 'Нічого не знайдено',
    history_empty: 'Історія порожня — завантаж щось!',
    sort_date_desc: 'Дата ↓',
    sort_date_asc: 'Дата ↑',
    sort_name_asc: 'Назва А-Я',
    sort_name_desc: 'Назва Я-А',
    sort_size_desc: 'Розмір ↓',
    sort_size_asc: 'Розмір ↑',
    date: 'Дата',
    name: 'Назва',
    size: 'Розмір',
    downloaded: 'Завантажено',
    failed: 'Помилка',
    processing: '⚙ Обробка файлу...',
    paused: '⏸ Пауза',
    connecting: 'Підключаємось...',
    loading: 'Завантажується...',
    error_loading: 'Помилка завантаження',
    play: 'Відтворити',
    open_folder: 'Відкрити папку',
    delete: 'Видалити',
    stop: 'Зупинити',
    pause: 'Пауза',
    resume: 'Продовжити',
    delete_title: 'Видалити файл?',
    delete_body: 'буде безповоротно видалено з пристрою.',
    delete_confirm: 'Видалити',
    delete_cancel: 'Залишити',
    preferences: 'Налаштування',
    general: 'Загальні',
    language: 'Мова',
    downloads: 'Завантаження',
    about: 'Про програму',
    theme: 'Тема',
    theme_light: 'Світла',
    theme_dark: 'Темна',
    theme_system: 'Системна',
    language_label: 'Мова інтерфейсу',
    speed_limit_default: 'Ліміт швидкості за замовчуванням',
    no_limit: 'Без ліміту',
    save: 'Зберегти',
    cancel: 'Скасувати',
    version: 'Версія',
    developer: 'Розробник',
    description: 'Опис',
    app_description: 'Швидкий та зручний завантажувач відео та аудіо з YouTube, TikTok та інших платформ.',
  },
  en: {
    paste_placeholder: 'Paste video link... (or Ctrl+V)',
    download: 'Download',
    downloading: 'Downloading...',
    settings_title: 'Settings',
    save_to: 'Save to',
    sponsorblock: 'SponsorBlock',
    subtitles: 'Subtitles',
    full_playlist: 'Full playlist',
    history_title: 'Download history',
    search_placeholder: 'Search...',
    nothing_found: 'Nothing found',
    history_empty: 'History is empty — download something!',
    sort_date_desc: 'Date ↓',
    sort_date_asc: 'Date ↑',
    sort_name_asc: 'Name A-Z',
    sort_name_desc: 'Name Z-A',
    sort_size_desc: 'Size ↓',
    sort_size_asc: 'Size ↑',
    date: 'Date',
    name: 'Name',
    size: 'Size',
    downloaded: 'Downloaded',
    failed: 'Failed',
    processing: '⚙ Processing...',
    paused: '⏸ Paused',
    connecting: 'Connecting...',
    loading: 'Loading...',
    error_loading: 'Download error',
    play: 'Play',
    open_folder: 'Open folder',
    delete: 'Delete',
    stop: 'Stop',
    pause: 'Pause',
    resume: 'Resume',
    delete_title: 'Delete file?',
    delete_body: 'will be permanently deleted from your device.',
    delete_confirm: 'Delete',
    delete_cancel: 'Keep',
    preferences: 'Preferences',
    general: 'General',
    language: 'Language',
    downloads: 'Downloads',
    about: 'About',
    theme: 'Theme',
    theme_light: 'Light',
    theme_dark: 'Dark',
    theme_system: 'System',
    language_label: 'Interface language',
    speed_limit_default: 'Default speed limit',
    no_limit: 'No limit',
    save: 'Save',
    cancel: 'Cancel',
    version: 'Version',
    developer: 'Developer',
    description: 'Description',
    app_description: 'Fast and convenient video & audio downloader from YouTube, TikTok and other platforms.',
  },
}

export type T = typeof TRANSLATIONS['ru']

// Хранение настроек в localStorage
export interface AppPreferences {
  lang: Lang
  theme: 'light' | 'dark' | 'system'
  defaultSpeedLimit: string
}

const DEFAULT_PREFS: AppPreferences = {
  lang: 'ru',
  theme: 'system',
  defaultSpeedLimit: 'Без лимита',
}

export function loadPrefs(): AppPreferences {
  try {
    const raw = localStorage.getItem('yt_prefs')
    return raw ? { ...DEFAULT_PREFS, ...JSON.parse(raw) } : DEFAULT_PREFS
  } catch {
    return DEFAULT_PREFS
  }
}

export function savePrefs(prefs: AppPreferences): void {
  localStorage.setItem('yt_prefs', JSON.stringify(prefs))
}

export function t(prefs: AppPreferences): T {
  return TRANSLATIONS[prefs.lang]
}

export function applyTheme(theme: AppPreferences['theme']): void {
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.classList.toggle('dark', isDark)
}
