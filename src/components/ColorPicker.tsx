import { useMemo } from 'react'

import { PRESET_COLORS, passesAA, relativeLuminance } from '../lib/colors'

type Props = {
  bgColor: string
  textColor: string
  onChange: (bg: string, text: string) => void
}

// Suggest appropriate text color based on background luminance
function suggestTextColor(bgColor: string): string {
  const lum = relativeLuminance(bgColor)
  // If background is dark (low luminance), use light text; otherwise dark text
  return lum < 0.5 ? '#e5e5e5' : '#1a1a1a'
}

export default function ColorPicker({ bgColor, textColor, onChange }: Props) {
  const ok = useMemo(() => passesAA(bgColor, textColor), [bgColor, textColor])

  function handlePresetClick(preset: string) {
    // Auto-suggest appropriate text color for the preset
    const suggestedText = suggestTextColor(preset)
    onChange(preset, suggestedText)
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-1.5">
        <div className="flex flex-col items-center">
          <input
            aria-label="Background color"
            type="color"
            value={bgColor}
            onChange={(e) => onChange(e.target.value, textColor)}
            className="h-8 w-10 cursor-pointer rounded"
          />
          <span className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">BG</span>
        </div>
        <div className="flex flex-col items-center">
          <input
            aria-label="Text color"
            type="color"
            value={textColor}
            onChange={(e) => onChange(bgColor, e.target.value)}
            className="h-8 w-10 cursor-pointer rounded"
          />
          <span className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">Text</span>
        </div>
      </div>
      <div className="flex items-center gap-1 flex-wrap">
        {PRESET_COLORS.map((c) => (
          <button
            key={c}
            title={c}
            onClick={() => handlePresetClick(c)}
            className="h-6 w-6 rounded-md border border-gray-300 dark:border-gray-600 transition-transform hover:scale-110 active:scale-95"
            style={{ backgroundColor: c }}
          />
        ))}
      </div>
      <span
        className={`text-xs px-2 py-1 rounded-full ${ok ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'}`}
      >
        {ok ? '✓ Good contrast' : '⚠ Low contrast'}
      </span>
    </div>
  )
}
