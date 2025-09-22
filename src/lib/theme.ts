import type { AppSettings } from './schema'
import { DefaultSettings } from './schema'

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem('noteme:settings')
    if (!raw) return DefaultSettings
    return { ...DefaultSettings, ...JSON.parse(raw) }
  } catch {
    return DefaultSettings
  }
}

export function applyTheme(settings: AppSettings) {
  const root = document.documentElement
  if (settings.theme === 'dark') root.classList.add('dark')
  else if (settings.theme === 'light') root.classList.remove('dark')
  else if (settings.theme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    root.classList.toggle('dark', prefersDark)
  }
}

