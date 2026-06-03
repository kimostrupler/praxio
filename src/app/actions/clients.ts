'use server'

import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import { revalidatePath, revalidateTag } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export type ClientFormData = {
  vorname: string
  nachname: string
  adresse: string
  telefon: string
  email: string
  beruf: string
  geburtsdatum: string
  geschlecht: string
  herkunft: string
}

export type AnamneseFormData = {
  ziele: string[]
  zieleSonstiges: string
  motivation: string
  zielWichtigkeit: number
  zielDatum: string
  groesse: string
  aktuellesGewicht: string
  gewichtVor3Monaten: string
  gewichtVor1Jahr: string
  wunschgewicht: string
  gewichtVeraendert: string
  gewichtVeraendertWie: string
  koerperfett: string
  taillenumfang: string
  sonstigeMasse: string
  ernaehrungBewertung: string
  mahlzeitenProTag: string
  essgewohnheiten: string[]
  essgewohnheitenSonstiges: string
  lebensmittelUnvertraeglichkeit: string
  lebensmittelUnvertraeglichkeitWelche: string
  wasserLiter: string
  kaffeeTassen: string
  alkoholPortionen: string
  softdrinksLiter: string
  ernaehrungstagebuch: string
  arbeitstag: string
  freizeitAktivitaet: string
  sportProWoche: string
  sportArt: string
  schritte: string
  raucher: string
  raucherMenge: string
  schlafStunden: string
  schlafQualitaet: string
  schlafProbleme: string
  schlafProblemeWelche: string
  stressLevel: number
  stressfaktoren: string
  stressBewaeltigung: string
  wohlbefinden: string
  erkrankungen: string
  erkrankungenWelche: string
  medikamente: string
  medikamenteWelche: string
  operationen: string
  operationenWann: string
  sonstigeInfos: string
}

function f(v: string): number | undefined {
  const n = parseFloat(v)
  return isNaN(n) ? undefined : n
}
function i(v: string): number | undefined {
  const n = parseInt(v)
  return isNaN(n) ? undefined : n
}
function b(v: string): boolean | undefined {
  if (v === 'ja') return true
  if (v === 'nein') return false
  return undefined
}

function anamneseFields(data: AnamneseFormData) {
  return {
    ziele: JSON.stringify(data.ziele),
    zieleSonstiges: data.zieleSonstiges || undefined,
    motivation: data.motivation || undefined,
    zielWichtigkeit: data.zielWichtigkeit || undefined,
    zielDatum: data.zielDatum || undefined,
    groesse: f(data.groesse),
    aktuellesGewicht: f(data.aktuellesGewicht),
    gewichtVor3Monaten: f(data.gewichtVor3Monaten),
    gewichtVor1Jahr: f(data.gewichtVor1Jahr),
    wunschgewicht: f(data.wunschgewicht),
    gewichtVeraendert: b(data.gewichtVeraendert),
    gewichtVeraendertWie: data.gewichtVeraendertWie || undefined,
    koerperfett: f(data.koerperfett),
    taillenumfang: f(data.taillenumfang),
    sonstigeMasse: data.sonstigeMasse || undefined,
    ernaehrungBewertung: data.ernaehrungBewertung || undefined,
    mahlzeitenProTag: i(data.mahlzeitenProTag),
    essgewohnheiten: JSON.stringify(data.essgewohnheiten),
    essgewohnheitenSonstiges: data.essgewohnheitenSonstiges || undefined,
    lebensmittelUnvertraeglichkeit: b(data.lebensmittelUnvertraeglichkeit),
    lebensmittelUnvertraeglichkeitWelche: data.lebensmittelUnvertraeglichkeitWelche || undefined,
    wasserLiter: f(data.wasserLiter),
    kaffeeTassen: f(data.kaffeeTassen),
    alkoholPortionen: f(data.alkoholPortionen),
    softdrinksLiter: f(data.softdrinksLiter),
    ernaehrungstagebuch: b(data.ernaehrungstagebuch),
    arbeitstag: data.arbeitstag || undefined,
    freizeitAktivitaet: data.freizeitAktivitaet || undefined,
    sportProWoche: i(data.sportProWoche),
    sportArt: data.sportArt || undefined,
    schritte: data.schritte || undefined,
    raucher: b(data.raucher),
    raucherMenge: data.raucherMenge || undefined,
    schlafStunden: f(data.schlafStunden),
    schlafQualitaet: data.schlafQualitaet || undefined,
    schlafProbleme: b(data.schlafProbleme),
    schlafProblemeWelche: data.schlafProblemeWelche || undefined,
    stressLevel: data.stressLevel || undefined,
    stressfaktoren: data.stressfaktoren || undefined,
    stressBewaeltigung: data.stressBewaeltigung || undefined,
    wohlbefinden: data.wohlbefinden || undefined,
    erkrankungen: b(data.erkrankungen),
    erkrankungenWelche: data.erkrankungenWelche || undefined,
    medikamente: b(data.medikamente),
    medikamenteWelche: data.medikamenteWelche || undefined,
    operationen: b(data.operationen),
    operationenWann: data.operationenWann || undefined,
    sonstigeInfos: data.sonstigeInfos || undefined,
  }
}

export async function createClient(data: ClientFormData, force = false) {
  if (!await getServerSession(authOptions)) return { error: 'Nicht angemeldet.' }
  if (!data.vorname.trim() || !data.nachname.trim()) {
    return { error: 'Vor- und Nachname sind Pflichtfelder.' }
  }

  // Email must be unique across all clients
  if (data.email?.trim()) {
    const emailTaken = await prisma.client.findFirst({
      where: { email: { equals: data.email.trim() } },
      select: { id: true },
    })
    if (emailTaken) {
      return { error: 'Diese E-Mail-Adresse wird bereits von einem anderen Klienten verwendet.' }
    }
  }

  if (!force) {
    const existing = await prisma.client.findFirst({
      where: {
        vorname: { equals: data.vorname.trim() },
        nachname: { equals: data.nachname.trim() },
      },
      select: { id: true, vorname: true, nachname: true },
    })
    if (existing) {
      return { duplicate: true, existingName: `${existing.vorname} ${existing.nachname}`, existingId: existing.id }
    }
  }

  let clientId: string
  try {
    const client = await prisma.client.create({
      data: {
        vorname: data.vorname.trim(),
        nachname: data.nachname.trim(),
        adresse: data.adresse || undefined,
        telefon: data.telefon || undefined,
        email: data.email || undefined,
        beruf: data.beruf || undefined,
        geburtsdatum: data.geburtsdatum ? new Date(data.geburtsdatum) : undefined,
        geschlecht:
          data.geschlecht === 'WEIBLICH' ? 'WEIBLICH'
          : data.geschlecht === 'MAENNLICH' ? 'MAENNLICH'
          : data.geschlecht === 'DIVERS' ? 'DIVERS'
          : undefined,
        herkunft: data.herkunft || undefined,
      },
    })
    clientId = client.id
  } catch (e) {
    console.error(e)
    return { error: 'Fehler beim Speichern.' }
  }
  revalidateTag('clients')

  revalidatePath('/clients')
  redirect(`/clients/${clientId}`)
}

export async function importSingleClient(data: {
  vorname: string
  nachname: string
  email?: string
  telefon?: string
  adresse?: string
  beruf?: string
  geburtsdatum?: string
}) {
  if (!await getServerSession(authOptions)) return { error: 'Nicht angemeldet.' }
  try {
    await prisma.client.create({
      data: {
        vorname:      data.vorname.trim(),
        nachname:     data.nachname.trim(),
        email:        data.email || undefined,
        telefon:      data.telefon || undefined,
        adresse:      data.adresse || undefined,
        beruf:        data.beruf || undefined,
        geburtsdatum: data.geburtsdatum ? new Date(data.geburtsdatum) : undefined,
      },
    })
    revalidateTag('clients')
    revalidatePath('/clients')
    return {}
  } catch (e: any) {
    return { error: e?.message ?? 'Fehler beim Speichern.' }
  }
}

export async function createAnamnese(clientId: string, data: AnamneseFormData) {
  if (!await getServerSession(authOptions)) return { error: 'Nicht angemeldet.' }
  try {
    await prisma.anamnese.create({ data: { clientId, ...anamneseFields(data) } })
  } catch (e) {
    console.error(e)
    return { error: 'Fehler beim Speichern.' }
  }
  revalidateTag('clients')

  revalidatePath(`/clients/${clientId}`)
  redirect(`/clients/${clientId}`)
}

export async function updateClientTags(clientId: string, tags: string[]) {
  if (!await getServerSession(authOptions)) return { error: 'Nicht angemeldet.' }
  await prisma.client.update({ where: { id: clientId }, data: { tags: JSON.stringify(tags) } })
  revalidateTag('clients')
  revalidatePath(`/clients/${clientId}`)
  revalidatePath('/clients')
}

export async function updateClientStatus(
  clientId: string,
  status: string
) {
  if (!await getServerSession(authOptions)) return { error: 'Nicht angemeldet.' }
  await prisma.client.update({ where: { id: clientId }, data: { status } })
  revalidateTag('clients')
  revalidatePath(`/clients/${clientId}`)
  revalidatePath('/clients')
}

export async function updateNaechsterTermin(clientId: string, datum: string) {
  if (!await getServerSession(authOptions)) return { error: 'Nicht angemeldet.' }
  await prisma.client.update({
    where: { id: clientId },
    data: { naechsterTermin: datum ? new Date(datum) : null },
  })
  revalidateTag('clients')

  revalidatePath(`/clients/${clientId}`)
}

export async function addNotiz(clientId: string, inhalt: string, kategorie?: string) {
  if (!await getServerSession(authOptions)) return { error: 'Nicht angemeldet.' }
  await prisma.notiz.create({ data: { clientId, inhalt, kategorie } })
  revalidateTag('clients')

  revalidatePath(`/clients/${clientId}`)
}


export async function deleteNotiz(notizId: string, clientId: string) {
  if (!await getServerSession(authOptions)) return { error: 'Nicht angemeldet.' }
  const notiz = await prisma.notiz.findUnique({
    where: { id: notizId },
    select: { messungId: true },
  })
  await prisma.$transaction(async tx => {
    await tx.notiz.update({
      where: { id: notizId },
      data: { deletedAt: new Date() },
    })
    if (notiz?.messungId) {
      await tx.messung.delete({ where: { id: notiz.messungId } })
        .catch((e: any) => { if (e.code !== 'P2025') throw e })
    }
  })
  revalidateTag('clients')

  revalidatePath(`/clients/${clientId}`)
}

export async function restoreNotiz(notizId: string, clientId: string) {
  if (!await getServerSession(authOptions)) return { error: 'Nicht angemeldet.' }
  await prisma.notiz.update({
    where: { id: notizId },
    data: { deletedAt: null },
  })
  revalidateTag('clients')
  revalidatePath(`/clients/${clientId}`)
}

export async function updateNotiz(notizId: string, clientId: string, inhalt: string) {
  if (!await getServerSession(authOptions)) return { error: 'Nicht angemeldet.' }
  await prisma.notiz.update({ where: { id: notizId }, data: { inhalt } })
  revalidateTag('clients')

  revalidatePath(`/clients/${clientId}`)
}

export async function updateAnamnese(id: string, clientId: string, data: AnamneseFormData) {
  if (!await getServerSession(authOptions)) return { error: 'Nicht angemeldet.' }
  try {
    await prisma.anamnese.update({ where: { id }, data: anamneseFields(data) })
  } catch (e) {
    console.error(e)
    return { error: 'Fehler beim Speichern.' }
  }
  revalidateTag('clients')

  revalidatePath(`/clients/${clientId}`)
  redirect(`/clients/${clientId}`)
}

export async function updateAnamniseDatum(id: string, clientId: string, datum: string) {
  if (!await getServerSession(authOptions)) return { error: 'Nicht angemeldet.' }
  try {
    await prisma.anamnese.update({ where: { id }, data: { datum: new Date(datum) } })
  } catch (e) {
    console.error(e)
    return { error: 'Fehler beim Speichern.' }
  }
  revalidateTag('clients')
  revalidatePath(`/clients/${clientId}`)
}

export async function deleteClient(id: string) {
  if (!await getServerSession(authOptions)) return { error: 'Nicht angemeldet.' }
  await prisma.client.delete({ where: { id } })
  revalidateTag('clients')
  revalidatePath('/clients')
  redirect('/clients')
}

// ── Messungen ──────────────────────────────────────────────────────────────────

export async function createMessung(clientId: string, gewicht: number, koerperfett?: number) {
  if (!await getServerSession(authOptions)) return { error: 'Nicht angemeldet.' }
  await prisma.messung.create({ data: { clientId, gewicht, koerperfett } })
  revalidateTag('clients')
  revalidatePath(`/clients/${clientId}`)
}

export async function deleteMessung(id: string, clientId: string) {
  if (!await getServerSession(authOptions)) return { error: 'Nicht angemeldet.' }
  await prisma.messung.delete({ where: { id } })
  revalidateTag('clients')
  revalidatePath(`/clients/${clientId}`)
}

// ── Ziele ──────────────────────────────────────────────────────────────────────

export async function createZiel(clientId: string, titel: string, beschreibung: string, zieldatum: string, zielwert?: number, einheit?: string) {
  if (!await getServerSession(authOptions)) return { error: 'Nicht angemeldet.' }
  await prisma.ziel.create({
    data: { clientId, titel, beschreibung: beschreibung || undefined, zieldatum: zieldatum ? new Date(zieldatum) : undefined, zielwert: zielwert || undefined, einheit: einheit || undefined },
  })
  revalidateTag('clients')
  revalidatePath(`/clients/${clientId}`)
}

export async function toggleZiel(id: string, clientId: string, erreicht: boolean) {
  if (!await getServerSession(authOptions)) return { error: 'Nicht angemeldet.' }
  await prisma.ziel.update({
    where: { id },
    data: { erreicht, erreichtAm: erreicht ? new Date() : null },
  })
  revalidateTag('clients')
  revalidatePath(`/clients/${clientId}`)
}

export async function deleteZiel(id: string, clientId: string) {
  if (!await getServerSession(authOptions)) return { error: 'Nicht angemeldet.' }
  await prisma.ziel.delete({ where: { id } })
  revalidateTag('clients')
  revalidatePath(`/clients/${clientId}`)
}
