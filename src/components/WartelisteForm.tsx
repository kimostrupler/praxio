'use client'

import { useState, useTransition, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { createWartelistenEintrag } from '@/app/actions/warteliste'

const ic = 'w-full px-3 py-2.5 bg-[#0a0a0a] border border-[#2e2e2e] rounded-lg text-sm text-[#efefef] placeholder:text-[#3a3a3a] focus:outline-none focus:border-[#555555] transition-colors'

const EMPTY = { vorname: '', nachname: '', email: '', telefon: '', prioritaet: 'MITTEL', notizen: '' }

export default function WartelisteForm() {
  const [open, setOpen]       = useState(false)
  const [form, setForm]       = useState(EMPTY)
  const [error, setError]     = useState<string | null>(null)
  const [pending, start]      = useTransition()

  const set = (k: keyof typeof EMPTY, v: string) => setForm(p => ({ ...p, [k]: v }))

  function close() { setOpen(false); setForm(EMPTY); setError(null) }

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') close() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.vorname.trim() || !form.nachname.trim()) {
      setError('Vorname und Nachname sind erforderlich.')
      return
    }
    setError(null)
    start(async () => {
      const r = await createWartelistenEintrag(form)
      if (r?.error) { setError(r.error); return }
      close()
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="bg-white hover:bg-[#e8e8e8] text-black text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
        + Hinzufügen
      </button>

      {open && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.82)' }}
          onClick={close}>
          <div
            className="bg-[#141414] border border-[#2e2e2e] rounded-2xl w-full max-w-md shadow-2xl"
            onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#2e2e2e]">
              <h2 className="text-base font-semibold text-[#efefef]">Warteliste — Neuer Eintrag</h2>
              <button type="button" onClick={close}
                className="text-[#444444] hover:text-[#efefef] transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-[#666666] mb-1.5">Vorname *</label>
                  <input autoFocus value={form.vorname} onChange={e => set('vorname', e.target.value)}
                    placeholder="Anna" className={ic} />
                </div>
                <div>
                  <label className="block text-xs text-[#666666] mb-1.5">Nachname *</label>
                  <input value={form.nachname} onChange={e => set('nachname', e.target.value)}
                    placeholder="Müller" className={ic} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-[#666666] mb-1.5">E-Mail</label>
                  <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                    placeholder="anna@beispiel.ch" className={ic} />
                </div>
                <div>
                  <label className="block text-xs text-[#666666] mb-1.5">Telefon</label>
                  <input value={form.telefon} onChange={e => set('telefon', e.target.value)}
                    placeholder="+41 79 000 00 00" className={ic} />
                </div>
              </div>

              <div>
                <label className="block text-xs text-[#666666] mb-1.5">Priorität</label>
                <div className="flex gap-2">
                  {[{ v: 'HOCH', l: 'Hoch', cls: 'border-orange-900/40 text-orange-400 bg-orange-950/20' },
                    { v: 'MITTEL', l: 'Mittel', cls: 'border-[#3a3a3a] text-[#efefef] bg-[#1c1c1c]' },
                    { v: 'NIEDRIG', l: 'Niedrig', cls: 'border-[#2e2e2e] text-[#666666]' }].map(o => (
                    <button key={o.v} type="button"
                      onClick={() => set('prioritaet', o.v)}
                      className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-colors ${
                        form.prioritaet === o.v ? o.cls : 'border-[#2e2e2e] text-[#444444] hover:border-[#3a3a3a] hover:text-[#efefef]'
                      }`}>
                      {o.l}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs text-[#666666] mb-1.5">Notizen</label>
                <textarea value={form.notizen} onChange={e => set('notizen', e.target.value)}
                  placeholder="Weitere Infos, Herkunft…" rows={2}
                  className={`${ic} resize-none`} />
              </div>

              {error && (
                <p className="text-xs text-red-400 bg-red-950/20 border border-red-900/30 px-3 py-2 rounded-lg">{error}</p>
              )}

              <div className="flex gap-2 pt-1">
                <button type="submit" disabled={pending}
                  className="flex-1 bg-white hover:bg-[#e8e8e8] disabled:opacity-40 text-black text-sm font-semibold py-2.5 rounded-lg transition-colors">
                  {pending ? 'Speichern…' : 'Hinzufügen'}
                </button>
                <button type="button" onClick={close}
                  className="px-4 py-2.5 text-sm text-[#666666] border border-[#2e2e2e] hover:bg-[#1c1c1c] rounded-lg transition-colors">
                  Abbrechen
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
