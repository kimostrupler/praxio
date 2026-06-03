'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { revalidatePath } from 'next/cache'
import { audit } from '@/lib/audit'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'ADMIN') return null
  return session
}

export async function getUsers() {
  if (!await requireAdmin()) return { error: 'Nicht berechtigt.' }
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'asc' },
    select: { id: true, email: true, name: true, role: true, active: true, createdAt: true },
  })
  return { users }
}

export async function createUser(formData: FormData) {
  const session = await requireAdmin()
  if (!session) return { error: 'Nicht berechtigt.' }

  const email    = (formData.get('email')    as string)?.trim().toLowerCase()
  const name     = (formData.get('name')     as string)?.trim()
  const password = (formData.get('password') as string)
  const role     = formData.get('role') as 'ADMIN' | 'STAFF'

  if (!email || !name || !password || !role) return { error: 'Alle Felder ausfüllen.' }
  if (password.length < 8) return { error: 'Passwort mindestens 8 Zeichen.' }
  if (!['ADMIN', 'STAFF'].includes(role)) return { error: 'Ungültige Rolle.' }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) return { error: 'E-Mail bereits vergeben.' }

  const passwordHash = await bcrypt.hash(password, 12)
  await prisma.user.create({ data: { email, name, passwordHash, role } })
  const adminId = (session.user as any).id as string
  await audit(adminId, 'CREATE_USER', undefined, email)
  revalidatePath('/settings/benutzer')
  return {}
}

export async function adminResetPassword(userId: string, formData: FormData) {
  if (!await requireAdmin()) return { error: 'Nicht berechtigt.' }

  const password = formData.get('password') as string
  if (!password || password.length < 8) return { error: 'Passwort mindestens 8 Zeichen.' }

  const passwordHash = await bcrypt.hash(password, 12)
  const adminSession = await requireAdmin()
  const adminId2 = (adminSession!.user as any).id as string
  await prisma.user.update({ where: { id: userId }, data: { passwordHash, sessionVersion: { increment: 1 } } })
  await audit(adminId2, 'ADMIN_RESET_PASSWORD', userId)
  revalidatePath('/settings/benutzer')
  return {}
}

export async function toggleUserActive(userId: string) {
  const session = await requireAdmin()
  if (!session) return { error: 'Nicht berechtigt.' }

  if (userId === (session.user as any).id)
    return { error: 'Eigenes Konto kann nicht deaktiviert werden.' }

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) return { error: 'Benutzer nicht gefunden.' }

  await prisma.user.update({ where: { id: userId }, data: { active: !user.active } })
  revalidatePath('/settings/benutzer')
  return {}
}

export async function deleteUser(userId: string) {
  const session = await requireAdmin()
  if (!session) return { error: 'Nicht berechtigt.' }

  if (userId === (session.user as any).id)
    return { error: 'Eigenes Konto kann nicht gelöscht werden.' }

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) return { error: 'Benutzer nicht gefunden.' }

  if (user.role === 'ADMIN') {
    const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } })
    if (adminCount <= 1) return { error: 'Letzter Admin kann nicht gelöscht werden.' }
  }

  const adminS = await requireAdmin()
  const adminId3 = (adminS!.user as any).id as string
  await prisma.user.delete({ where: { id: userId } })
  await audit(adminId3, 'DELETE_USER', userId)
  revalidatePath('/settings/benutzer')
  return {}
}
