import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import fs from 'fs'
import { VERTRAG_FILE } from '@/lib/data-paths'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return new Response('Unauthorized', { status: 401 })
  try {
    return new Response(fs.readFileSync(VERTRAG_FILE, 'utf-8'), {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  } catch {
    return new Response('', { status: 200 })
  }
}
