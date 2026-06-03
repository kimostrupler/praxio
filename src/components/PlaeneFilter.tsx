'use client'

import { useState } from 'react'
import Link from 'next/link'

export type Plan = {
  id: string
  name: string
  typ: 'training' | 'ernaehrung'
  clientId: string
  clientVorname: string
  clientNachname: string
  meta: string
  href: string
}

type ClientGroup = {
  id: string
  vorname: string
  nachname: string
  training: Plan[]
  ernaehrung: Plan[]
}

function groupByClient(plans: Plan[]): ClientGroup[] {
  const map = new Map<string, ClientGroup>()
  for (const p of plans) {
    if (!map.has(p.clientId)) {
      map.set(p.clientId, {
        id: p.clientId, vorname: p.clientVorname, nachname: p.clientNachname,
        training: [], ernaehrung: [],
      })
    }
    const g = map.get(p.clientId)!
    if (p.typ === 'training') g.training.push(p)
    else g.ernaehrung.push(p)
  }
  return Array.from(map.values()).sort((a, b) => a.nachname.localeCompare(b.nachname))
}

export default function PlaeneFilter({ plans }: { plans: Plan[] }) {
  const [query, setQuery] = useState('')

  const groups = groupByClient(plans)
  const filtered = query.trim()
    ? groups.filter(g => `${g.vorname} ${g.nachname}`.toLowerCase().includes(query.toLowerCase()))
    : groups

  return (
    <div className="space-y-4">
      {/* Search + count */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#3a3a3a] pointer-events-none">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Klient suchen…"
            className="w-full pl-9 pr-3 py-2.5 bg-[#141414] border border-[#2e2e2e] rounded-lg text-sm text-[#efefef] placeholder:text-[#3a3a3a] focus:outline-none focus:border-[#555555] transition-colors"
          />
        </div>
        <span className="text-xs text-[#3a3a3a] shrink-0 tabular-nums">
          {filtered.length} Klient{filtered.length !== 1 ? 'en' : ''}
        </span>
      </div>

      {/* Empty state */}
      {filtered.length === 0 ? (
        <div className="bg-[#141414] border border-[#2e2e2e] rounded-xl py-14 text-center">
          <p className="text-sm text-[#3a3a3a]">
            {query ? 'Kein Klient gefunden.' : 'Noch keine Pläne zugewiesen.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(g => (
            <div key={g.id} className="bg-[#141414] border border-[#2e2e2e] rounded-xl overflow-hidden">

              {/* Client header */}
              <Link href={`/clients/${g.id}`}
                className="flex items-center gap-3 px-5 py-3.5 border-b border-[#1c1c1c] hover:bg-[#1c1c1c] transition-colors group">
                <div className="w-8 h-8 rounded-full bg-[#1c1c1c] border border-[#2e2e2e] flex items-center justify-center text-xs font-semibold text-[#666666] shrink-0 group-hover:border-[#3a3a3a] transition-colors">
                  {g.vorname[0]}{g.nachname[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#efefef]">{g.vorname} {g.nachname}</p>
                  <p className="text-xs text-[#444444] mt-0.5">
                    {[
                      g.training.length > 0 && `${g.training.length} Trainingsplan${g.training.length !== 1 ? 'e' : ''}`,
                      g.ernaehrung.length > 0 && `${g.ernaehrung.length} Ernährungsplan${g.ernaehrung.length !== 1 ? 'e' : ''}`,
                    ].filter(Boolean).join(' · ')}
                  </p>
                </div>
                <span className="text-[10px] text-[#3a3a3a] hidden sm:block shrink-0">Profil →</span>
              </Link>

              {/* Plan chips */}
              <div className="px-5 py-4 space-y-3">
                {g.training.length > 0 && (
                  <div className="flex items-start gap-4">
                    <div className="flex items-center gap-1.5 w-20 shrink-0 pt-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                      <span className="text-[10px] font-semibold text-blue-400 uppercase tracking-wider">Training</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {g.training.map(p => (
                        <Link key={p.id} href={p.href}
                          className="inline-flex items-center gap-2 bg-[#0a0a0a] border border-[#2e2e2e] hover:border-blue-400/40 hover:bg-blue-400/5 px-3 py-1.5 rounded-lg transition-colors group/chip">
                          <span className="text-sm text-[#efefef] leading-none">{p.name}</span>
                          <span className="text-[10px] text-[#444444] leading-none">{p.meta}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {g.ernaehrung.length > 0 && (
                  <div className="flex items-start gap-4">
                    <div className="flex items-center gap-1.5 w-20 shrink-0 pt-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                      <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">Ernährung</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {g.ernaehrung.map(p => (
                        <Link key={p.id} href={p.href}
                          className="inline-flex items-center gap-2 bg-[#0a0a0a] border border-[#2e2e2e] hover:border-emerald-400/40 hover:bg-emerald-400/5 px-3 py-1.5 rounded-lg transition-colors group/chip">
                          <span className="text-sm text-[#efefef] leading-none">{p.name}</span>
                          <span className="text-[10px] text-[#444444] leading-none">{p.meta}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  )
}
