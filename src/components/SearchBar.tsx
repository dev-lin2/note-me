type Props = {
  value: string
  onChange: (v: string) => void
}

export default function SearchBar({ value, onChange }: Props) {
  return (
    <input
      id="global-search"
      type="search"
      placeholder="Search notes (Ctrl/Cmd+K)"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full md:w-96 border rounded px-3 py-2 bg-white text-black placeholder-gray-500 border-gray-200 dark:bg-zinc-900 dark:text-white dark:placeholder-gray-400 dark:border-gray-700"
    />
  )
}
