'use client'

import { useState, useRef, useEffect, useTransition } from 'react'
import Link from 'next/link'
import { deleteTrainingsPlan } from '@/app/actions/training'
import EmptyState from '@/components/EmptyState'

type PlanUebung = {
  id: string
  reihenfolge: number
  saetze: number | null
  wiederholungen: number | null
  gewicht: number | null
  dauer: number | null
  pause: number | null
  notizen: string | null
  uebung: { name: string; kategorie: string; beschreibung: string | null }
}

type Props = {
  plan: {
    id: string
    name: string
    datum: Date
    notizen: string | null
    uebungen: PlanUebung[]
  }
  clientId:     string
  clientEmail:  string | null
  clientVorname: string
}

function fmt(val: number | null, unit: string) {
  return val != null ? `${val}${unit}` : null
}

function PlanMenu({ plan, clientId, clientEmail, clientVorname }: Props) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
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
  }, [])

  function handleEmail(e: React.MouseEvent) {
    e.stopPropagation()
    window.open(`/api/pdf/plan/${plan.id}`)
    const body =
      `Hallo ${clientVorname},\n\n` +
      `im Anhang findest du deinen aktuellen Trainingsplan „${plan.name}".\n\n` +
      `Bei Fragen stehe ich dir gerne zur Verfügung.\n\n` +
      `Liebe Grüsse\nFitAllCoach`
    window.location.href = `mailto:${clientEmail}?subject=${encodeURIComponent(`Trainingsplan „${plan.name}"`)}&body=${encodeURIComponent(body)}`
    setOpen(false)
  }

  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation()
    if (!confirm(`Plan „${plan.name}" wirklich löschen?`)) return
    setOpen(false)
    startTransition(async () => { await deleteTrainingsPlan(plan.id, clientId) })
  }

  const item = 'w-full text-left px-3 py-2 text-sm transition-colors hover:bg-[#1c1c1c]'

  return (
    <div className="relative" ref={ref} onClick={e => e.stopPropagation()}>
      <button type="button"
        onClick={() => setOpen(v => !v)}
        className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${
          pending ? 'text-[#3a3a3a] cursor-wait' : 'text-[#555555] hover:text-[#efefef] hover:bg-[#1c1c1c]'
        }`}>
        {pending ? (
          <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <circle cx="3" cy="8" r="1.5"/><circle cx="8" cy="8" r="1.5"/><circle cx="13" cy="8" r="1.5"/>
          </svg>
        )}
      </button>

      {open && !pending && (
        <div className="absolute right-0 top-full mt-1 z-50 bg-[#141414] border border-[#2e2e2e] rounded-xl shadow-2xl min-w-[180px] py-1 overflow-hidden">
          <a href={`/api/pdf/plan/${plan.id}`} download onClick={e => { e.stopPropagation(); setOpen(false) }}
            className={`${item} text-[#666666] hover:text-[#efefef] flex`}>
            PDF herunterladen
          </a>
          {clientEmail && (
            <button type="button" onClick={handleEmail} className={`${item} text-[#666666] hover:text-[#efefef]`}>
              Per E-Mail senden
            </button>
          )}
          <div className="border-t border-[#2e2e2e] my-1" />
          <Link href={`/clients/${clientId}/training/${plan.id}/bearbeiten`}
            onClick={e => { e.stopPropagation(); setOpen(false) }}
            className={`${item} text-[#666666] hover:text-[#efefef] block`}>
            Bearbeiten
          </Link>
          <div className="border-t border-[#2e2e2e] my-1" />
          <button type="button" onClick={handleDelete}
            className={`${item} text-[#3a3a3a] hover:text-red-500 hover:bg-[#1c0000]`}>
            Löschen
          </button>
        </div>
      )}
    </div>
  )
}

export default function TrainingsPlanKarte({ plan, clientId, clientEmail, clientVorname }: Props) {
  const [open, setOpen] = useState(false)
  const sorted = [...plan.uebungen].sort((a, b) => a.reihenfolge - b.reihenfolge)

  return (
    <div className="bg-[#141414] border border-[#2e2e2e] rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-4 cursor-pointer hover:bg-[#1c1c1c] transition-colors select-none"
        onClick={() => setOpen(o => !o)}>
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[#efefef] truncate">{plan.name}</p>
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-[#444444] mt-0.5">
              <span>{new Date(plan.datum).toLocaleDateString('de-DE')}</span>
              <span>{plan.uebungen.length} Übung{plan.uebungen.length !== 1 ? 'en' : ''}</span>
              {plan.notizen && <span className="truncate max-w-[200px]">{plan.notizen}</span>}
            </div>
            {!open && sorted.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {sorted.slice(0, 4).map(u => (
                  <span key={u.id} className="text-[10px] bg-[#1c1c1c] text-[#666666] border border-[#2e2e2e] px-1.5 py-0.5 rounded-md">
                    {u.uebung.name}
                  </span>
                ))}
                {sorted.length > 4 && (
                  <span className="text-[10px] text-[#3a3a3a]">+{sorted.length - 4}</span>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <PlanMenu plan={plan} clientId={clientId} clientEmail={clientEmail} clientVorname={clientVorname} />
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              className={`text-[#3a3a3a] transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </div>
        </div>
      </div>

      {/* Detail */}
      {open && (
        <div className="border-t border-[#1c1c1c] px-4 py-4">
          {sorted.length === 0 ? (
            <EmptyState inline
              icon={<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"><path d="M6.5 6.5h11"/><path d="M6.5 17.5h11"/><path d="M4 12h16"/><circle cx="7" cy="6.5" r="1.5" fill="currentColor" stroke="none"/><circle cx="17" cy="6.5" r="1.5" fill="currentColor" stroke="none"/><circle cx="7" cy="17.5" r="1.5" fill="currentColor" stroke="none"/><circle cx="17" cy="17.5" r="1.5" fill="currentColor" stroke="none"/></svg>}
              title="Keine Übungen hinzugefügt."
              description="Bearbeite den Plan, um Übungen hinzuzufügen."
            />
          ) : (
          <div className="space-y-0">
            {sorted.map((u, idx) => {
              const specs = [
                u.saetze && u.wiederholungen ? `${u.saetze} × ${u.wiederholungen}` : null,
                fmt(u.gewicht, ' kg'),
                u.dauer ? `${u.dauer}s` : null,
                u.pause ? `${u.pause}s Pause` : null,
              ].filter(Boolean)

              return (
                <div key={u.id} className="flex items-start gap-3 py-3 border-b border-[#1c1c1c] last:border-0">
                  <span className="text-xs text-[#3a3a3a] w-5 shrink-0 pt-0.5">{idx + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#efefef]">{u.uebung.name}</p>
                    <p className="text-[10px] text-[#444444] mt-0.5">{u.uebung.kategorie}</p>
                    {u.uebung.beschreibung && (
                      <p className="text-[10px] text-[#3a3a3a] mt-1 leading-relaxed">{u.uebung.beschreibung}</p>
                    )}
                    {u.notizen && (
                      <p className="text-[10px] text-[#555555] mt-1 italic">{u.notizen}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-medium text-[#efefef]">
                      {specs.length > 0 ? specs[0] : '—'}
                    </p>
                    {specs.slice(1).map((s, i) => (
                      <p key={i} className="text-[10px] text-[#444444] mt-0.5">{s}</p>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
          )}
        </div>
      )}
    </div>
  )
}
