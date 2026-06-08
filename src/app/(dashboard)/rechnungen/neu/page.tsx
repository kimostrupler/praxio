import { prisma } from '@/lib/db'
import RechnungForm from '@/components/RechnungForm'
import { getPraxisConfig } from '@/lib/praxis'

export default async function NeueRechnungPage(
  props: {
    searchParams: Promise<{ clientId?: string }>
  }
) {
  const searchParams = await props.searchParams;
  const [clients, praxis] = await Promise.all([
    prisma.client.findMany({
      orderBy: [{ nachname: 'asc' }, { vorname: 'asc' }],
      select: { id: true, vorname: true, nachname: true, geschlecht: true },
    }),
    getPraxisConfig(),
  ])

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-3xl">
      <div className="mb-6">
        <a href="/rechnungen" className="text-xs text-[#555555] hover:text-[#efefef] transition-colors inline-flex items-center gap-1 mb-2">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
          Rechnungen
        </a>
        <h1 className="text-xl font-bold text-white mt-1.5">Neue Rechnung</h1>
      </div>
      <RechnungForm
        clients={clients}
        initialClientId={searchParams.clientId}
        initialMwst={praxis.rechnungMwst}
        initialBetreff={praxis.rechnungBetreff}
        initialTextBody={praxis.rechnungText}
      />
    </div>
  )
}
