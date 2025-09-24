const meta = import.meta as unknown as { env?: { VITE_SHARE_MAX_HASH?: string } }

export const env = {
  SHARE_MAX_HASH: Number(meta.env?.VITE_SHARE_MAX_HASH) || 2800,
}
