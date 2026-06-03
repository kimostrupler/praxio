'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import type { Anamnese } from '@prisma/client'
import { updateAnamniseDatum } from '@/app/actions/clients'

type Props = { anamnese: Anamnese; clientId: string; isLatest: boolean }

function bmi(w: number | null, h: number | null) {
  if (!w || !h) return null
  return (w / Math.pow(h / 100, 2)).toFixed(1)
}

const B = (v: boolean | null | undefined) => v === true ? 'Ja' : v === false ? 'Nein' : undefined
const V = (v: string | number | null | undefined, s = '') => (v != null && v !== '') ? `${v}${s}` : undefined

function Row({ label, value }: { label: string; value?: string | number | null }) {
  if (value == null || value === '') return null
  return (
    <>
      <dt className="text-[10px] text-[#3a3a3a] uppercase tracking-wide pt-0.5">{label}</dt>
      <dd className="text-sm text-[#efefef]">{value}</dd>
    </>
  )
}

function RowWide({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div className="col-span-2">
      <dt className="text-[10px] text-[#3a3a3a] uppercase tracking-wide mb-0.5">{label}</dt>
      <dd className="text-sm text-[#efefef] leading-relaxed">{value}</dd>
    </div>
  )
}

function Sec({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <p className="text-[10px] font-semibold text-[#3a3a3a] uppercase tracking-wider mb-3">{title}</p>
      <dl className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">{children}</dl>
    </section>
  )
}

export default function AnamneseKarte({ anamnese: a, clientId, isLatest }: Props) {
  const [open, setOpen] = useState(false)
  const [dateVal, setDateVal] = useState(new Date(a.datum).toISOString().split('T')[0])
  const [, startTransition] = useTransition()
  const bmiVal = bmi(a.aktuellesGewicht, a.groesse)

  const handleDateChange = (v: string) => {
    setDateVal(v)
    startTransition(async () => { await updateAnamniseDatum(a.id, clientId, v) })
  }

  return (
    <div className="bg-[#141414] border border-[#2e2e2e] rounded-xl overflow-hidden">
      {/* Preview header */}
      <div className="px-5 py-4 cursor-pointer hover:bg-[#1c1c1c] transition-colors select-none"
        onClick={() => setOpen(o => !o)}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <input
                type="date"
                value={dateVal}
                onClick={e => e.stopPropagation()}
                onChange={e => { e.stopPropagation(); handleDateChange(e.target.value) }}
                className="bg-transparent text-sm font-semibold text-[#efefef] border-none outline-none cursor-pointer hover:text-white"
              />
              {isLatest && (
                <span className="text-[10px] font-medium text-white bg-white/10 border border-white/10 px-1.5 py-0.5 rounded">
                  Aktuell
                </span>
              )}
            </div>

            {/* Key metrics */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
              {a.aktuellesGewicht != null && <span className="text-[#efefef] font-medium">{a.aktuellesGewicht} kg</span>}
              {a.koerperfett != null && <span className="text-[#666666]">{a.koerperfett}% KF</span>}
              {bmiVal && <span className="text-[#666666]">BMI {bmiVal}</span>}
              {a.taillenumfang != null && <span className="text-[#666666]">{a.taillenumfang} cm</span>}
              {a.stressLevel != null && <span className="text-[#666666]">Stress {a.stressLevel}/10</span>}
              {a.schlafStunden != null && <span className="text-[#666666]">{a.schlafStunden}h Schlaf</span>}
              {a.sportProWoche != null && <span className="text-[#666666]">{a.sportProWoche}× Sport</span>}
            </div>

            {(a.wohlbefinden || a.schlafQualitaet || a.ernaehrungBewertung) && (
              <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-[#3a3a3a] mt-1">
                {a.wohlbefinden && <span>Befinden: {a.wohlbefinden}</span>}
                {a.schlafQualitaet && <span>Schlaf: {a.schlafQualitaet}</span>}
                {a.ernaehrungBewertung && <span>Ernährung: {a.ernaehrungBewertung}</span>}
              </div>
            )}

            {a.ziele.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {a.ziele.map(z => (
                  <span key={z} className="text-[10px] bg-white/5 text-white/50 border border-white/10 px-1.5 py-0.5 rounded-full">{z}</span>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <a
              href={`/api/pdf/anamnese/${a.id}`}
              download
              onClick={e => e.stopPropagation()}
              className="text-xs text-[#444444] hover:text-white transition-colors flex items-center gap-1">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              PDF
            </a>
            <Link href={`/clients/${clientId}/anamnese/${a.id}/bearbeiten`}
              onClick={e => e.stopPropagation()}
              className="text-xs text-[#666666] hover:text-white transition-colors">
              Bearbeiten
            </Link>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              className={`text-[#3a3a3a] transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </div>
        </div>
      </div>

      {/* Full details */}
      {open && (
        <div className="border-t border-[#1c1c1c] px-5 py-5 space-y-5">
          {(a.ziele.length > 0 || a.motivation) && (
            <Sec title="Ziele & Motivation">
              <Row label="Ziele" value={a.ziele.join(', ')} />
              <Row label="Wichtigkeit" value={a.zielWichtigkeit != null ? `${a.zielWichtigkeit}/10` : undefined} />
              <Row label="Bis wann" value={a.zielDatum} />
              <RowWide label="Motivation" value={a.motivation} />
            </Sec>
          )}
          <Sec title="Körperdaten">
            <Row label="Größe" value={V(a.groesse, ' cm')} />
            <Row label="Gewicht" value={V(a.aktuellesGewicht, ' kg')} />
            <Row label="vor 3 Mon." value={V(a.gewichtVor3Monaten, ' kg')} />
            <Row label="vor 1 Jahr" value={V(a.gewichtVor1Jahr, ' kg')} />
            <Row label="Wunschgewicht" value={V(a.wunschgewicht, ' kg')} />
            <Row label="Körperfett" value={V(a.koerperfett, ' %')} />
            <Row label="Taillenumfang" value={V(a.taillenumfang, ' cm')} />
            <Row label="Verändert" value={B(a.gewichtVeraendert)} />
            <RowWide label="Wie" value={a.gewichtVeraendert ? a.gewichtVeraendertWie : null} />
            <RowWide label="Sonstige Maße" value={a.sonstigeMasse} />
          </Sec>
          <Sec title="Ernährung">
            <Row label="Bewertung" value={a.ernaehrungBewertung} />
            <Row label="Mahlzeiten/Tag" value={a.mahlzeitenProTag} />
            <Row label="Wasser" value={V(a.wasserLiter, ' L/Tag')} />
            <Row label="Kaffee" value={V(a.kaffeeTassen, ' Tassen')} />
            {a.essgewohnheiten.length > 0 && <RowWide label="Gewohnheiten" value={a.essgewohnheiten.join(', ')} />}
            {a.lebensmittelUnvertraeglichkeit && <RowWide label="Unverträglichkeiten" value={a.lebensmittelUnvertraeglichkeitWelche} />}
          </Sec>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Sec title="Alltag & Lifestyle">
              <Row label="Arbeitstag" value={a.arbeitstag} />
              <Row label="Freizeit" value={a.freizeitAktivitaet} />
              <Row label="Sport" value={a.sportProWoche != null ? `${a.sportProWoche} ×/Woche` : undefined} />
              <Row label="Schritte/Tag" value={a.schritte} />
            </Sec>
            <Sec title="Schlaf">
              <Row label="Stunden/Nacht" value={V(a.schlafStunden, ' h')} />
              <Row label="Qualität" value={a.schlafQualitaet} />
              <Row label="Probleme" value={B(a.schlafProbleme)} />
            </Sec>
          </div>
          <Sec title="Stress & Wohlbefinden">
            <Row label="Stresslevel" value={a.stressLevel != null ? `${a.stressLevel}/10` : undefined} />
            <Row label="Wohlbefinden" value={a.wohlbefinden} />
            <RowWide label="Stressfaktoren" value={a.stressfaktoren} />
          </Sec>
          {(a.erkrankungen != null || a.medikamente != null || a.operationen != null) && (
            <Sec title="Gesundheit">
              <Row label="Erkrankungen" value={B(a.erkrankungen)} />
              {a.erkrankungen && <RowWide label="Welche" value={a.erkrankungenWelche} />}
              <Row label="Medikamente/NEM" value={B(a.medikamente)} />
              {a.medikamente && <RowWide label="Welche" value={a.medikamenteWelche} />}
              <Row label="Operationen" value={B(a.operationen)} />
              {a.operationen && <RowWide label="Welche & wann" value={a.operationenWann} />}
              <RowWide label="Sonstige Infos" value={a.sonstigeInfos} />
            </Sec>
          )}
        </div>
      )}
    </div>
  )
}
