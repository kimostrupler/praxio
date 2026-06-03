'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { avatarColor } from '@/lib/avatar'
import { updateClientStatus } from '@/app/actions/clients'
import type { ClientStatus } from '@prisma/client'

const STATUS_LABEL: Record<ClientStatus, string> = { AKTIV: 'Aktiv', PAUSIERT: 'Pausiert', INAKTIV: 'Inaktiv' }
const STATUS_STYLE: Record<ClientStatus, string> = {
  AKTIV:    'bg-emerald-950/40 text-emerald-400 border border-emerald-900/40',
  PAUSIERT: 'bg-orange-950/40 text-orange-400 border border-orange-900/40',
  INAKTIV:  'bg-[#1c1c1c] text-[#444444] border border-[#2e2e2e]',
}

function contactText(datum: Date | string | null | undefined): { text: string; cls: string } | null {
  if (!datum) return null
  const days = Math.floor((Date.now() - new Date(datum).getTime()) / 86400000)
  if (days === 0) return { text: 'Heute', cls: 'text-[#555555]' }
  if (days === 1) return { text: 'Gestern', cls: 'text-[#555555]' }
  if (days <= 7)  return { text: `vor ${days}T`, cls: 'text-[#555555]' }
  if (days <= 30) return { text: `vor ${days}T`, cls: 'text-[#444444]' }
  return { text: `vor ${days}T`, cls: 'text-orange-400' }
}

type Client = {
  id:       string
  vorname:  string
  nachname: string
  email:    string | null
  telefon:  string | null
  status:   ClientStatus
  tags:     string[]
  adresse:  string | null
  createdAt: Date
  anamnesen: { aktuellesGewicht: number | null }[]
  notizen:   { datum: Date }[]
}

export default function ClientListBulk({ clients }: { clients: Client[] }) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [statusDropOpen, setStatusDropOpen] = useState(false)
  const [pending, startTrans] = useTransition()

  const allSelected = clients.length > 0 && selectedIds.size === clients.length

  function toggleOne(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAll() {
    if (allSelected) setSelectedIds(new Set())
    else setSelectedIds(new Set(clients.map(c => c.id)))
  }

  function handleStatusChange(status: ClientStatus) {
    setStatusDropOpen(false)
    const label = STATUS_LABEL[status]
    if (!confirm(`Status von ${selectedIds.size} Klient(en) auf "${label}" setzen?`)) return
    const ids = Array.from(selectedIds)
    startTrans(async () => {
      for (const id of ids) {
        await updateClientStatus(id, status)
      }
      setSelectedIds(new Set())
      window.location.reload()
    })
  }

  function handleCsvExport() {
    const selected = clients.filter(c => selectedIds.has(c.id))
    const rows = [
      ['Vorname', 'Nachname', 'E-Mail', 'Telefon', 'Status', 'Erstellt'],
      ...selected.map(c => [
        c.vorname,
        c.nachname,
        c.email ?? '',
        c.telefon ?? '',
        STATUS_LABEL[c.status],
        new Date(c.createdAt).toLocaleDateString('de-DE'),
      ]),
    ]
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'klienten.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  if (clients.length === 0) {
    return (
      <div className="bg-[#141414] border border-[#2e2e2e] rounded-xl py-16 text-center space-y-3">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"
          className="text-[#2e2e2e] mx-auto">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
        <p className="text-sm font-medium text-[#3a3a3a]">Keine Klienten gefunden.</p>
      </div>
    )
  }

  return (
    <>
      {/* All-select checkbox shown above the grid */}
      <div className="flex items-center gap-2 mb-3">
        <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-[#666666]">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={toggleAll}
            className="w-4 h-4 accent-white cursor-pointer"
          />
          Alle auswählen
        </label>
      </div>

      <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5">
        {clients.map(client => {
          const lastWeight  = client.anamnesen[0]?.aktuellesGewicht
          const isSelected  = selectedIds.has(client.id)
          const anySelected = selectedIds.size > 0
          return (
            <li key={client.id} className="relative">
              {/* Checkbox overlay */}
              <div className={`absolute top-3 left-3 z-10 transition-opacity ${
                anySelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
              }`}>
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleOne(client.id)}
                  onClick={e => e.stopPropagation()}
                  className="w-4 h-4 accent-white cursor-pointer"
                />
              </div>
              <Link href={`/clients/${client.id}`}
                className={`flex items-center gap-4 bg-[#141414] border hover:bg-[#1c1c1c] rounded-xl p-4 transition-all group h-full ${
                  isSelected ? 'border-[#555555]' : 'border-[#1c1c1c] hover:border-[#2e2e2e]'
                } ${anySelected ? 'pl-10' : ''}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-sm font-semibold ${avatarColor(client.vorname + client.nachname)}`}>
                  {client.vorname[0]}{client.nachname[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[#efefef] truncate">
                    {client.vorname} {client.nachname}
                  </p>
                  <p className="text-xs text-[#444444] mt-0.5 truncate">
                    {client.email ?? client.telefon ?? '—'}
                    {lastWeight ? ` · ${lastWeight} kg` : ''}
                  </p>
                  {(() => {
                    const ct = contactText(client.notizen[0]?.datum)
                    return ct && <p className={`text-[9px] mt-0.5 ${ct.cls}`}>{ct.text}</p>
                  })()}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`hidden sm:inline-flex px-2 py-0.5 rounded-md text-[10px] font-medium ${STATUS_STYLE[client.status]}`}>
                    {STATUS_LABEL[client.status]}
                  </span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#2e2e2e] group-hover:text-[#444444] transition-colors">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </div>
              </Link>
            </li>
          )
        })}
      </ul>

      {/* Floating action bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-[#141414] border border-[#2e2e2e] rounded-2xl shadow-2xl px-4 py-3">
          <span className="text-sm font-medium text-[#efefef] whitespace-nowrap">
            {selectedIds.size} ausgewählt
          </span>

          {/* Status dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setStatusDropOpen(v => !v)}
              disabled={pending}
              className="flex items-center gap-1.5 text-xs px-3 py-2 bg-[#1c1c1c] border border-[#2e2e2e] hover:border-[#3a3a3a] text-[#efefef] rounded-xl transition-colors disabled:opacity-50"
            >
              Status
              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>
            {statusDropOpen && (
              <div className="absolute bottom-full mb-1.5 left-0 bg-[#141414] border border-[#2e2e2e] rounded-xl shadow-2xl overflow-hidden py-1 min-w-[120px]">
                {(['AKTIV', 'PAUSIERT', 'INAKTIV'] as ClientStatus[]).map(s => (
                  <button key={s} type="button" onClick={() => handleStatusChange(s)}
                    className="flex w-full px-3 py-2 text-sm text-[#efefef] hover:bg-[#1c1c1c] transition-colors">
                    {STATUS_LABEL[s]}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleCsvExport}
            className="text-xs px-3 py-2 bg-[#1c1c1c] border border-[#2e2e2e] hover:border-[#3a3a3a] text-[#efefef] rounded-xl transition-colors"
          >
            CSV Export
          </button>

          <button
            type="button"
            onClick={() => setSelectedIds(new Set())}
            className="text-xs px-3 py-2 text-[#666666] hover:text-[#efefef] transition-colors"
          >
            ✕
          </button>
        </div>
      )}
    </>
  )
}
