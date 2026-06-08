import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import AnamneseBearbeitenForm from '@/components/AnamneseBearbeitenForm'
import type { AnamneseFormData } from '@/app/actions/clients'
import type { Anamnese } from '@prisma/client'
import { parseJsonArray } from '@/lib/client-utils'

function toFormData(a: Anamnese): AnamneseFormData {
  const str = (v: number | null) => v != null ? String(v) : ''
  const bool = (v: boolean | null) => v === true ? 'ja' : v === false ? 'nein' : ''
  return {
    ziele: parseJsonArray(a.ziele),
    zieleSonstiges: a.zieleSonstiges ?? '',
    motivation: a.motivation ?? '',
    zielWichtigkeit: a.zielWichtigkeit ?? 5,
    zielDatum: a.zielDatum ?? '',
    groesse: str(a.groesse),
    aktuellesGewicht: str(a.aktuellesGewicht),
    gewichtVor3Monaten: str(a.gewichtVor3Monaten),
    gewichtVor1Jahr: str(a.gewichtVor1Jahr),
    wunschgewicht: str(a.wunschgewicht),
    gewichtVeraendert: bool(a.gewichtVeraendert),
    gewichtVeraendertWie: a.gewichtVeraendertWie ?? '',
    koerperfett: str(a.koerperfett),
    taillenumfang: str(a.taillenumfang),
    sonstigeMasse: a.sonstigeMasse ?? '',
    ernaehrungBewertung: a.ernaehrungBewertung ?? '',
    mahlzeitenProTag: a.mahlzeitenProTag != null ? String(a.mahlzeitenProTag) : '',
    essgewohnheiten: parseJsonArray(a.essgewohnheiten),
    essgewohnheitenSonstiges: a.essgewohnheitenSonstiges ?? '',
    lebensmittelUnvertraeglichkeit: bool(a.lebensmittelUnvertraeglichkeit),
    lebensmittelUnvertraeglichkeitWelche: a.lebensmittelUnvertraeglichkeitWelche ?? '',
    wasserLiter: str(a.wasserLiter),
    kaffeeTassen: str(a.kaffeeTassen),
    alkoholPortionen: str(a.alkoholPortionen),
    softdrinksLiter: str(a.softdrinksLiter),
    ernaehrungstagebuch: bool(a.ernaehrungstagebuch),
    arbeitstag: a.arbeitstag ?? '',
    freizeitAktivitaet: a.freizeitAktivitaet ?? '',
    sportProWoche: a.sportProWoche != null ? String(a.sportProWoche) : '',
    sportArt: a.sportArt ?? '',
    schritte: a.schritte ?? '',
    raucher: bool(a.raucher),
    raucherMenge: a.raucherMenge ?? '',
    schlafStunden: str(a.schlafStunden),
    schlafQualitaet: a.schlafQualitaet ?? '',
    schlafProbleme: bool(a.schlafProbleme),
    schlafProblemeWelche: a.schlafProblemeWelche ?? '',
    stressLevel: a.stressLevel ?? 5,
    stressfaktoren: a.stressfaktoren ?? '',
    stressBewaeltigung: a.stressBewaeltigung ?? '',
    wohlbefinden: a.wohlbefinden ?? '',
    erkrankungen: bool(a.erkrankungen),
    erkrankungenWelche: a.erkrankungenWelche ?? '',
    medikamente: bool(a.medikamente),
    medikamenteWelche: a.medikamenteWelche ?? '',
    operationen: bool(a.operationen),
    operationenWann: a.operationenWann ?? '',
    sonstigeInfos: a.sonstigeInfos ?? '',
  }
}

export default async function BearbeitenPage(props: { params: Promise<{ id: string; anamneseId: string }> }) {
  const params = await props.params;
  const [anamnese, client] = await Promise.all([
    prisma.anamnese.findFirst({ where: { id: params.anamneseId, clientId: params.id } }),
    prisma.client.findUnique({ where: { id: params.id }, select: { vorname: true, nachname: true } }),
  ])
  if (!anamnese || !client) notFound()

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-3xl">
      <div className="mb-6">
        <Link href={`/clients/${params.id}`} className="text-xs text-[#555555] hover:text-[#efefef] transition-colors inline-flex items-center gap-1 mb-2">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
          {client.vorname} {client.nachname}
        </Link>
        <h1 className="text-xl font-bold text-white mt-2">Anamnese bearbeiten</h1>
        <p className="text-sm text-[#3a3a3a] mt-0.5">
          {client.vorname} {client.nachname} · {new Date(anamnese.datum).toLocaleDateString('de-DE')}
        </p>
      </div>
      <AnamneseBearbeitenForm
        key={anamnese.id}
        id={anamnese.id}
        clientId={params.id}
        initialData={toFormData(anamnese)}
      />
    </div>
  )
}
