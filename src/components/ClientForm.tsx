'use client'

import { useState, useTransition } from 'react'
import { createClient, type ClientFormData } from '@/app/actions/clients'

const INITIAL: ClientFormData = { vorname: '', nachname: '', adresse: '', telefon: '', email: '', beruf: '', geburtsdatum: '', geschlecht: '', herkunft: '' }
const HERKUNFT_OPTIONS = ['Instagram', 'Website', 'Empfehlung', 'Flyer', 'Sonstiges']
const ic = 'w-full px-3 py-2.5 bg-[#0a0a0a] border border-[#2e2e2e] rounded-lg text-sm text-[#efefef] placeholder:text-[#3a3a3a] focus:outline-none focus:border-[#555555] focus:ring-1 focus:ring-white/10 transition-colors'

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-[#666666] mb-1.5">{label}</label>
      {children}
    </div>
  )
}

export default function ClientForm() {
  const [data, setData]         = useState<ClientFormData>(INITIAL)
  const [error, setError]       = useState<string | null>(null)
  const [duplicate, setDuplicate] = useState<{ name: string; id: string } | null>(null)
  const [isPending, start]      = useTransition()
  const set = (f: keyof ClientFormData, v: string) => setData(p => ({ ...p, [f]: v }))

  function handleSubmit(e: React.FormEvent, force = false) {
    e.preventDefault()
    setError(null)
    setDuplicate(null)
    start(async () => {
      const result = await createClient(data, force)
      if (!result) return
      if ('duplicate' in result && result.duplicate) {
        setDuplicate({ name: result.existingName!, id: result.existingId! })
      } else if ('error' in result) {
        setError(result.error ?? null)
      }
    })
  }

  return (
    <form onSubmit={e => handleSubmit(e)} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <F label="Vorname *"><input className={ic} value={data.vorname} onChange={e => set('vorname', e.target.value)} placeholder="Anna" required /></F>
        <F label="Nachname *"><input className={ic} value={data.nachname} onChange={e => set('nachname', e.target.value)} placeholder="Müller" required /></F>
      </div>
      <F label="Adresse"><input className={ic} value={data.adresse} onChange={e => set('adresse', e.target.value)} placeholder="Musterstraße 1, 12345 Berlin" /></F>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <F label="Telefon"><input className={ic} value={data.telefon} onChange={e => set('telefon', e.target.value)} placeholder="+41 79 123 45 67" /></F>
        <F label="E-Mail"><input type="email" className={ic} value={data.email} onChange={e => set('email', e.target.value)} placeholder="anna@beispiel.ch" /></F>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <F label="Beruf"><input className={ic} value={data.beruf} onChange={e => set('beruf', e.target.value)} placeholder="Lehrerin" /></F>
        <F label="Geburtsdatum"><input type="date" className={ic} value={data.geburtsdatum} onChange={e => set('geburtsdatum', e.target.value)} /></F>
      </div>
      <F label="Geschlecht">
        <div className="flex gap-5">
          {[{ v: 'WEIBLICH', l: 'Weiblich' }, { v: 'MAENNLICH', l: 'Männlich' }, { v: 'DIVERS', l: 'Divers' }].map(o => (
            <label key={o.v} className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="g" value={o.v} checked={data.geschlecht === o.v} onChange={() => set('geschlecht', o.v)} className="accent-white" />
              <span className="text-sm text-[#efefef]">{o.l}</span>
            </label>
          ))}
        </div>
      </F>
      <F label="Wie wurde der Klient aufmerksam?">
        <div className="relative">
          <select value={data.herkunft} onChange={e => set('herkunft', e.target.value)}
            className={`${ic} appearance-none pr-8 cursor-pointer`}>
            <option value="">— Unbekannt —</option>
            {HERKUNFT_OPTIONS.map(o => <option key={o} value={o} className="bg-[#141414]">{o}</option>)}
          </select>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#555555]">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>
      </F>

      {/* Error */}
      {error && <p className="text-xs text-red-400 bg-red-950/20 border border-red-900/30 px-3 py-2 rounded-lg">{error}</p>}

      {/* Duplicate warning */}
      {duplicate && (
        <div className="bg-orange-950/30 border border-orange-900/40 rounded-xl px-4 py-3.5 space-y-3">
          <div className="flex items-start gap-2.5">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-orange-400 shrink-0 mt-0.5">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <div>
              <p className="text-sm font-medium text-orange-400">Mögliches Duplikat gefunden</p>
              <p className="text-xs text-orange-400/70 mt-0.5">
                Es gibt bereits einen Klienten namens <strong>{duplicate.name}</strong>. Trotzdem einen neuen anlegen?
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={e => handleSubmit(e as any, true)} disabled={isPending}
              className="px-3 py-1.5 text-xs font-semibold bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 border border-orange-900/40 rounded-lg transition-colors disabled:opacity-50">
              {isPending ? 'Erstellen…' : 'Ja, trotzdem erstellen'}
            </button>
            <button type="button" onClick={() => setDuplicate(null)}
              className="px-3 py-1.5 text-xs text-[#666666] border border-[#2e2e2e] hover:bg-[#1c1c1c] rounded-lg transition-colors">
              Abbrechen
            </button>
          </div>
        </div>
      )}

      {!duplicate && (
        <button type="submit" disabled={isPending}
          className="bg-white hover:bg-[#e8e8e8] disabled:opacity-50 text-black font-semibold text-sm px-6 py-2.5 rounded-lg transition-colors">
          {isPending ? 'Speichern…' : 'Klient anlegen'}
        </button>
      )}
    </form>
  )
}
