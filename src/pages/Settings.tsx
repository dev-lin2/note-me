import { useEffect, useState } from 'react'
import type { AppSettings } from '../lib/schema'
import { loadSettings, applyTheme } from '../lib/theme'

export default function Settings() {
  const [settings, setSettings] = useState<AppSettings>(loadSettings())

  useEffect(() => {
    localStorage.setItem('noteme:settings', JSON.stringify(settings))
    applyTheme(settings)
  }, [settings])

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h2 className="text-xl font-semibold mb-4">Settings</h2>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label>Theme</label>
          <select
            className="border rounded px-2 py-1 bg-white text-black dark:bg-zinc-900 dark:text-white border-gray-200 dark:border-gray-700"
            value={settings.theme}
            onChange={(e) => setSettings({ ...settings, theme: e.target.value as any })}
          >
            <option value="system">System</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>
        <div className="flex items-center justify-between">
          <label>Density</label>
          <select
            className="border rounded px-2 py-1 bg-white text-black dark:bg-zinc-900 dark:text-white border-gray-200 dark:border-gray-700"
            value={settings.density}
            onChange={(e) => setSettings({ ...settings, density: e.target.value as any })}
          >
            <option value="comfortable">Comfortable</option>
            <option value="compact">Compact</option>
          </select>
        </div>
        <div className="flex items-center justify-between">
          <label>Default Background</label>
          <input
            type="color"
            value={settings.defaultBg}
            onChange={(e) => setSettings({ ...settings, defaultBg: e.target.value })}
            className="h-8 w-12"
          />
        </div>
        <div className="flex items-center justify-between">
          <label>Default Text</label>
          <input
            type="color"
            value={settings.defaultText}
            onChange={(e) => setSettings({ ...settings, defaultText: e.target.value })}
            className="h-8 w-12"
          />
        </div>
      </div>
    </div>
  )
}
