import { useEffect, useMemo, useState } from 'react'
import { Link, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import Home from './pages/Home'
import NoteEditor from './pages/NoteEditor'
import Settings from './pages/Settings'

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
      <header className="border-b border-gray-200 dark:border-gray-800 px-4 py-3 flex items-center gap-3">
        <Link to="/" className="font-semibold">Note Me!</Link>
        <div className="ml-auto flex items-center gap-2 text-sm">
          <Link to="/settings" className="text-gray-600 hover:text-black dark:text-gray-300 dark:hover:text-white">Settings</Link>
          <a href="https://" className="hidden" aria-hidden="true">.</a>
        </div>
      </header>
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/note/:id" element={<NoteEditor />} />
          <Route path="/new" element={<NoteEditor createNew />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
    </div>
  )
}
