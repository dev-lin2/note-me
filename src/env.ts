export const env = {
  SHARE_FEATURE: (import.meta as any).env?.VITE_SHARE_FEATURE === 'true' || (import.meta as any).env?.VITE_SHARE_FEATURE === true,
  APP_URL: ((import.meta as any).env?.VITE_APP_URL as string | undefined) || '',
  BASE_PATH: ((import.meta as any).env?.VITE_BASE_PATH as string | undefined) || '/',
  SHARE_MAX_HASH: Number((import.meta as any).env?.VITE_SHARE_MAX_HASH) || 2800,
}

export function getBaseUrl(): string {
  const raw = (env.APP_URL || '').trim()
  let origin = ''
  if (!raw) {
    origin = window.location.origin
  } else if (/^https?:\/\//i.test(raw)) {
    origin = raw
  } else {
    // Assume host[:port] without protocol; inherit current protocol
    origin = `${window.location.protocol}//${raw}`
  }
  const base = (env.BASE_PATH || '/').trim()
  const normalizedBase = base.endsWith('/') ? base : base + '/'
  return origin.replace(/\/$/, '') + normalizedBase
}
