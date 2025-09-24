import { useEffect, useState } from 'react'

import { applyTheme, loadSettings } from '../lib/theme'

import type { AppSettings } from '../lib/schema'

export default function Settings() {
  const [settings, setSettings] = useState<AppSettings>(loadSettings())

  useEffect(() => {
    localStorage.setItem('noteme:settings', JSON.stringify(settings))
    applyTheme(settings)
  }, [settings])

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h2 className="text-xl font-semibold mb-1">Settings</h2>
      <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
        Personalize your NoteMe experience.
      </p>
      <div className="space-y-4">
        <div className="rounded-md border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <label className="font-medium">Theme</label>
            <select
              className="border rounded px-2 py-1 bg-white text-black dark:bg-zinc-800 dark:text-white border-gray-200 dark:border-gray-700"
              value={settings.theme}
              onChange={(e) =>
                setSettings({ ...settings, theme: e.target.value as AppSettings['theme'] })
              }
            >
              <option value="system">System</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>
        </div>
        <div className="rounded-md border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <label className="font-medium">Density</label>
            <select
              className="border rounded px-2 py-1 bg-white text-black dark:bg-zinc-800 dark:text-white border-gray-200 dark:border-gray-700"
              value={settings.density}
              onChange={(e) =>
                setSettings({ ...settings, density: e.target.value as AppSettings['density'] })
              }
            >
              <option value="comfortable">Comfortable</option>
              <option value="compact">Compact</option>
            </select>
          </div>
        </div>
        <div className="rounded-md border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <label className="font-medium">Default Background</label>
            <input
              type="color"
              value={settings.defaultBg}
              onChange={(e) => setSettings({ ...settings, defaultBg: e.target.value })}
              className="h-8 w-12"
            />
          </div>
        </div>
        <div className="rounded-md border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <label className="font-medium">Default Text</label>
            <input
              type="color"
              value={settings.defaultText}
              onChange={(e) => setSettings({ ...settings, defaultText: e.target.value })}
              className="h-8 w-12"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
