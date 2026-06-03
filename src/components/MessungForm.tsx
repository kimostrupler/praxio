'use client'

import { useState, useTransition } from 'react'
import { createMessung } from '@/app/actions/clients'

const ic = 'px-3 py-2 bg-[#0a0a0a] border border-[#2e2e2e] rounded-lg text-sm text-[#efefef] placeholder:text-[#3a3a3a] focus:outline-none focus:border-[#555555] transition-colors'

export default function MessungForm({ clientId }: { clientId: string }) {
  const [open, setOpen] = useState(false)
  const [gewicht, setGewicht] = useState('')
  const [kf, setKf] = useState('')
  const [, start] = useTransition()

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const w = parseFloat(gewicht)
    if (isNaN(w)) return
    const k = parseFloat(kf)
    start(async () => {
      await createMessung(clientId, w, isNaN(k) ? undefined : k)
      setGewicht(''); setKf(''); setOpen(false)
    })
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        className="text-xs text-[#555555] hover:text-white transition-colors flex items-center gap-1.5">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        Messung eintragen
      </button>
    )
  }

  return (
    <form onSubmit={submit} className="flex items-center gap-2 flex-wrap">
      <input className={`${ic} w-28`} type="number" step="0.1" placeholder="Gewicht (kg)"
        value={gewicht} onChange={e => setGewicht(e.target.value)} required autoFocus />
      <input className={`${ic} w-24`} type="number" step="0.1" placeholder="KF % (opt.)"
        value={kf} onChange={e => setKf(e.target.value)} />
      <button type="submit" className="bg-white hover:bg-[#e8e8e8] text-black text-xs font-semibold px-3 py-2 rounded-lg transition-colors">
        Speichern
      </button>
      <button type="button" onClick={() => setOpen(false)} className="text-xs text-[#555555] hover:text-white transition-colors">
        Abbrechen
      </button>
    </form>
  )
}
