import { useEffect, useMemo, useState } from 'react'
import { Link, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import Home from './pages/Home'
import NoteEditor from './pages/NoteEditor'
import Settings from './pages/Settings'
import NoteView from './pages/NoteView'
import SharedNotePage from './pages/SharedNotePage'

function useGlobalShortcuts() {
  const navigate = useNavigate()
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey
      if (!mod) return
      if (e.key.toLowerCase() === 'n') {
        e.preventDefault()
        navigate('/new')
      }
      if (e.key.toLowerCase() === 'k') {
        e.preventDefault()
        const el = document.getElementById('global-search') as HTMLInputElement | null
        el?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [navigate])
}

export default function App() {
  useGlobalShortcuts()
  const loc = useLocation()
  return (
    <div className="min-h-full flex flex-col">
      <header className="border-b border-gray-200 dark:border-gray-800 px-4 py-3 flex items-center gap-3 bg-white/70 dark:bg-black/50 backdrop-blur supports-[backdrop-filter]:backdrop-blur sticky top-0 z-40 transition-smooth">
        <Link to="/" className="font-semibold flex items-center gap-2">
          <span className="text-xl">🗒️</span>
          <span className="text-lg">Note Me!</span>
        </Link>
        <div className="ml-auto flex items-center gap-2 text-sm">
          <Link
            to="/new"
            className="inline-flex items-center gap-2 rounded-md px-3 py-2 bg-blue-600 text-white hover:bg-blue-700 transition-smooth active:scale-[.98]"
            aria-label="Create new note (Ctrl/Cmd+N)"
            title="New Note (Ctrl/Cmd+N)"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M11 13H5v-2h6V5h2v6h6v2h-6v6h-2v-6z"/></svg>
            New
          </Link>
          <Link to="/settings" className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-zinc-900 transition-smooth active:scale-[.98]" aria-label="Settings">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M19.14 12.94a7.953 7.953 0 000-1.88l2.03-1.58a.5.5 0 00.12-.64l-1.92-3.32a.5.5 0 00-.6-.22l-2.39.96a7.98 7.98 0 00-1.62-.94l-.36-2.54a.5.5 0 00-.5-.42h-3.84a.5.5 0 00-.5.42l-.36 2.54c-.57.22-1.11.52-1.62.94l-2.39-.96a.5.5 0 00-.6.22L2.71 8.84a.5.5 0 00.12.64l2.03 1.58c-.05.31-.08.62-.08.94 0 .32.03.63.08.94L2.83 14.5a.5.5 0 00-.12.64l1.92 3.32c.13.22.39.31.6.22l2.39-.96c.51.42 1.05.72 1.62.94l.36 2.54c.06.25.27.42.5.42h3.84c.23 0 .44-.17.5-.42l.36-2.54c.57-.22 1.11-.52 1.62-.94l2.39.96c.21.09.47 0 .6-.22l1.92-3.32a.5.5 0 00-.12-.64l-2.03-1.58zM12 15.5a3.5 3.5 0 110-7 3.5 3.5 0 010 7z"/></svg>
            <span className="hidden sm:inline">Settings</span>
          </Link>
        </div>
      </header>
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/note/:id" element={<NoteEditor />} />
          <Route path="/view/:id" element={<NoteView />} />
          <Route path="/new" element={<NoteEditor createNew />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/shared" element={<SharedNotePage />} />
        </Routes>
      </main>
    </div>
  )
}
