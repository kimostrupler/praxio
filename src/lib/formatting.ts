export type ClientStatus = 'AKTIV' | 'PAUSIERT' | 'INAKTIV'
export type RechnungStatus = 'OFFEN' | 'BEZAHLT' | 'STORNIERT'

export function CHF(n: number): string {
  const [int, dec] = n.toFixed(2).split('.')
  return 'CHF ' + int.replace(/\B(?=(\d{3})+(?!\d))/g, "'") + '.' + dec
}

export function rBrutto(r: { mwst: number; positionen: { menge: number; einzelpreis: number }[] }): number {
  const netto = r.positionen.reduce((s, p) => s + p.menge * p.einzelpreis, 0)
  return netto * (1 + r.mwst / 100)
}

export const CLIENT_STATUS_LABEL: Record<string, string> = {
  AKTIV: 'Aktiv', PAUSIERT: 'Pausiert', INAKTIV: 'Inaktiv',
}
export const CLIENT_STATUS_STYLE: Record<string, string> = {
  AKTIV:    'bg-emerald-950/40 text-emerald-400 border border-emerald-900/40',
  PAUSIERT: 'bg-orange-950/40 text-orange-400 border border-orange-900/40',
  INAKTIV:  'bg-[#1c1c1c] text-[#444444] border border-[#2e2e2e]',
}

export const RECHNUNG_STATUS_LABEL: Record<string, string> = {
  OFFEN: 'Offen', BEZAHLT: 'Bezahlt', STORNIERT: 'Storniert',
}
export const RECHNUNG_STATUS_STYLE: Record<string, string> = {
  OFFEN:     'bg-orange-950/40 text-orange-400 border border-orange-900/40',
  BEZAHLT:   'bg-emerald-950/40 text-emerald-400 border border-emerald-900/40',
  STORNIERT: 'bg-[#1c1c1c] text-[#444444] border border-[#2e2e2e]',
}
