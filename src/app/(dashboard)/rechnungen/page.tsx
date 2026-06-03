import Link from 'next/link'
import RechnungAktionen from '@/components/RechnungAktionen'
import type { RechnungStatus } from '@prisma/client'
import { getCachedRechnungen } from '@/lib/queries'
import { CHF, RECHNUNG_STATUS_LABEL, RECHNUNG_STATUS_STYLE } from '@/lib/formatting'

const D   = (d: Date | string) => new Date(d).toLocaleDateString('de-DE')
function overdueDays(faellig: Date | null | undefined, status: string): number | null {
  if (status !== 'OFFEN' || !faellig) return null
  const days = Math.floor((Date.now() - new Date(faellig).getTime()) / 86400000)
  return days > 0 ? days : null
}

function netto(positionen: { menge: number; einzelpreis: number }[]) {
  return positionen.reduce((s, p) => s + p.menge * p.einzelpreis, 0)
}
function brutto(n: number, mwst: number) {
  return n * (1 + mwst / 100)
}

export default async function RechnungenPage(
  props: {
    searchParams: Promise<{ q?: string; status?: string }>
  }
) {
  const searchParams = await props.searchParams;
  const q            = searchParams.q?.trim() ?? ''
  const statusFilter = (['OFFEN', 'BEZAHLT', 'STORNIERT'] as RechnungStatus[]).includes(searchParams.status as RechnungStatus)
    ? searchParams.status as RechnungStatus
    : undefined

  const all = await getCachedRechnungen()

  const rechnungen = all.filter(r => {
    if (statusFilter && r.status !== statusFilter) return false
    if (q) {
      const s = q.toLowerCase()
      return (
        r.nummer.toLowerCase().includes(s) ||
        `${r.client.vorname} ${r.client.nachname}`.toLowerCase().includes(s) ||
        (r.betreff?.toLowerCase().includes(s) ?? false)
      )
    }
    return true
  })

  const counts: Record<string, number> = {
    OFFEN:     all.filter(r => r.status === 'OFFEN').length,
    BEZAHLT:   all.filter(r => r.status === 'BEZAHLT').length,
    STORNIERT: all.filter(r => r.status === 'STORNIERT').length,
  }

  const totals = {
    offen:   all.filter(r => r.status === 'OFFEN').reduce((s, r) => s + brutto(netto(r.positionen), r.mwst), 0),
    bezahlt: all.filter(r => r.status === 'BEZAHLT').reduce((s, r) => s + brutto(netto(r.positionen), r.mwst), 0),
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 w-full">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-5">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-white">Rechnungen</h1>
          <p className="text-xs text-[#3a3a3a] mt-0.5">{rechnungen.length} {rechnungen.length === 1 ? 'Rechnung' : 'Rechnungen'}</p>
        </div>
        <Link href="/rechnungen/neu"
          className="flex-shrink-0 bg-white hover:bg-[#e8e8e8] text-black text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
          + Neue Rechnung
        </Link>
      </div>

      {/* Summary cards */}
      {all.length > 0 && (
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="bg-[#141414] border border-[#2e2e2e] rounded-xl p-4">
            <p className="text-[10px] text-[#3a3a3a] uppercase tracking-wider mb-1">Offen</p>
            <p className="text-lg font-bold text-orange-400">{CHF(totals.offen)}</p>
          </div>
          <div className="bg-[#141414] border border-[#2e2e2e] rounded-xl p-4">
            <p className="text-[10px] text-[#3a3a3a] uppercase tracking-wider mb-1">Eingenommen</p>
            <p className="text-lg font-bold text-emerald-400">{CHF(totals.bezahlt)}</p>
          </div>
        </div>
      )}

      {/* Search + filter */}
      <div className="space-y-3 mb-5">
        <form>
          {statusFilter && <input type="hidden" name="status" value={statusFilter} />}
          <input name="q" defaultValue={q} placeholder="Nummer, Klient oder Betreff…"
            className="w-full px-3 py-2.5 bg-[#141414] border border-[#2e2e2e] rounded-lg text-sm text-[#efefef] placeholder:text-[#3a3a3a] focus:outline-none focus:border-[#555555] transition-colors" />
        </form>
        <div className="flex gap-2 flex-wrap">
          {([undefined, 'OFFEN', 'BEZAHLT', 'STORNIERT'] as const).map(s => {
            const isActive = (statusFilter ?? undefined) === s
            const label    = s ? RECHNUNG_STATUS_LABEL[s] : 'Alle'
            const count    = s ? (counts[s] ?? 0) : all.length
            return (
              <Link key={s ?? 'all'}
                href={`/rechnungen${s ? `?status=${s}` : ''}${q ? `${s ? '&' : '?'}q=${encodeURIComponent(q)}` : ''}`}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-white text-black'
                    : 'bg-[#141414] border border-[#2e2e2e] text-[#666666] hover:text-[#efefef] hover:border-[#3a3a3a]'
                }`}>
                {label} <span className={`ml-1 ${isActive ? 'text-black/50' : 'text-[#3a3a3a]'}`}>{count}</span>
              </Link>
            )
          })}
        </div>
      </div>

      {/* List */}
      {rechnungen.length === 0 ? (
        <div className="bg-[#141414] border border-[#2e2e2e] rounded-xl py-16 text-center space-y-3">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
            className="text-[#2e2e2e] mx-auto">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="15" y2="17"/>
          </svg>
          <div>
            <p className="text-sm font-medium text-[#3a3a3a]">
              {q || statusFilter ? 'Keine Rechnungen gefunden.' : 'Noch keine Rechnungen vorhanden.'}
            </p>
            {!q && !statusFilter && (
              <p className="text-xs text-[#2e2e2e] mt-1">Erstelle jetzt deine erste Rechnung.</p>
            )}
          </div>
          {!q && !statusFilter && (
            <Link href="/rechnungen/neu"
              className="inline-flex items-center gap-2 bg-white hover:bg-[#e8e8e8] text-black text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors">
              + Neue Rechnung
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {rechnungen.map(r => {
            const n = netto(r.positionen)
            const b = brutto(n, r.mwst)
            return (
              <div key={r.id} className={`bg-[#141414] border border-[#2e2e2e] rounded-xl p-4 flex items-center gap-3 border-l-2 ${
                r.status === 'BEZAHLT' ? 'border-l-emerald-700' :
                r.status === 'OFFEN'   ? 'border-l-orange-700' :
                'border-l-[#2e2e2e]'
              }`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="text-sm font-semibold text-[#efefef]">{r.nummer}</span>
                    <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-medium ${RECHNUNG_STATUS_STYLE[r.status]}`}>
                      {RECHNUNG_STATUS_LABEL[r.status]}
                    </span>
                    {(() => { const d = overdueDays(r.faellig, r.status); return d ? (
                      <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-medium bg-red-950/40 text-red-400 border border-red-900/40">
                        {d} {d === 1 ? 'Tag' : 'Tage'} überfällig
                      </span>
                    ) : null })()}
                  </div>
                  {r.betreff && <p className="text-xs text-[#efefef] mt-0.5 truncate">{r.betreff}</p>}
                  <p className="text-xs text-[#666666]">
                    {r.client.vorname} {r.client.nachname}
                    {' · '}{D(r.datum)}
                    {r.faellig && ` · Fällig: ${D(r.faellig)}`}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-base font-bold text-white tabular-nums">{CHF(b)}</p>
                  {r.mwst > 0 && <p className="text-[10px] text-[#3a3a3a]">inkl. {r.mwst}% MwSt</p>}
                </div>

                <RechnungAktionen
                  rechnungId={r.id}
                  rechnungNr={r.nummer}
                  clientEmail={r.client.email ?? null}
                  clientVorname={r.client.vorname}
                  anrede={r.anrede}
                  status={r.status}
                />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
