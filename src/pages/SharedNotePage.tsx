import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { createNote } from '../lib/db'
import { decodePayload } from '../share/codec'
import { toHtmlFromMarkdownOrHtml } from '../utils/markdown'
import { sanitizeHtml } from '../utils/sanitize'

type State =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | {
      status: 'ready'
      note: {
        title: string
        content: string
        bgColor?: string
        textColor?: string
        updatedAt: number
      }
    }

function parseHashParams(hash: string): Record<string, string> {
  const h = hash.startsWith('#') ? hash.slice(1) : hash
  const out: Record<string, string> = {}
  for (const part of h.split('&')) {
    if (!part) continue
    const [k, v] = part.split('=')
    if (!k) continue
    out[decodeURIComponent(k)] = decodeURIComponent(v || '')
  }
  return out
}

export default function SharedNotePage() {
  const [state, setState] = useState<State>({ status: 'loading' })
  const [justAdded, setJustAdded] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    let cancelled = false
    async function init() {
      try {
        const params = parseHashParams(window.location.hash)
        const c = params['c']
        const k = params['k']
        if (!c || !k) throw new Error('Invalid or incomplete link.')
        const payload = await decodePayload(c, k)
        if (!payload?.note) throw new Error('This link does not contain a valid note.')
        if (cancelled) return
        setState({ status: 'ready', note: payload.note })
      } catch (e: unknown) {
        if (cancelled) return
        const msg =
          e instanceof Error && typeof e.message === 'string'
            ? e.message
            : 'Link is corrupted or unsupported.'
        setState({ status: 'error', message: msg })
      }
    }
    init()
    return () => {
      cancelled = true
    }
  }, [])

  const body = useMemo(() => {
    if (state.status === 'loading')
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 animate-fade-in">
            <div className="w-8 h-8 border-2 border-gray-300 dark:border-gray-600 border-t-blue-500 rounded-full animate-spin" />
            <span className="text-sm text-gray-500 dark:text-gray-400">Loading shared note...</span>
          </div>
        </div>
      )

    if (state.status === 'error')
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="text-center animate-fade-in-up max-w-md">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-red-500 dark:text-red-400"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h2 className="text-lg font-medium mb-2">Unable to load note</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{state.message}</p>
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
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              Go to Home
            </button>
          </div>
        </div>
      )

    const note = state.note
    return (
      <div className="min-h-screen flex flex-col">
        {/* Header */}
        <div className="sticky top-0 z-30 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
          <div className="max-w-3xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium">
                  Shared Note
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 hidden sm:inline">
                  Read-only
                </span>
              </div>
              <button
                onClick={() => navigate('/')}
                className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-smooth active:scale-[.98] inline-flex items-center gap-2 text-sm"
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
                  <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
                <span className="hidden sm:inline">Home</span>
              </button>
            </div>
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 px-4 py-6">
          <div className="max-w-3xl mx-auto">
            {/* Note card */}
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

            {/* Action buttons */}
            <div className="mt-4 flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button
                onClick={async () => {
                  await createNote({
                    title: note.title,
                    content: note.content,
                    bgColor: note.bgColor,
                    textColor: note.textColor,
                  })
                  setJustAdded(true)
                  setTimeout(() => setJustAdded(false), 1400)
                }}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-smooth active:scale-[.98] inline-flex items-center justify-center gap-2 text-sm font-medium"
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
                  <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
                  <polyline points="17 21 17 13 7 13 7 21" />
                  <polyline points="7 3 7 8 15 8" />
                </svg>
                Save to My Notes
              </button>
              <button
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(note.content || '')
                  } catch {
                    // ignore
                  }
                }}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-smooth active:scale-[.98] inline-flex items-center justify-center gap-2 text-sm"
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
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                </svg>
                Copy Content
              </button>
            </div>
          </div>
        </div>

        {/* Toast notification */}
        {justAdded && (
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
              Saved to your notes
            </div>
          </div>
        )}
      </div>
    )
  }, [state, navigate, justAdded])

  return body
}
