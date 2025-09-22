import { useEffect, useRef } from 'react'
import { sanitizeHtml } from '../utils/sanitize'

type Props = {
  value: string
  onChange: (html: string) => void
  textColor?: string
}

export default function RichEditor({ value, onChange, textColor = '#222' }: Props) {
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (el.innerHTML !== value) el.innerHTML = value || ''
  }, [value])

  function cmd(command: string, value?: string) {
    document.execCommand(command, false, value)
    // After exec, emit change
    const el = ref.current
    if (!el) return
    onChange(sanitizeHtml(el.innerHTML))
  }

  function onInput() {
    const el = ref.current
    if (!el) return
    onChange(sanitizeHtml(el.innerHTML))
  }

  function onPaste(e: React.ClipboardEvent) {
    e.preventDefault()
    const html = e.clipboardData.getData('text/html') || e.clipboardData.getData('text/plain')
    const safe = sanitizeHtml(html)
    document.execCommand('insertHTML', false, safe)
  }

  function onAddLink() {
    const url = prompt('Enter URL')
    if (!url) return
    cmd('createLink', url)
  }


  return (
    <div>
      <div className="flex flex-wrap items-center gap-1 border border-gray-200 dark:border-gray-700 rounded-md p-1 bg-white/70 dark:bg-black/40 backdrop-blur">
        <button className="px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-zinc-800" title="Bold" onClick={() => cmd('bold')}><b>B</b></button>
        <button className="px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-zinc-800 italic" title="Italic" onClick={() => cmd('italic')}>I</button>
        <button className="px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-zinc-800 underline" title="Underline" onClick={() => cmd('underline')}>U</button>
        <span className="mx-1 h-5 w-px bg-gray-200 dark:bg-gray-700" />
        <button className="px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-zinc-800" onClick={() => cmd('formatBlock', '<h1>')} title="Heading 1">H1</button>
        <button className="px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-zinc-800" onClick={() => cmd('formatBlock', '<h2>')} title="Heading 2">H2</button>
        <button className="px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-zinc-800" onClick={() => cmd('formatBlock', '<blockquote>')} title="Quote">❝</button>
        <span className="mx-1 h-5 w-px bg-gray-200 dark:bg-gray-700" />
        <button className="px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-zinc-800" onClick={() => cmd('insertUnorderedList')} title="Bulleted list">• List</button>
        <button className="px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-zinc-800" onClick={() => cmd('insertOrderedList')} title="Numbered list">1. List</button>
        <span className="mx-1 h-5 w-px bg-gray-200 dark:bg-gray-700" />
        <button className="px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-zinc-800" onClick={onAddLink} title="Link">🔗</button>
        <span className="mx-1 h-5 w-px bg-gray-200 dark:bg-gray-700" />
        <button className="px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-zinc-800" onClick={() => cmd('undo')} title="Undo">↶</button>
        <button className="px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-zinc-800" onClick={() => cmd('redo')} title="Redo">↷</button>
      </div>
      <div
        ref={ref}
        className="mt-2 min-h-[55vh] rounded-md border border-gray-200 dark:border-gray-700 p-3 outline-none focus:ring-2 focus:ring-blue-500 bg-transparent leading-6 wysiwyg"
        contentEditable
        onInput={onInput}
        onPaste={onPaste}
        style={{ color: textColor }}
        suppressContentEditableWarning
      />
    </div>
  )
}
