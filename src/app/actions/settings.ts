'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function saveAppSettings(data: {
  theme?: string
  accentPreset?: string
  praxisName?: string
  coachName?: string
  trainSaetze?: number
  trainWdh?: number
  trainPause?: number
  clientDefault?: string
  revenueGoal?: number
}) {
  const session = await getServerSession(authOptions)
  if (!session) return

  const isAdmin = (session.user as any)?.role === 'ADMIN'

  // Only ADMIN may update the global theme — STAFF theme is per-user (see saveUserTheme)
  const { theme, ...rest } = data
  const updateData = isAdmin ? data : rest

  if (Object.keys(updateData).length === 0) return

  await prisma.appSettings.upsert({
    where:  { id: 'singleton' },
    create: { id: 'singleton', ...updateData },
    update: updateData,
  })
}

// Saves the calling user's personal theme preference to their User record.
// When set, this overrides the global AppSettings.theme for that user only.
export async function saveUserTheme(theme: string) {
  const session = await getServerSession(authOptions)
  if (!session) return
  const userId = (session.user as any)?.id
  if (!userId) return
  await prisma.user.update({ where: { id: userId }, data: { theme } })
}
