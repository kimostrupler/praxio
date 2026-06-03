import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({}, { status: 401 })

  const q = req.nextUrl.searchParams.get('q')?.trim() ?? ''
  if (q.length < 2) return Response.json({ clients: [], rechnungen: [], training: [], ernaehrung: [] })

  const clientNameFilter = {
    OR: [
      { vorname:  { contains: q, mode: 'insensitive' as const } },
      { nachname: { contains: q, mode: 'insensitive' as const } },
    ],
  }

  const [clients, rechnungen, training, ernaehrung] = await Promise.all([
    prisma.client.findMany({
      where: {
        OR: [
          { vorname:  { contains: q, mode: 'insensitive' } },
          { nachname: { contains: q, mode: 'insensitive' } },
          { email:    { contains: q, mode: 'insensitive' } },
        ],
      },
      select: { id: true, vorname: true, nachname: true, status: true, email: true },
      take: 5,
    }),

    prisma.rechnung.findMany({
      where: {
        OR: [
          { nummer:  { contains: q, mode: 'insensitive' } },
          { betreff: { contains: q, mode: 'insensitive' } },
          { client:  clientNameFilter },
        ],
      },
      select: {
        id: true, nummer: true, status: true,
        client: { select: { vorname: true, nachname: true } },
      },
      take: 5,
    }),

    prisma.trainingsPlan.findMany({
      where: {
        OR: [
          { name:   { contains: q, mode: 'insensitive' } },
          { client: clientNameFilter },
        ],
      },
      select: {
        id: true, name: true, clientId: true,
        client: { select: { vorname: true, nachname: true } },
      },
      take: 5,
    }),

    prisma.ernaehrungsPlan.findMany({
      where: {
        OR: [
          { name:   { contains: q, mode: 'insensitive' } },
          { client: clientNameFilter },
        ],
      },
      select: {
        id: true, name: true, clientId: true,
        client: { select: { vorname: true, nachname: true } },
      },
      take: 5,
    }),
  ])

  return Response.json({ clients, rechnungen, training, ernaehrung })
}
