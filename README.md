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
