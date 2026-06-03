'use server'

import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import { revalidatePath, revalidateTag } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { toInt, toFloat } from '@/lib/form-parse'

export type PlanUebungInput = {
  uebungId: string
  uebungName: string
  saetze: string
  wiederholungen: string
  gewicht: string
  dauer: string
  pause: string
  reihenfolge: number
  notizen: string
}


// ─── Training Plans ───────────────────────────────────────────────────────────

export async function createTrainingsPlan(
  clientId: string,
  name: string,
  notizen: string,
  uebungen: PlanUebungInput[]
) {
  if (!await getServerSession(authOptions)) return { error: 'Nicht angemeldet.' }
  if (!name.trim()) return { error: 'Planname ist erforderlich.' }
  let planId: string
  try {
    const plan = await prisma.trainingsPlan.create({
      data: {
        clientId,
        name: name.trim(),
        notizen: notizen || undefined,
        uebungen: {
          create: uebungen.map(u => ({
            uebungId: u.uebungId,
            saetze: toInt(u.saetze),
            wiederholungen: toInt(u.wiederholungen),
            gewicht: toFloat(u.gewicht),
            dauer: toInt(u.dauer),
            pause: toInt(u.pause),
            reihenfolge: u.reihenfolge,
            notizen: u.notizen || undefined,
          })),
        },
      },
    })
    planId = plan.id
  } catch (e) {
    console.error(e)
    return { error: 'Fehler beim Speichern.' }
  }
  revalidateTag('training')

  revalidatePath(`/clients/${clientId}`)
  redirect(`/clients/${clientId}?tab=training`)
}

export async function deleteTrainingsPlan(planId: string, clientId: string) {
  if (!await getServerSession(authOptions)) return { error: 'Nicht angemeldet.' }
  try {
    await prisma.trainingsPlan.delete({ where: { id: planId } })
  } catch (e) {
    console.error(e)
    return { error: 'Fehler beim Löschen.' }
  }
  revalidateTag('training')
  revalidatePath(`/clients/${clientId}`)
  revalidatePath('/training')
}

export async function updateTrainingsPlan(
  planId: string,
  clientId: string,
  name: string,
  notizen: string,
  uebungen: PlanUebungInput[]
) {
  if (!await getServerSession(authOptions)) return { error: 'Nicht angemeldet.' }
  if (!name.trim()) return { error: 'Planname ist erforderlich.' }
  try {
    await prisma.$transaction(async tx => {
      await tx.planUebung.deleteMany({ where: { planId } })
      await tx.trainingsPlan.update({
        where: { id: planId },
        data: {
          name: name.trim(),
          notizen: notizen || undefined,
          uebungen: {
            create: uebungen.map(u => ({
              uebungId: u.uebungId,
              saetze: toInt(u.saetze),
              wiederholungen: toInt(u.wiederholungen),
              gewicht: toFloat(u.gewicht),
              dauer: toInt(u.dauer),
              pause: toInt(u.pause),
              reihenfolge: u.reihenfolge,
              notizen: u.notizen || undefined,
            })),
          },
        },
      })
    })
  } catch (e) {
    console.error(e)
    return { error: 'Fehler beim Speichern.' }
  }
  revalidateTag('training')
  revalidatePath(`/clients/${clientId}`)
  revalidatePath('/training')
  redirect(`/clients/${clientId}?tab=training`)
}

// ─── Presets ─────────────────────────────────────────────────────────────────

export type PresetUebungInput = {
  uebungId: string
  saetze: string
  wiederholungen: string
  gewicht: string
  dauer: string
  pause: string
  reihenfolge: number
}

export async function createPreset(
  name: string,
  beschreibung: string,
  ziele: string[],
  uebungen: PresetUebungInput[]
) {
  if (!await getServerSession(authOptions)) return { error: 'Nicht angemeldet.' }
  if (!name.trim()) return { error: 'Presetname ist erforderlich.' }
  try {
    await prisma.trainingsPreset.create({
      data: {
        name: name.trim(),
        beschreibung: beschreibung || undefined,
        ziele,
        uebungen: {
          create: uebungen.map(u => ({
            uebungId: u.uebungId,
            saetze: toInt(u.saetze),
            wiederholungen: toInt(u.wiederholungen),
            gewicht: toFloat(u.gewicht),
            dauer: toInt(u.dauer),
            pause: toInt(u.pause),
            reihenfolge: u.reihenfolge,
          })),
        },
      },
    })
  } catch (e) {
    console.error(e)
    return { error: 'Fehler beim Speichern.' }
  }
  revalidateTag('training')

  revalidatePath('/training')
  redirect('/training?tab=presets')
}

export async function deletePreset(presetId: string) {
  if (!await getServerSession(authOptions)) return { error: 'Nicht angemeldet.' }
  try {
    await prisma.trainingsPreset.delete({ where: { id: presetId } })
  } catch (e) {
    console.error(e)
    return { error: 'Fehler beim Löschen.' }
  }
  revalidateTag('training')
  revalidatePath('/training')
}

function presetUebungData(uebungen: PresetUebungInput[]) {
  return uebungen.map(u => ({
    uebungId: u.uebungId,
    saetze: toInt(u.saetze),
    wiederholungen: toInt(u.wiederholungen),
    gewicht: toFloat(u.gewicht),
    dauer: toInt(u.dauer),
    pause: toInt(u.pause),
    reihenfolge: u.reihenfolge,
  }))
}

export async function updatePreset(
  presetId: string,
  name: string,
  beschreibung: string,
  ziele: string[],
  uebungen: PresetUebungInput[]
) {
  if (!await getServerSession(authOptions)) return { error: 'Nicht angemeldet.' }
  if (!name.trim()) return { error: 'Presetname ist erforderlich.' }
  try {
    await prisma.$transaction(async tx => {
      await tx.presetUebung.deleteMany({ where: { presetId } })
      await tx.trainingsPreset.update({
        where: { id: presetId },
        data: {
          name: name.trim(),
          beschreibung: beschreibung || undefined,
          ziele,
          uebungen: { create: presetUebungData(uebungen) },
        },
      })
    })
  } catch (e) {
    console.error(e)
    return { error: 'Fehler beim Speichern.' }
  }
  revalidateTag('training')

  revalidatePath('/training')
  redirect('/training?tab=vorlagen')
}

export async function updatePresetAndPlans(
  presetId: string,
  name: string,
  beschreibung: string,
  ziele: string[],
  uebungen: PresetUebungInput[]
) {
  if (!await getServerSession(authOptions)) return { error: 'Nicht angemeldet.' }
  if (!name.trim()) return { error: 'Presetname ist erforderlich.' }
  try {
    await prisma.$transaction(async tx => {
      // Update preset exercises
      await tx.presetUebung.deleteMany({ where: { presetId } })
      await tx.trainingsPreset.update({
        where: { id: presetId },
        data: {
          name: name.trim(),
          beschreibung: beschreibung || undefined,
          ziele,
          uebungen: { create: presetUebungData(uebungen) },
        },
      })

      // Update all plans assigned to this preset
      const plans = await tx.trainingsPlan.findMany({
        where: { presetId },
        select: { id: true },
      })
      const planIds = plans.map(p => p.id)
      await tx.planUebung.deleteMany({ where: { planId: { in: planIds } } })
      await tx.planUebung.createMany({
        data: planIds.flatMap(planId => uebungen.map(u => ({
          planId,
          uebungId: u.uebungId,
          saetze: toInt(u.saetze) ?? null,
          wiederholungen: toInt(u.wiederholungen) ?? null,
          gewicht: toFloat(u.gewicht) ?? null,
          dauer: toInt(u.dauer) ?? null,
          pause: toInt(u.pause) ?? null,
          reihenfolge: u.reihenfolge,
        }))),
      })
    })
  } catch (e) {
    console.error(e)
    return { error: 'Fehler beim Speichern.' }
  }
  revalidateTag('training')
  revalidatePath('/training')
  revalidatePath('/clients')
  redirect('/training?tab=vorlagen')
}

// ─── Exercises ───────────────────────────────────────────────────────────────

export type UebungInput = {
  name: string
  kategorie: string
  schwierigkeit: string
  ausruestung: string
  ziele: string[]
  beschreibung: string
}

export async function createUebung(data: UebungInput) {
  if (!await getServerSession(authOptions)) return { error: 'Nicht angemeldet.' }
  if (!data.name.trim()) return { error: 'Name ist erforderlich.' }
  try {
    await prisma.uebung.create({
      data: {
        name: data.name.trim(),
        kategorie: data.kategorie,
        schwierigkeit: data.schwierigkeit || undefined,
        ausruestung: data.ausruestung || undefined,
        ziele: data.ziele,
        beschreibung: data.beschreibung || undefined,
        isCustom: true,
      },
    })
  } catch (e) {
    console.error(e)
    return { error: 'Fehler beim Speichern.' }
  }
  revalidateTag('training')

  revalidatePath('/training')
}

export async function deleteUebung(id: string) {
  if (!await getServerSession(authOptions)) return { error: 'Nicht angemeldet.' }
  try {
    await prisma.uebung.delete({ where: { id, isCustom: true } })
  } catch (e) {
    console.error(e)
    return { error: 'Fehler beim Löschen.' }
  }
  revalidateTag('training')
  revalidatePath('/training')
}

export async function assignPresetToClient(presetId: string, clientId: string) {
  if (!await getServerSession(authOptions)) return { error: 'Nicht angemeldet.' }
  const preset = await prisma.trainingsPreset.findUnique({
    where: { id: presetId },
    include: { uebungen: { orderBy: { reihenfolge: 'asc' } } },
  })
  if (!preset) return { error: 'Vorlage nicht gefunden.' }
  try {
    await prisma.trainingsPlan.create({
      data: {
        clientId,
        presetId,
        name: preset.name,
        notizen: preset.beschreibung || undefined,
        uebungen: {
          create: preset.uebungen.map(u => ({
            uebungId: u.uebungId,
            saetze: u.saetze || undefined,
            wiederholungen: u.wiederholungen || undefined,
            gewicht: u.gewicht || undefined,
            dauer: u.dauer || undefined,
            pause: u.pause || undefined,
            reihenfolge: u.reihenfolge,
          })),
        },
      },
    })
  } catch (e) {
    console.error(e)
    return { error: 'Fehler beim Zuweisen.' }
  }
  revalidateTag('training')
  revalidatePath(`/clients/${clientId}`)
  revalidatePath('/training')
}
