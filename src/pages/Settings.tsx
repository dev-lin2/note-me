import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { clearNotes } from '../lib/db'
import { applyTheme, loadSettings } from '../lib/theme'

import type { AppSettings } from '../lib/schema'

export default function Settings() {
  const navigate = useNavigate()
  const [settings, setSettings] = useState<AppSettings>(loadSettings())

  useEffect(() => {
    localStorage.setItem('noteme:settings', JSON.stringify(settings))
    applyTheme(settings)
  }, [settings])

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-smooth active:scale-[.98] inline-flex items-center gap-2"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              <span className="hidden sm:inline">Back</span>
            </button>
            <h1 className="text-lg font-semibold">Settings</h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 py-6">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Theme Section */}
          <section className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-zinc-900 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
              <h2 className="font-medium">Appearance</h2>
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-sm">Theme</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Choose how NoteMe looks
                  </div>
                </div>
                <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                  {(['system', 'light', 'dark'] as const).map((theme) => (
                    <button
                      key={theme}
                      onClick={() => setSettings({ ...settings, theme })}
                      className={`px-3 py-2 text-sm capitalize transition-smooth ${
                        settings.theme === theme
                          ? 'bg-blue-600 text-white'
                          : 'bg-white dark:bg-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-700'
                      }`}
                    >
                      {theme}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* About Section */}
          <section className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-zinc-900 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
              <h2 className="font-medium">About</h2>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Version</span>
                <span>0.1.0</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Storage</span>
                <span>Local (IndexedDB)</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-100 dark:border-gray-800">
                NoteMe stores all your notes locally on this device. Notes can be shared via
                encrypted links.
              </p>
            </div>
          </section>

          {/* Danger Zone */}
          <section className="rounded-xl border border-red-200 dark:border-red-900 bg-white dark:bg-zinc-900 overflow-hidden">
            <div className="px-4 py-3 border-b border-red-100 dark:border-red-900">
              <h2 className="font-medium text-red-600">Danger Zone</h2>
            </div>
            <div className="p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="font-medium text-sm">Clear all notes</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Permanently deletes every note on this device.
                </div>
              </div>
              <button
                onClick={async () => {
                  if (!confirm('This will permanently delete all notes. Continue?')) return
                  await clearNotes()
                  navigate('/')
                }}
                className="px-3 py-2 rounded-md border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950 transition-smooth active:scale-[.98]"
              >
                Clear Notes
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
