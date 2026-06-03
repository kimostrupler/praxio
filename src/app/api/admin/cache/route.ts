import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { revalidateTag } from 'next/cache'

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session) return new Response('Unauthorized', { status: 401 })

  revalidateTag('clients')
  revalidateTag('training')
  revalidateTag('ernaehrung')
  revalidateTag('rechnungen')
  revalidateTag('warteliste')

  return Response.json({ ok: true })
}
