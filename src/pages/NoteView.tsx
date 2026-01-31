import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { deleteNote, getNote, updateNote } from '../lib/db'
import { encodePayload } from '../share/codec'
import { buildShareUrl, isHashTooLong } from '../share/link'
import { copyText } from '../utils/clipboard'
import { toHtmlFromMarkdownOrHtml } from '../utils/markdown'
import { sanitizeHtml } from '../utils/sanitize'

import type { Note } from '../lib/schema'

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

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 animate-fade-in">
          <div className="w-8 h-8 border-2 border-gray-300 dark:border-gray-600 border-t-blue-500 rounded-full animate-spin" />
          <span className="text-sm text-gray-500 dark:text-gray-400">Loading note...</span>
        </div>
      </div>
    )

  if (!note)
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center animate-fade-in-up">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-gray-400 dark:text-gray-500"
            >
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="9" y1="15" x2="15" y2="15" />
            </svg>
          </div>
          <h2 className="text-lg font-medium mb-2">Note not found</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            This note may have been deleted or doesn't exist.
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-smooth active:scale-[.98] inline-flex items-center gap-2"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back to Home
          </button>
        </div>
      </div>
    )

  // Note: These handlers are only called when note is guaranteed to be non-null
  // (after the early return checks above)
  const currentNote = note // TypeScript narrowed type

  async function handleCopyLink() {
    try {
      const payload = {
        v: 1 as const,
        note: {
          title: currentNote.title,
          content: currentNote.content,
          bgColor: currentNote.bgColor,
          textColor: currentNote.textColor,
          updatedAt: currentNote.updatedAt,
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
  }

  async function handleArchive() {
    const updated = await updateNote(currentNote.id, { archived: !currentNote.archived })
    setNote(updated)
  }

  async function handleDelete() {
    if (confirm('Delete this note?')) {
      await deleteNote(currentNote.id)
      navigate('/')
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Toolbar */}
      <div className="sticky top-0 z-30 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 transition-smooth">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {/* Top row: Back button and archived badge */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/')}
                className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-smooth active:scale-[.98] inline-flex items-center gap-2"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
                <span className="hidden sm:inline">Back</span>
              </button>
              {note.archived && (
                <span className="text-xs px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 font-medium">
                  Archived
                </span>
              )}
            </div>

            {/* Mobile action row */}
            <div className="grid grid-cols-4 gap-2 sm:hidden w-full">
              <button
                onClick={handleCopyLink}
                className="flex flex-col items-center gap-1 px-2 py-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-smooth active:scale-[.98] text-xs"
                aria-label="Copy link"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M3.9 12a5 5 0 015-5h3v2h-3a3 3 0 100 6h3v2h-3a5 5 0 01-5-5zm6.1 1h4v-2h-4v2zm5.1-6h-3V5h3a5 5 0 110 10h-3v-2h3a3 3 0 000-6z" />
                </svg>
                Share
              </button>
              <Link
                to={`/note/${note.id}`}
                className="flex flex-col items-center gap-1 px-2 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-smooth active:scale-[.98] text-xs"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                Edit
              </Link>
              <button
                onClick={handleArchive}
                className="flex flex-col items-center gap-1 px-2 py-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-smooth active:scale-[.98] text-xs"
                aria-label={note.archived ? 'Unarchive' : 'Archive'}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M20 6H4V4h16v2zm-2 2v12H6V8h12zM8 10v8h8v-8H8z" />
                </svg>
                {note.archived ? 'Restore' : 'Archive'}
              </button>
              <button
                onClick={handleDelete}
                className="flex flex-col items-center gap-1 px-2 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950 transition-smooth active:scale-[.98] text-xs"
                aria-label="Delete"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M9 3h6v2h5v2H4V5h5V3zm1 6h2v9h-2V9zm4 0h2v9h-2V9zM8 9h2v9H8V9z" />
                </svg>
                Delete
              </button>
            </div>

            {/* Desktop action row */}
            <div className="hidden sm:flex sm:ml-auto items-center gap-2 text-sm">
              <button
                onClick={handleCopyLink}
                className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-smooth active:scale-[.98] inline-flex items-center gap-2"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M3.9 12a5 5 0 015-5h3v2h-3a3 3 0 100 6h3v2h-3a5 5 0 01-5-5zm6.1 1h4v-2h-4v2zm5.1-6h-3V5h3a5 5 0 110 10h-3v-2h3a3 3 0 000-6z" />
                </svg>
                Copy Link
              </button>
              <Link
                to={`/note/${note.id}`}
                className="px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-smooth active:scale-[.98] inline-flex items-center gap-2"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                Edit
              </Link>
              <button
                onClick={handleArchive}
                className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-smooth active:scale-[.98] inline-flex items-center gap-2"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M20 6H4V4h16v2zm-2 2v12H6V8h12zM8 10v8h8v-8H8z" />
                </svg>
                {note.archived ? 'Unarchive' : 'Archive'}
              </button>
              <button
                onClick={handleDelete}
                className="px-3 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950 transition-smooth active:scale-[.98] inline-flex items-center gap-2"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M9 3h6v2h5v2H4V5h5V3zm1 6h2v9h-2V9zm4 0h2v9h-2V9zM8 9h2v9H8V9z" />
                </svg>
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 px-4 py-6">
        <div className="max-w-3xl mx-auto">
          {/* Read-only card */}
          <article
            className="rounded-xl border shadow-sm overflow-hidden transition-smooth animate-fade-in-up"
            style={{ backgroundColor: note.bgColor, color: note.textColor }}
          >
            <div className="p-5 sm:p-6">
              <h1
                className="text-xl sm:text-2xl font-semibold mb-4 break-words leading-tight"
                style={{ color: note.textColor }}
              >
                {note.title?.trim() || 'Untitled'}
              </h1>
              {note.content ? (
                <div
                  className="wysiwyg break-words"
                  style={{ color: note.textColor }}
                  dangerouslySetInnerHTML={{
                    __html: sanitizeHtml(toHtmlFromMarkdownOrHtml(note.content)),
                  }}
                />
              ) : (
                <div className="italic opacity-60">No content</div>
              )}
            </div>
            <div
              className="px-5 sm:px-6 py-3 border-t text-xs opacity-60 flex items-center gap-2"
              style={{ color: note.textColor, borderColor: 'currentColor', borderTopWidth: '1px' }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="opacity-70"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              Last edited: {new Date(note.updatedAt).toLocaleString()}
            </div>
          </article>
        </div>
      </div>

      {/* Toast notifications */}
      {linkCopied && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-fade-in-up">
          <div className="rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950 px-4 py-2.5 shadow-lg text-sm text-green-700 dark:text-green-300 flex items-center gap-2">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 6L9 17l-5-5" />
            </svg>
            Link copied to clipboard
          </div>
        </div>
      )}
      {linkError && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-fade-in-up">
          <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950 px-4 py-2.5 shadow-lg text-sm text-red-700 dark:text-red-300 flex items-center gap-2">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {linkError}
          </div>
        </div>
      )}
      {lastUrl && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 w-[95vw] max-w-lg animate-fade-in-up">
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md px-4 py-3 shadow-xl">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">Share link:</div>
            <div className="flex items-center gap-2">
              <input
                className="bg-gray-100 dark:bg-zinc-800 rounded-md px-3 py-2 text-xs outline-none flex-1 min-w-0 focus:ring-2 focus:ring-blue-500"
                readOnly
                value={lastUrl}
                onFocus={(e) => e.currentTarget.select()}
              />
              <button
                onClick={() => {
                  copyText(lastUrl)
                  setLinkCopied(true)
                  setTimeout(() => setLinkCopied(false), 1200)
                }}
                className="px-3 py-2 rounded-md bg-blue-600 text-white text-xs hover:bg-blue-700 transition-smooth active:scale-[.98]"
              >
                Copy
              </button>
              <a
                href={lastUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 text-xs hover:bg-gray-50 dark:hover:bg-zinc-800 transition-smooth"
              >
                Open
              </a>
              <button
                onClick={() => setLastUrl(null)}
                className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-800 transition-smooth"
                aria-label="Close"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
