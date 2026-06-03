'use client'

import { useState, useTransition } from 'react'
import { createUebung, type UebungInput } from '@/app/actions/training'

const KATEGORIEN = ['Brust', 'Rücken', 'Beine', 'Schultern', 'Arme', 'Bauch', 'Kardio', 'Ganzkörper']
const SCHWIERIGKEIT = ['Anfänger', 'Fortgeschritten', 'Profi']
const AUSRUESTUNG = ['Körpergewicht', 'Freie Gewichte', 'Maschine', 'Kein Equipment', 'Sonstiges']
const ZIELE = ['Abnehmen', 'Muskelaufbau', 'Körperfett reduzieren', 'Gesünder leben', 'Leistungssteigerung', 'Mehr Energie']

const ic = 'w-full px-3 py-2 bg-[#0a0a0a] border border-[#2e2e2e] rounded-lg text-sm text-[#efefef] placeholder:text-[#3a3a3a] focus:outline-none focus:border-[#555555] transition-colors'
const Chevron = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
    className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#555555]">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
)

const EMPTY: UebungInput = { name: '', kategorie: 'Brust', schwierigkeit: 'Anfänger', ausruestung: 'Freie Gewichte', ziele: [], beschreibung: '' }

export default function UebungHinzufuegenForm({ onCreated }: { onCreated?: () => void }) {
  const [open, setOpen] = useState(false)
  const [data, setData] = useState<UebungInput>(EMPTY)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()

  const set = (f: keyof UebungInput, v: string | string[]) =>
    setData(p => ({ ...p, [f]: v }))

  const toggleZiel = (z: string) =>
    set('ziele', data.ziele.includes(z) ? data.ziele.filter(x => x !== z) : [...data.ziele, z])

  const handleSave = () => {
    setError(null)
    startTransition(async () => {
      const result = await createUebung(data)
      if (result?.error) {
        setError(result.error)
      } else {
        setData(EMPTY)
        setSuccess(true)
        setTimeout(() => setSuccess(false), 2500)
        setOpen(false)
        onCreated?.()
      }
    })
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)}
        className="bg-white hover:bg-[#e8e8e8] text-black text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
        {success ? '✓ Gespeichert' : '+ Neue Übung'}
      </button>
    )
  }

  return (
    <div className="bg-[#141414] border border-[#2e2e2e] rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between mb-1">
        <p className="text-sm font-semibold text-white">Neue Übung erstellen</p>
        <button type="button" onClick={() => setOpen(false)} className="text-[#444444] hover:text-white text-sm transition-colors">✕</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-[#666666] mb-1.5">Name *</label>
          <input className={ic} value={data.name} onChange={e => set('name', e.target.value)} placeholder="z. B. Bulgarian Split Squat" />
        </div>
        <div>
          <label className="block text-xs text-[#666666] mb-1.5">Kategorie</label>
          <div className="relative">
            <select className={`${ic} appearance-none pr-8 cursor-pointer`} value={data.kategorie} onChange={e => set('kategorie', e.target.value)}>
              {KATEGORIEN.map(k => <option key={k} value={k} className="bg-[#141414]">{k}</option>)}
            </select>
            <Chevron />
          </div>
        </div>
        <div>
          <label className="block text-xs text-[#666666] mb-1.5">Schwierigkeit</label>
          <div className="relative">
            <select className={`${ic} appearance-none pr-8 cursor-pointer`} value={data.schwierigkeit} onChange={e => set('schwierigkeit', e.target.value)}>
              {SCHWIERIGKEIT.map(s => <option key={s} value={s} className="bg-[#141414]">{s}</option>)}
            </select>
            <Chevron />
          </div>
        </div>
        <div>
          <label className="block text-xs text-[#666666] mb-1.5">Ausrüstung</label>
          <div className="relative">
            <select className={`${ic} appearance-none pr-8 cursor-pointer`} value={data.ausruestung} onChange={e => set('ausruestung', e.target.value)}>
              {AUSRUESTUNG.map(a => <option key={a} value={a} className="bg-[#141414]">{a}</option>)}
            </select>
            <Chevron />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-xs text-[#666666] mb-2">Geeignet für Ziele</label>
        <div className="flex flex-wrap gap-2">
          {ZIELE.map(z => (
            <button key={z} type="button" onClick={() => toggleZiel(z)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                data.ziele.includes(z) ? 'bg-white text-black' : 'bg-[#1c1c1c] text-[#666666] hover:text-white border border-[#2e2e2e]'
              }`}>
              {z}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs text-[#666666] mb-1.5">Beschreibung (optional)</label>
        <textarea rows={2} className={`${ic} resize-none`} value={data.beschreibung}
          onChange={e => set('beschreibung', e.target.value)} placeholder="Ausführungsbeschreibung…" />
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      <div className="flex gap-2">
        <button type="button" onClick={handleSave} disabled={isPending}
          className="bg-white hover:bg-[#e8e8e8] disabled:opacity-50 text-black text-sm font-semibold px-5 py-2 rounded-lg transition-colors">
          {isPending ? 'Speichern…' : 'Übung erstellen'}
        </button>
        <button type="button" onClick={() => setOpen(false)}
          className="text-sm text-[#444444] hover:text-white px-4 py-2 transition-colors">
          Abbrechen
        </button>
      </div>
    </div>
  )
}
