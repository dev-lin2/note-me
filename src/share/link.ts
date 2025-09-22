import { env, getBaseUrl } from '../env'

export function buildShareUrl(params: { c: string; k: string }): string {
  const base = getBaseUrl()
  // Keep key in hash to preserve zero-knowledge with BrowserRouter
  const hash = `#c=${params.c}&k=${params.k}`
  return `${base}shared${hash}`
}

export function isHashTooLong(url: string): boolean {
  const hashIndex = url.indexOf('#')
  const hash = hashIndex >= 0 ? url.slice(hashIndex) : ''
  return hash.length > env.SHARE_MAX_HASH
}

