'use client'

import { useState, useTransition } from 'react'
import { createAnamnese, type AnamneseFormData } from '@/app/actions/clients'

const EMPTY: AnamneseFormData = {
  ziele: [], zieleSonstiges: '', motivation: '', zielWichtigkeit: 5, zielDatum: '',
  groesse: '', aktuellesGewicht: '', gewichtVor3Monaten: '', gewichtVor1Jahr: '',
  wunschgewicht: '', gewichtVeraendert: '', gewichtVeraendertWie: '',
  koerperfett: '', taillenumfang: '', sonstigeMasse: '',
  ernaehrungBewertung: '', mahlzeitenProTag: '', essgewohnheiten: [],
  essgewohnheitenSonstiges: '', lebensmittelUnvertraeglichkeit: '',
  lebensmittelUnvertraeglichkeitWelche: '', wasserLiter: '', kaffeeTassen: '',
  alkoholPortionen: '', softdrinksLiter: '', ernaehrungstagebuch: '',
  arbeitstag: '', freizeitAktivitaet: '', sportProWoche: '', sportArt: '',
  schritte: '', raucher: '', raucherMenge: '',
  schlafStunden: '', schlafQualitaet: '', schlafProbleme: '', schlafProblemeWelche: '',
  stressLevel: 5, stressfaktoren: '', stressBewaeltigung: '', wohlbefinden: '',
  erkrankungen: '', erkrankungenWelche: '', medikamente: '', medikamenteWelche: '',
  operationen: '', operationenWann: '', sonstigeInfos: '',
}

const STEPS = ['Messungen', 'Befinden']
const ic = 'w-full px-3 py-2.5 bg-[#0a0a0a] border border-[#2e2e2e] rounded-lg text-sm text-[#efefef] placeholder:text-[#3a3a3a] focus:outline-none focus:border-[#555555] transition-colors'

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-[#666666] mb-1.5">{label}</label>
      {children}
    </div>
  )
}

function Radio({ name, opts, value, onChange }: { name: string; opts: { v: string; l: string }[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-3">
      {opts.map(o => (
        <label key={o.v} className="flex items-center gap-2 cursor-pointer">
          <input type="radio" name={name} value={o.v} checked={value === o.v} onChange={() => onChange(o.v)} className="accent-white w-3.5 h-3.5" />
          <span className="text-sm text-[#efefef]">{o.l}</span>
        </label>
      ))}
    </div>
  )
}

function Scale({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="space-y-2">
      <div className="flex gap-1.5 flex-wrap">
        {[1,2,3,4,5,6,7,8,9,10].map(n => (
          <button key={n} type="button" onClick={() => onChange(n)}
            className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${value === n ? 'bg-white text-black' : 'bg-[#1c1c1c] text-[#666666] hover:bg-[#2e2e2e]'}`}>
            {n}
          </button>
        ))}
      </div>
      <div className="flex justify-between text-[10px] text-[#3a3a3a]">
        <span>1 – kein Stress</span><span>10 – sehr hoch</span>
      </div>
    </div>
  )
}

type P = { d: AnamneseFormData; set: (u: Partial<AnamneseFormData>) => void }

function Step1({ d, set }: P) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <F label="Gewicht (kg) *"><input type="number" step="0.1" className={ic} value={d.aktuellesGewicht} onChange={e => set({ aktuellesGewicht: e.target.value })} placeholder="70.0" /></F>
        <F label="Körperfett (%)"><input type="number" step="0.1" className={ic} value={d.koerperfett} onChange={e => set({ koerperfett: e.target.value })} placeholder="28.0" /></F>
        <F label="Taillenumfang (cm)"><input type="number" step="0.5" className={ic} value={d.taillenumfang} onChange={e => set({ taillenumfang: e.target.value })} placeholder="82" /></F>
        <F label="Sport (×/Woche)"><input type="number" className={ic} value={d.sportProWoche} onChange={e => set({ sportProWoche: e.target.value })} placeholder="3" /></F>
      </div>
      <F label="Sonstige Maße"><textarea rows={2} className={`${ic} resize-none`} value={d.sonstigeMasse} onChange={e => set({ sonstigeMasse: e.target.value })} placeholder="Hüfte: 98 cm…" /></F>
    </div>
  )
}

function Step2({ d, set }: P) {
  const RATING = [
    { v: 'sehr gut', l: 'Sehr gut' }, { v: 'gut', l: 'Gut' },
    { v: 'mittelmäßig', l: 'Mittelmäßig' }, { v: 'schlecht', l: 'Schlecht' }, { v: 'sehr schlecht', l: 'Sehr schlecht' },
  ]
  return (
    <div className="space-y-5">
      <F label={`Stresslevel (${d.stressLevel}/10)`}><Scale value={d.stressLevel} onChange={v => set({ stressLevel: v })} /></F>
      <div className="grid grid-cols-2 gap-3">
        <F label="Schlafstunden/Nacht"><input type="number" step="0.5" className={ic} value={d.schlafStunden} onChange={e => set({ schlafStunden: e.target.value })} placeholder="7" /></F>
        <F label="Wasser (L/Tag)"><input type="number" step="0.1" className={ic} value={d.wasserLiter} onChange={e => set({ wasserLiter: e.target.value })} placeholder="2.0" /></F>
      </div>
      <F label="Schlafqualität"><Radio name="sq2" opts={RATING} value={d.schlafQualitaet} onChange={v => set({ schlafQualitaet: v })} /></F>
      <F label="Wohlbefinden"><Radio name="wb2" opts={RATING} value={d.wohlbefinden} onChange={v => set({ wohlbefinden: v })} /></F>
      <F label="Ernährung (Selbsteinschätzung)"><Radio name="eb2" opts={RATING} value={d.ernaehrungBewertung} onChange={v => set({ ernaehrungBewertung: v })} /></F>
    </div>
  )
}

export default function SchnellEintragWizard({ clientId }: { clientId: string }) {
  const [step, setStep] = useState(1)
  const [data, setData] = useState<AnamneseFormData>(EMPTY)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const set = (u: Partial<AnamneseFormData>) => setData(p => ({ ...p, ...u }))
  const handleSave = () => {
    setError(null)
    startTransition(async () => {
      const r = await createAnamnese(clientId, data)
      if (r?.error) setError(r.error)
    })
  }

  return (
    <div className="bg-[#141414] border border-[#2e2e2e] rounded-xl">
      <div className="px-6 pt-6 pb-5 border-b border-[#2e2e2e]">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-white">{STEPS[step - 1]}</h2>
          <span className="text-xs text-[#3a3a3a]">{step} / {STEPS.length}</span>
        </div>
        <div className="flex gap-1">
          {STEPS.map((_, i) => (
            <div key={i} className={`flex-1 h-1 rounded-full transition-colors ${i + 1 <= step ? 'bg-white' : 'bg-[#2e2e2e]'}`} />
          ))}
        </div>
      </div>
      <div className="px-6 py-6">{step === 1 ? <Step1 d={data} set={set} /> : <Step2 d={data} set={set} />}</div>
      <div className="px-6 pb-6 pt-4 border-t border-[#2e2e2e] flex items-center justify-between">
        <button type="button" onClick={() => setStep(s => Math.max(1, s - 1))} disabled={step === 1}
          className="text-sm text-[#444444] hover:text-[#efefef] disabled:opacity-30 transition-colors">Zurück</button>
        <div className="flex items-center gap-3">
          {error && <p className="text-xs text-red-400">{error}</p>}
          {step < STEPS.length
            ? <button type="button" onClick={() => setStep(2)}
                className="bg-white hover:bg-[#e8e8e8] text-black text-sm font-semibold px-5 py-2 rounded-lg transition-colors">Weiter</button>
            : <button type="button" onClick={handleSave} disabled={isPending}
                className="bg-white hover:bg-[#e8e8e8] disabled:opacity-50 text-black text-sm font-semibold px-5 py-2 rounded-lg transition-colors">
                {isPending ? 'Speichern…' : 'Eintrag speichern'}
              </button>
          }
        </div>
      </div>
    </div>
  )
}
