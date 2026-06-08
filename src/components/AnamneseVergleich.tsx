import type { Anamnese } from '@prisma/client'
import { parseJsonArray } from '@/lib/client-utils'

type Props = { alt: Anamnese; neu: Anamnese }

const RATING: Record<string, number> = { 'sehr gut': 5, 'gut': 4, 'mittelmäßig': 3, 'schlecht': 2, 'sehr schlecht': 1 }
const ACTIVITY: Record<string, number> = { 'sehr aktiv': 5, 'aktiv': 4, 'moderat': 3, 'wenig': 2, 'gar nicht': 1 }

const fmt = (v: number | null | undefined) =>
  v == null ? '—' : v % 1 === 0 ? String(v) : v.toFixed(1)

function MetricCard({ label, altVal, neuVal, unit }: {
  label: string; altVal: number | null | undefined; neuVal: number | null | undefined; unit: string
}) {
  const hasBoth = altVal != null && neuVal != null
  const diff = hasBoth ? neuVal - altVal : null
  const sign = diff != null && diff !== 0 ? (diff > 0 ? '+' : '−') : null
  const absDiff = diff != null ? Math.abs(diff) : null

  return (
    <div className="bg-[#0a0a0a] border border-[#1c1c1c] rounded-xl p-4 overflow-hidden min-w-0">
      <p className="text-[10px] font-medium text-[#3a3a3a] uppercase tracking-wider mb-2 truncate">{label}</p>
      {hasBoth ? (
        <>
          <p className="text-sm font-semibold text-[#efefef] truncate">
            {fmt(altVal)} <span className="text-[#3a3a3a] font-normal mx-1">→</span> {fmt(neuVal)}
            <span className="text-xs text-[#444444] font-normal ml-1">{unit}</span>
          </p>
          {sign && absDiff != null ? (
            <p className="text-xs text-[#666666] mt-1.5">
              {sign}{absDiff % 1 === 0 ? absDiff : absDiff.toFixed(1)} {unit}
            </p>
          ) : (
            <p className="text-xs text-[#2e2e2e] mt-1.5">Unverändert</p>
          )}
        </>
      ) : (
        <p className="text-sm text-[#2e2e2e]">—</p>
      )}
    </div>
  )
}

function RatingCard({ label, altVal, neuVal, scoreMap }: {
  label: string; altVal: string | null | undefined; neuVal: string | null | undefined; scoreMap: Record<string, number>
}) {
  const hasBoth = altVal && neuVal
  const improved = hasBoth && altVal !== neuVal && (scoreMap[neuVal!] ?? 0) > (scoreMap[altVal!] ?? 0)
  const declined = hasBoth && altVal !== neuVal && (scoreMap[neuVal!] ?? 0) < (scoreMap[altVal!] ?? 0)

  return (
    <div className="bg-[#0a0a0a] border border-[#1c1c1c] rounded-xl p-4 overflow-hidden min-w-0">
      <p className="text-[10px] font-medium text-[#3a3a3a] uppercase tracking-wider mb-2 truncate">{label}</p>
      {hasBoth ? (
        <>
          <p className="text-sm text-[#efefef] break-words">
            {altVal} <span className="text-[#3a3a3a] mx-1">→</span> {neuVal}
          </p>
          {improved && <p className="text-xs text-emerald-400 mt-1.5 font-medium">Verbessert</p>}
          {declined && <p className="text-xs text-orange-400 mt-1.5">Verschlechtert</p>}
          {!improved && !declined && <p className="text-xs text-[#2e2e2e] mt-1.5">Unverändert</p>}
        </>
      ) : (
        <p className="text-sm text-[#2e2e2e]">—</p>
      )}
    </div>
  )
}

export default function AnamneseVergleich({ alt, neu }: Props) {
  const days = Math.round(Math.abs(new Date(neu.datum).getTime() - new Date(alt.datum).getTime()) / (1000 * 60 * 60 * 24))
  const d = (date: Date | string) => new Date(date).toLocaleDateString('de-DE')
  const neuZiele = parseJsonArray(neu.ziele)
  const altZiele = parseJsonArray(alt.ziele)
  const added = neuZiele.filter(z => !altZiele.includes(z))
  const removed = altZiele.filter(z => !neuZiele.includes(z))

  return (
    <div className="bg-[#141414] border border-[#2e2e2e] rounded-xl p-5 md:p-6">
      <div className="flex items-baseline justify-between gap-3 mb-5 min-w-0">
        <h3 className="text-sm font-semibold text-white shrink-0">Entwicklung</h3>
        <span className="text-xs text-[#3a3a3a] truncate">{d(alt.datum)} — {d(neu.datum)} · {days} Tage</span>
      </div>

      <p className="text-[10px] font-medium text-[#3a3a3a] uppercase tracking-wider mb-3">Messbare Kennzahlen</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-5">
        <MetricCard label="Gewicht"       altVal={alt.aktuellesGewicht}  neuVal={neu.aktuellesGewicht}  unit="kg" />
        <MetricCard label="Körperfett"    altVal={alt.koerperfett}        neuVal={neu.koerperfett}        unit="%" />
        <MetricCard label="Taillenumfang" altVal={alt.taillenumfang}      neuVal={neu.taillenumfang}      unit="cm" />
        <MetricCard label="Stresslevel"   altVal={alt.stressLevel}        neuVal={neu.stressLevel}        unit="/10" />
        <MetricCard label="Schlaf"        altVal={alt.schlafStunden}      neuVal={neu.schlafStunden}      unit="h" />
        <MetricCard label="Sport"         altVal={alt.sportProWoche}      neuVal={neu.sportProWoche}      unit="×/Woche" />
        <MetricCard label="Wasser"        altVal={alt.wasserLiter}        neuVal={neu.wasserLiter}        unit="L/Tag" />
        <MetricCard label="Wunschgewicht" altVal={alt.wunschgewicht}      neuVal={neu.wunschgewicht}      unit="kg" />
      </div>

      <p className="text-[10px] font-medium text-[#3a3a3a] uppercase tracking-wider mb-3">Bewertungen</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <RatingCard label="Wohlbefinden"     altVal={alt.wohlbefinden}        neuVal={neu.wohlbefinden}        scoreMap={RATING} />
        <RatingCard label="Schlafqualität"   altVal={alt.schlafQualitaet}     neuVal={neu.schlafQualitaet}     scoreMap={RATING} />
        <RatingCard label="Ernährung"        altVal={alt.ernaehrungBewertung} neuVal={neu.ernaehrungBewertung} scoreMap={RATING} />
        <RatingCard label="Freizeitaktivität" altVal={alt.freizeitAktivitaet} neuVal={neu.freizeitAktivitaet}  scoreMap={ACTIVITY} />
      </div>

      {(added.length > 0 || removed.length > 0) && (
        <div className="mt-4 pt-4 border-t border-[#1c1c1c]">
          <p className="text-[10px] font-medium text-[#3a3a3a] uppercase tracking-wider mb-2">Zieländerungen</p>
          <div className="flex flex-wrap gap-1.5">
            {added.map(z => <span key={z} className="text-xs px-2.5 py-1 bg-emerald-950/30 text-emerald-400 border border-emerald-900/30 rounded-full">+ {z}</span>)}
            {removed.map(z => <span key={z} className="text-xs px-2.5 py-1 bg-[#1c1c1c] text-[#444444] border border-[#2e2e2e] rounded-full line-through">{z}</span>)}
          </div>
        </div>
      )}
    </div>
  )
}
