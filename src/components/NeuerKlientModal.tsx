'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import ClientForm from '@/components/ClientForm'

// Higher opacity (0.82) ensures the empty lower portion of the page appears
// consistently dark on both light and dark backgrounds — 0.60 was not enough
// to darken the light page background in the area below the fold.
const BACKDROP: React.CSSProperties = {
  background: 'rgba(0,0,0,0.82)',
}

export default function NeuerKlientModal() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="bg-white hover:bg-[#e8e8e8] text-black text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
        + Neuer Klient
      </button>

      {open && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={BACKDROP}
          onClick={() => setOpen(false)}>
          <div
            className="bg-[#141414] border border-[#2e2e2e] rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}>

            {/* Header — boxShadow:none prevents the global glass card shadow from
                casting a dark zone over the form body when the header goes sticky */}
            <div
              className="flex items-center justify-between px-6 py-4 border-b border-[#2e2e2e] sticky top-0 bg-[#141414] z-10"
              style={{ boxShadow: 'none' }}>
              <h2 className="text-base font-semibold text-[#efefef]">Neuer Klient</h2>
              <button type="button" onClick={() => setOpen(false)}
                className="text-[#444444] hover:text-[#efefef] transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <div className="px-6 py-5">
              <ClientForm />
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
