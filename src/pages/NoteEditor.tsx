import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { createNote, deleteNote, getNote, updateNote } from '../lib/db'
import type { Note } from '../lib/schema'
import ColorPicker from '../components/ColorPicker'
import { debounce } from '../utils/debounce'

export default function NoteEditor({ createNew = false }: { createNew?: boolean }) {
  const params = useParams()
  const navigate = useNavigate()
  const [note, setNote] = useState<Note | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
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
      }, 300),
    [note?.id]
  )

  if (loading || !note) return <div className="p-4">Loading…</div>

  return (
    <div className="p-4 max-w-4xl mx-auto">
      {/* Sticky toolbar */}
      <div className="sticky top-0 z-30 -mx-4 px-4 py-2 bg-white/70 dark:bg-black/50 backdrop-blur border-b border-gray-200 dark:border-gray-800 flex items-center gap-2 transition-smooth">
        <button onClick={() => navigate('/')} className="px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-zinc-900 transition-smooth active:scale-[.98]">Back</button>
        {note.archived && (
          <span className="ml-2 text-xs px-2 py-1 rounded-full border border-gray-300 dark:border-gray-700">Archived</span>
        )}
        <div className="ml-auto flex items-center gap-2 text-sm">
          <div className="px-2 py-1 rounded bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-gray-700 transition-smooth" aria-live="polite">
            {saving ? 'Saving…' : 'Saved'}
          </div>
          <button
            onClick={async () => {
              await navigator.clipboard.writeText(window.location.href)
            }}
            className="px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-zinc-900 transition-smooth active:scale-[.98]"
          >
            Copy Link
          </button>
          <button
            onClick={async () => {
              const updated = await updateNote(note.id, { archived: !note.archived })
              setNote(updated)
            }}
            className="px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-zinc-900 transition-smooth active:scale-[.98]"
          >
            {note.archived ? 'Unarchive' : 'Archive'}
          </button>
          <button
            onClick={async () => {
              if (confirm('Delete this note?')) {
                await deleteNote(note.id)
                navigate('/')
              }
            }}
            className="px-3 py-2 rounded-md border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950 transition-smooth active:scale-[.98]"
          >
            Delete
          </button>
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
        <textarea
          className="w-full min-h-[55vh] resize-vertical bg-transparent outline-none leading-6 placeholder-black/40 dark:placeholder-white/50"
          placeholder="Capture your thoughts…"
          defaultValue={note.content}
          onChange={(e) => {
            setSaving(true)
            saveContent(e.target.value)
          }}
          style={{ color: note.textColor }}
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
  )
}
