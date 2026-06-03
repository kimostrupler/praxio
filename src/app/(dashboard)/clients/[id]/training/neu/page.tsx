import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import TrainingsPlanBuilder from '@/components/TrainingsPlanBuilder'

export default async function NeuerTrainingsplanPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const [client, alleUebungen, previousPlans] = await Promise.all([
    prisma.client.findUnique({
      where: { id: params.id },
      include: { anamnesen: { orderBy: { datum: 'desc' }, take: 1 } },
    }),
    prisma.uebung.findMany({ orderBy: [{ kategorie: 'asc' }, { name: 'asc' }] }),
    prisma.trainingsPlan.findMany({
      where: { clientId: params.id },
      orderBy: { datum: 'desc' },
      take: 5,
      include: {
        uebungen: {
          orderBy: { reihenfolge: 'asc' },
          include: { uebung: { select: { name: true, kategorie: true } } },
        },
      },
    }),
  ])

  if (!client) notFound()

  const clientZiele = client.anamnesen[0]?.ziele ?? []

  // Serialize for client component
  const prevPlansData = previousPlans.map(p => ({
    id: p.id,
    name: p.name,
    datum: p.datum,
    uebungen: p.uebungen.map(u => ({
      uebungId: u.uebungId,
      uebungName: u.uebung.name,
      kategorie: u.uebung.kategorie,
      saetze: u.saetze,
      wiederholungen: u.wiederholungen,
      gewicht: u.gewicht,
      dauer: u.dauer,
      pause: u.pause,
      notizen: u.notizen ?? null,
    })),
  }))

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-5xl">
      <div className="mb-6">
        <Link href={`/clients/${params.id}?tab=training`}
          className="text-xs text-[#555555] hover:text-[#efefef] transition-colors inline-flex items-center gap-1 mb-2">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
          {client.vorname} {client.nachname} · Training
        </Link>
        <h1 className="text-xl font-bold text-white mt-2">Neuer Trainingsplan</h1>
        {clientZiele.length > 0 && (
          <p className="text-xs text-[#444444] mt-0.5">
            Ziele: {clientZiele.join(', ')}
          </p>
        )}
      </div>
      <TrainingsPlanBuilder
        clientId={params.id}
        clientZiele={clientZiele}
        alleUebungen={alleUebungen}
        previousPlans={prevPlansData}
      />
    </div>
  )
}
