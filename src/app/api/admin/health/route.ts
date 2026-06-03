import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return new Response('Unauthorized', { status: 401 })

  try {
    await prisma.$queryRaw`SELECT 1`
    return Response.json({ db: 'ok', uptime: Math.floor(process.uptime()) })
  } catch (e) {
    return Response.json({ db: 'error', error: String(e) }, { status: 500 })
  }
}
