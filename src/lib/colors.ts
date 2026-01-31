// Utilities for computing contrast and validating color pairs

function hexToRgb(hex: string) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!m) return null
  const r = m[1]!
  const g = m[2]!
  const b = m[3]!
  return {
    r: parseInt(r, 16),
    g: parseInt(g, 16),
    b: parseInt(b, 16),
  }
}

function luminanceChannel(c: number) {
  const s = c / 255
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
}

export function relativeLuminance(hex: string) {
  const rgb = hexToRgb(hex)
  if (!rgb) return 0
  const r = luminanceChannel(rgb.r)
  const g = luminanceChannel(rgb.g)
  const b = luminanceChannel(rgb.b)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export function contrastRatio(hex1: string, hex2: string) {
  const L1 = relativeLuminance(hex1)
  const L2 = relativeLuminance(hex2)
  const lighter = Math.max(L1, L2)
  const darker = Math.min(L1, L2)
  return (lighter + 0.05) / (darker + 0.05)
}

export function passesAA(bg: string, fg: string) {
  return contrastRatio(bg, fg) >= 4.5
}

// Dark backgrounds (for light text)
export const DARK_PRESETS = [
  '#1e1e1e', // Default dark
  '#1a1a2e', // Deep navy
  '#16213e', // Dark blue
  '#1b2838', // Steam dark
  '#2d2d2d', // Charcoal
  '#1e3a5f', // Dark ocean
  '#2c3e50', // Midnight blue
  '#1a1a1a', // Near black
]

// Light backgrounds (for dark text)
export const LIGHT_PRESETS = [
  '#FFF8C5', // Warm yellow
  '#FFEDD5', // Peach
  '#E0F2FE', // Sky blue
  '#DCFCE7', // Mint
  '#FCE7F3', // Pink
  '#F5F5F4', // Stone
]

// Combined for color picker (dark first since default is dark)
export const PRESET_COLORS = [...DARK_PRESETS.slice(0, 5), ...LIGHT_PRESETS.slice(0, 5)]
