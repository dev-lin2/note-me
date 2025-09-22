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
  const id = params.id

  function defaults() {
    try {
      const raw = localStorage.getItem('noteme:settings')
      if (!raw) return { bgColor: '#FFF8C5', textColor: '#222222' }
      const s = JSON.parse(raw)
      return { bgColor: s.defaultBg || '#FFF8C5', textColor: s.defaultText || '#222222' }
    } catch { return { bgColor: '#FFF8C5', textColor: '#222222' }}
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
          // If not found, create a new note and redirect
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
      }, 200),
    [note]
  )

  const saveContent = useMemo(
    () =>
      debounce(async (value: string) => {
        if (!note) return
        const updated = await updateNote(note.id, { content: value })
        setNote(updated)
      }, 200),
    [note]
  )

  if (loading || !note) return <div className="p-4">Loading…</div>

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="flex items-center gap-2 mb-3">
        <button onClick={() => navigate('/')} className="border rounded px-3 py-2">Back</button>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={async () => {
              await navigator.clipboard.writeText(window.location.href)
            }}
            className="border rounded px-3 py-2"
          >
            Copy Link
          </button>
          <button
            onClick={async () => {
              if (confirm('Delete this note?')) {
                await deleteNote(note.id)
                navigate('/')
              }
            }}
            className="border rounded px-3 py-2 text-red-600"
          >
            Delete
          </button>
        </div>
      </div>
      <div
        className="rounded border p-4"
        style={{ backgroundColor: note.bgColor, color: note.textColor }}
      >
        <input
          className="title-input w-full text-2xl font-semibold mb-2"
          placeholder="Title"
          defaultValue={note.title}
          onChange={(e) => saveTitle(e.target.value)}
          maxLength={120}
          style={{ backgroundColor: 'transparent', color: note.textColor }}
        />
        <textarea
          className="w-full min-h-[50vh] resize-vertical bg-transparent outline-none"
          placeholder="Write your note…"
          defaultValue={note.content}
          onChange={(e) => saveContent(e.target.value)}
          style={{ color: note.textColor }}
        />
      </div>

      <div className="mt-3 flex items-center gap-3">
        <ColorPicker
          bgColor={note.bgColor}
          textColor={note.textColor}
          onChange={async (bg, text) => {
            const updated = await updateNote(note.id, { bgColor: bg, textColor: text })
            setNote(updated)
          }}
        />
        <div className="text-sm text-gray-600">
          Last edited: {new Date(note.updatedAt).toLocaleString()}
        </div>
      </div>
    </div>
  )
}
