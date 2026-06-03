'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { assignVorlageToClient, deleteErnaehrungsVorlage } from '@/app/actions/ernaehrung'
import ClientSearchSelect from '@/components/ClientSearchSelect'

type ErnaehrungsZeile = {
  id: string
  zeitpunkt: string
  kalorien: number | null
  protein: number | null
  kohlenhydrate: number | null
  fett: number | null
  notizen: string | null
  reihenfolge: number
}

type AssignedClient = {
  id: string
  client: { vorname: string; nachname: string }
}

type Props = {
  vorlage: {
    id: string
    name: string
    beschreibung: string | null
    createdAt: Date
    zeilen: ErnaehrungsZeile[]
    plaene: AssignedClient[]
  }
  clients: { id: string; vorname: string; nachname: string }[]
}

export default function ErnaehrungsVorlageKarte({ vorlage, clients }: Props) {
  const [open, setOpen] = useState(false)
  const [assigning, setAssigning] = useState(false)
  const [selectedClient, setSelectedClient] = useState('')
  const [assignError, setAssignError] = useState<string | null>(null)
  const [assignSuccess, setAssignSuccess] = useState(false)
  const [isPendingDelete, startDelete] = useTransition()
  const [isPendingAssign, startAssign] = useTransition()

  const sorted = [...vorlage.zeilen].sort((a, b) => a.reihenfolge - b.reihenfolge)

  const totalKcal = sorted.reduce((s, z) => s + (z.kalorien ?? 0), 0)
  const totalProt = sorted.reduce((s, z) => s + (z.protein ?? 0), 0)
  const totalKH   = sorted.reduce((s, z) => s + (z.kohlenhydrate ?? 0), 0)
  const totalFett = sorted.reduce((s, z) => s + (z.fett ?? 0), 0)

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm(`Vorlage "${vorlage.name}" wirklich löschen?`)) return
    startDelete(async () => { await deleteErnaehrungsVorlage(vorlage.id) })
  }

  const handleAssign = () => {
    if (!selectedClient) return
    setAssignError(null)
    startAssign(async () => {
      const result = await assignVorlageToClient(vorlage.id, selectedClient)
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

  return (
    <div className="bg-[#141414] border border-[#2e2e2e] rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 cursor-pointer hover:bg-[#1c1c1c] transition-colors select-none"
        onClick={() => setOpen(o => !o)}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[#efefef] mb-1">{vorlage.name}</p>
            {vorlage.beschreibung && (
              <p className="text-xs text-[#444444] mb-2 truncate">{vorlage.beschreibung}</p>
            )}
            <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-[#444444]">
              <span>{sorted.length} {sorted.length === 1 ? 'Mahlzeit' : 'Mahlzeiten'}</span>
              {totalKcal > 0 && <span>{totalKcal} kcal/Tag</span>}
              {vorlage.plaene.length > 0 && (
                <span>{vorlage.plaene.length} Klient{vorlage.plaene.length !== 1 ? 'en' : ''}</span>
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
              href={`/ernaehrung/vorlagen/${vorlage.id}/bearbeiten`}
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

        {/* Assign section */}
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

        {/* Assigned clients pills (collapsed view) */}
        {vorlage.plaene.length > 0 && !open && (
          <div className="mt-2 flex flex-wrap gap-1" onClick={e => e.stopPropagation()}>
            {vorlage.plaene.slice(0, 4).map(p => (
              <span key={p.id} className="text-[10px] bg-[#1c1c1c] text-[#555555] border border-[#2e2e2e] px-1.5 py-0.5 rounded-md">
                {p.client.vorname} {p.client.nachname}
              </span>
            ))}
            {vorlage.plaene.length > 4 && (
              <span className="text-[10px] text-[#3a3a3a]">+{vorlage.plaene.length - 4} weitere</span>
            )}
          </div>
        )}
      </div>

      {/* Expanded detail */}
      {open && (
        <div className="border-t border-[#1c1c1c] px-5 py-4">
          {sorted.length > 0 ? (
            <div className="overflow-x-auto mb-4">
              <table className="w-full text-xs min-w-[400px]">
                <thead>
                  <tr className="border-b border-[#1c1c1c]">
                    {['Zeitpunkt', 'Kcal', 'Protein g', 'KH g', 'Fett g'].map(h => (
                      <th key={h} className="pb-2 text-[10px] font-medium text-[#3a3a3a] uppercase tracking-wider text-left pr-4">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1c1c1c]">
                  {sorted.map(z => (
                    <tr key={z.id}>
                      <td className="py-1.5 text-[#efefef] pr-4">{z.zeitpunkt}</td>
                      <td className="py-1.5 text-[#666666] pr-4">{z.kalorien ?? '—'}</td>
                      <td className="py-1.5 text-[#666666] pr-4">{z.protein != null ? `${z.protein}` : '—'}</td>
                      <td className="py-1.5 text-[#666666] pr-4">{z.kohlenhydrate != null ? `${z.kohlenhydrate}` : '—'}</td>
                      <td className="py-1.5 text-[#666666]">{z.fett != null ? `${z.fett}` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
                {sorted.length > 1 && (
                  <tfoot>
                    <tr className="border-t border-[#2e2e2e]">
                      <td className="pt-2 text-[10px] font-medium text-[#3a3a3a] uppercase tracking-wider pr-4">Gesamt</td>
                      <td className="pt-2 text-[#efefef] font-semibold pr-4">{totalKcal > 0 ? totalKcal : '—'}</td>
                      <td className="pt-2 text-[#efefef] font-semibold pr-4">{totalProt > 0 ? totalProt : '—'}</td>
                      <td className="pt-2 text-[#efefef] font-semibold pr-4">{totalKH > 0 ? totalKH : '—'}</td>
                      <td className="pt-2 text-[#efefef] font-semibold">{totalFett > 0 ? totalFett : '—'}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          ) : (
            <p className="text-xs text-[#3a3a3a] mb-4">Keine Mahlzeiten definiert.</p>
          )}

          {/* Assigned clients in expanded view */}
          {vorlage.plaene.length > 0 && (
            <div className="mt-4 pt-4 border-t border-[#1c1c1c]">
              <p className="text-[10px] text-[#444444] uppercase tracking-wider mb-2">Zugewiesen an</p>
              <div className="flex flex-wrap gap-1">
                {vorlage.plaene.map(p => (
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
