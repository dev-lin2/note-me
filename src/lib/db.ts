// Minimal IndexedDB wrapper for NoteMe (no external deps)
import { nanoid } from 'nanoid'
import type { Note } from './schema'

const DB_NAME = 'note-me'
const STORE = 'notes'
const VERSION = 1

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'id' })
        store.createIndex('updatedAt', 'updatedAt')
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function run<T = unknown>(
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest
): Promise<T> {
  return openDB().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(STORE, mode)
        const store = tx.objectStore(STORE)
        const req = fn(store)
        req.onsuccess = () => resolve(req.result as T)
        req.onerror = () => reject(req.error)
      })
  )
}

export async function getAllNotes(): Promise<Note[]> {
  const notes = await run<any[]>('readonly', (s) => s.getAll())
  return (notes || []).sort((a, b) => b.updatedAt - a.updatedAt)
}

export async function getNote(id: string): Promise<Note | null> {
  const n = await run<Note | undefined>('readonly', (s) => s.get(id))
  return n ?? null
}

export async function createNote(partial: Partial<Note> = {}): Promise<Note> {
  const now = Date.now()
  const note: Note = {
    id: partial.id || nanoid(),
    title: (partial.title ?? '').toString().slice(0, 120),
    content: partial.content ?? '',
    bgColor: partial.bgColor ?? '#FFF8C5',
    textColor: partial.textColor ?? '#222222',
    createdAt: now,
    updatedAt: now,
    archived: false,
  }
  await run('readwrite', (s) => s.put(note))
  try { window.dispatchEvent(new CustomEvent('notes:changed', { detail: { type: 'create', id: note.id } })) } catch {}
  return note
}

export async function updateNote(id: string, patch: Partial<Note>): Promise<Note> {
  const existing = await getNote(id)
  if (!existing) throw new Error('Note not found')
  const updated: Note = { ...existing, ...patch, updatedAt: Date.now() }
  await run('readwrite', (s) => s.put(updated))
  try { window.dispatchEvent(new CustomEvent('notes:changed', { detail: { type: 'update', id } })) } catch {}
  return updated
}

export async function deleteNote(id: string): Promise<void> {
  await run('readwrite', (s) => s.delete(id))
  try { window.dispatchEvent(new CustomEvent('notes:changed', { detail: { type: 'delete', id } })) } catch {}
}

// Persist an explicit order for the provided note IDs (0..n-1)
export async function setOrders(ids: string[]): Promise<void> {
  await openDB().then(
    (db) =>
      new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE, 'readwrite')
        const store = tx.objectStore(STORE)
        let i = 0
        const assignNext = () => {
          if (i >= ids.length) return
          const id = ids[i++]!
          const getReq = store.get(id as IDBValidKey)
          getReq.onsuccess = () => {
            const n = getReq.result as Note | undefined
            if (n) {
              // Do not bump updatedAt for ordering changes
              const updated: Note = { ...n, order: i - 1 }
              store.put(updated)
            }
            assignNext()
          }
        }
        assignNext()
        tx.oncomplete = () => resolve()
        tx.onabort = () => reject(tx.error)
      })
  )
  try { window.dispatchEvent(new CustomEvent('notes:changed', { detail: { type: 'reorder', ids } })) } catch {}
}

export async function exportJSON(): Promise<string> {
  const notes = await getAllNotes()
  return JSON.stringify({ version: 1, exportedAt: Date.now(), notes })
}

export async function importJSON(json: string): Promise<void> {
  const data = JSON.parse(json)
  if (!data || !Array.isArray(data.notes)) throw new Error('Invalid file')
  await openDB().then(
    (db) =>
      new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE, 'readwrite')
        const store = tx.objectStore(STORE)
        for (const n of data.notes) store.put(n)
        tx.oncomplete = () => resolve()
        tx.onabort = () => reject(tx.error)
      })
  )
  try { window.dispatchEvent(new CustomEvent('notes:changed', { detail: { type: 'import' } })) } catch {}
}
