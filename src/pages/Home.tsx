import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import SearchBar from '../components/SearchBar'
import NoteCard from '../components/NoteCard'
import { createNote, exportJSON, getAllNotes, importJSON, setOrders } from '../lib/db'
import type { Note } from '../lib/schema'

export default function Home() {
  const [notes, setNotes] = useState<Note[]>([])
  const [q, setQ] = useState('')
  const [showArchived, setShowArchived] = useState(false)
  const [loading, setLoading] = useState(true)
  const draggingId = useRef<string | null>(null)
  const gridRef = useRef<HTMLDivElement | null>(null)
  const prevRects = useRef<Map<string, DOMRect>>(new Map())
  const navigate = useNavigate()

  function defaults() {
    try {
      const raw = localStorage.getItem('noteme:settings')
      if (!raw) return { bgColor: '#FFF8C5', textColor: '#222222' }
      const s = JSON.parse(raw)
      return { bgColor: s.defaultBg || '#FFF8C5', textColor: s.defaultText || '#222222' }
    } catch {
      return { bgColor: '#FFF8C5', textColor: '#222222' }
    }
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
    const base = showArchived ? notes : notes.filter((n) => !n.archived)
    const list = base
      .slice()
      .sort((a, b) => {
        const ao = a.order
        const bo = b.order
        if (ao == null && bo == null) return b.updatedAt - a.updatedAt
        if (ao == null) return 1
        if (bo == null) return -1
        return ao - bo
      })
    if (!term) return list
    return list.filter(
      (n) => n.title.toLowerCase().includes(term) || n.content.toLowerCase().includes(term)
    )
  }, [q, notes, showArchived])

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

  async function ensureOrdersInitialized(ids: string[]) {
    const hasAnyOrder = filtered.some((n) => n.order != null)
    if (!hasAnyOrder) {
      await setOrders(ids)
      await load()
    }
  }

  async function persistReorder(ids: string[]) {
    await setOrders(ids)
    await load()
  }

  function onDragStartCard(id: string) {
    return (e: React.DragEvent) => {
      e.dataTransfer.effectAllowed = 'move'
      draggingId.current = id
      const ids = filtered.map((n) => n.id)
      // Initialize order on first drag if missing
      ensureOrdersInitialized(ids)
    }
  }

  function onDragOverCard(id: string) {
    return (e: React.DragEvent) => {
      e.preventDefault()
      // hint move operation
      try { (e.dataTransfer as DataTransfer).dropEffect = 'move' } catch {}
      // track drop target visually only
      // visual drop-target hint
      (e.currentTarget as HTMLElement).classList.add('drop-target')
    }
  }

  function onDropCard(id: string) {
    return async (e: React.DragEvent) => {
      e.preventDefault()
      const fromId = draggingId.current
      const toId = id
      draggingId.current = null
      ;(e.currentTarget as HTMLElement).classList.remove('drop-target')
      if (!fromId || !toId || fromId === toId) return

      const current = filtered.map((n) => n.id)
      const fromIdx = current.indexOf(fromId)
      const toIdx = current.indexOf(toId)
      if (fromIdx < 0 || toIdx < 0) return
      const next = current.slice()
      const movedId = next[fromIdx]!
      next.splice(fromIdx, 1)
      next.splice(toIdx, 0, movedId)
      await persistReorder(next)
    }
  }

  function onDragLeaveCard() {
    return (e: React.DragEvent) => {
      (e.currentTarget as HTMLElement).classList.remove('drop-target')
    }
  }

  // FLIP: animate reorders smoothly
  useLayoutEffect(() => {
    const grid = gridRef.current
    if (!grid) return
    const nodeList = grid.querySelectorAll('[data-note-id]') as NodeListOf<HTMLElement>
    const nodes = Array.from(nodeList)
    const newRects = new Map<string, DOMRect>()
    nodes.forEach((el) => {
      const id = el.dataset.noteId
      if (!id) return
      const rect = el.getBoundingClientRect()
      newRects.set(id, rect)
      const prev = prevRects.current.get(id)
      if (prev) {
        const dx = prev.left - rect.left
        const dy = prev.top - rect.top
        if (dx || dy) {
          el.style.transition = 'none'
          el.style.transform = `translate(${dx}px, ${dy}px)`
          requestAnimationFrame(() => {
            el.style.transition = 'transform 220ms cubic-bezier(0.22, 1, 0.36, 1)'
            el.style.transform = ''
          })
        }
      }
    })
    prevRects.current = newRects
  }, [filtered])

  return (
    <div className="p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-3">
        <SearchBar value={q} onChange={setQ} />
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setShowArchived((v) => !v)}
            className="px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-zinc-900"
          >
            {showArchived ? 'Show Active' : 'Show Archived'}
          </button>
          <button
            onClick={onExport}
            className="px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-zinc-900"
          >
            Export
          </button>
          <label className="px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-zinc-900 cursor-pointer">
            Import
            <input
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) onImport(f)
                e.currentTarget.value = ''
              }}
            />
          </label>
          <button
            onClick={onNew}
            className="hidden sm:inline-flex items-center gap-2 rounded-md px-3 py-2 bg-blue-600 text-white hover:bg-blue-700"
            title="New Note (Ctrl/Cmd+N)"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M11 13H5v-2h6V5h2v6h6v2h-6v6h-2v-6z"/></svg>
            New
          </button>
        </div>
      </div>

      <div ref={gridRef} className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 transition-smooth">
        {loading && (
          <>
            <div className="h-36 rounded-md border border-gray-200 dark:border-gray-700 animate-pulse bg-gray-50 dark:bg-zinc-900" />
            <div className="h-36 rounded-md border border-gray-200 dark:border-gray-700 animate-pulse bg-gray-50 dark:bg-zinc-900" />
            <div className="h-36 rounded-md border border-gray-200 dark:border-gray-700 animate-pulse bg-gray-50 dark:bg-zinc-900" />
          </>
        )}
        {!loading && filtered.length === 0 && (
          <div className="col-span-full text-center text-gray-500 py-16">
            <div className="text-5xl mb-2">🗒️</div>
            <div className="font-medium">No notes here yet</div>
            <div className="text-sm">Create your first note to get started.</div>
          </div>
        )}
        {filtered.map((n, i) => (
          <NoteCard
            key={n.id}
            note={n}
            onArchived={load}
            onDeleted={load}
            draggable
            onDragStart={onDragStartCard(n.id)}
            onDragOver={onDragOverCard(n.id)}
            onDragLeave={onDragLeaveCard()}
            onDrop={onDropCard(n.id)}
            index={i}
          />
        ))}
      </div>

      {/* Floating action button on mobile */}
      <button
        onClick={onNew}
        className="sm:hidden fixed right-5 bottom-5 h-14 w-14 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 flex items-center justify-center"
        aria-label="Create new note"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M11 13H5v-2h6V5h2v6h6v2h-6v6h-2v-6z"/></svg>
      </button>
    </div>
  )
}
