'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import fs from 'fs'
import path from 'path'
import { LOGO_FILE, VERTRAG_FILE } from '@/lib/data-paths'
import { audit } from '@/lib/audit'
import { invalidateLogoCache } from '@/lib/logo'

const ENV_PATH = path.join(process.cwd(), '.env')

function patchEnv(updates: Record<string, string>) {
  let content = fs.readFileSync(ENV_PATH, 'utf-8')
  for (const [key, value] of Object.entries(updates)) {
    const escaped = value.replace(/"/g, '\\"')
    const line = `${key}="${escaped}"`
    const pattern = new RegExp(`^${key}=.*$`, 'm')
    content = pattern.test(content)
      ? content.replace(pattern, line)
      : content + `\n${line}`
  }
  fs.writeFileSync(ENV_PATH, content, 'utf-8')
}

export async function updateEmail(currentPassword: string, newEmail: string) {
  const session = await getServerSession(authOptions)
  if (!session) return { error: 'Nicht angemeldet.' }

  const trimmed = newEmail.trim().toLowerCase()
  if (!trimmed || !trimmed.includes('@')) return { error: 'Ungültige E-Mail-Adresse.' }

  const userId = (session.user as any).id
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) return { error: 'Benutzer nicht gefunden.' }

  if (!await bcrypt.compare(currentPassword, user.passwordHash))
    return { error: 'Aktuelles Passwort ist falsch.' }

  const existing = await prisma.user.findUnique({ where: { email: trimmed } })
  if (existing && existing.id !== userId) return { error: 'E-Mail bereits vergeben.' }

  await prisma.user.update({ where: { id: userId }, data: { email: trimmed } })
  await audit(userId, 'UPDATE_EMAIL', userId)
  return { success: true }
}

export async function updatePassword(
  currentPassword: string,
  newPassword: string,
  confirmPassword: string,
) {
  const session = await getServerSession(authOptions)
  if (!session) return { error: 'Nicht angemeldet.' }

  if (newPassword.length < 8) return { error: 'Neues Passwort muss mindestens 8 Zeichen lang sein.' }
  if (newPassword !== confirmPassword) return { error: 'Passwörter stimmen nicht überein.' }
  if (newPassword === currentPassword) return { error: 'Neues Passwort darf nicht gleich dem alten sein.' }

  const userId = (session.user as any).id
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) return { error: 'Benutzer nicht gefunden.' }

  if (!await bcrypt.compare(currentPassword, user.passwordHash))
    return { error: 'Aktuelles Passwort ist falsch.' }

  const hashed = await bcrypt.hash(newPassword, 12)
  await prisma.user.update({ where: { id: userId }, data: { passwordHash: hashed, sessionVersion: { increment: 1 } } })
  await audit(userId, 'UPDATE_PASSWORD', userId)
  return { success: true }
}

export async function updateVertragLeistungen(text: string) {
  if (!await getServerSession(authOptions)) return { error: 'Nicht angemeldet.' }
  try {
    fs.mkdirSync(path.dirname(VERTRAG_FILE), { recursive: true })
    fs.writeFileSync(VERTRAG_FILE, text, 'utf-8')
  } catch {
    return { error: 'Datei konnte nicht gespeichert werden.' }
  }
  return { success: true }
}

export async function updateCalcomApiKey(key: string) {
  if (!await getServerSession(authOptions)) return { error: 'Nicht angemeldet.' }
  const trimmed = key.trim()
  if (trimmed && !trimmed.startsWith('cal_'))
    return { error: 'Ungültiger API-Key (muss mit cal_ beginnen).' }
  patchEnv({ CALCOM_API_KEY: trimmed })
  process.env.CALCOM_API_KEY = trimmed
  return { success: true }
}

export async function uploadLogo(dataUrl: string) {
  if (!await getServerSession(authOptions)) return { error: 'Nicht angemeldet.' }
  if (!dataUrl.startsWith('data:image/jpeg;') && !dataUrl.startsWith('data:image/png;'))
    return { error: 'Nur JPEG und PNG erlaubt.' }
  if (dataUrl.length > 500_000) return { error: 'Logo zu gross (max. 500 KB).' }
  try {
    fs.mkdirSync(path.dirname(LOGO_FILE), { recursive: true })
    fs.writeFileSync(LOGO_FILE, dataUrl, 'utf-8')
    invalidateLogoCache()
  } catch {
    return { error: 'Logo konnte nicht gespeichert werden.' }
  }
  return { success: true }
}

export async function removeLogo() {
  if (!await getServerSession(authOptions)) return { error: 'Nicht angemeldet.' }
  try {
    if (fs.existsSync(LOGO_FILE)) fs.unlinkSync(LOGO_FILE)
    invalidateLogoCache()
  } catch {
    return { error: 'Logo konnte nicht entfernt werden.' }
  }
  return { success: true }
}

export async function updatePraxisKontakt(data: {
  adresse: string; strasse: string; plz: string; ort: string
  telefon: string; email: string; website: string
  mwstNr: string; iban: string; qrIban: string; bank: string; bic: string
  rechnungMwst: string; rechnungBetreff: string; rechnungText: string
}) {
  if (!await getServerSession(authOptions)) return { error: 'Nicht angemeldet.' }

  const updates = {
    PRAXIS_ADRESSE:        data.adresse,
    PRAXIS_STRASSE:        data.strasse,
    PRAXIS_PLZ:            data.plz,
    PRAXIS_ORT:            data.ort,
    PRAXIS_TELEFON:        data.telefon,
    PRAXIS_EMAIL_ADDR:     data.email,
    PRAXIS_WEBSITE:        data.website,
    PRAXIS_MWST_NR:        data.mwstNr,
    PRAXIS_IBAN:           data.iban,
    PRAXIS_QR_IBAN:        data.qrIban,
    PRAXIS_BANK:           data.bank,
    PRAXIS_BIC:            data.bic,
    RECHNUNG_MWST_DEFAULT:    data.rechnungMwst,
    RECHNUNG_BETREFF_DEFAULT: data.rechnungBetreff,
    RECHNUNG_TEXT_DEFAULT:    data.rechnungText,
  }
  patchEnv(updates)
  for (const [k, v] of Object.entries(updates)) process.env[k] = v

  return { success: true }
}
