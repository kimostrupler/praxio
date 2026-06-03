'use client'

import { useState, useRef, useEffect } from 'react'

type Props = {
  clientId: string
  latestAnamneseId?: string | null
  hasPlaene?: boolean
  hasErnaehrung?: boolean
}

export default function PdfMenu({ clientId, latestAnamneseId, hasPlaene, hasErnaehrung }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onMouse(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onMouse)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onMouse)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const items = [
    { label: 'Fortschrittsbericht', href: `/api/pdf/fortschritt/${clientId}` },
    { label: 'Vertrag',             href: `/api/pdf/vertrag/${clientId}` },
    ...(latestAnamneseId ? [{ label: 'Anamnesebogen',  href: `/api/pdf/anamnese/${latestAnamneseId}` }] : []),
    ...(hasPlaene        ? [{ label: 'Trainingspläne', href: `/api/pdf/trainingplaene/${clientId}` }]   : []),
    ...(hasErnaehrung    ? [{ label: 'Ernährungspläne',href: `/api/pdf/ernaehrungsplaene/${clientId}` }]: []),
  ]

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-label="PDFs herunterladen" aria-haspopup="menu" aria-expanded={open}
        onClick={() => setOpen(v => !v)}
        className={`flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border transition-all ${
          open
            ? 'bg-[#1c1c1c] border-[#3a3a3a] text-[#efefef]'
            : 'border-[#2e2e2e] text-[#666666] hover:border-[#3a3a3a] hover:text-[#efefef] hover:bg-[#1c1c1c]'
        }`}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="9" y1="13" x2="15" y2="13"/>
          <line x1="9" y1="17" x2="12" y2="17"/>
        </svg>
        <span className="hidden sm:inline">PDF</span>
        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="hidden sm:block">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {open && (
        <div role="menu" className="absolute right-0 top-full mt-1.5 w-52 bg-[#141414] border border-[#2e2e2e] rounded-xl shadow-2xl z-50 overflow-hidden py-1 max-w-[calc(100vw-2rem)]">
          {items.map(item => (
            <a
              key={item.href}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm text-[#efefef] hover:bg-[#1c1c1c] transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-[#555555]">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
              {item.label}
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
