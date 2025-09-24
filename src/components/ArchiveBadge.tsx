import { useEffect, useState } from 'react'
import { getAllNotes } from '../lib/db'

export default function ArchiveBadge() {
  const [count, setCount] = useState<number | null>(null)

  async function refresh() {
    const notes = await getAllNotes()
    setCount(notes.filter((n) => n.archived).length)
  }

  useEffect(() => {
    refresh()
    const onChanged = () => refresh()
    window.addEventListener('notes:changed', onChanged as EventListener)
    return () => window.removeEventListener('notes:changed', onChanged as EventListener)
  }, [])

  if (count == null)
    return (
      <span className="inline-flex items-center px-2 py-0.5 text-xs rounded-full border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300">
        ...
      </span>
    )

  return (
    <span
      title="Archived notes"
      className="inline-flex items-center px-2 py-0.5 text-xs rounded-full border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200"
      aria-label={`Archived notes: ${count}`}
    >
      Archived: {count}
    </span>
  )
}
