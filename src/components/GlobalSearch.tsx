'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import type { ClientStatus, RechnungStatus } from '@/lib/formatting'

type SearchResults = {
  clients:    { id: string; vorname: string; nachname: string; status: ClientStatus; email: string | null }[]
  rechnungen: { id: string; nummer: string; status: RechnungStatus; client: { vorname: string; nachname: string } }[]
  training:   { id: string; name: string; clientId: string; client: { vorname: string; nachname: string } }[]
  ernaehrung: { id: string; name: string; clientId: string; client: { vorname: string; nachname: string } }[]
}

const STATUS_DOT: Record<ClientStatus, string> = {
  AKTIV:    'bg-emerald-400',
  PAUSIERT: 'bg-orange-400',
  INAKTIV:  'bg-[#3a3a3a]',
}

export default function GlobalSearch({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ]             = useState('')
  const [results, setResults] = useState<SearchResults | null>(null)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQ('')
      setResults(null)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  // Cmd+K / Ctrl+K to open (self-contained)
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        if (!open) return // parent controls open; just prevent default
      }
      if (e.key === 'Escape' && open) onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  const search = useCallback((val: string) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (val.length < 2) { setResults(null); return }
    timerRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(val)}`)
        const data = await res.json()
        setResults(data)
      } finally {
        setLoading(false)
      }
    }, 250)
  }, [])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setQ(e.target.value)
    search(e.target.value)
  }

  const hasResults = results && (
    results.clients.length > 0 || results.rechnungen.length > 0 ||
    results.training.length > 0 || results.ernaehrung.length > 0
  )

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      {/* Backdrop */}
      <div aria-hidden="true" className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div role="dialog" aria-modal="true" aria-label="Suche"
        className="relative w-full max-w-lg mx-3 bg-[#141414] border border-[#2e2e2e] rounded-2xl shadow-2xl overflow-hidden">
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#1c1c1c]">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            className="text-[#555555] shrink-0">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            ref={inputRef}
            value={q}
            onChange={handleChange}
            placeholder="Klient, Rechnung, E-Mail…"
            aria-label="Suchen"
            className="flex-1 bg-transparent text-sm text-[#efefef] placeholder:text-[#3a3a3a] focus:outline-none"
          />
          {loading && (
            <svg className="animate-spin shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
            </svg>
          )}
          <kbd className="text-[10px] text-[#3a3a3a] border border-[#2e2e2e] rounded px-1.5 py-0.5 shrink-0">ESC</kbd>
        </div>

        {/* Results */}
        {hasResults && (
          <div className="max-h-80 overflow-y-auto py-2">
            {results!.clients.length > 0 && (
              <div>
                <p className="px-4 py-1.5 text-[10px] font-semibold text-[#3a3a3a] uppercase tracking-wider">Klienten</p>
                {results!.clients.map(c => (
                  <Link key={c.id} href={`/clients/${c.id}`} onClick={onClose}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#1c1c1c] transition-colors">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${STATUS_DOT[c.status]}`} />
                    <div className="min-w-0">
                      <p className="text-sm text-[#efefef] truncate">{c.vorname} {c.nachname}</p>
                      {c.email && <p className="text-xs text-[#444444] truncate">{c.email}</p>}
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {results!.rechnungen.length > 0 && (
              <div className={results!.clients.length > 0 ? 'border-t border-[#1c1c1c] mt-1 pt-1' : ''}>
                <p className="px-4 py-1.5 text-[10px] font-semibold text-[#3a3a3a] uppercase tracking-wider">Rechnungen</p>
                {results!.rechnungen.map(r => (
                  <Link key={r.id} href={`/rechnungen/${r.id}/bearbeiten`} onClick={onClose}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#1c1c1c] transition-colors">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
                      className="text-[#444444] shrink-0">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                    </svg>
                    <div className="min-w-0">
                      <p className="text-sm text-[#efefef] truncate">{r.nummer}</p>
                      <p className="text-xs text-[#444444] truncate">{r.client.vorname} {r.client.nachname}</p>
                    </div>
                    <span className={`ml-auto text-[10px] font-medium shrink-0 ${
                      r.status === 'OFFEN' ? 'text-orange-400' : r.status === 'BEZAHLT' ? 'text-emerald-400' : 'text-[#444444]'
                    }`}>{r.status === 'OFFEN' ? 'Offen' : r.status === 'BEZAHLT' ? 'Bezahlt' : 'Storniert'}</span>
                  </Link>
                ))}
              </div>
            )}

            {results!.training.length > 0 && (
              <div className={results!.clients.length > 0 || results!.rechnungen.length > 0 ? 'border-t border-[#1c1c1c] mt-1 pt-1' : ''}>
                <p className="px-4 py-1.5 text-[10px] font-semibold text-[#3a3a3a] uppercase tracking-wider">Trainingspläne</p>
                {results!.training.map(t => (
                  <Link key={t.id} href={`/clients/${t.clientId}/training/${t.id}/bearbeiten`} onClick={onClose}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#1c1c1c] transition-colors">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
                      className="text-[#444444] shrink-0">
                      <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
                      <rect x="9" y="3" width="6" height="4" rx="1"/>
                    </svg>
                    <div className="min-w-0">
                      <p className="text-sm text-[#efefef] truncate">{t.name}</p>
                      <p className="text-xs text-[#444444] truncate">{t.client.vorname} {t.client.nachname}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {results!.ernaehrung.length > 0 && (
              <div className={results!.clients.length > 0 || results!.rechnungen.length > 0 || results!.training.length > 0 ? 'border-t border-[#1c1c1c] mt-1 pt-1' : ''}>
                <p className="px-4 py-1.5 text-[10px] font-semibold text-[#3a3a3a] uppercase tracking-wider">Ernährungspläne</p>
                {results!.ernaehrung.map(e => (
                  <Link key={e.id} href={`/clients/${e.clientId}/ernaehrung/${e.id}/bearbeiten`} onClick={onClose}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#1c1c1c] transition-colors">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
                      className="text-[#444444] shrink-0">
                      <path d="M3 11l19-9-9 19-2-8-8-2z"/>
                    </svg>
                    <div className="min-w-0">
                      <p className="text-sm text-[#efefef] truncate">{e.name}</p>
                      <p className="text-xs text-[#444444] truncate">{e.client.vorname} {e.client.nachname}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {results && !hasResults && q.length >= 2 && (
          <div className="px-4 py-8 text-center">
            <p className="text-sm text-[#3a3a3a]">Keine Ergebnisse für „{q}"</p>
          </div>
        )}

        {!results && q.length < 2 && (
          <div className="px-4 py-6 flex items-center justify-center gap-3 text-[10px] text-[#2e2e2e] flex-wrap">
            <span>Klienten</span><span>·</span><span>Rechnungen</span><span>·</span><span>Trainingspläne</span><span>·</span><span>Ernährungspläne</span>
          </div>
        )}
      </div>
    </div>
  )
}
