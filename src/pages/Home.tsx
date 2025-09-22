import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import SearchBar from '../components/SearchBar'
import NoteCard from '../components/NoteCard'
import { createNote, exportJSON, getAllNotes, importJSON, setOrders, updateNote, deleteNote } from '../lib/db'
import type { Note } from '../lib/schema'

export default function Home() {
  const [notes, setNotes] = useState<Note[]>([])
  const [q, setQ] = useState('')
  const [showArchived, setShowArchived] = useState(false)
  const [loading, setLoading] = useState(true)
  const [justToggled, setJustToggled] = useState(false)
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
    const onChanged = () => load()
    window.addEventListener('notes:changed', onChanged as EventListener)
    return () => window.removeEventListener('notes:changed', onChanged as EventListener)
  }, [])

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    const base = showArchived ? notes.filter((n) => n.archived) : notes.filter((n) => !n.archived)
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
            onClick={() => {
              setJustToggled(true)
              setShowArchived((v) => !v)
              setTimeout(() => setJustToggled(false), 220)
            }}
            className={`px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-zinc-900 active:scale-[.98] ${justToggled ? 'animate-toggle-pulse' : ''}`}
          >
            {showArchived ? 'Show Active' : `Show Archived (${notes.filter(n => n.archived).length})`}
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
        </div>
      </div>

      <div ref={gridRef} className={`mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 transition-smooth ${justToggled ? 'animate-fade-in' : ''}${showArchived ? ' hidden' : ''}`}
      >
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

      {showArchived && (
        <div className={`mt-4 transition-smooth ${justToggled ? 'animate-fade-in' : ''}`}>
          {loading && (
            <>
              <div className="h-14 rounded-md border border-gray-200 dark:border-gray-700 animate-pulse bg-gray-50 dark:bg-zinc-900" />
              <div className="h-14 mt-2 rounded-md border border-gray-200 dark:border-gray-700 animate-pulse bg-gray-50 dark:bg-zinc-900" />
              <div className="h-14 mt-2 rounded-md border border-gray-200 dark:border-gray-700 animate-pulse bg-gray-50 dark:bg-zinc-900" />
            </>
          )}
          {!loading && filtered.length === 0 && (
            <div className="text-center text-gray-500 py-12">
              <div className="font-medium">No archived notes</div>
              <div className="text-sm">Notes you archive will show up here.</div>
            </div>
          )}
          {!loading && filtered.length > 0 && (
            <div className="rounded-md border border-gray-200 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-800 overflow-hidden">
              {filtered.map((n) => (
                <div key={n.id} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 p-3 bg-white/60 dark:bg-black/40 backdrop-blur">
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold truncate">{n.title?.trim() || 'Untitled'}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-300 truncate">{new Date(n.updatedAt).toLocaleString()}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 sm:flex sm:items-center sm:gap-2 w-full sm:w-auto">
                    <button onClick={() => navigate(`/view/${n.id}`)} className="px-3 py-1.5 rounded-md border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-zinc-900">View</button>
                    <button onClick={async () => { await updateNote(n.id, { archived: false }); load() }} className="px-3 py-1.5 rounded-md border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-zinc-900">Unarchive</button>
                    <button onClick={async () => { if (confirm('Delete this note?')) { await deleteNote(n.id); load() } }} className="px-3 py-1.5 rounded-md border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Mobile FAB removed as requested; creation via top header only */}
    </div>
  )
}
