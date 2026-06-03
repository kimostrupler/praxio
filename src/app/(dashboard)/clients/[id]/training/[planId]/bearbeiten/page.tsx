import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import TrainingsPlanBuilder from '@/components/TrainingsPlanBuilder'
import { parseJsonArray } from '@/lib/client-utils'

export default async function TrainingsplanBearbeitenPage(
  props: {
    params: Promise<{ id: string; planId: string }>
  }
) {
  const params = await props.params;
  const [client, plan, alleUebungen] = await Promise.all([
    prisma.client.findUnique({
      where: { id: params.id },
      include: { anamnesen: { orderBy: { datum: 'desc' }, take: 1 } },
    }),
    prisma.trainingsPlan.findUnique({
      where: { id: params.planId },
      include: {
        uebungen: {
          orderBy: { reihenfolge: 'asc' },
          include: { uebung: { select: { name: true, kategorie: true } } },
        },
      },
    }),
    prisma.uebung.findMany({ orderBy: [{ kategorie: 'asc' }, { name: 'asc' }] }),
  ])

  if (!client || !plan || plan.clientId !== params.id) notFound()

  const clientZiele = parseJsonArray(client.anamnesen[0]?.ziele)

  const initialUebungen = plan.uebungen.map(u => ({
    uebungId: u.uebungId,
    uebungName: u.uebung.name,
    kategorie: u.uebung.kategorie,
    saetze: u.saetze,
    wiederholungen: u.wiederholungen,
    gewicht: u.gewicht,
    dauer: u.dauer,
    pause: u.pause,
    notizen: u.notizen,
  }))

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-5xl">
      <div className="mb-6">
        <Link href={`/clients/${params.id}?tab=training`}
          className="text-xs text-[#555555] hover:text-[#efefef] transition-colors inline-flex items-center gap-1 mb-2">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
          {client.vorname} {client.nachname} · Training
        </Link>
        <h1 className="text-xl font-bold text-white mt-2">Trainingsplan bearbeiten</h1>
        <p className="text-xs text-[#444444] mt-0.5">{plan.name}</p>
      </div>
      <TrainingsPlanBuilder
        clientId={params.id}
        clientZiele={clientZiele}
        alleUebungen={alleUebungen.map(u => ({ ...u, ziele: parseJsonArray(u.ziele) }))}
        previousPlans={[]}
        editPlanId={params.planId}
        initialName={plan.name}
        initialNotizen={plan.notizen ?? ''}
        initialUebungen={initialUebungen}
      />
    </div>
  )
}
