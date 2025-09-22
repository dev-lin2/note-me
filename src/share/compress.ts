function toArrayBuffer(view: Uint8Array): ArrayBuffer {
  const ab = new ArrayBuffer(view.byteLength)
  new Uint8Array(ab).set(view)
  return ab
}

export async function deflate(data: Uint8Array): Promise<Uint8Array> {
  if (typeof CompressionStream === 'undefined') return data
  try {
    const cs = new CompressionStream('deflate')
    const stream = new Blob([toArrayBuffer(data)]).stream().pipeThrough(cs)
    const buf = await new Response(stream).arrayBuffer()
    return new Uint8Array(buf)
  } catch {
    // Fallback on any runtime error
    return data
  }
}

export async function inflate(data: Uint8Array): Promise<Uint8Array> {
  if (typeof DecompressionStream === 'undefined') return data
  try {
    const ds = new DecompressionStream('deflate')
    const stream = new Blob([toArrayBuffer(data)]).stream().pipeThrough(ds)
    const buf = await new Response(stream).arrayBuffer()
    return new Uint8Array(buf)
  } catch {
    // If decompression fails (e.g., input wasn't compressed), return original
    return data
  }
}
