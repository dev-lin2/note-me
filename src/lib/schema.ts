export type NoteID = string

export interface Note {
  id: NoteID
  title: string
  content: string
  bgColor: string
  textColor: string
  createdAt: number
  updatedAt: number
  archived?: boolean
  order?: number
}

export interface AppSettings {
  theme: 'system' | 'light' | 'dark'
}

export const DefaultSettings: AppSettings = {
  theme: 'system',
}

// Default note colors (dark mode style)
export const DEFAULT_NOTE_BG = '#1e1e1e'
export const DEFAULT_NOTE_TEXT = '#e5e5e5'
