'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { deletePreset, assignPresetToClient } from '@/app/actions/training'
import ClientSearchSelect from '@/components/ClientSearchSelect'

type PresetUebung = {
  id: string
  reihenfolge: number
  saetze: number | null
  wiederholungen: number | null
  gewicht: number | null
  dauer: number | null
  pause: number | null
  uebung: { name: string; kategorie: string }
}

type Client = { id: string; vorname: string; nachname: string }

type Props = {
  preset: {
    id: string
    name: string
    beschreibung: string | null
    ziele: string[]
    createdAt: Date
    uebungen: PresetUebung[]
    trainingsplaene: { id: string; client: { vorname: string; nachname: string } }[]
  }
  clients: Client[]
}

export default function PresetKarte({ preset, clients }: Props) {
  const [open, setOpen] = useState(false)
  const [assigning, setAssigning] = useState(false)
  const [selectedClient, setSelectedClient] = useState('')
  const [assignError, setAssignError] = useState<string | null>(null)
  const [assignSuccess, setAssignSuccess] = useState(false)
  const [isPendingDelete, startDelete] = useTransition()
  const [isPendingAssign, startAssign] = useTransition()

  const sorted = [...preset.uebungen].sort((a, b) => a.reihenfolge - b.reihenfolge)

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm(`Vorlage "${preset.name}" wirklich löschen?`)) return
    startDelete(async () => { await deletePreset(preset.id) })
  }

  const handleAssign = () => {
    if (!selectedClient) return
    setAssignError(null)
    startAssign(async () => {
      const result = await assignPresetToClient(preset.id, selectedClient)
      if (result?.error) {
        setAssignError(result.error)
      } else {
        setAssignSuccess(true)
        setAssigning(false)
        setSelectedClient('')
        setTimeout(() => setAssignSuccess(false), 2500)
      }
    })
  }

  const ZIEL_COLORS: Record<string, string> = {
    'Abnehmen': 'text-blue-400 border-blue-400/30 bg-blue-400/10',
    'Muskelaufbau': 'text-orange-400 border-orange-400/30 bg-orange-400/10',
    'Körperfett reduzieren': 'text-purple-400 border-purple-400/30 bg-purple-400/10',
    'Gesünder leben': 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10',
    'Leistungssteigerung': 'text-red-400 border-red-400/30 bg-red-400/10',
    'Mehr Energie': 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10',
  }

  return (
    <div className="bg-[#141414] border border-[#2e2e2e] rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 cursor-pointer hover:bg-[#1c1c1c] transition-colors select-none"
        onClick={() => setOpen(o => !o)}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[#efefef] mb-1">{preset.name}</p>
            {preset.beschreibung && (
              <p className="text-xs text-[#444444] mb-2 truncate">{preset.beschreibung}</p>
            )}
            {/* Ziel tags */}
            {preset.ziele.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {preset.ziele.map(z => (
                  <span key={z} className={`text-[10px] border px-1.5 py-0.5 rounded-md ${ZIEL_COLORS[z] ?? 'text-[#666666] border-[#2e2e2e]'}`}>
                    {z}
                  </span>
                ))}
              </div>
            )}
            <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-[#444444]">
              <span>{sorted.length} Übung{sorted.length !== 1 ? 'en' : ''}</span>
              {preset.trainingsplaene.length > 0 && (
                <span>{preset.trainingsplaene.length} Klient{preset.trainingsplaene.length !== 1 ? 'en' : ''} zugewiesen</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={e => { e.stopPropagation(); setAssigning(a => !a); setAssignError(null) }}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                assignSuccess
                  ? 'text-emerald-400 border-emerald-400/30'
                  : 'text-[#666666] border-[#2e2e2e] hover:text-white hover:border-[#444444]'
              }`}>
              {assignSuccess ? '✓ Zugewiesen' : 'Zuweisen'}
            </button>
            <Link
              href={`/training/presets/${preset.id}/bearbeiten`}
              onClick={e => e.stopPropagation()}
              className="text-xs text-[#666666] hover:text-white transition-colors">
              Bearbeiten
            </Link>
            <button type="button" onClick={handleDelete} disabled={isPendingDelete}
              className="text-[#3a3a3a] hover:text-red-500 transition-colors text-xs">
              {isPendingDelete ? '…' : 'Löschen'}
            </button>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              className={`text-[#3a3a3a] transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </div>
        </div>

        {/* Assign dropdown */}
        {assigning && (
          <div className="mt-3 pt-3 border-t border-[#2e2e2e]" onClick={e => e.stopPropagation()}>
            <p className="text-xs text-[#666666] mb-2">Vorlage als Plan zuweisen an:</p>
            <div className="flex gap-2">
              <div className="flex-1">
                <ClientSearchSelect
                  clients={clients}
                  value={selectedClient}
                  onChange={setSelectedClient}
                  placeholder="Klient suchen…"
                />
              </div>
              <button
                type="button"
                onClick={handleAssign}
                disabled={!selectedClient || isPendingAssign}
                className="bg-white hover:bg-[#e8e8e8] disabled:opacity-40 text-black text-sm font-semibold px-4 py-2 rounded-lg transition-colors shrink-0">
                {isPendingAssign ? '…' : 'Zuweisen'}
              </button>
            </div>
            {assignError && <p className="text-xs text-red-400 mt-1.5">{assignError}</p>}
          </div>
        )}

        {/* Assigned clients */}
        {preset.trainingsplaene.length > 0 && !open && (
          <div className="mt-2 flex flex-wrap gap-1" onClick={e => e.stopPropagation()}>
            {preset.trainingsplaene.slice(0, 4).map(p => (
              <span key={p.id} className="text-[10px] bg-[#1c1c1c] text-[#555555] border border-[#2e2e2e] px-1.5 py-0.5 rounded-md">
                {p.client.vorname} {p.client.nachname}
              </span>
            ))}
            {preset.trainingsplaene.length > 4 && (
              <span className="text-[10px] text-[#3a3a3a]">+{preset.trainingsplaene.length - 4} weitere</span>
            )}
          </div>
        )}
      </div>

      {/* Exercise detail */}
      {open && (
        <div className="border-t border-[#1c1c1c] px-5 py-4">
          <div className="space-y-1">
            {sorted.map((u, idx) => {
              const specs = [
                u.saetze && u.wiederholungen ? `${u.saetze}×${u.wiederholungen}` : null,
                u.gewicht ? `${u.gewicht} kg` : null,
                u.dauer ? `${u.dauer}s` : null,
                u.pause ? `${u.pause}s Pause` : null,
              ].filter(Boolean)

              return (
                <div key={u.id} className="flex items-start gap-3 py-2.5 border-b border-[#1c1c1c] last:border-0">
                  <span className="text-xs text-[#3a3a3a] w-5 shrink-0 pt-0.5">{idx + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#efefef]">{u.uebung.name}</p>
                    <p className="text-xs text-[#444444] mt-0.5">{u.uebung.kategorie}</p>
                  </div>
                  <p className="text-sm font-medium text-[#efefef] text-right">
                    {specs.length > 0 ? specs.join(' · ') : '—'}
                  </p>
                </div>
              )
            })}
          </div>

          {/* Assigned clients in expanded view */}
          {preset.trainingsplaene.length > 0 && (
            <div className="mt-4 pt-4 border-t border-[#1c1c1c]">
              <p className="text-[10px] text-[#444444] uppercase tracking-wider mb-2">Zugewiesen an</p>
              <div className="flex flex-wrap gap-1">
                {preset.trainingsplaene.map(p => (
                  <span key={p.id} className="text-[11px] bg-[#1c1c1c] text-[#666666] border border-[#2e2e2e] px-2 py-0.5 rounded-md">
                    {p.client.vorname} {p.client.nachname}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
