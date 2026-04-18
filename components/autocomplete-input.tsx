'use client'
import { useState, useRef, useEffect } from 'react'

interface Props {
  value: string
  onChange: (v: string) => void
  suggestions: string[]
  placeholder: string
  icon: string
  required?: boolean
  className?: string
}

export default function AutocompleteInput({ value, onChange, suggestions, placeholder, icon, required, className = '' }: Props) {
  const [open, setOpen] = useState(false)
  const [filtered, setFiltered] = useState<string[]>([])
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const q = value.trim().toLowerCase()
    if (q.length < 1) { setFiltered([]); setOpen(false); return }
    const matches = suggestions.filter(s => s.toLowerCase().includes(q)).slice(0, 7)
    setFiltered(matches)
    setOpen(matches.length > 0)
  }, [value, suggestions])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div ref={ref} className={`relative ${className}`}>
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-base pointer-events-none">{icon}</span>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => filtered.length > 0 && setOpen(true)}
        placeholder={placeholder}
        required={required}
        autoComplete="off"
        className="w-full border-2 border-gray-100 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-blue-400 transition-colors bg-white"
      />
      {open && (
        <ul className="absolute z-50 top-full mt-1 left-0 right-0 bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden">
          {filtered.map(s => (
            <li
              key={s}
              onMouseDown={() => { onChange(s); setOpen(false) }}
              className="px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 cursor-pointer transition-colors"
            >
              {highlight(s, value)}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function highlight(text: string, query: string) {
  const i = text.toLowerCase().indexOf(query.toLowerCase())
  if (i === -1) return text
  return (
    <>
      {text.slice(0, i)}
      <strong className="font-bold">{text.slice(i, i + query.length)}</strong>
      {text.slice(i + query.length)}
    </>
  )
}
