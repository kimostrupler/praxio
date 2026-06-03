'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function createWartelistenEintrag(data: {
  vorname: string
  nachname: string
  email?: string
  telefon?: string
  notizen?: string
  prioritaet?: string
}) {
  if (!await getServerSession(authOptions)) return { error: 'Nicht angemeldet.' }

  await prisma.warteliste.create({
    data: {
      vorname:    data.vorname,
      nachname:   data.nachname,
      email:      data.email || undefined,
      telefon:    data.telefon || undefined,
      notizen:    data.notizen || undefined,
      prioritaet: data.prioritaet ?? 'MITTEL',
    },
  })

  revalidatePath('/clients')
  return {}
}

export async function deleteWartelistenEintrag(id: string) {
  if (!await getServerSession(authOptions)) return { error: 'Nicht angemeldet.' }

  try {
    await prisma.warteliste.delete({ where: { id } })
    revalidatePath('/clients')
    return {}
  } catch {
    return { error: 'Eintrag konnte nicht gelöscht werden.' }
  }
}

export type TransferData = {
  vorname: string
  nachname: string
  email: string
  telefon: string
  adresse: string
  beruf: string
  geburtsdatum: string
  geschlecht: string
  herkunft: string
}

export async function transferWartelisteToClient(
  wartelisteId: string,
  data: TransferData,
  force = false
): Promise<{ error?: string; duplicate?: boolean; existingName?: string; existingId?: string }> {
  if (!await getServerSession(authOptions)) return { error: 'Nicht angemeldet.' }
  if (!data.vorname.trim() || !data.nachname.trim()) return { error: 'Vor- und Nachname sind Pflichtfelder.' }

  if (data.email?.trim()) {
    const taken = await prisma.client.findFirst({
      where: { email: { equals: data.email.trim() } },
      select: { id: true },
    })
    if (taken) return { error: 'Diese E-Mail-Adresse wird bereits von einem anderen Klienten verwendet.' }
  }

  if (!force) {
    const existing = await prisma.client.findFirst({
      where: {
        vorname:  { equals: data.vorname.trim() },
        nachname: { equals: data.nachname.trim() },
      },
      select: { id: true, vorname: true, nachname: true },
    })
    if (existing) return {
      duplicate: true,
      existingName: `${existing.vorname} ${existing.nachname}`,
      existingId: existing.id,
    }
  }

  let clientId: string
  try {
    const client = await prisma.client.create({
      data: {
        vorname:      data.vorname.trim(),
        nachname:     data.nachname.trim(),
        email:        data.email || undefined,
        telefon:      data.telefon || undefined,
        adresse:      data.adresse || undefined,
        beruf:        data.beruf || undefined,
        geburtsdatum: data.geburtsdatum ? new Date(data.geburtsdatum) : undefined,
        geschlecht:   data.geschlecht === 'WEIBLICH' ? 'WEIBLICH' : data.geschlecht === 'MAENNLICH' ? 'MAENNLICH' : data.geschlecht === 'DIVERS' ? 'DIVERS' : undefined,
        herkunft:     data.herkunft || undefined,
      },
    })
    clientId = client.id
  } catch (e) {
    console.error(e)
    return { error: 'Fehler beim Speichern.' }
  }

  await prisma.warteliste.delete({ where: { id: wartelisteId } }).catch(() => {})

  revalidateTag('clients')
  revalidatePath('/clients')
  redirect(`/clients/${clientId}`)
}
