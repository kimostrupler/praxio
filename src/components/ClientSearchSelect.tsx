'use client'

import { useState, useRef, useEffect } from 'react'

type Props = {
  clients: { id: string; vorname: string; nachname: string }[]
  value: string
  onChange: (id: string) => void
  placeholder?: string
  className?: string
}

const inputCls = 'w-full px-3 py-2 bg-[#0a0a0a] border border-[#2e2e2e] rounded-lg text-sm text-[#efefef] placeholder:text-[#3a3a3a] focus:outline-none focus:border-[#555555] transition-colors'

export default function ClientSearchSelect({ clients, value, onChange, placeholder = 'Klient suchen…', className }: Props) {
  const selected = clients.find(c => c.id === value)
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const displayValue = selected ? `${selected.vorname} ${selected.nachname}` : ''

  const filtered = clients.filter(c => {
    const full = `${c.vorname} ${c.nachname}`.toLowerCase()
    return full.includes(query.toLowerCase())
  })

  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [])

  function handleFocus() {
    setOpen(true)
    setQuery('')
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      setOpen(false)
      setQuery('')
      ;(e.target as HTMLInputElement).blur()
    }
  }

  function handleSelect(id: string) {
    onChange(id)
    setOpen(false)
    setQuery('')
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation()
    onChange('')
    setQuery('')
    setOpen(false)
  }

  return (
    <div ref={containerRef} className={`relative${className ? ' ' + className : ''}`}>
      <input
        type="text"
        className={inputCls + ' pr-8'}
        placeholder={placeholder}
        value={open ? query : displayValue}
        onFocus={handleFocus}
        onChange={e => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        readOnly={!open}
      />
      {selected && !open && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#3a3a3a] hover:text-[#efefef] transition-colors text-base leading-none">
          ×
        </button>
      )}
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-[#141414] border border-[#2e2e2e] rounded-lg shadow-lg z-50 overflow-y-auto max-h-48">
          {filtered.length === 0 ? (
            <p className="px-3 py-2.5 text-sm text-[#3a3a3a]">Kein Klient gefunden.</p>
          ) : (
            filtered.map(c => (
              <div
                key={c.id}
                onMouseDown={() => handleSelect(c.id)}
                className="px-3 py-2.5 text-sm text-[#efefef] hover:bg-[#1c1c1c] cursor-pointer transition-colors">
                {c.vorname} {c.nachname}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
