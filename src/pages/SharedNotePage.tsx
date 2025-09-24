import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { decodePayload } from '../share/codec'
import { sanitizeHtml } from '../utils/sanitize'
import { createNote } from '../lib/db'

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
      } catch (e: any) {
        if (cancelled) return
        const msg =
          typeof e?.message === 'string'
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
    if (state.status === 'loading') return <div className="p-4">Loading...</div>
    if (state.status === 'error')
      return (
        <div className="p-4 max-w-xl mx-auto">
          <div className="rounded-md border border-red-200 dark:border-red-900 bg-red-50/50 dark:bg-red-950/40 p-4">
            <div className="font-medium text-red-700 dark:text-red-300">{state.message}</div>
            <button onClick={() => navigate('/')} className="mt-3 px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-zinc-900">Back to Home</button>
          </div>
        </div>
      )

    const note = state.note
    return (
      <div className="p-4 max-w-3xl mx-auto">
        <div className="mb-2 text-sm text-gray-600 dark:text-gray-300">
          Shared note (read-only)
        </div>
        <article
          className="rounded-md border mt-2 p-4 transition-smooth"
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

        <div className="mt-3 flex items-center gap-2">
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
            className="px-3 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-smooth active:scale-[.98]"
          >
            Add To List
          </button>
          <button
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(note.content || '')
              } catch {
                // ignore
              }
            }}
            className="px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-zinc-900"
          >
            Copy Content
          </button>
          <button onClick={() => navigate('/')} className="ml-auto px-3 py-2 rounded-md border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-zinc-900">Home</button>
        </div>

        {justAdded && (
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
            <div className="rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-zinc-900 px-3 py-2 shadow-md text-sm">
              Saved to your notes
            </div>
          </div>
        )}
      </div>
    )
  }, [state, navigate, justAdded])

  return body
}
