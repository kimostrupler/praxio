'use client'

import { useState, useTransition, useEffect } from 'react'
import { updateAnamnese, type AnamneseFormData } from '@/app/actions/clients'

const ic = 'w-full px-3 py-2.5 bg-[#0a0a0a] border border-[#2e2e2e] rounded-lg text-sm text-[#efefef] placeholder:text-[#3a3a3a] focus:outline-none focus:border-[#555555] focus:ring-1 focus:ring-white/10 transition-colors'
const tc = `${ic} resize-none`

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-[#666666] mb-1.5">{label}</label>
      {children}
    </div>
  )
}

function Radio({ name, opts, value, onChange }: {
  name: string; opts: { v: string; l: string }[]; value: string; onChange: (v: string) => void
}) {
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

function Checks({ opts, values, onChange }: {
  opts: { v: string; l: string }[]; values: string[]; onChange: (v: string[]) => void
}) {
  const toggle = (v: string) => onChange(values.includes(v) ? values.filter(x => x !== v) : [...values, v])
  return (
    <div className="flex flex-wrap gap-3">
      {opts.map(o => (
        <label key={o.v} className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={values.includes(o.v)} onChange={() => toggle(o.v)} className="accent-white w-3.5 h-3.5" />
          <span className="text-sm text-[#efefef]">{o.l}</span>
        </label>
      ))}
    </div>
  )
}

function Scale({ value, onChange, low, high }: { value: number; onChange: (n: number) => void; low: string; high: string }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-1.5">
        {[1,2,3,4,5,6,7,8,9,10].map(n => (
          <button key={n} type="button" onClick={() => onChange(n)}
            className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${
              value === n ? 'bg-white text-black' : 'bg-[#1c1c1c] text-[#666666] hover:bg-[#2e2e2e] hover:text-[#efefef]'
            }`}>{n}</button>
        ))}
      </div>
      <div className="flex justify-between text-[10px] text-[#3a3a3a]">
        <span>{low}</span><span>{high}</span>
      </div>
    </div>
  )
}

// Chevron icon
function Chevron({ open }: { open: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      className={`transition-transform duration-200 ${open ? 'rotate-180' : ''} text-[#444444]`}>
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  )
}

// Accordion section with summary line
function Section({ title, summary, children }: { title: string; summary?: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-[#2e2e2e] rounded-xl overflow-hidden">
      <button type="button" onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-[#1c1c1c] transition-colors text-left">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-[#efefef]">{title}</p>
          {summary && !open && (
            <p className="text-xs text-[#444444] mt-0.5 truncate pr-4">{summary}</p>
          )}
        </div>
        <Chevron open={open} />
      </button>
      {open && (
        <div className="px-5 pb-6 pt-4 border-t border-[#2e2e2e] space-y-5">
          {children}
        </div>
      )}
    </div>
  )
}

const RATING = [
  { v: 'sehr gut', l: 'Sehr gut' }, { v: 'gut', l: 'Gut' },
  { v: 'mittelmäßig', l: 'Mittelmäßig' }, { v: 'schlecht', l: 'Schlecht' },
  { v: 'sehr schlecht', l: 'Sehr schlecht' },
]
const YESNO = [{ v: 'ja', l: 'Ja' }, { v: 'nein', l: 'Nein' }]

type Props = { id: string; clientId: string; initialData: AnamneseFormData }

export default function AnamneseBearbeitenForm({ id, clientId, initialData }: Props) {
  const [d, setD] = useState<AnamneseFormData>(initialData)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [isPending, startTransition] = useTransition()

  useEffect(() => { setD(initialData) }, [id])

  const set = (u: Partial<AnamneseFormData>) => { setD(p => ({ ...p, ...u })); setSaved(false) }

  const handleSave = () => {
    setError(null)
    startTransition(async () => {
      const result = await updateAnamnese(id, clientId, d)
      if (result?.error) setError(result.error)
      else setSaved(true)
    })
  }

  // Summary helpers
  const s_ziele = [d.ziele.join(', '), d.motivation ? `„${d.motivation.slice(0, 40)}${d.motivation.length > 40 ? '…' : ''}"` : ''].filter(Boolean).join(' · ') || undefined
  const s_koerper = [d.aktuellesGewicht && `${d.aktuellesGewicht} kg`, d.koerperfett && `${d.koerperfett}% KF`, d.taillenumfang && `${d.taillenumfang} cm Taille`].filter(Boolean).join(' · ') || undefined
  const s_ern = [d.ernaehrungBewertung, d.wasserLiter && `${d.wasserLiter} L Wasser`, d.mahlzeitenProTag && `${d.mahlzeitenProTag} Mahlzeiten`].filter(Boolean).join(' · ') || undefined
  const s_alltag = [d.arbeitstag, d.sportProWoche && `${d.sportProWoche}×/Woche Sport`, d.freizeitAktivitaet].filter(Boolean).join(' · ') || undefined
  const s_schlaf = [d.schlafStunden && `${d.schlafStunden}h`, d.schlafQualitaet].filter(Boolean).join(' · ') || undefined
  const s_stress = [d.stressLevel && `Level ${d.stressLevel}/10`, d.wohlbefinden && `Befinden: ${d.wohlbefinden}`].filter(Boolean).join(' · ') || undefined
  const s_gesund = [d.erkrankungen === 'ja' && 'Erkrankungen vorhanden', d.medikamente === 'ja' && 'Medikamente', d.operationen === 'ja' && 'Operationen'].filter(Boolean).join(' · ') || 'Keine Angaben'

  return (
    <div className="space-y-2">
      {/* 1. Ziele */}
      <Section title="Ziele & Motivation" summary={s_ziele}>
        <F label="Aktuelle Ziele (Mehrfachauswahl)">
          <Checks opts={[
            { v: 'Abnehmen', l: 'Abnehmen' }, { v: 'Muskelaufbau', l: 'Muskelaufbau' },
            { v: 'Körperfett reduzieren', l: 'Körperfett reduzieren' }, { v: 'Gesünder leben', l: 'Gesünder leben' },
            { v: 'Leistungssteigerung', l: 'Leistungssteigerung' }, { v: 'Mehr Energie', l: 'Mehr Energie' },
          ]} values={d.ziele} onChange={v => set({ ziele: v })} />
        </F>
        <F label="Sonstiges Ziel">
          <input className={ic} value={d.zieleSonstiges} onChange={e => set({ zieleSonstiges: e.target.value })} placeholder="Weiteres Ziel…" />
        </F>
        <F label="Wichtigste Motivation">
          <textarea rows={3} className={tc} value={d.motivation} onChange={e => set({ motivation: e.target.value })} placeholder="Was treibt dich an?" />
        </F>
        <F label={`Wichtigkeit (${d.zielWichtigkeit}/10)`}>
          <Scale value={d.zielWichtigkeit} onChange={v => set({ zielWichtigkeit: v })} low="1 – wenig wichtig" high="10 – sehr wichtig" />
        </F>
        <F label="Bis wann?">
          <input className={ic} value={d.zielDatum} onChange={e => set({ zielDatum: e.target.value })} placeholder="z. B. bis Dezember 2025…" />
        </F>
      </Section>

      {/* 2. Körperdaten */}
      <Section title="Körperdaten" summary={s_koerper}>
        <div className="grid grid-cols-2 gap-3">
          <F label="Größe (cm)"><input type="number" className={ic} value={d.groesse} onChange={e => set({ groesse: e.target.value })} placeholder="170" /></F>
          <F label="Gewicht (kg)"><input type="number" step="0.1" className={ic} value={d.aktuellesGewicht} onChange={e => set({ aktuellesGewicht: e.target.value })} placeholder="70.0" /></F>
          <F label="vor 3 Mon. (kg)"><input type="number" step="0.1" className={ic} value={d.gewichtVor3Monaten} onChange={e => set({ gewichtVor3Monaten: e.target.value })} placeholder="72.0" /></F>
          <F label="vor 1 Jahr (kg)"><input type="number" step="0.1" className={ic} value={d.gewichtVor1Jahr} onChange={e => set({ gewichtVor1Jahr: e.target.value })} placeholder="75.0" /></F>
          <F label="Wunschgewicht (kg)"><input type="number" step="0.1" className={ic} value={d.wunschgewicht} onChange={e => set({ wunschgewicht: e.target.value })} placeholder="65.0" /></F>
          <F label="Körperfett (%)"><input type="number" step="0.1" className={ic} value={d.koerperfett} onChange={e => set({ koerperfett: e.target.value })} placeholder="28.0" /></F>
          <F label="Taille (cm)"><input type="number" step="0.1" className={ic} value={d.taillenumfang} onChange={e => set({ taillenumfang: e.target.value })} placeholder="82" /></F>
        </div>
        <F label="Gewicht verändert?"><Radio name="gv_e" opts={YESNO} value={d.gewichtVeraendert} onChange={v => set({ gewichtVeraendert: v })} /></F>
        {d.gewichtVeraendert === 'ja' && <F label="Wie?"><input className={ic} value={d.gewichtVeraendertWie} onChange={e => set({ gewichtVeraendertWie: e.target.value })} placeholder="Zugenommen durch Stress…" /></F>}
        <F label="Sonstige Maße"><textarea rows={2} className={tc} value={d.sonstigeMasse} onChange={e => set({ sonstigeMasse: e.target.value })} placeholder="Hüfte, Oberschenkel…" /></F>
      </Section>

      {/* 3. Ernährung */}
      <Section title="Ernährung" summary={s_ern}>
        <F label="Ernährung bewerten"><Radio name="eb_e" opts={RATING} value={d.ernaehrungBewertung} onChange={v => set({ ernaehrungBewertung: v })} /></F>
        <F label="Mahlzeiten/Tag"><input type="number" className={`${ic} w-28`} value={d.mahlzeitenProTag} onChange={e => set({ mahlzeitenProTag: e.target.value })} placeholder="3" /></F>
        <F label="Essgewohnheiten">
          <Checks opts={[
            { v: 'Frühstücke regelmäßig', l: 'Frühstücke regelmäßig' }, { v: 'Essen zwischendurch', l: 'Essen zwischendurch' },
            { v: 'Heißhungerattacken', l: 'Heißhungerattacken' }, { v: 'Späte Mahlzeiten', l: 'Späte Mahlzeiten' },
            { v: 'Emotionales Essen', l: 'Emotionales Essen' }, { v: 'Unregelmäßige Zeiten', l: 'Unregelmäßige Zeiten' },
          ]} values={d.essgewohnheiten} onChange={v => set({ essgewohnheiten: v })} />
        </F>
        <F label="Unverträglichkeiten?"><Radio name="lu_e" opts={YESNO} value={d.lebensmittelUnvertraeglichkeit} onChange={v => set({ lebensmittelUnvertraeglichkeit: v })} /></F>
        {d.lebensmittelUnvertraeglichkeit === 'ja' && <F label="Welche?"><input className={ic} value={d.lebensmittelUnvertraeglichkeitWelche} onChange={e => set({ lebensmittelUnvertraeglichkeitWelche: e.target.value })} placeholder="Laktose, Gluten…" /></F>}
        <div className="grid grid-cols-2 gap-3">
          <F label="Wasser (L/Tag)"><input type="number" step="0.1" className={ic} value={d.wasserLiter} onChange={e => set({ wasserLiter: e.target.value })} placeholder="2.0" /></F>
          <F label="Kaffee (Tassen)"><input type="number" step="0.5" className={ic} value={d.kaffeeTassen} onChange={e => set({ kaffeeTassen: e.target.value })} placeholder="2" /></F>
          <F label="Alkohol (Port.)"><input type="number" step="0.5" className={ic} value={d.alkoholPortionen} onChange={e => set({ alkoholPortionen: e.target.value })} placeholder="0" /></F>
          <F label="Softdrinks (L)"><input type="number" step="0.1" className={ic} value={d.softdrinksLiter} onChange={e => set({ softdrinksLiter: e.target.value })} placeholder="0" /></F>
        </div>
        <F label="Ernährungstagebuch?"><Radio name="et_e" opts={YESNO} value={d.ernaehrungstagebuch} onChange={v => set({ ernaehrungstagebuch: v })} /></F>
      </Section>

      {/* 4. Alltag */}
      <Section title="Alltag & Lifestyle" summary={s_alltag}>
        <F label="Arbeitstag">
          <Radio name="at_e" opts={[
            { v: 'überwiegend sitzend', l: 'Überwiegend sitzend' }, { v: 'überwiegend stehend', l: 'Überwiegend stehend' },
            { v: 'körperlich aktiv', l: 'Körperlich aktiv' }, { v: 'wechselnd', l: 'Wechselnd' },
          ]} value={d.arbeitstag} onChange={v => set({ arbeitstag: v })} />
        </F>
        <F label="Freizeitaktivität">
          <Radio name="fa_e" opts={[
            { v: 'gar nicht', l: 'Gar nicht' }, { v: 'wenig', l: 'Wenig' },
            { v: 'moderat', l: 'Moderat' }, { v: 'aktiv', l: 'Aktiv' }, { v: 'sehr aktiv', l: 'Sehr aktiv' },
          ]} value={d.freizeitAktivitaet} onChange={v => set({ freizeitAktivitaet: v })} />
        </F>
        <div className="grid grid-cols-2 gap-3">
          <F label="Sport (×/Woche)"><input type="number" className={`${ic} w-28`} value={d.sportProWoche} onChange={e => set({ sportProWoche: e.target.value })} placeholder="3" /></F>
          <F label="Art des Sports"><input className={ic} value={d.sportArt} onChange={e => set({ sportArt: e.target.value })} placeholder="Laufen, Krafttraining…" /></F>
        </div>
        <F label="Schritte/Tag">
          <Radio name="sc_e" opts={[
            { v: '< 3.000', l: '< 3.000' }, { v: '3.000–7.000', l: '3.000–7.000' },
            { v: '7.000–10.000', l: '7.000–10.000' }, { v: '> 10.000', l: '> 10.000' },
          ]} value={d.schritte} onChange={v => set({ schritte: v })} />
        </F>
        <F label="Raucher?"><Radio name="ra_e" opts={YESNO} value={d.raucher} onChange={v => set({ raucher: v })} /></F>
        {d.raucher === 'ja' && <F label="Wie viel/Tag?"><input className={ic} value={d.raucherMenge} onChange={e => set({ raucherMenge: e.target.value })} placeholder="10 Zigaretten" /></F>}
      </Section>

      {/* 5. Schlaf */}
      <Section title="Schlaf" summary={s_schlaf}>
        <F label="Schlafstunden/Nacht"><input type="number" step="0.5" className={`${ic} w-32`} value={d.schlafStunden} onChange={e => set({ schlafStunden: e.target.value })} placeholder="7" /></F>
        <F label="Schlafqualität"><Radio name="sq_e" opts={RATING} value={d.schlafQualitaet} onChange={v => set({ schlafQualitaet: v })} /></F>
        <F label="Schlafprobleme?"><Radio name="sp_e" opts={YESNO} value={d.schlafProbleme} onChange={v => set({ schlafProbleme: v })} /></F>
        {d.schlafProbleme === 'ja' && <F label="Welche?"><textarea rows={2} className={tc} value={d.schlafProblemeWelche} onChange={e => set({ schlafProblemeWelche: e.target.value })} placeholder="Einschlafen, Durchschlafen…" /></F>}
      </Section>

      {/* 6. Stress */}
      <Section title="Stress & Wohlbefinden" summary={s_stress}>
        <F label={`Stresslevel (${d.stressLevel}/10)`}>
          <Scale value={d.stressLevel} onChange={v => set({ stressLevel: v })} low="1 – kein Stress" high="10 – sehr hoch" />
        </F>
        <F label="Stressfaktoren"><textarea rows={2} className={tc} value={d.stressfaktoren} onChange={e => set({ stressfaktoren: e.target.value })} placeholder="Arbeit, Familie…" /></F>
        <F label="Stressbewältigung"><textarea rows={2} className={tc} value={d.stressBewaeltigung} onChange={e => set({ stressBewaeltigung: e.target.value })} placeholder="Sport, Meditation…" /></F>
        <F label="Allgemeines Wohlbefinden"><Radio name="wb_e" opts={RATING} value={d.wohlbefinden} onChange={v => set({ wohlbefinden: v })} /></F>
      </Section>

      {/* 7. Gesundheit */}
      <Section title="Gesundheit" summary={s_gesund}>
        <F label="Erkrankungen?"><Radio name="erk_e" opts={YESNO} value={d.erkrankungen} onChange={v => set({ erkrankungen: v })} /></F>
        {d.erkrankungen === 'ja' && <F label="Welche?"><textarea rows={2} className={tc} value={d.erkrankungenWelche} onChange={e => set({ erkrankungenWelche: e.target.value })} placeholder="Diabetes, Bluthochdruck…" /></F>}
        <F label="Medikamente / NEM?"><Radio name="med_e" opts={YESNO} value={d.medikamente} onChange={v => set({ medikamente: v })} /></F>
        {d.medikamente === 'ja' && <F label="Welche?"><textarea rows={2} className={tc} value={d.medikamenteWelche} onChange={e => set({ medikamenteWelche: e.target.value })} placeholder="Metformin, Vitamin D…" /></F>}
        <F label="Operationen?"><Radio name="op_e" opts={YESNO} value={d.operationen} onChange={v => set({ operationen: v })} /></F>
        {d.operationen === 'ja' && <F label="Welche & wann?"><textarea rows={2} className={tc} value={d.operationenWann} onChange={e => set({ operationenWann: e.target.value })} placeholder="Appendix 2019…" /></F>}
        <F label="Sonstige Infos"><textarea rows={3} className={tc} value={d.sonstigeInfos} onChange={e => set({ sonstigeInfos: e.target.value })} placeholder="Alles Wichtige…" /></F>
      </Section>

      {/* Save bar */}
      <div className="sticky bottom-4 md:bottom-6 z-10">
        <div className="bg-[#141414] border border-[#2e2e2e] rounded-xl px-5 py-3.5 flex items-center justify-between shadow-xl shadow-black/40">
          <div>
            {error && <p className="text-xs text-red-400">{error}</p>}
            {saved && <p className="text-xs text-emerald-400">Gespeichert</p>}
            {!error && !saved && <p className="text-xs text-[#3a3a3a]">Klicke eine Kategorie um sie zu bearbeiten</p>}
          </div>
          <button type="button" onClick={handleSave} disabled={isPending}
            className="bg-white hover:bg-[#e8e8e8] disabled:opacity-50 text-black font-semibold text-sm px-5 py-2 rounded-lg transition-colors">
            {isPending ? 'Speichern…' : 'Speichern'}
          </button>
        </div>
      </div>
    </div>
  )
}
