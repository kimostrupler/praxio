import { prisma } from './db'

// Praxis config — all read from the AppSettings singleton row in the DB.
// Import getPraxisConfig() and read fields from it. Never read process.env.PRAXIS_* directly.
export type PraxisConfig = {
  name:            string
  subtitle:        string
  adresse:         string
  strasse:         string
  plz:             string
  ort:             string
  telefon:         string
  email:           string
  website:         string
  mwstNr:          string
  iban:            string
  qrIban:          string
  bank:            string
  bic:             string
  rechnungMwst:    string
  rechnungBetreff: string
  rechnungText:    string
}

export async function getPraxisConfig(): Promise<PraxisConfig> {
  const s = await prisma.appSettings.findUnique({ where: { id: 'singleton' } })
  return {
    name:            s?.praxisName     ?? 'FitAllCoach',
    subtitle:        s?.coachName      ?? 'by Joelle',
    adresse:         s?.praxisAdresse  ?? '',
    strasse:         s?.praxisStrasse  ?? '',
    plz:             s?.praxisPlz      ?? '',
    ort:             s?.praxisOrt      ?? '',
    telefon:         s?.praxisTelefon  ?? '',
    email:           s?.praxisEmail    ?? '',
    website:         s?.praxisWebsite  ?? '',
    mwstNr:          s?.praxisMwstNr   ?? '',
    iban:            s?.praxisIban     ?? '',
    qrIban:          s?.praxisQrIban   ?? '',
    bank:            s?.praxisBank     ?? '',
    bic:             s?.praxisBic      ?? '',
    rechnungMwst:    s?.rechnungMwst    ?? '0',
    rechnungBetreff: s?.rechnungBetreff ?? '',
    rechnungText:    s?.rechnungText    ?? '',
  }
}
