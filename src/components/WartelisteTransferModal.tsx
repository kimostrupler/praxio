'use client'

import { useState, useTransition, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { transferWartelisteToClient, type TransferData } from '@/app/actions/warteliste'

const ic = 'w-full px-3 py-2.5 bg-[#0a0a0a] border border-[#2e2e2e] rounded-lg text-sm text-[#efefef] placeholder:text-[#3a3a3a] focus:outline-none focus:border-[#555555] transition-colors'

type Props = {
  id: string
  initial: { vorname: string; nachname: string; email: string | null; telefon: string | null }
  onClose: () => void
}

const HERKUNFT = ['Instagram', 'Website', 'Empfehlung', 'Flyer', 'Sonstiges']

export default function WartelisteTransferModal({ id, initial, onClose }: Props) {
  const [form, setForm] = useState<TransferData>({
    vorname:      initial.vorname,
    nachname:     initial.nachname,
    email:        initial.email    ?? '',
    telefon:      initial.telefon  ?? '',
    adresse:      '',
    beruf:        '',
    geburtsdatum: '',
    geschlecht:   '',
    herkunft:     '',
  })
  const [error, setError]       = useState<string | null>(null)
  const [duplicate, setDuplicate] = useState<{ name: string; id: string } | null>(null)
  const [pending, start]        = useTransition()

  const set = (k: keyof TransferData, v: string) => setForm(p => ({ ...p, [k]: v }))

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  function handleSubmit(e: React.FormEvent, force = false) {
    e.preventDefault()
    setError(null)
    setDuplicate(null)
    start(async () => {
      const r = await transferWartelisteToClient(id, form, force)
      if (!r) return // redirect happened
      if (r.duplicate) {
        setDuplicate({ name: r.existingName!, id: r.existingId! })
      } else if (r.error) {
        setError(r.error)
      }
    })
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.82)' }}
      onClick={onClose}>
      <div
        className="bg-[#141414] border border-[#2e2e2e] rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}>

        {/* Header — boxShadow:none prevents the global glass card shadow from
            casting a dark zone over the form body when the header goes sticky */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2e2e2e] sticky top-0 bg-[#141414] z-10"
          style={{ boxShadow: 'none' }}>
          <div>
            <h2 className="text-base font-semibold text-[#efefef]">Als Klient übernehmen</h2>
            <p className="text-xs text-[#444444] mt-0.5">Daten prüfen und ergänzen</p>
          </div>
          <button type="button" onClick={onClose}
            className="text-[#444444] hover:text-[#efefef] transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Name */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[#666666] mb-1.5">Vorname *</label>
              <input autoFocus value={form.vorname} onChange={e => set('vorname', e.target.value)} className={ic} placeholder="Vorname" />
            </div>
            <div>
              <label className="block text-xs text-[#666666] mb-1.5">Nachname *</label>
              <input value={form.nachname} onChange={e => set('nachname', e.target.value)} className={ic} placeholder="Nachname" />
            </div>
          </div>

          {/* Contact */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[#666666] mb-1.5">E-Mail</label>
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)} className={ic} placeholder="anna@beispiel.ch" />
            </div>
            <div>
              <label className="block text-xs text-[#666666] mb-1.5">Telefon</label>
              <input value={form.telefon} onChange={e => set('telefon', e.target.value)} className={ic} placeholder="+41 79 000 00 00" />
            </div>
          </div>

          {/* Address + job */}
          <div>
            <label className="block text-xs text-[#666666] mb-1.5">Adresse</label>
            <input value={form.adresse} onChange={e => set('adresse', e.target.value)} className={ic} placeholder="Musterstrasse 1, 8000 Zürich" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-[#666666] mb-1.5">Beruf</label>
              <input value={form.beruf} onChange={e => set('beruf', e.target.value)} className={ic} placeholder="Lehrerin" />
            </div>
            <div>
              <label className="block text-xs text-[#666666] mb-1.5">Geburtsdatum</label>
              <input type="date" value={form.geburtsdatum} onChange={e => set('geburtsdatum', e.target.value)} className={ic} />
            </div>
          </div>

          {/* Gender */}
          <div>
            <label className="block text-xs text-[#666666] mb-1.5">Geschlecht</label>
            <div className="flex gap-5">
              {[{ v: 'WEIBLICH', l: 'Weiblich' }, { v: 'MAENNLICH', l: 'Männlich' }, { v: 'DIVERS', l: 'Divers' }].map(o => (
                <label key={o.v} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="geschlecht" value={o.v}
                    checked={form.geschlecht === o.v} onChange={() => set('geschlecht', o.v)}
                    className="accent-white" />
                  <span className="text-sm text-[#efefef]">{o.l}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Herkunft */}
          <div>
            <label className="block text-xs text-[#666666] mb-1.5">Wie wurde der Klient aufmerksam?</label>
            <div className="relative">
              <select value={form.herkunft} onChange={e => set('herkunft', e.target.value)}
                className={`${ic} appearance-none pr-8 cursor-pointer`}>
                <option value="">— Unbekannt —</option>
                {HERKUNFT.map(o => <option key={o} value={o} className="bg-[#141414]">{o}</option>)}
              </select>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#555555]">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="text-xs text-red-400 bg-red-950/20 border border-red-900/30 px-3 py-2 rounded-lg">{error}</p>
          )}

          {/* Duplicate warning */}
          {duplicate && (
            <div className="bg-orange-950/30 border border-orange-900/40 rounded-xl px-4 py-3.5 space-y-3">
              <div className="flex items-start gap-2.5">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-orange-400 shrink-0 mt-0.5">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                <p className="text-xs text-orange-400/80 mt-0.5">
                  Es gibt bereits einen Klienten namens <strong className="text-orange-400">{duplicate.name}</strong>. Trotzdem anlegen?
                </p>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={e => handleSubmit(e as any, true)} disabled={pending}
                  className="px-3 py-1.5 text-xs font-semibold bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 border border-orange-900/40 rounded-lg transition-colors disabled:opacity-50">
                  {pending ? 'Erstellen…' : 'Ja, trotzdem anlegen'}
                </button>
                <button type="button" onClick={() => setDuplicate(null)}
                  className="px-3 py-1.5 text-xs text-[#666666] border border-[#2e2e2e] hover:bg-[#1c1c1c] rounded-lg transition-colors">
                  Abbrechen
                </button>
              </div>
            </div>
          )}

          {/* Actions */}
          {!duplicate && (
            <div className="flex gap-2 pt-1">
              <button type="submit" disabled={pending}
                className="flex-1 bg-white hover:bg-[#e8e8e8] disabled:opacity-40 text-black text-sm font-semibold py-2.5 rounded-lg transition-colors">
                {pending ? 'Übernehmen…' : 'Als Klient anlegen'}
              </button>
              <button type="button" onClick={onClose}
                className="px-4 py-2.5 text-sm text-[#666666] border border-[#2e2e2e] hover:bg-[#1c1c1c] rounded-lg transition-colors">
                Abbrechen
              </button>
            </div>
          )}
        </form>
      </div>
    </div>,
    document.body
  )
}
