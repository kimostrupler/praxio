export function parseJsonArray(v: unknown): string[] {
  if (Array.isArray(v)) return v as string[]
  if (typeof v !== 'string' || !v) return []
  try { const p = JSON.parse(v); return Array.isArray(p) ? p : [] } catch { return [] }
}

export type GewichtsEintrag = {
  datum: Date
  gewicht: number
  koerperfett: number | null
}

export function buildGewichtsDaten(
  anamnesen: Array<{ datum: Date; aktuellesGewicht: number | null; koerperfett: number | null }>,
  messungen: Array<{ datum: Date; gewicht: number | null; koerperfett: number | null }>
): GewichtsEintrag[] {
  return [
    ...anamnesen
      .filter(a => a.aktuellesGewicht != null)
      .map(a => ({ datum: a.datum, gewicht: a.aktuellesGewicht!, koerperfett: a.koerperfett ?? null })),
    ...messungen
      .filter(m => m.gewicht != null)
      .map(m => ({ datum: m.datum, gewicht: m.gewicht!, koerperfett: m.koerperfett ?? null })),
  ].sort((a, b) => a.datum.getTime() - b.datum.getTime())
}
