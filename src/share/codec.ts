import { deflate, inflate } from './compress'
import { decryptAesGcm, encryptAesGcm } from './crypto'

export type SharedPayloadV1 = {
  v: 1
  note: {
    id?: string
    title: string
    content: string
    bgColor?: string
    textColor?: string
    tags?: string[]
    updatedAt: number
  }
}

export function validatePayload(obj: unknown): obj is SharedPayloadV1 {
  if (typeof obj !== 'object' || obj === null) return false
  const o = obj as Record<string, unknown>
  if (o['v'] !== 1) return false
  const note = o['note']
  if (typeof note !== 'object' || note === null) return false
  const n = note as Record<string, unknown>
  if (typeof n['title'] !== 'string') return false
  if (typeof n['content'] !== 'string') return false
  if (typeof n['updatedAt'] !== 'number') return false
  return true
}

export async function encodePayload(
  payload: SharedPayloadV1,
): Promise<{ c: string; k: string; rawSize: number; compressedSize: number }> {
  const json = JSON.stringify(payload)
  const raw = new TextEncoder().encode(json)
  const compressed = await deflate(raw)
  const { c, k } = await encryptAesGcm(compressed)
  return { c, k, rawSize: raw.byteLength, compressedSize: compressed.byteLength }
}

export async function decodePayload(c: string, k: string): Promise<SharedPayloadV1> {
  const decrypted = await decryptAesGcm(c, k)
  const inflated = await inflate(decrypted)
  const json = new TextDecoder().decode(inflated)
  const obj = JSON.parse(json)
  if (!validatePayload(obj)) throw new Error('Schema mismatch')
  return obj
}
