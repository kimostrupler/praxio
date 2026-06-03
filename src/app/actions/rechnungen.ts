'use server'

import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import { revalidatePath, revalidateTag } from 'next/cache'
import type { RechnungStatus } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { audit } from '@/lib/audit'
import { authOptions } from '@/lib/auth'
import { toFloat } from '@/lib/form-parse'

export type PositionInput = {
  beschreibung: string
  menge:        string
  einzelpreis:  string
  einheit:      string
  reihenfolge:  number
}

async function nextNummer(): Promise<string> {
  const year   = new Date().getFullYear()
  const prefix = `RE-${year}-`
  const last   = await prisma.rechnung.findFirst({
    where:   { nummer: { startsWith: prefix } },
    orderBy: { nummer: 'desc' },
    select:  { nummer: true },
  })
  const n = last ? parseInt(last.nummer.slice(prefix.length)) + 1 : 1
  return `${prefix}${String(n).padStart(3, '0')}`
}

function buildPositionen(positionen: PositionInput[]) {
  return positionen.map(p => ({
    beschreibung: p.beschreibung,
    menge:        toFloat(p.menge) ?? 1,
    einzelpreis:  toFloat(p.einzelpreis) ?? 0,
    einheit:      p.einheit || undefined,
    reihenfolge:  p.reihenfolge,
  }))
}

export async function createRechnung(
  clientId:     string,
  datum:        string,
  faellig:      string,
  mwst:         string,
  betreff:      string,
  anrede:       string,
  notizen:      string,
  positionen:   PositionInput[],
  textBody?:    string,
  emailVorlage?: string,
) {
  if (!await getServerSession(authOptions))    return { error: 'Nicht angemeldet.' }
  if (!clientId)          return { error: 'Klient ist erforderlich.' }
  if (!positionen.length) return { error: 'Mindestens eine Position erforderlich.' }
  try {
    const nummer = await nextNummer()
    await prisma.rechnung.create({
      data: {
        nummer,
        clientId,
        datum:        datum   ? new Date(datum)   : new Date(),
        faellig:      faellig ? new Date(faellig) : undefined,
        mwst:         toFloat(mwst) ?? 0,
        betreff:      betreff      || undefined,
        anrede:       anrede       || undefined,
        notizen:      notizen      || undefined,
        textBody:     textBody     || undefined,
        emailVorlage: emailVorlage || undefined,
        positionen: { create: buildPositionen(positionen) },
      },
    })
  } catch (e) {
    console.error(e)
    return { error: 'Fehler beim Erstellen.' }
  }
  revalidateTag('rechnungen')

  revalidatePath('/rechnungen')
  redirect('/rechnungen')
}

export async function updateRechnung(
  id:           string,
  datum:        string,
  faellig:      string,
  mwst:         string,
  betreff:      string,
  anrede:       string,
  notizen:      string,
  positionen:   PositionInput[],
  textBody?:    string,
  emailVorlage?: string,
) {
  if (!await getServerSession(authOptions))    return { error: 'Nicht angemeldet.' }
  if (!positionen.length) return { error: 'Mindestens eine Position erforderlich.' }
  try {
    await prisma.$transaction(async tx => {
      await tx.rechnungsPosition.deleteMany({ where: { rechnungId: id } })
      await tx.rechnung.update({
        where: { id },
        data: {
          datum:        datum   ? new Date(datum)   : undefined,
          faellig:      faellig ? new Date(faellig) : null,
          mwst:         toFloat(mwst) ?? 0,
          betreff:      betreff      || undefined,
          anrede:       anrede       || undefined,
          notizen:      notizen      || undefined,
          textBody:     textBody     || undefined,
          emailVorlage: emailVorlage || undefined,
          positionen: { create: buildPositionen(positionen) },
        },
      })
    })
  } catch (e) {
    console.error(e)
    return { error: 'Fehler beim Speichern.' }
  }
  revalidateTag('rechnungen')

  revalidatePath('/rechnungen')
  redirect('/rechnungen')
}

export async function updateRechnungStatus(id: string, status: RechnungStatus) {
  if (!await getServerSession(authOptions)) return { error: 'Nicht angemeldet.' }
  await prisma.rechnung.update({
    where: { id },
    data: { status, bezahltAm: status === 'BEZAHLT' ? new Date() : null },
  })
  await audit(null, 'UPDATE_RECHNUNG_STATUS', id, status)
  revalidateTag('rechnungen')

  revalidatePath('/rechnungen')
}

export async function deleteRechnung(id: string) {
  if (!await getServerSession(authOptions)) return { error: 'Nicht angemeldet.' }
  await prisma.rechnung.delete({ where: { id } })
  await audit(null, 'DELETE_RECHNUNG', id)
  revalidateTag('rechnungen')

  revalidatePath('/rechnungen')
}
