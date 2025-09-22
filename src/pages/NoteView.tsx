import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { deleteNote, getNote, updateNote } from '../lib/db'
import { sanitizeHtml } from '../utils/sanitize'
import type { Note } from '../lib/schema'

export default function NoteView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [note, setNote] = useState<Note | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      if (!id) return
      const n = await getNote(id)
      if (!cancelled) {
        setNote(n)
        setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [id])

  if (loading) return <div className="p-4">Loading…</div>
  if (!note) return (
    <div className="p-4">
      <div className="mb-3">Note not found.</div>
      <button onClick={() => navigate('/')} className="px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-zinc-900">Back</button>
    </div>
  )

  return (
    <div className="p-4 max-w-3xl mx-auto">
      {/* Toolbar */}
      <div className="sticky top-0 z-30 -mx-4 px-4 py-2 bg-white/70 dark:bg-black/50 backdrop-blur border-b border-gray-200 dark:border-gray-800 flex items-center gap-2 transition-smooth">
        <button onClick={() => navigate('/')} className="px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-zinc-900 transition-smooth active:scale-[.98]">Back</button>
        {note.archived && (
          <span className="ml-2 text-xs px-2 py-1 rounded-full border border-gray-300 dark:border-gray-700">Archived</span>
        )}
        <div className="ml-auto flex items-center gap-2 text-sm">
          <Link
            to={`/note/${note.id}`}
            className="px-3 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-smooth active:scale-[.98]"
          >
            Edit
          </Link>
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

      {/* Read-only card */}
      <article
        className="rounded-md border mt-3 p-4 transition-smooth overflow-hidden"
        style={{ backgroundColor: note.bgColor, color: note.textColor }}
      >
        <h1 className="text-2xl font-semibold mb-2 break-words" style={{ color: note.textColor }}>
          {note.title?.trim() || 'Untitled'}
        </h1>
        {note.content ? (
          <div className="wysiwyg leading-6 break-words" style={{ color: note.textColor }} dangerouslySetInnerHTML={{ __html: sanitizeHtml(note.content) }} />
        ) : (
          <div className="italic opacity-70">No content</div>
        )}
        <div className="text-xs opacity-70 mt-3" style={{ color: note.textColor }}>
          Last edited: {new Date(note.updatedAt).toLocaleString()}
        </div>
      </article>
    </div>
  )
}
