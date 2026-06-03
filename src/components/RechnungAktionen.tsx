'use client'

import { useState, useRef, useEffect, useTransition } from 'react'
import Link from 'next/link'
import { updateRechnungStatus, deleteRechnung } from '@/app/actions/rechnungen'
import type { RechnungStatus } from '@prisma/client'

type Props = {
  rechnungId:    string
  rechnungNr:    string
  clientEmail:   string | null
  clientVorname: string
  anrede?:       string | null
  status:        RechnungStatus
}

export default function RechnungAktionen({ rechnungId, rechnungNr, clientEmail, clientVorname, anrede, status }: Props) {
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

  function handleEmail() {
    window.open(`/api/pdf/rechnung/${rechnungId}`)
    const greeting = anrede?.trim() || `Hallo ${clientVorname},`
    const body =
      `${greeting}\n\n` +
      `im Anhang findest du die Rechnung ${rechnungNr}.\n\n` +
      `Bei Fragen stehe ich dir gerne zur Verfügung.\n\n` +
      `Liebe Grüsse\nFitAllCoach`
    const subject = encodeURIComponent(`Rechnung ${rechnungNr} – FitAllCoach`)
    window.location.href = `mailto:${clientEmail}?subject=${subject}&body=${encodeURIComponent(body)}`
    setOpen(false)
  }

  function handleStatusChange(next: RechnungStatus) {
    setOpen(false)
    startTransition(async () => { await updateRechnungStatus(rechnungId, next) })
  }

  function handleDelete() {
    if (!confirm(`Rechnung ${rechnungNr} wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`)) return
    setOpen(false)
    startTransition(async () => { await deleteRechnung(rechnungId) })
  }

  const item = 'w-full text-left px-3 py-2 text-sm transition-colors hover:bg-[#1c1c1c]'

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-label="Aktionen" aria-haspopup="menu" aria-expanded={open}
        onClick={() => setOpen(v => !v)}
        className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${
          pending
            ? 'text-[#3a3a3a] cursor-wait'
            : 'text-[#555555] hover:text-[#efefef] hover:bg-[#1c1c1c]'
        }`}
      >
        {pending ? (
          <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <circle cx="3" cy="8" r="1.5"/>
            <circle cx="8" cy="8" r="1.5"/>
            <circle cx="13" cy="8" r="1.5"/>
          </svg>
        )}
      </button>

      {open && !pending && (
        <div role="menu" className="absolute right-0 top-full mt-1 z-50 bg-[#141414] border border-[#2e2e2e] rounded-xl shadow-2xl min-w-[188px] py-1 overflow-hidden max-w-[calc(100vw-2rem)]">

          <a href={`/api/pdf/rechnung/${rechnungId}`} download onClick={() => setOpen(false)}
            className={`${item} text-[#666666] hover:text-[#efefef] flex`}>
            PDF herunterladen
          </a>

          {clientEmail && (
            <button type="button" onClick={handleEmail} className={`${item} text-[#666666] hover:text-[#efefef]`}>
              E-Mail senden
            </button>
          )}

          <div className="border-t border-[#2e2e2e] my-1" />

          <Link href={`/rechnungen/${rechnungId}/bearbeiten`} onClick={() => setOpen(false)}
            className={`${item} text-[#666666] hover:text-[#efefef] block`}>
            Bearbeiten
          </Link>

          {status === 'OFFEN' && (
            <button type="button" onClick={() => handleStatusChange('BEZAHLT')}
              className={`${item} text-emerald-400`}>
              Als bezahlt markieren
            </button>
          )}

          {(status === 'BEZAHLT' || status === 'STORNIERT') && (
            <button type="button" onClick={() => handleStatusChange('OFFEN')}
              className={`${item} text-[#666666] hover:text-[#efefef]`}>
              {status === 'BEZAHLT' ? 'Zurücksetzen' : 'Reaktivieren'}
            </button>
          )}

          {status === 'OFFEN' && (
            <button type="button" onClick={() => handleStatusChange('STORNIERT')}
              className={`${item} text-[#666666] hover:text-[#efefef]`}>
              Stornieren
            </button>
          )}

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
