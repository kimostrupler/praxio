'use client'

import { useState, useTransition } from 'react'
import { createZiel, toggleZiel, deleteZiel } from '@/app/actions/clients'
import EmptyState from '@/components/EmptyState'
import ZieleChart from '@/components/ZieleChart'

type Ziel = {
  id: string
  titel: string
  beschreibung: string | null
  zielwert: number | null
  einheit: string | null
  zieldatum: Date | string | null
  erreicht: boolean
  erreichtAm: Date | string | null
}

const PRESETS = [
  { label: 'Abnehmen',          unit: 'kg'  },
  { label: 'Zunehmen',          unit: 'kg'  },
  { label: 'Muskelaufbau',      unit: null  },
  { label: 'Körperfett senken', unit: '%'   },
  { label: 'Ausdauer',          unit: null  },
  { label: 'Stress reduzieren', unit: null  },
  { label: 'Schlaf verbessern', unit: 'h'   },
  { label: 'Eigenes',           unit: null  },
] as const

const ic = 'px-3 py-2 bg-[#0a0a0a] border border-[#2e2e2e] rounded-lg text-sm text-[#efefef] placeholder:text-[#3a3a3a] focus:outline-none focus:border-[#555555] transition-colors'

export default function ZieleBlock({ clientId, ziele }: { clientId: string; ziele: Ziel[] }) {
  const [open, setOpen]       = useState(false)
  const [selected, setSelected] = useState<string | null>(null)
  const [titel, setTitel]     = useState('')
  const [zielwert, setZielwert] = useState('')
  const [einheit, setEinheit] = useState('')
  const [zieldatum, setZieldatum] = useState('')
  const [, start]             = useTransition()

  function pickPreset(p: typeof PRESETS[number]) {
    setSelected(p.label)
    setTitel(p.label === 'Eigenes' ? '' : p.label)
    setEinheit(p.unit ?? '')
    setOpen(true)
  }

  function reset() {
    setOpen(false); setSelected(null)
    setTitel(''); setZielwert(''); setEinheit(''); setZieldatum('')
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!titel.trim()) return
    const w = parseFloat(zielwert)
    start(async () => {
      await createZiel(clientId, titel.trim(), '', zieldatum, isNaN(w) ? undefined : w, einheit || undefined)
      reset()
    })
  }

  const D = (d: Date | string) => new Date(d).toLocaleDateString('de-DE')
  const aktiv    = ziele.filter(z => !z.erreicht)
  const erreicht = ziele.filter(z => z.erreicht)

  return (
    <div className="space-y-3">

      <ZieleChart ziele={ziele} />

      {/* Existing goals */}
      {ziele.length > 0 && (
        <div className="space-y-1.5">
          {aktiv.map(z => <ZielRow key={z.id} z={z} clientId={clientId} D={D} />)}
          {erreicht.length > 0 && aktiv.length > 0 && (
            <div className="border-t border-[#1c1c1c] my-1" />
          )}
          {erreicht.map(z => <ZielRow key={z.id} z={z} clientId={clientId} D={D} />)}
        </div>
      )}

      {/* Preset chips */}
      {!open && (
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map(p => (
            <button
              key={p.label}
              type="button"
              onClick={() => pickPreset(p)}
              className="px-3 py-1.5 text-xs text-[#555555] border border-[#2e2e2e] hover:border-[#555555] hover:text-[#efefef] rounded-lg transition-colors">
              {p.label === 'Eigenes' ? '+ Eigenes' : `+ ${p.label}`}
            </button>
          ))}
        </div>
      )}

      {/* Form */}
      {open && (
        <form onSubmit={submit} className="p-3 bg-[#0a0a0a] rounded-xl border border-[#1c1c1c] space-y-2">
          <input
            className={`${ic} w-full`}
            placeholder="Titel"
            value={titel}
            onChange={e => setTitel(e.target.value)}
            required
            autoFocus={selected === 'Eigenes'}
          />
          {einheit && (
            <div className="flex gap-2">
              <input
                className={`${ic} flex-1`}
                type="number"
                step="0.1"
                placeholder={`Zielwert (${einheit})`}
                value={zielwert}
                onChange={e => setZielwert(e.target.value)}
              />
              <span className="flex items-center px-3 text-sm text-[#555555] border border-[#2e2e2e] rounded-lg bg-[#0a0a0a]">{einheit}</span>
            </div>
          )}
          <input type="date" className={`${ic} w-full`} value={zieldatum} onChange={e => setZieldatum(e.target.value)} />
          <div className="flex gap-2 pt-1">
            <button type="submit" className="bg-white hover:bg-[#e8e8e8] text-black text-xs font-semibold px-4 py-2 rounded-lg transition-colors">
              Speichern
            </button>
            <button type="button" onClick={reset} className="text-xs text-[#555555] hover:text-white px-3 py-2 transition-colors">
              Abbrechen
            </button>
          </div>
        </form>
      )}

      {ziele.length === 0 && !open && (
        <EmptyState inline
          icon={<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>}
          title="Noch keine Ziele."
          description="Wähle ein Ziel oben aus."
        />
      )}
    </div>
  )
}

function ZielRow({ z, clientId, D }: { z: Ziel; clientId: string; D: (d: Date | string) => string }) {
  const [, start] = useTransition()

  return (
    <div className={`flex items-start gap-3 group py-1.5 ${z.erreicht ? 'opacity-50' : ''}`}>
      <button
        type="button"
        onClick={() => start(async () => { await toggleZiel(z.id, clientId, !z.erreicht) })}
        className={`mt-0.5 w-4 h-4 rounded border shrink-0 flex items-center justify-center transition-colors ${
          z.erreicht ? 'bg-emerald-600 border-emerald-600' : 'border-[#3a3a3a] hover:border-[#666666]'
        }`}>
        {z.erreicht && (
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        )}
      </button>
      <div className="flex-1 min-w-0">
        <p className={`text-sm ${z.erreicht ? 'line-through text-[#3a3a3a]' : 'text-[#efefef]'}`}>
          {z.titel}
          {z.zielwert != null && z.einheit && (
            <span className="text-[#555555] font-normal ml-2">— {z.zielwert} {z.einheit}</span>
          )}
        </p>
        {z.zieldatum && !z.erreicht && (
          <p className="text-xs text-[#3a3a3a] mt-0.5">Bis {D(z.zieldatum)}</p>
        )}
        {z.erreichtAm && z.erreicht && (
          <p className="text-xs text-emerald-600 mt-0.5">Erreicht {D(z.erreichtAm)}</p>
        )}
      </div>
      <button
        type="button"
        onClick={() => start(async () => { await deleteZiel(z.id, clientId) })}
        className="opacity-0 group-hover:opacity-100 text-[#3a3a3a] hover:text-red-500 transition-all text-xs shrink-0">
        ✕
      </button>
    </div>
  )
}
