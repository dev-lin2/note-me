import { toBase64Url, fromBase64Url } from './base64url'

function toArrayBuffer(view: Uint8Array): ArrayBuffer {
  const ab = new ArrayBuffer(view.byteLength)
  new Uint8Array(ab).set(view)
  return ab
}

export async function encryptAesGcm(plain: Uint8Array): Promise<{ c: string; k: string }> {
  const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, [
    'encrypt',
    'decrypt',
  ])
  const rawKey = new Uint8Array(await crypto.subtle.exportKey('raw', key))
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const ct = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, toArrayBuffer(plain)),
  )
  // Packet: [1-byte version=1][12B IV][ciphertext]
  const packet = new Uint8Array(1 + iv.length + ct.length)
  packet[0] = 1
  packet.set(iv, 1)
  packet.set(ct, 1 + iv.length)
  return { c: toBase64Url(packet), k: toBase64Url(rawKey) }
}

export async function decryptAesGcm(c: string, k: string): Promise<Uint8Array> {
  const packet = fromBase64Url(c)
  if (packet.byteLength < 1 + 12 + 16) throw new Error('Invalid packet')
  const version = packet[0]
  if (version !== 1) throw new Error('Unsupported version')
  const iv = packet.slice(1, 13)
  const ct = packet.slice(13)
  const rawKey = fromBase64Url(k)
  if (rawKey.byteLength !== 32) throw new Error('Invalid key')
  const key = await crypto.subtle.importKey(
    'raw',
    toArrayBuffer(rawKey),
    { name: 'AES-GCM' },
    false,
    ['decrypt'],
  )
  const plainBuf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, toArrayBuffer(ct))
  return new Uint8Array(plainBuf)
}
