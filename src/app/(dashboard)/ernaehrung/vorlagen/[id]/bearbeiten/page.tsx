import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import ErnaehrungsBuilder from '@/components/ErnaehrungsBuilder'
import type { ZeileInput } from '@/components/ErnaehrungsBuilder'

export default async function VorlageBearbeitenPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const vorlage = await prisma.ernaehrungsVorlage.findUnique({
    where: { id: params.id },
    include: { zeilen: { orderBy: { reihenfolge: 'asc' } } },
  })
  if (!vorlage) notFound()

  const initialZeilen: ZeileInput[] = vorlage.zeilen.map(z => ({
    zeitpunkt:     z.zeitpunkt,
    kalorien:      z.kalorien?.toString() ?? '',
    protein:       z.protein?.toString() ?? '',
    kohlenhydrate: z.kohlenhydrate?.toString() ?? '',
    fett:          z.fett?.toString() ?? '',
    notizen:       z.notizen ?? '',
    reihenfolge:   z.reihenfolge,
  }))

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-3xl">
      <Link href="/ernaehrung" className="text-xs text-[#555555] hover:text-[#efefef] transition-colors inline-flex items-center gap-1 mb-2">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
          Ernährung
      </Link>
      <h1 className="text-xl font-bold text-white mt-3 mb-6">Vorlage bearbeiten</h1>
      <ErnaehrungsBuilder
        editVorlageId={vorlage.id}
        initialName={vorlage.name}
        initialBeschreibung={vorlage.beschreibung ?? ''}
        initialZeilen={initialZeilen}
        cancelHref="/ernaehrung"
      />
    </div>
  )
}
