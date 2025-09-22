# NoteMe!

A lightweight, local‑first notes app with instant autosave, offline storage, and keyboard‑first workflow.

## Features
- Create/edit colorful notes with autosave
- Full‑text search (title + content)
- Light/Dark theme with system option
- Export/Import JSON backups
- Keyboard: Ctrl/Cmd+N (new), Ctrl/Cmd+K (search)

## Quick Start
1. Install: `npm install`
2. Dev server: `npm run dev` (open URL from terminal)
3. Build: `npm run build` → Preview: `npm run preview`

## Tech
- React + TypeScript + Vite, Tailwind (dark mode via `class`)
- IndexedDB for storage (no backend required)

## Notes
- Data persists in your browser (IndexedDB). Use Export/Import to back up or move notes.
- Theme can be changed in Settings. System mode follows OS preference.

## Sharing (Encrypted URL)
- Share a note as a link: content is compressed + encrypted client-side and embedded in the URL hash.
- Open links at `/shared#c=...&k=...` to view a read-only version and click "Add To List" to save into your own notes (IndexedDB).
- Privacy: zero-knowledge — the key and ciphertext live in the hash, so servers never receive them.
- Size guard: links longer than `VITE_SHARE_MAX_HASH` (default 2800) are blocked with an error message.

### How to Share
- In the Note Editor or View, click "Copy" / "Copy Link" to copy the share link.
- Paste the link into a new tab or send it to someone. They can open and "Add To List".

### Environment
- Required: `VITE_SHARE_MAX_HASH` (optional; defaults to `2800`). No other `VITE_*` variables are needed.

### Deployment (Netlify)
- Ensure SPA redirects so `/shared` serves your app:
  - `public/_redirects`: `/* /index.html 200`
  - or `netlify.toml` with a `[[redirects]]` from `/*` to `/index.html` (status 200).

### Security & Rendering
- Uses Web Crypto AES-GCM with a random key per link; key is in the hash.
- Content is sanitized before rendering. Avoid embedding unsafe scripts.

### Compatibility
- Compression uses the browser's CompressionStream/DecompressionStream when available; otherwise it falls back.
- Links made with compression may not open in older browsers without decompression support. In that case, you'll see an error like "Link is corrupted or unsupported." Future enhancement: add a pure-JS compression fallback for full cross-browser decode.
