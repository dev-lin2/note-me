import { env } from '../env'

export function buildShareUrl(params: { c: string; k: string }): string {
  // Keep key in hash to preserve zero-knowledge
  const hash = `#c=${params.c}&k=${params.k}`
  const base = new URL('/shared', window.location.origin).toString()
  return `${base}${hash}`
}

export function isHashTooLong(url: string): boolean {
  const hashIndex = url.indexOf('#')
  const hash = hashIndex >= 0 ? url.slice(hashIndex) : ''
  return hash.length > env.SHARE_MAX_HASH
}
