'use client'

import { useState, useRef, useEffect, useTransition } from 'react'
import { deleteWartelistenEintrag } from '@/app/actions/warteliste'
import WartelisteTransferModal from '@/components/WartelisteTransferModal'

type Props = {
  id: string
  entry: { vorname: string; nachname: string; email: string | null; telefon: string | null }
}

export default function WartelisteAktionen({ id, entry }: Props) {
  const [open, setOpen]             = useState(false)
  const [showModal, setShowModal]   = useState(false)
  const [delPending, startDelete]   = useTransition()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onMouse(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onMouse)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onMouse)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  function handleDelete() {
    setOpen(false)
    if (!confirm('Eintrag wirklich löschen?')) return
    startDelete(async () => { await deleteWartelistenEintrag(id) })
  }

  return (
    <>
      <div className="relative shrink-0" ref={ref}>
        <button
          type="button"
          aria-label="Aktionen" aria-haspopup="menu" aria-expanded={open}
          onClick={() => setOpen(v => !v)}
          disabled={delPending}
          className="w-8 h-8 flex items-center justify-center text-[#555555] hover:text-[#efefef] hover:bg-[#1c1c1c] rounded-lg transition-colors disabled:opacity-40">
          {delPending ? (
            <svg className="animate-spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
            </svg>
          ) : (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>
            </svg>
          )}
        </button>

        {open && !delPending && (
          <div role="menu" className="absolute right-0 top-full mt-1 z-50 bg-[#141414] border border-[#2e2e2e] rounded-xl shadow-2xl min-w-[190px] py-1 overflow-hidden">
            <button type="button"
              onClick={() => { setOpen(false); setShowModal(true) }}
              className="w-full text-left px-3 py-2.5 text-sm text-emerald-400 hover:bg-[#1c1c1c] transition-colors">
              Als Klient übernehmen
            </button>
            <div className="border-t border-[#2e2e2e] my-1" />
            <button type="button" onClick={handleDelete}
              className="w-full text-left px-3 py-2.5 text-sm text-[#3a3a3a] hover:text-red-500 hover:bg-[#1c0000] transition-colors">
              Löschen
            </button>
          </div>
        )}
      </div>

      {showModal && (
        <WartelisteTransferModal id={id} initial={entry} onClose={() => setShowModal(false)} />
      )}
    </>
  )
}
