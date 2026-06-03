'use server'

import { prisma } from '@/lib/db'
import { revalidatePath, revalidateTag } from 'next/cache'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { toPositiveInt } from '@/lib/form-parse'

export type ZeileInput = {
  zeitpunkt:     string
  kalorien:      string
  protein:       string
  kohlenhydrate: string
  fett:          string
  notizen:       string
  reihenfolge:   number
}

function mapZeileInput(z: ZeileInput) {
  return {
    zeitpunkt:     z.zeitpunkt,
    kalorien:      toPositiveInt(z.kalorien),
    protein:       toPositiveInt(z.protein),
    kohlenhydrate: toPositiveInt(z.kohlenhydrate),
    fett:          toPositiveInt(z.fett),
    notizen:       z.notizen || undefined,
    reihenfolge:   z.reihenfolge,
  }
}

// ── Vorlagen ─────────────────────────────────────────────────────────────────

export async function createErnaehrungsVorlage(name: string, beschreibung: string, zeilen: ZeileInput[]) {
  if (!await getServerSession(authOptions)) return { error: 'Nicht angemeldet.' }
  if (!name.trim()) return { error: 'Name ist erforderlich.' }
  await prisma.ernaehrungsVorlage.create({
    data: {
      name: name.trim(),
      beschreibung: beschreibung || undefined,
      zeilen: { create: zeilen.map(mapZeileInput) },
    },
  })
  revalidateTag('ernaehrung')

  revalidatePath('/ernaehrung')
  redirect('/ernaehrung')
}

export async function updateErnaehrungsVorlage(id: string, name: string, beschreibung: string, zeilen: ZeileInput[]) {
  if (!await getServerSession(authOptions)) return { error: 'Nicht angemeldet.' }
  if (!name.trim()) return { error: 'Name ist erforderlich.' }
  await prisma.$transaction(async tx => {
    await tx.ernaehrungsVorlageZeile.deleteMany({ where: { vorlageId: id } })
    await tx.ernaehrungsVorlage.update({
      where: { id },
      data: {
        name: name.trim(),
        beschreibung: beschreibung || undefined,
        zeilen: {
          create: zeilen.map(mapZeileInput),
        },
      },
    })
  })
  revalidateTag('ernaehrung')

  revalidatePath('/ernaehrung')
  redirect('/ernaehrung')
}

export async function deleteErnaehrungsVorlage(id: string) {
  if (!await getServerSession(authOptions)) return { error: 'Nicht angemeldet.' }
  await prisma.ernaehrungsVorlage.delete({ where: { id } })
  revalidateTag('ernaehrung')

  revalidatePath('/ernaehrung')
}

export async function assignVorlageToClient(vorlageId: string, clientId: string) {
  if (!await getServerSession(authOptions)) return { error: 'Nicht angemeldet.' }
  const vorlage = await prisma.ernaehrungsVorlage.findUnique({
    where: { id: vorlageId },
    include: { zeilen: { orderBy: { reihenfolge: 'asc' } } },
  })
  if (!vorlage) return { error: 'Vorlage nicht gefunden.' }
  await prisma.ernaehrungsPlan.create({
    data: {
      clientId,
      vorlageId,
      name: vorlage.name,
      zeilen: {
        create: vorlage.zeilen.map(z => ({
          zeitpunkt:     z.zeitpunkt,
          kalorien:      z.kalorien ?? undefined,
          protein:       z.protein ?? undefined,
          kohlenhydrate: z.kohlenhydrate ?? undefined,
          fett:          z.fett ?? undefined,
          notizen:       z.notizen ?? undefined,
          reihenfolge:   z.reihenfolge,
        })),
      },
    },
  })
  revalidateTag('ernaehrung')
  revalidatePath(`/clients/${clientId}`)
  revalidatePath('/ernaehrung')
}

// ── Pläne ─────────────────────────────────────────────────────────────────────

export async function createErnaehrungsPlan(clientId: string, name: string, notizen: string, zeilen: ZeileInput[]) {
  if (!await getServerSession(authOptions)) return { error: 'Nicht angemeldet.' }
  if (!name.trim()) return { error: 'Name ist erforderlich.' }
  await prisma.ernaehrungsPlan.create({
    data: {
      clientId,
      name: name.trim(),
      notizen: notizen || undefined,
      zeilen: { create: zeilen.map(mapZeileInput) },
    },
  })
  revalidateTag('ernaehrung')

  revalidatePath(`/clients/${clientId}`)
  redirect(`/clients/${clientId}?tab=ernaehrung`)
}

export async function updateErnaehrungsPlan(planId: string, clientId: string, name: string, notizen: string, zeilen: ZeileInput[]) {
  if (!await getServerSession(authOptions)) return { error: 'Nicht angemeldet.' }
  if (!name.trim()) return { error: 'Name ist erforderlich.' }
  await prisma.$transaction(async tx => {
    await tx.ernaehrungsPlanZeile.deleteMany({ where: { planId } })
    await tx.ernaehrungsPlan.update({
      where: { id: planId },
      data: {
        name: name.trim(),
        notizen: notizen || undefined,
        zeilen: {
          create: zeilen.map(mapZeileInput),
        },
      },
    })
  })
  revalidateTag('ernaehrung')

  revalidatePath(`/clients/${clientId}`)
  redirect(`/clients/${clientId}?tab=ernaehrung`)
}

export async function deleteErnaehrungsPlan(planId: string, clientId: string) {
  if (!await getServerSession(authOptions)) return { error: 'Nicht angemeldet.' }
  await prisma.ernaehrungsPlan.delete({ where: { id: planId } })
  revalidateTag('ernaehrung')

  revalidatePath(`/clients/${clientId}`)
}
