import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { deleteNote, getNote, updateNote } from '../lib/db'
import { sanitizeHtml } from '../utils/sanitize'
import { toHtmlFromMarkdownOrHtml } from '../utils/markdown'
import type { Note } from '../lib/schema'
import { encodePayload } from '../share/codec'
import { buildShareUrl, isHashTooLong } from '../share/link'
import { copyText } from '../utils/clipboard'

export default function NoteView() {
  const [linkCopied, setLinkCopied] = useState(false)
  const [lastUrl, setLastUrl] = useState<string | null>(null)
  const [linkError, setLinkError] = useState<string | null>(null)
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
  if (!note)
    return (
      <div className="p-4">
        <div className="mb-3">Note not found.</div>
        <button
          onClick={() => navigate('/')}
          className="px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-zinc-900"
        >
          Back
        </button>
      </div>
    )

  return (
    <div className="p-4 max-w-3xl mx-auto">
      {/* Toolbar */}
      <div className="sticky top-0 z-30 -mx-4 px-4 py-2 bg-white/70 dark:bg-black/50 backdrop-blur border-b border-gray-200 dark:border-gray-800 flex items-center gap-2 transition-smooth">
        <button
          onClick={() => navigate('/')}
          className="px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-zinc-900 transition-smooth active:scale-[.98]"
        >
          Back
        </button>
        {note.archived && (
          <span className="ml-2 text-xs px-2 py-1 rounded-full border border-gray-300 dark:border-gray-700">
            Archived
          </span>
        )}
        <div className="ml-auto flex items-center gap-2 text-sm">
          <button
            onClick={async () => {
              try {
                const payload = {
                  v: 1 as const,
                  note: {
                    title: note.title,
                    content: note.content,
                    bgColor: note.bgColor,
                    textColor: note.textColor,
                    updatedAt: note.updatedAt,
                  },
                }
                const { c, k } = await encodePayload(payload)
                const url = buildShareUrl({ c, k })
                if (isHashTooLong(url)) {
                  setLastUrl(null)
                  setLinkError('Note is too large to share via link.')
                  setTimeout(() => setLinkError(null), 1800)
                  return
                }
                setLastUrl(url)
                const ok = await copyText(url)
                if (ok) {
                  setLinkCopied(true)
                  setTimeout(() => setLinkCopied(false), 1200)
                }
              } catch {
                setLinkError('Failed to generate share link.')
                setTimeout(() => setLinkError(null), 1800)
              }
            }}
            className="px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-zinc-900 transition-smooth active:scale-[.98] inline-flex items-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M3.9 12a5 5 0 015-5h3v2h-3a3 3 0 100 6h3v2h-3a5 5 0 01-5-5zm6.1 1h4v-2h-4v2zm5.1-6h-3V5h3a5 5 0 110 10h-3v-2h3a3 3 0 000-6z" />
            </svg>
            Copy Link
          </button>
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
        className="rounded-md border mt-3 p-4 transition-smooth"
        style={{ backgroundColor: note.bgColor, color: note.textColor }}
      >
        <h1 className="text-2xl font-semibold mb-2 break-words" style={{ color: note.textColor }}>
          {note.title?.trim() || 'Untitled'}
        </h1>
        {note.content ? (
          <div
            className="wysiwyg leading-6 break-words"
            style={{ color: note.textColor }}
            dangerouslySetInnerHTML={{
              __html: sanitizeHtml(toHtmlFromMarkdownOrHtml(note.content)),
            }}
          />
        ) : (
          <div className="italic opacity-70">No content</div>
        )}
        <div className="text-xs opacity-70 mt-3" style={{ color: note.textColor }}>
          Last edited: {new Date(note.updatedAt).toLocaleString()}
        </div>
      </article>
      {linkCopied && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
          <div className="rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-zinc-900 px-3 py-2 shadow-md text-sm">
            Link copied
          </div>
        </div>
      )}
      {linkError && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
          <div className="rounded-md border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950 px-3 py-2 shadow-md text-sm text-red-700 dark:text-red-300">
            {linkError}
          </div>
        </div>
      )}
      {lastUrl && (
        <div className="fixed bottom-16 left-1/2 -translate-x-1/2 z-40">
          <div className="rounded-md border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-black/50 backdrop-blur px-3 py-2 shadow text-xs flex items-center gap-2 max-w-[90vw]">
            <input
              className="bg-transparent outline-none flex-1 min-w-0"
              readOnly
              value={lastUrl}
              onFocus={(e) => e.currentTarget.select()}
            />
            <button
              onClick={() => copyText(lastUrl)}
              className="px-2 py-1 rounded-md border border-gray-200 dark:border-gray-700"
            >
              Copy
            </button>
            <a
              href={lastUrl}
              target="_blank"
              rel="noreferrer"
              className="px-2 py-1 rounded-md border border-gray-200 dark:border-gray-700"
            >
              Open
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
