import { Link } from 'react-router-dom'
import type { Note } from '../lib/schema'
import { updateNote, deleteNote } from '../lib/db'

type Props = {
  note: Note
  onArchived?: () => void
  onDeleted?: () => void
  className?: string
  draggable?: boolean
  onDragStart?: (e: React.DragEvent) => void
  onDragOver?: (e: React.DragEvent) => void
  onDrop?: (e: React.DragEvent) => void
  onDragLeave?: (e: React.DragEvent) => void
  index?: number
}

export default function NoteCard({ note, onArchived, onDeleted, className = '', draggable, onDragStart, onDragOver, onDrop, onDragLeave, index }: Props) {
  const preview = (note.content || '').trim()
  const title = (note.title || '').trim() || 'Untitled'

  async function toggleArchive(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    await updateNote(note.id, { archived: !note.archived })
    onArchived?.()
  }

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (confirm('Delete this note?')) {
      await deleteNote(note.id)
      onDeleted?.()
    }
  }

  const base = "relative rounded-md border border-gray-200 dark:border-gray-700 p-3 block card transition-smooth animate-fade-in-up"

  const linkStyle: React.CSSProperties = typeof index === 'number'
    ? { backgroundColor: note.bgColor, color: note.textColor, animationDelay: `${Math.min(index * 40, 240)}ms` }
    : { backgroundColor: note.bgColor, color: note.textColor }

  return (
    <Link
      to={`/note/${note.id}`}
      className={`${base} ${className}`}
      style={linkStyle}
      data-note-id={note.id}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <div className="absolute top-2 right-2 flex gap-1">
        <button
          onClick={toggleArchive}
          title={note.archived ? 'Unarchive' : 'Archive'}
          className="rounded-md bg-white/70 text-black dark:bg-black/40 dark:text-white backdrop-blur px-2 py-1 text-xs hover:opacity-100 opacity-90"
          aria-label={note.archived ? 'Unarchive note' : 'Archive note'}
        >
          {note.archived ? 'Unarchive' : 'Archive'}
        </button>
        <button
          onClick={handleDelete}
          title="Delete"
          className="rounded-md bg-white/70 text-red-600 dark:bg-black/40 dark:text-red-400 backdrop-blur px-2 py-1 text-xs hover:opacity-100 opacity-90"
          aria-label="Delete note"
        >
          Delete
        </button>
      </div>

      <div className="font-semibold mb-1 line-clamp-2" style={{ color: note.textColor }}>{title}</div>
      <div className="text-sm opacity-90 whitespace-pre-wrap line-clamp-3" style={{ color: note.textColor }}>
        {preview || <span className="italic opacity-70">No content</span>}
      </div>
      <div className="text-xs opacity-70 mt-2" style={{ color: note.textColor }}>
        {new Date(note.updatedAt).toLocaleString()} {note.archived && <span className="ml-2 px-2 py-0.5 rounded-full border border-current/30 text-[10px] align-middle">Archived</span>}
      </div>
    </Link>
  )
}
