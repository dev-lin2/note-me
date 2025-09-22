import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import SearchBar from '../components/SearchBar'
import NoteCard from '../components/NoteCard'
import { createNote, exportJSON, getAllNotes, importJSON } from '../lib/db'
import type { Note } from '../lib/schema'

export default function Home() {
  const [notes, setNotes] = useState<Note[]>([])
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  function defaults() {
    try {
      const raw = localStorage.getItem('noteme:settings')
      if (!raw) return { bgColor: '#FFF8C5', textColor: '#222222' }
      const s = JSON.parse(raw)
      return { bgColor: s.defaultBg || '#FFF8C5', textColor: s.defaultText || '#222222' }
    } catch { return { bgColor: '#FFF8C5', textColor: '#222222' }}
  }

  async function load() {
    setLoading(true)
    setNotes(await getAllNotes())
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    if (!term) return notes
    return notes.filter(
      (n) => n.title.toLowerCase().includes(term) || n.content.toLowerCase().includes(term)
    )
  }, [q, notes])

  async function onNew() {
    const n = await createNote(defaults())
    navigate(`/note/${n.id}`)
  }

  async function onExport() {
    const json = await exportJSON()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `noteme-export-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function onImport(file: File) {
    const text = await file.text()
    await importJSON(text)
    await load()
  }

  return (
    <div className="p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-3">
        <SearchBar value={q} onChange={setQ} />
        <div className="ml-auto flex items-center gap-2">
          <button onClick={onNew} className="border border-gray-200 dark:border-gray-700 rounded px-3 py-2 bg-white text-black dark:bg-zinc-900 dark:text-white">New Note (Ctrl/Cmd+N)</button>
          <button onClick={onExport} className="border border-gray-200 dark:border-gray-700 rounded px-3 py-2 bg-white text-black dark:bg-zinc-900 dark:text-white">Export</button>
          <label className="border border-gray-200 dark:border-gray-700 rounded px-3 py-2 cursor-pointer bg-white text-black dark:bg-zinc-900 dark:text-white">
            Import
            <input type="file" accept="application/json" className="hidden" onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) onImport(f)
              e.currentTarget.value = ''
            }} />
          </label>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {loading && <div>Loading…</div>}
        {!loading && filtered.length === 0 && <div>No notes yet.</div>}
        {filtered.map((n) => (
          <NoteCard key={n.id} note={n} />
        ))}
      </div>
    </div>
  )
}
