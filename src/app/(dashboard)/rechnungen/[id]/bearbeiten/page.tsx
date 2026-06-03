import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import RechnungForm from '@/components/RechnungForm'

export default async function RechnungBearbeitenPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const [rechnung, clients] = await Promise.all([
    prisma.rechnung.findUnique({
      where: { id: params.id },
      include: {
        positionen: { orderBy: { reihenfolge: 'asc' } },
        client:     { select: { vorname: true, nachname: true } },
      },
    }),
    prisma.client.findMany({
      orderBy: [{ nachname: 'asc' }, { vorname: 'asc' }],
      select:  { id: true, vorname: true, nachname: true, geschlecht: true },
    }),
  ])
  if (!rechnung) notFound()

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-3xl">
      <div className="mb-6">
        <Link href="/rechnungen" className="text-xs text-[#555555] hover:text-[#efefef] transition-colors inline-flex items-center gap-1 mb-2">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
          Rechnungen
        </Link>
        <h1 className="text-xl font-bold text-white mt-1.5">Rechnung bearbeiten</h1>
        <p className="text-xs text-[#444444] mt-0.5">
          {rechnung.nummer} · {rechnung.client.vorname} {rechnung.client.nachname}
        </p>
      </div>
      <RechnungForm
        clients={clients}
        editId={rechnung.id}
        initialClientId={rechnung.clientId}
        initialDatum={new Date(rechnung.datum).toISOString().split('T')[0]}
        initialFaellig={rechnung.faellig ? new Date(rechnung.faellig).toISOString().split('T')[0] : ''}
        initialMwst={String(rechnung.mwst)}
        initialBetreff={rechnung.betreff ?? ''}
        initialAnrede={rechnung.anrede ?? ''}
        initialTextBody={rechnung.textBody ?? ''}
        initialEmailVorlage={rechnung.emailVorlage ?? ''}
        initialNotizen={rechnung.notizen ?? ''}
        initialPositionen={rechnung.positionen.map((p, i) => ({
          beschreibung: p.beschreibung,
          menge:        String(p.menge),
          einzelpreis:  String(p.einzelpreis),
          einheit:      p.einheit ?? 'h',
          reihenfolge:  i,
        }))}
      />
    </div>
  )
}
