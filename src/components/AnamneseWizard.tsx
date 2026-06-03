'use client'

import { useState, useTransition } from 'react'
import { createAnamnese, type AnamneseFormData } from '@/app/actions/clients'

const INITIAL: AnamneseFormData = {
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

const STEPS = [
  'Ziele & Motivation', 'Körperdaten', 'Ernährung',
  'Alltag & Lifestyle', 'Schlaf', 'Stress & Wohlbefinden', 'Gesundheit',
]

const inputCls = 'w-full px-3 py-2.5 bg-[#0a0a0a] border border-[#2e2e2e] rounded-lg text-sm text-[#efefef] placeholder:text-[#3a3a3a] focus:outline-none focus:border-[#555555] transition-colors'
const textareaCls = `${inputCls} resize-none`

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-[#666666] mb-1.5">{label}</label>
      {children}
    </div>
  )
}

function Radio({ name, options, value, onChange }: {
  name: string; options: { value: string; label: string }[]; value: string; onChange: (v: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-4">
      {options.map(o => (
        <label key={o.value} className="flex items-center gap-2 cursor-pointer">
          <input type="radio" name={name} value={o.value} checked={value === o.value} onChange={() => onChange(o.value)} className="accent-white" />
          <span className="text-sm text-[#efefef]">{o.label}</span>
        </label>
      ))}
    </div>
  )
}

function Checkboxes({ options, values, onChange }: {
  options: { value: string; label: string }[]; values: string[]; onChange: (v: string[]) => void
}) {
  const toggle = (v: string) =>
    onChange(values.includes(v) ? values.filter(x => x !== v) : [...values, v])
  return (
    <div className="flex flex-wrap gap-4">
      {options.map(o => (
        <label key={o.value} className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={values.includes(o.value)} onChange={() => toggle(o.value)} className="accent-white" />
          <span className="text-sm text-[#efefef]">{o.label}</span>
        </label>
      ))}
    </div>
  )
}

function Scale({ value, onChange, low, high }: {
  value: number; onChange: (v: number) => void; low: string; high: string
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-[#3a3a3a] w-28 shrink-0">{low}</span>
      <div className="flex gap-1.5">
        {[1,2,3,4,5,6,7,8,9,10].map(n => (
          <button key={n} type="button" onClick={() => onChange(n)}
            className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
              value === n ? 'bg-white text-black' : 'bg-[#1c1c1c] text-[#666666] hover:bg-[#2e2e2e] hover:text-[#efefef]'
            }`}>
            {n}
          </button>
        ))}
      </div>
      <span className="text-xs text-[#3a3a3a] w-28 shrink-0 text-right">{high}</span>
    </div>
  )
}

type P = { data: AnamneseFormData; upd: (d: Partial<AnamneseFormData>) => void }

function StepZiele({ data, upd }: P) {
  return (
    <div className="space-y-5">
      <Field label="Aktuelle Ziele (Mehrfachauswahl)">
        <Checkboxes options={[
          { value: 'Abnehmen', label: 'Abnehmen' },
          { value: 'Muskelaufbau', label: 'Muskelaufbau' },
          { value: 'Körperfett reduzieren', label: 'Körperfett reduzieren' },
          { value: 'Gesünder leben', label: 'Gesünder leben' },
          { value: 'Leistungssteigerung', label: 'Leistungssteigerung' },
          { value: 'Mehr Energie', label: 'Mehr Energie' },
        ]} values={data.ziele} onChange={v => upd({ ziele: v })} />
      </Field>
      <Field label="Sonstiges Ziel">
        <input className={inputCls} value={data.zieleSonstiges} onChange={e => upd({ zieleSonstiges: e.target.value })} placeholder="Weiteres Ziel…" />
      </Field>
      <Field label="Wichtigste Motivation">
        <textarea rows={3} className={textareaCls} value={data.motivation} onChange={e => upd({ motivation: e.target.value })} placeholder="Was treibt dich an?" />
      </Field>
      <Field label={`Wie wichtig ist dir dein Ziel? (${data.zielWichtigkeit}/10)`}>
        <Scale value={data.zielWichtigkeit} onChange={v => upd({ zielWichtigkeit: v })} low="1 – wenig wichtig" high="10 – sehr wichtig" />
      </Field>
      <Field label="Bis wann möchtest du dein Ziel erreichen?">
        <input className={inputCls} value={data.zielDatum} onChange={e => upd({ zielDatum: e.target.value })} placeholder="z. B. in 3 Monaten, bis Dezember…" />
      </Field>
    </div>
  )
}

function StepKoerperdaten({ data, upd }: P) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Größe (cm)"><input type="number" className={inputCls} value={data.groesse} onChange={e => upd({ groesse: e.target.value })} placeholder="170" /></Field>
        <Field label="Aktuelles Gewicht (kg)"><input type="number" step="0.1" className={inputCls} value={data.aktuellesGewicht} onChange={e => upd({ aktuellesGewicht: e.target.value })} placeholder="70.0" /></Field>
        <Field label="Gewicht vor 3 Mon. (kg)"><input type="number" step="0.1" className={inputCls} value={data.gewichtVor3Monaten} onChange={e => upd({ gewichtVor3Monaten: e.target.value })} placeholder="72.0" /></Field>
        <Field label="Gewicht vor 1 Jahr (kg)"><input type="number" step="0.1" className={inputCls} value={data.gewichtVor1Jahr} onChange={e => upd({ gewichtVor1Jahr: e.target.value })} placeholder="75.0" /></Field>
        <Field label="Wunschgewicht (kg)"><input type="number" step="0.1" className={inputCls} value={data.wunschgewicht} onChange={e => upd({ wunschgewicht: e.target.value })} placeholder="65.0" /></Field>
        <Field label="Körperfett (%, falls bekannt)"><input type="number" step="0.1" className={inputCls} value={data.koerperfett} onChange={e => upd({ koerperfett: e.target.value })} placeholder="28.0" /></Field>
        <Field label="Taillenumfang (cm, Bauchnabelhöhe)"><input type="number" step="0.1" className={inputCls} value={data.taillenumfang} onChange={e => upd({ taillenumfang: e.target.value })} placeholder="82" /></Field>
      </div>
      <Field label="Gewicht zuletzt verändert?">
        <Radio name="gewichtVeraendert" options={[{ value: 'ja', label: 'Ja' }, { value: 'nein', label: 'Nein' }]} value={data.gewichtVeraendert} onChange={v => upd({ gewichtVeraendert: v })} />
      </Field>
      {data.gewichtVeraendert === 'ja' && (
        <Field label="Wenn ja, wie?">
          <input className={inputCls} value={data.gewichtVeraendertWie} onChange={e => upd({ gewichtVeraendertWie: e.target.value })} placeholder="Zugenommen durch Stress…" />
        </Field>
      )}
      <Field label="Sonstige Maße (Hüfte, Oberschenkel, Brust…)">
        <textarea rows={2} className={textareaCls} value={data.sonstigeMasse} onChange={e => upd({ sonstigeMasse: e.target.value })} placeholder="Hüfte: 98 cm, Oberschenkel: 60 cm…" />
      </Field>
    </div>
  )
}

function StepErnaehrung({ data, upd }: P) {
  return (
    <div className="space-y-5">
      <Field label="Aktuelle Ernährung bewerten">
        <Radio name="ernaehrungBewertung" options={[
          { value: 'sehr gut', label: 'Sehr gut' }, { value: 'gut', label: 'Gut' },
          { value: 'mittelmäßig', label: 'Mittelmäßig' }, { value: 'schlecht', label: 'Schlecht' },
          { value: 'sehr schlecht', label: 'Sehr schlecht' }
        ]} value={data.ernaehrungBewertung} onChange={v => upd({ ernaehrungBewertung: v })} />
      </Field>
      <Field label="Wie viele Mahlzeiten pro Tag?">
        <input type="number" className={`${inputCls} w-28`} value={data.mahlzeitenProTag} onChange={e => upd({ mahlzeitenProTag: e.target.value })} placeholder="3" />
      </Field>
      <Field label="Essgewohnheiten (Mehrfachauswahl)">
        <Checkboxes options={[
          { value: 'Frühstücke regelmäßig', label: 'Frühstücke regelmäßig' },
          { value: 'Essen zwischendurch', label: 'Essen zwischendurch' },
          { value: 'Heißhungerattacken', label: 'Heißhungerattacken' },
          { value: 'Späte Mahlzeiten', label: 'Späte Mahlzeiten' },
          { value: 'Emotionales Essen', label: 'Emotionales Essen' },
          { value: 'Unregelmäßige Zeiten', label: 'Unregelmäßige Zeiten' },
        ]} values={data.essgewohnheiten} onChange={v => upd({ essgewohnheiten: v })} />
      </Field>
      <Field label="Lebensmittelunverträglichkeiten?">
        <Radio name="lebensmittelUnvertraeglichkeit" options={[{ value: 'ja', label: 'Ja' }, { value: 'nein', label: 'Nein' }]} value={data.lebensmittelUnvertraeglichkeit} onChange={v => upd({ lebensmittelUnvertraeglichkeit: v })} />
      </Field>
      {data.lebensmittelUnvertraeglichkeit === 'ja' && (
        <Field label="Wenn ja, welche?">
          <input className={inputCls} value={data.lebensmittelUnvertraeglichkeitWelche} onChange={e => upd({ lebensmittelUnvertraeglichkeitWelche: e.target.value })} placeholder="Laktose, Gluten…" />
        </Field>
      )}
      <div className="grid grid-cols-2 gap-4">
        <Field label="Wasser (L/Tag)"><input type="number" step="0.1" className={inputCls} value={data.wasserLiter} onChange={e => upd({ wasserLiter: e.target.value })} placeholder="2.0" /></Field>
        <Field label="Kaffee (Tassen/Tag)"><input type="number" step="0.5" className={inputCls} value={data.kaffeeTassen} onChange={e => upd({ kaffeeTassen: e.target.value })} placeholder="2" /></Field>
        <Field label="Alkohol (Port./Tag)"><input type="number" step="0.5" className={inputCls} value={data.alkoholPortionen} onChange={e => upd({ alkoholPortionen: e.target.value })} placeholder="0" /></Field>
        <Field label="Softdrinks (L/Tag)"><input type="number" step="0.1" className={inputCls} value={data.softdrinksLiter} onChange={e => upd({ softdrinksLiter: e.target.value })} placeholder="0" /></Field>
      </div>
      <Field label="Ernährungstagebuch?">
        <Radio name="ernaehrungstagebuch" options={[{ value: 'ja', label: 'Ja' }, { value: 'nein', label: 'Nein' }]} value={data.ernaehrungstagebuch} onChange={v => upd({ ernaehrungstagebuch: v })} />
      </Field>
    </div>
  )
}

function StepAlltag({ data, upd }: P) {
  return (
    <div className="space-y-5">
      <Field label="Arbeitstag überwiegend">
        <Radio name="arbeitstag" options={[
          { value: 'überwiegend sitzend', label: 'Überwiegend sitzend' },
          { value: 'überwiegend stehend', label: 'Überwiegend stehend' },
          { value: 'körperlich aktiv', label: 'Körperlich aktiv' },
          { value: 'wechselnd', label: 'Wechselnd' },
        ]} value={data.arbeitstag} onChange={v => upd({ arbeitstag: v })} />
      </Field>
      <Field label="Wie aktiv in der Freizeit?">
        <Radio name="freizeitAktivitaet" options={[
          { value: 'gar nicht', label: 'Gar nicht' }, { value: 'wenig', label: 'Wenig' },
          { value: 'moderat', label: 'Moderat' }, { value: 'aktiv', label: 'Aktiv' },
          { value: 'sehr aktiv', label: 'Sehr aktiv' },
        ]} value={data.freizeitAktivitaet} onChange={v => upd({ freizeitAktivitaet: v })} />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Sport (mal/Woche)"><input type="number" className={`${inputCls} w-28`} value={data.sportProWoche} onChange={e => upd({ sportProWoche: e.target.value })} placeholder="3" /></Field>
        <Field label="Art des Sports"><input className={inputCls} value={data.sportArt} onChange={e => upd({ sportArt: e.target.value })} placeholder="Laufen, Krafttraining…" /></Field>
      </div>
      <Field label="Durchschnittliche Schritte pro Tag">
        <Radio name="schritte" options={[
          { value: '< 3.000', label: '< 3.000' }, { value: '3.000–7.000', label: '3.000–7.000' },
          { value: '7.000–10.000', label: '7.000–10.000' }, { value: '> 10.000', label: '> 10.000' },
        ]} value={data.schritte} onChange={v => upd({ schritte: v })} />
      </Field>
      <Field label="Rauchst du?">
        <Radio name="raucher" options={[{ value: 'ja', label: 'Ja' }, { value: 'nein', label: 'Nein' }]} value={data.raucher} onChange={v => upd({ raucher: v })} />
      </Field>
      {data.raucher === 'ja' && (
        <Field label="Wie viel pro Tag?"><input className={inputCls} value={data.raucherMenge} onChange={e => upd({ raucherMenge: e.target.value })} placeholder="10 Zigaretten" /></Field>
      )}
    </div>
  )
}

function StepSchlaf({ data, upd }: P) {
  return (
    <div className="space-y-5">
      <Field label="Schlafstunden pro Nacht (Durchschnitt)">
        <input type="number" step="0.5" className={`${inputCls} w-32`} value={data.schlafStunden} onChange={e => upd({ schlafStunden: e.target.value })} placeholder="7" />
      </Field>
      <Field label="Schlafqualität">
        <Radio name="schlafQualitaet" options={[
          { value: 'sehr gut', label: 'Sehr gut' }, { value: 'gut', label: 'Gut' },
          { value: 'mittelmäßig', label: 'Mittelmäßig' }, { value: 'schlecht', label: 'Schlecht' },
          { value: 'sehr schlecht', label: 'Sehr schlecht' },
        ]} value={data.schlafQualitaet} onChange={v => upd({ schlafQualitaet: v })} />
      </Field>
      <Field label="Probleme beim Ein- oder Durchschlafen?">
        <Radio name="schlafProbleme" options={[{ value: 'ja', label: 'Ja' }, { value: 'nein', label: 'Nein' }]} value={data.schlafProbleme} onChange={v => upd({ schlafProbleme: v })} />
      </Field>
      {data.schlafProbleme === 'ja' && (
        <Field label="Wenn ja, welche?">
          <textarea rows={2} className={textareaCls} value={data.schlafProblemeWelche} onChange={e => upd({ schlafProblemeWelche: e.target.value })} placeholder="Einschlafen, nächtliches Aufwachen…" />
        </Field>
      )}
    </div>
  )
}

function StepStress({ data, upd }: P) {
  return (
    <div className="space-y-5">
      <Field label={`Aktuelles Stresslevel (${data.stressLevel}/10)`}>
        <Scale value={data.stressLevel} onChange={v => upd({ stressLevel: v })} low="1 – kein Stress" high="10 – sehr hoch" />
      </Field>
      <Field label="Größte Stressfaktoren">
        <textarea rows={3} className={textareaCls} value={data.stressfaktoren} onChange={e => upd({ stressfaktoren: e.target.value })} placeholder="Arbeit, Familie, finanzielle Sorgen…" />
      </Field>
      <Field label="Wie gehst du mit Stress um?">
        <textarea rows={2} className={textareaCls} value={data.stressBewaeltigung} onChange={e => upd({ stressBewaeltigung: e.target.value })} placeholder="Sport, Meditation, Freunde treffen…" />
      </Field>
      <Field label="Allgemeines Wohlbefinden">
        <Radio name="wohlbefinden" options={[
          { value: 'sehr gut', label: 'Sehr gut' }, { value: 'gut', label: 'Gut' },
          { value: 'mittelmäßig', label: 'Mittelmäßig' }, { value: 'schlecht', label: 'Schlecht' },
          { value: 'sehr schlecht', label: 'Sehr schlecht' },
        ]} value={data.wohlbefinden} onChange={v => upd({ wohlbefinden: v })} />
      </Field>
    </div>
  )
}

function StepGesundheit({ data, upd }: P) {
  return (
    <div className="space-y-5">
      <Field label="Bekannte Erkrankungen?">
        <Radio name="erkrankungen" options={[{ value: 'ja', label: 'Ja' }, { value: 'nein', label: 'Nein' }]} value={data.erkrankungen} onChange={v => upd({ erkrankungen: v })} />
      </Field>
      {data.erkrankungen === 'ja' && <Field label="Wenn ja, welche?"><textarea rows={2} className={textareaCls} value={data.erkrankungenWelche} onChange={e => upd({ erkrankungenWelche: e.target.value })} placeholder="Diabetes, Bluthochdruck…" /></Field>}
      <Field label="Regelmäßige Medikamente / Nahrungsergänzungsmittel?">
        <Radio name="medikamente" options={[{ value: 'ja', label: 'Ja' }, { value: 'nein', label: 'Nein' }]} value={data.medikamente} onChange={v => upd({ medikamente: v })} />
      </Field>
      {data.medikamente === 'ja' && <Field label="Wenn ja, welche?"><textarea rows={2} className={textareaCls} value={data.medikamenteWelche} onChange={e => upd({ medikamenteWelche: e.target.value })} placeholder="Metformin, Vitamin D…" /></Field>}
      <Field label="Operationen?">
        <Radio name="operationen" options={[{ value: 'ja', label: 'Ja' }, { value: 'nein', label: 'Nein' }]} value={data.operationen} onChange={v => upd({ operationen: v })} />
      </Field>
      {data.operationen === 'ja' && <Field label="Wenn ja, welche und wann?"><textarea rows={2} className={textareaCls} value={data.operationenWann} onChange={e => upd({ operationenWann: e.target.value })} placeholder="Appendix 2019, Knie-OP 2022…" /></Field>}
      <Field label="Sonstige wichtige Informationen">
        <textarea rows={3} className={textareaCls} value={data.sonstigeInfos} onChange={e => upd({ sonstigeInfos: e.target.value })} placeholder="Alles, was ich noch wissen sollte…" />
      </Field>
    </div>
  )
}

export default function AnamneseWizard({ clientId }: { clientId: string }) {
  const [step, setStep] = useState(1)
  const [data, setData] = useState<AnamneseFormData>(INITIAL)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const upd = (updates: Partial<AnamneseFormData>) =>
    setData(prev => ({ ...prev, ...updates }))

  const handleSubmit = () => {
    setError(null)
    startTransition(async () => {
      const result = await createAnamnese(clientId, data)
      if (result?.error) setError(result.error)
    })
  }

  const steps = [
    <StepZiele key={1} data={data} upd={upd} />,
    <StepKoerperdaten key={2} data={data} upd={upd} />,
    <StepErnaehrung key={3} data={data} upd={upd} />,
    <StepAlltag key={4} data={data} upd={upd} />,
    <StepSchlaf key={5} data={data} upd={upd} />,
    <StepStress key={6} data={data} upd={upd} />,
    <StepGesundheit key={7} data={data} upd={upd} />,
  ]

  return (
    <div className="bg-[#141414] border border-[#2e2e2e] rounded-xl">
      {/* Header */}
      <div className="px-5 md:px-8 pt-6 pb-5 border-b border-[#1c1c1c]">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-white">{STEPS[step - 1]}</h2>
          <span className="text-xs text-[#3a3a3a]">{step} / {STEPS.length}</span>
        </div>
        <div className="flex gap-1">
          {STEPS.map((_, i) => (
            <button key={i} type="button" onClick={() => setStep(i + 1)}
              className={`flex-1 h-1 rounded-full transition-colors ${i + 1 <= step ? 'bg-white' : 'bg-[#2e2e2e]'}`} />
          ))}
        </div>
      </div>

      <div className="px-5 md:px-8 py-6 md:py-7">{steps[step - 1]}</div>

      <div className="px-5 md:px-8 pb-6 pt-4 border-t border-[#1c1c1c] flex items-center justify-between">
        <button type="button" onClick={() => setStep(s => Math.max(1, s - 1))} disabled={step === 1}
          className="text-sm text-[#3a3a3a] hover:text-[#efefef] disabled:opacity-30 transition-colors">
          Zurück
        </button>
        <div className="flex items-center gap-3">
          {error && <p className="text-xs text-red-400">{error}</p>}
          {step < STEPS.length ? (
            <button type="button" onClick={() => setStep(s => Math.min(STEPS.length, s + 1))}
              className="px-5 py-2 bg-white hover:bg-[#e8e8e8] text-black text-sm font-semibold rounded-lg transition-colors">
              Weiter
            </button>
          ) : (
            <button type="button" onClick={handleSubmit} disabled={isPending}
              className="px-5 py-2 bg-white hover:bg-[#e8e8e8] disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
              {isPending ? 'Speichern…' : 'Anamnese speichern'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
