import { deflate, inflate } from './compress'
import { encryptAesGcm, decryptAesGcm } from './crypto'

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

export function validatePayload(obj: any): obj is SharedPayloadV1 {
  return (
    obj &&
    obj.v === 1 &&
    obj.note &&
    typeof obj.note.title === 'string' &&
    typeof obj.note.content === 'string' &&
    typeof obj.note.updatedAt === 'number'
  )
}

export async function encodePayload(payload: SharedPayloadV1): Promise<{ c: string; k: string; rawSize: number; compressedSize: number }> {
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

