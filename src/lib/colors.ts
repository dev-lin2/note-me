// Utilities for computing contrast and validating color pairs

function hexToRgb(hex: string) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!m) return null
  return {
    r: parseInt(m[1], 16),
    g: parseInt(m[2], 16),
    b: parseInt(m[3], 16),
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

export const PRESET_COLORS = [
  '#FFF8C5',
  '#FFEDD5',
  '#E0F2FE',
  '#DCFCE7',
  '#FCE7F3',
  '#E2E8F0',
  '#FEF3C7',
  '#FAE8FF',
  '#FEE2E2',
  '#F5F5F4',
]

