import { Link } from 'react-router-dom'
import type { Note } from '../lib/schema'

export default function NoteCard({ note }: { note: Note }) {
  const preview = note.content.length > 140 ? note.content.slice(0, 140) + '…' : note.content
  return (
    <Link
      to={`/note/${note.id}`}
      className="rounded border p-3 block hover:shadow-sm transition-shadow"
      style={{ backgroundColor: note.bgColor, color: note.textColor }}
    >
      <div className="font-semibold mb-1">{note.title || 'Untitled'}</div>
      <div className="text-sm opacity-90 whitespace-pre-wrap">{preview || '—'}</div>
      <div className="text-xs opacity-60 mt-2">{new Date(note.updatedAt).toLocaleString()}</div>
    </Link>
  )
}

