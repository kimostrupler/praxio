import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import AnamneseWahl from '@/components/AnamneseWahl'

export default async function NeueAnamnesePage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const client = await prisma.client.findUnique({
    where: { id: params.id },
    select: { vorname: true, nachname: true },
  })
  if (!client) notFound()

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-3xl">
      <div className="mb-6">
        <Link href={`/clients/${params.id}`} className="text-xs text-[#555555] hover:text-[#efefef] transition-colors inline-flex items-center gap-1 mb-2">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
          {client.vorname} {client.nachname}
        </Link>
        <h1 className="text-xl font-bold text-white mt-2">Neue Anamnese</h1>
        <p className="text-sm text-[#3a3a3a] mt-0.5">{client.vorname} {client.nachname}</p>
      </div>
      <AnamneseWahl clientId={params.id} />
    </div>
  )
}
