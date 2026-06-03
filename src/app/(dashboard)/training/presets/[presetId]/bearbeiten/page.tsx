import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import PresetBuilder from '@/components/PresetBuilder'
import { parseJsonArray } from '@/lib/client-utils'

export default async function PresetBearbeitenPage(
  props: {
    params: Promise<{ presetId: string }>
  }
) {
  const params = await props.params;
  const [preset, alleUebungen, assignedCount] = await Promise.all([
    prisma.trainingsPreset.findUnique({
      where: { id: params.presetId },
      include: {
        uebungen: {
          orderBy: { reihenfolge: 'asc' },
          include: { uebung: { select: { name: true, kategorie: true } } },
        },
      },
    }),
    prisma.uebung.findMany({ orderBy: [{ kategorie: 'asc' }, { name: 'asc' }] }),
    prisma.trainingsPlan.count({ where: { presetId: params.presetId } }),
  ])

  if (!preset) notFound()

  const initialUebungen = preset.uebungen.map(u => ({
    uebungId: u.uebungId,
    uebungName: u.uebung.name,
    kategorie: u.uebung.kategorie,
    saetze: u.saetze,
    wiederholungen: u.wiederholungen,
    gewicht: u.gewicht,
    dauer: u.dauer,
    pause: u.pause,
  }))

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-5xl">
      <div className="mb-6">
        <Link href="/training?tab=vorlagen"
          className="text-xs text-[#555555] hover:text-[#efefef] transition-colors inline-flex items-center gap-1 mb-2">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
          Training · Vorlagen
        </Link>
        <h1 className="text-xl font-bold text-white mt-2">Vorlage bearbeiten</h1>
        <p className="text-xs text-[#444444] mt-0.5">{preset.name}</p>
      </div>
      <PresetBuilder
        alleUebungen={alleUebungen}
        editPresetId={params.presetId}
        assignedCount={assignedCount}
        initialName={preset.name}
        initialBeschreibung={preset.beschreibung ?? ''}
        initialZiele={parseJsonArray(preset.ziele)}
        initialUebungen={initialUebungen}
      />
    </div>
  )
}
