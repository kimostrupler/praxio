'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export async function cancelBooking(uid: string, reason?: string) {
  if (!await getServerSession(authOptions)) return { error: 'Nicht angemeldet.' }

  const apiKey = process.env.CALCOM_API_KEY?.trim()
  if (!apiKey) return { error: 'Cal.com API-Key nicht konfiguriert.' }

  const res = await fetch(`https://api.cal.com/v2/bookings/${uid}/cancel`, {
    method: 'POST',
    headers: {
      'Authorization':   `Bearer ${apiKey}`,
      'cal-api-version': '2024-08-13',
      'Content-Type':    'application/json',
    },
    body:  JSON.stringify({ cancellationReason: reason ?? 'Abgesagt durch Coach' }),
    cache: 'no-store',
  })

  if (!res.ok) return { error: `Cal.com Fehler: HTTP ${res.status}` }

  revalidatePath('/termine')
  revalidatePath('/dashboard')
  return {}
}
