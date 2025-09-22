import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { createNote, deleteNote, getNote, updateNote } from '../lib/db'
import type { Note } from '../lib/schema'
import ColorPicker from '../components/ColorPicker'
import RichEditor from '../components/RichEditor'
import { debounce } from '../utils/debounce'

export default function NoteEditor({ createNew = false }: { createNew?: boolean }) {
  const params = useParams()
  const navigate = useNavigate()
  const [note, setNote] = useState<Note | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showSaved, setShowSaved] = useState(false)
  const id = params.id

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

  useEffect(() => {
    let cancelled = false
    async function init() {
      setLoading(true)
      if (createNew) {
        const n = await createNote(defaults())
        if (!cancelled) {
          setNote(n)
          setLoading(false)
          navigate(`/note/${n.id}`, { replace: true })
        }
        return
      }
      if (id) {
        const n = await getNote(id)
        if (!n) {
          const created = await createNote(defaults())
          if (!cancelled) {
            setNote(created)
            setLoading(false)
            navigate(`/note/${created.id}`, { replace: true })
          }
          return
        }
        if (!cancelled) {
          setNote(n)
          setLoading(false)
        }
      }
    }
    init()
    return () => {
      cancelled = true
    }
  }, [id, createNew, navigate])

  const saveTitle = useMemo(
    () =>
      debounce(async (value: string) => {
        if (!note) return
        const updated = await updateNote(note.id, { title: value.slice(0, 120) })
        setNote(updated)
        setSaving(false)
        setShowSaved(true)
        setTimeout(() => setShowSaved(false), 1200)
      }, 250),
    // tie to note id so closures stay fresh
    [note?.id]
  )

  const saveContent = useMemo(
    () =>
      debounce(async (value: string) => {
        if (!note) return
        const updated = await updateNote(note.id, { content: value })
        setNote(updated)
        setSaving(false)
        setShowSaved(true)
        setTimeout(() => setShowSaved(false), 1200)
      }, 300),
    [note?.id]
  )

  if (loading || !note) return <div className="p-4">Loading…</div>

  return (
    <>
    <div className="p-4 max-w-4xl mx-auto">
      {/* Sticky toolbar */}
      <div className="sticky top-0 z-30 -mx-4 px-4 py-2 bg-white/70 dark:bg-black/50 backdrop-blur border-b border-gray-200 dark:border-gray-800 transition-smooth">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/')} className="px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-zinc-900 transition-smooth active:scale-[.98]">Back</button>
            {note.archived && (
              <span className="text-xs px-2 py-1 rounded-full border border-gray-300 dark:border-gray-700">Archived</span>
            )}
          </div>
          <div className="sm:ml-auto flex items-center gap-2 text-sm"></div>
          {/* Mobile action row */}
          <div className="grid grid-cols-3 gap-2 sm:hidden w-full">
            <button
              onClick={async () => { await navigator.clipboard.writeText(window.location.href) }}
              className="w-full px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-zinc-900 transition-smooth inline-flex items-center justify-center gap-2"
              aria-label="Copy link"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3.9 12a5 5 0 015-5h3v2h-3a3 3 0 100 6h3v2h-3a5 5 0 01-5-5zm6.1 1h4v-2h-4v2zm5.1-6h-3V5h3a5 5 0 110 10h-3v-2h3a3 3 0 000-6z"/></svg>
              Copy
            </button>
            <button
              onClick={async () => { const updated = await updateNote(note.id, { archived: !note.archived }); setNote(updated) }}
              className="w-full px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-zinc-900 transition-smooth inline-flex items-center justify-center gap-2"
              aria-label={note.archived ? 'Unarchive note' : 'Archive note'}
            >
              {note.archived ? (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M4 6h16v2H4V6zm2 4h12v10H6V10zm2 2v6h8v-6H8z"/></svg>
                  Unarchive
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20 6H4V4h16v2zm-2 2v12H6V8h12zM8 10v8h8v-8H8z"/></svg>
                  Archive
                </>
              )}
            </button>
            <button
              onClick={async () => { if (confirm('Delete this note?')) { await deleteNote(note.id); navigate('/') } }}
              className="w-full px-3 py-2 rounded-md border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950 transition-smooth inline-flex items-center justify-center gap-2"
              aria-label="Delete note"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M9 3h6v2h5v2H4V5h5V3zm1 6h2v9h-2V9zm4 0h2v9h-2V9zM8 9h2v9H8V9z"/></svg>
              Delete
            </button>
          </div>
          {/* Desktop action row */}
          <div className="hidden sm:flex items-center gap-2 text-sm">
            <button
              onClick={() => navigate(`/view/${note.id}`)}
              className="px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-zinc-900 transition-smooth active:scale-[.98] inline-flex items-center gap-2"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 5c5 0 9 4.5 9 7s-4 7-9 7-9-4.5-9-7 4-7 9-7zm0 2c-3.86 0-7 3.14-7 5s3.14 5 7 5 7-3.14 7-5-3.14-5-7-5zm0 2.5a2.5 2.5 0 110 5 2.5 2.5 0 010-5z"/></svg>
              View
            </button>
            <button
              onClick={async () => { await navigator.clipboard.writeText(window.location.href) }}
              className="px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-zinc-900 transition-smooth active:scale-[.98] inline-flex items-center gap-2"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3.9 12a5 5 0 015-5h3v2h-3a3 3 0 100 6h3v2h-3a5 5 0 01-5-5zm6.1 1h4v-2h-4v2zm5.1-6h-3V5h3a5 5 0 110 10h-3v-2h3a3 3 0 000-6z"/></svg>
              Copy Link
            </button>
            <button
              onClick={async () => { const updated = await updateNote(note.id, { archived: !note.archived }); setNote(updated) }}
              className="px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-zinc-900 transition-smooth active:scale-[.98] inline-flex items-center gap-2"
            >
              {note.archived ? (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M4 6h16v2H4V6zm2 4h12v10H6V10zm2 2v6h8v-6H8z"/></svg>
                  Unarchive
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20 6H4V4h16v2zm-2 2v12H6V8h12zM8 10v8h8v-8H8z"/></svg>
                  Archive
                </>
              )}
            </button>
            <button
              onClick={async () => { if (confirm('Delete this note?')) { await deleteNote(note.id); navigate('/') } }}
              className="px-3 py-2 rounded-md border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950 transition-smooth active:scale-[.98] inline-flex items-center gap-2"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M9 3h6v2h5v2H4V5h5V3zm1 6h2v9h-2V9zm4 0h2v9h-2V9zM8 9h2v9H8V9z"/></svg>
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Editor card */}
      <div
        className="rounded-md border mt-3 p-4 transition-smooth"
        style={{ backgroundColor: note.bgColor, color: note.textColor }}
      >
        <input
          className="title-input w-full text-2xl font-semibold mb-2 placeholder-black/40 dark:placeholder-white/50"
          placeholder="Title"
          defaultValue={note.title}
          onChange={(e) => {
            setSaving(true)
            saveTitle(e.target.value)
          }}
          maxLength={120}
          style={{ backgroundColor: 'transparent', color: note.textColor }}
        />
        <RichEditor
          value={note.content}
          onChange={(html) => {
            setSaving(true)
            saveContent(html)
          }}
          textColor={note.textColor}
        />
      </div>

      <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-3">
        <ColorPicker
          bgColor={note.bgColor}
          textColor={note.textColor}
          onChange={async (bg, text) => {
            const updated = await updateNote(note.id, { bgColor: bg, textColor: text })
            setNote(updated)
          }}
        />
        <div className="text-sm text-gray-600 dark:text-gray-300">
          Last edited: {new Date(note.updatedAt).toLocaleString()}
        </div>
      </div>
    </div>
    {/* Quick Saved Toast */}
    {showSaved && (
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
        <div className="rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-zinc-900 px-3 py-2 shadow-md text-sm">
          Saved
        </div>
      </div>
    )}
    </>
  )
}
