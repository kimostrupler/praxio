import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return new Response('Unauthorized', { status: 401 })
  const key = process.env.CALCOM_API_KEY?.trim() ?? ''
  return Response.json({ configured: !!key })
}
