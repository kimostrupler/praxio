import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return new Response('Unauthorized', { status: 401 })

  // Export contact info and plan metadata only.
  // Health assessments (anamnesen) and session notes (notizen) are excluded —
  // they contain sensitive health data and must not be bulk-exported.
  const clients = await prisma.client.findMany({
    orderBy: { nachname: 'asc' },
    select: {
      id: true, createdAt: true,
      vorname: true, nachname: true, email: true, telefon: true,
      beruf: true, geburtsdatum: true, geschlecht: true,
      status: true, herkunft: true, tags: true,
      trainingsplaene:   { select: { id: true, name: true, datum: true } },
      ernaehrungsplaene: { select: { id: true, name: true, datum: true } },
    },
  })

  const date = new Date().toISOString().slice(0, 10)
  return new Response(JSON.stringify(clients, null, 2), {
    headers: {
      'Content-Type':        'application/json',
      'Content-Disposition': `attachment; filename="fitallcoach_export_${date}.json"`,
    },
  })
}
