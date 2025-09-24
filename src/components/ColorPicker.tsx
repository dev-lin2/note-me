import { useMemo } from 'react'
import { PRESET_COLORS, passesAA } from '../lib/colors'

type Props = {
  bgColor: string
  textColor: string
  onChange: (bg: string, text: string) => void
}

export default function ColorPicker({ bgColor, textColor, onChange }: Props) {
  const ok = useMemo(() => passesAA(bgColor, textColor), [bgColor, textColor])
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1">
        <input
          aria-label="Background color"
          type="color"
          value={bgColor}
          onChange={(e) => onChange(e.target.value, textColor)}
          className="h-8 w-10 cursor-pointer"
        />
        <input
          aria-label="Text color"
          type="color"
          value={textColor}
          onChange={(e) => onChange(bgColor, e.target.value)}
          className="h-8 w-10 cursor-pointer"
        />
      </div>
      <div className="flex items-center gap-1">
        {PRESET_COLORS.map((c) => (
          <button
            key={c}
            title={c}
            onClick={() => onChange(c, textColor)}
            className="h-6 w-6 rounded border"
            style={{ backgroundColor: c }}
          />
        ))}
      </div>
      <span className={`text-sm ${ok ? 'text-green-600' : 'text-red-600'}`}>
        {ok ? 'AA OK' : 'Low contrast'}
      </span>
    </div>
  )
}
