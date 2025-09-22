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
  density: 'comfortable' | 'compact'
  defaultBg: string
  defaultText: string
}

export const DefaultSettings: AppSettings = {
  theme: 'system',
  density: 'comfortable',
  defaultBg: '#FFF8C5',
  defaultText: '#222222',
}
