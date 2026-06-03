import { getCachedClients, getCachedRechnungen, getCachedStatistikenAggregates } from '@/lib/queries'
import { CHF, rBrutto } from '@/lib/formatting'
import Link from 'next/link'

// ── Primitives ────────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-mono font-semibold text-[#555555] uppercase tracking-widest">
      {children}
    </p>
  )
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-[#141414] border border-[#2e2e2e] rounded-xl ${className}`}>
      {children}
    </div>
  )
}

// Inline bar: label / bar / value — used in ranked lists
function BarRow({
  label, value, max, accent = false, href,
}: {
  label: string; value: number | string; max: number; accent?: boolean; href?: string
}) {
  const num = typeof value === 'number' ? value : 0
  const pct = max > 0 ? Math.round((num / max) * 100) : 0
  const row = (
    <div className="flex items-center gap-3">
      <span className="text-xs text-[#666666] w-36 shrink-0 truncate">{label}</span>
      <div className="flex-1 bg-[#1c1c1c] rounded-full h-1.5 overflow-hidden">
        <div
          className="h-1.5 rounded-full transition-all"
          style={{
            width: `${pct}%`,
            background: accent ? 'var(--accent)' : 'color-mix(in srgb, var(--accent) 45%, var(--hover))',
          }}
        />
      </div>
      <span className="text-xs font-semibold text-[#efefef] w-6 text-right tabular-nums shrink-0">{value}</span>
    </div>
  )
  if (href) {
    return <Link href={href} className="block hover:opacity-80 transition-opacity">{row}</Link>
  }
  return row
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function StatistikenPage() {
  const now              = new Date()
  const sixMonthsAgo     = new Date(now.getFullYear(), now.getMonth() - 5, 1)
  const startOfYear      = new Date(now.getFullYear(), 0, 1)
  const startOfMonth     = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const endOfLastMonth   = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)

  const [allClients, allRechnungen, aggregates] = await Promise.all([
    getCachedClients(),
    getCachedRechnungen(),
    getCachedStatistikenAggregates(),
  ])

  const { anamneseCount, planCount, presetTop, goalCounts, stressAvg, schlafAvg, weightData } = aggregates

  // Client counts
  const clientStats = allClients.length
  const statusMap: Record<string, number> = {}
  for (const c of allClients) statusMap[c.status] = (statusMap[c.status] ?? 0) + 1
  const newThisMonth = allClients.filter(c => new Date(c.createdAt) >= startOfMonth).length

  // Herkunft
  const herkunftMap: Record<string, number> = {}
  for (const c of allClients) {
    const h = c.herkunft ?? 'Unbekannt'
    herkunftMap[h] = (herkunftMap[h] ?? 0) + 1
  }
  const herkunftEntries = Object.entries(herkunftMap).sort((a, b) => b[1] - a[1])
  const maxHerkunft = herkunftEntries[0]?.[1] ?? 1

  // Monthly new clients (last 6 months)
  const monthlyData: Record<string, number> = {}
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    monthlyData[d.toLocaleDateString('de-DE', { month: 'short' })] = 0
  }
  for (const c of allClients) {
    if (new Date(c.createdAt) >= sixMonthsAgo) {
      const key = new Date(c.createdAt).toLocaleDateString('de-DE', { month: 'short' })
      if (key in monthlyData) monthlyData[key]++
    }
  }
  const maxMonth = Math.max(...Object.values(monthlyData), 1)

  // Revenue
  const bezahlt = allRechnungen.filter(r => r.status === 'BEZAHLT')
  const bezahltMitBrutto = bezahlt.map(r => ({
    ...r,
    brutto: rBrutto(r),
    paidAt: new Date(r.bezahltAm ?? r.datum),
  }))

  const thisMonthRevenue  = bezahltMitBrutto.filter(r => r.paidAt >= startOfMonth).reduce((s, r) => s + r.brutto, 0)
  const lastMonthRevenue  = bezahltMitBrutto.filter(r => r.paidAt >= startOfLastMonth && r.paidAt <= endOfLastMonth).reduce((s, r) => s + r.brutto, 0)
  const ytdRevenue        = bezahltMitBrutto.filter(r => r.paidAt >= startOfYear).reduce((s, r) => s + r.brutto, 0)
  const openTotal         = allRechnungen.filter(r => r.status === 'OFFEN').reduce((s, r) => s + rBrutto(r), 0)

  // Monthly revenue for 6-month chart
  const monthlyRevenue: Record<string, number> = {}
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    monthlyRevenue[d.toLocaleDateString('de-DE', { month: 'short' })] = 0
  }
  for (const r of bezahltMitBrutto) {
    const key = r.paidAt.toLocaleDateString('de-DE', { month: 'short' })
    if (key in monthlyRevenue) monthlyRevenue[key] += r.brutto
  }
  const maxMonthlyRevenue = Math.max(...Object.values(monthlyRevenue), 1)
  const totalRevenue6m    = Object.values(monthlyRevenue).reduce((s, v) => s + v, 0)

  // Top clients
  const clientRevenue: Record<string, { name: string; total: number }> = {}
  for (const r of bezahltMitBrutto) {
    const cid = r.client.id
    if (!clientRevenue[cid]) clientRevenue[cid] = { name: `${r.client.vorname} ${r.client.nachname}`, total: 0 }
    clientRevenue[cid].total += r.brutto
  }
  const topClients       = Object.values(clientRevenue).sort((a, b) => b.total - a.total).slice(0, 6)
  const maxClientRevenue = topClients[0]?.total ?? 1

  // Revenue forecast — avg of last 3 complete months
  const forecastMonths = [1, 2, 3].map(i => {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const end   = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59)
    return bezahltMitBrutto.filter(r => r.paidAt >= start && r.paidAt <= end).reduce((s, r) => s + r.brutto, 0)
  })
  const forecastNext = forecastMonths.reduce((s, v) => s + v, 0) / 3

  // Churn risk
  const sixtyDaysAgo = new Date(Date.now() - 60 * 86400000)
  const churnRisk = allClients
    .filter(c => c.status === 'AKTIV')
    .map(c => {
      const last = new Date((c.notizen[0]?.datum ?? c.createdAt) as Date)
      return { ...c, lastContact: last, daysSince: Math.floor((Date.now() - last.getTime()) / 86400000) }
    })
    .filter(c => c.lastContact < sixtyDaysAgo)
    .sort((a, b) => b.daysSince - a.daysSince)

  // Goals + presets
  const goalFreq: Record<string, number> = {}
  for (const a of goalCounts) {
    for (const z of a.ziele) goalFreq[z] = (goalFreq[z] ?? 0) + 1
  }
  const topGoals  = Object.entries(goalFreq).sort((a, b) => b[1] - a[1]).slice(0, 8)
  const maxGoal   = topGoals[0]?.[1] ?? 1
  const maxPreset = presetTop[0]?._count.trainingsplaene ?? 1

  const revenueEntries   = Object.entries(monthlyRevenue)
  const newClientEntries = Object.entries(monthlyData)

  return (
    <div className="p-4 md:p-6 lg:p-8 w-full space-y-4">

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-[#efefef]">Statistiken</h1>
        <p className="text-xs text-[#3a3a3a] mt-0.5">
          {now.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* ── Revenue hero ── */}
      <Card className="overflow-hidden">
        {/* Card header */}
        <div className="px-5 pt-5 flex items-start justify-between gap-4">
          <div>
            <SectionLabel>Umsatz · Letzte 6 Monate</SectionLabel>
            <p className="text-3xl font-bold tabular-nums text-[#efefef] mt-2">{CHF(totalRevenue6m)}</p>
          </div>
          <div className="text-right shrink-0">
            <SectionLabel>Prognose nächster Monat</SectionLabel>
            <p className="text-xl font-bold tabular-nums text-[#efefef] mt-2">{CHF(forecastNext)}</p>
          </div>
        </div>

        {/* Bar chart */}
        <div className="px-5 pt-4 pb-5">
          <div className="flex items-end gap-2" style={{ height: 148 }}>
            {revenueEntries.map(([month, amount], i) => {
              const isCurrentMonth = i === revenueEntries.length - 1
              const barH = amount > 0 ? Math.max(Math.round((amount / maxMonthlyRevenue) * 108), 4) : 2
              return (
                <div key={month} className="flex-1 flex flex-col items-center gap-1" style={{ height: '100%' }}>
                  <div style={{ flex: 1 }} />
                  {amount > 0 && (
                    <span
                      className="text-[9px] font-mono tabular-nums mb-1"
                      style={{ color: 'var(--accent)' }}
                    >
                      {amount >= 1000 ? `${(amount / 1000).toFixed(1)}k` : Math.round(amount)}
                    </span>
                  )}
                  <div
                    className="w-full rounded-lg"
                    style={{
                      height: barH,
                      background: isCurrentMonth
                        ? 'var(--accent)'
                        : 'color-mix(in srgb, var(--accent) 28%, var(--hover))',
                    }}
                  />
                  <span className="text-[9px] font-mono text-[#3a3a3a] mt-1.5">{month}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* KPI strip */}
        <div className="border-t border-[#1c1c1c] grid grid-cols-2 md:grid-cols-4 divide-x divide-[#1c1c1c]">
          {[
            { label: 'Diesen Monat',  value: CHF(thisMonthRevenue),  accent: false },
            { label: 'Letzten Monat', value: CHF(lastMonthRevenue),  accent: false },
            { label: 'Jahresumsatz',  value: CHF(ytdRevenue),        accent: false },
            { label: 'Ausstehend',    value: CHF(openTotal),         accent: openTotal > 0 },
          ].map(({ label, value, accent }) => (
            <div key={label} className="px-4 py-4 md:px-5">
              <SectionLabel>{label}</SectionLabel>
              <p
                className="text-lg font-bold tabular-nums mt-1.5"
                style={{ color: accent ? 'var(--accent)' : 'var(--text)' }}
              >
                {value}
              </p>
            </div>
          ))}
        </div>
      </Card>

      {/* ── Clients + top clients ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Client overview */}
        <Card className="p-5">
          <div className="flex items-start justify-between mb-4">
            <SectionLabel>Klienten</SectionLabel>
            <span className="text-xs font-semibold text-[#efefef]">{clientStats} gesamt</span>
          </div>

          {/* Segmented status bar */}
          {clientStats > 0 && (
            <div className="flex h-1.5 rounded-full overflow-hidden mb-4 gap-px">
              {([
                { key: 'AKTIV',    bg: '#34d399' },
                { key: 'PAUSIERT', bg: '#fb923c' },
                { key: 'INAKTIV',  bg: '#374151' },
              ] as const).map(({ key, bg }) => {
                const count = statusMap[key] ?? 0
                if (count === 0) return null
                return (
                  <div
                    key={key}
                    className="h-full rounded-full transition-all"
                    style={{ flex: count / clientStats, background: bg }}
                  />
                )
              })}
            </div>
          )}

          {/* Status rows */}
          <div className="space-y-2.5 mb-5">
            {([
              { label: 'Aktiv',    key: 'AKTIV',    color: '#34d399' },
              { label: 'Pausiert', key: 'PAUSIERT', color: '#fb923c' },
              { label: 'Inaktiv',  key: 'INAKTIV',  color: '#6b7280' },
            ] as const).map(({ label, key, color }) => {
              const count = statusMap[key] ?? 0
              const pct   = clientStats > 0 ? Math.round((count / clientStats) * 100) : 0
              return (
                <div key={key} className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color }} />
                  <span className="text-xs text-[#666666] flex-1">{label}</span>
                  <div className="w-24 bg-[#1c1c1c] rounded-full h-1 overflow-hidden">
                    <div
                      className="h-1 rounded-full"
                      style={{ width: `${pct}%`, background: color }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-[#efefef] w-4 text-right tabular-nums">{count}</span>
                  <span className="text-[10px] text-[#3a3a3a] w-8 tabular-nums">{pct}%</span>
                </div>
              )
            })}
          </div>

          {/* Meta strip */}
          <div className="border-t border-[#1c1c1c] pt-4 grid grid-cols-3 gap-2 text-center">
            {[
              { label: 'Anamnesen',       value: anamneseCount },
              { label: 'Trainingspläne',  value: planCount },
              { label: 'Neu diesen Monat', value: newThisMonth },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-xl font-bold text-[#efefef] tabular-nums">{value}</p>
                <p className="text-[9px] font-mono text-[#3a3a3a] mt-0.5 leading-tight">{label}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Top clients by revenue */}
        <Card className="p-5">
          <SectionLabel>Top Klienten · Umsatz</SectionLabel>
          {topClients.length === 0 ? (
            <p className="text-xs text-[#3a3a3a] mt-4">Keine Rechnungen vorhanden.</p>
          ) : (
            <div className="space-y-3 mt-4">
              {topClients.map((c, i) => {
                const pct = Math.round((c.total / maxClientRevenue) * 100)
                return (
                  <div key={c.name} className="flex items-center gap-3">
                    <span className="text-[10px] font-mono text-[#3a3a3a] w-3 shrink-0 tabular-nums">{i + 1}</span>
                    <span className="text-xs text-[#efefef] w-28 shrink-0 truncate">{c.name}</span>
                    <div className="flex-1 bg-[#1c1c1c] rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-1.5 rounded-full"
                        style={{
                          width: `${pct}%`,
                          opacity: 1 - i * 0.1,
                          background: 'var(--accent)',
                        }}
                      />
                    </div>
                    <span className="text-xs font-semibold tabular-nums text-[#efefef] w-24 text-right shrink-0">
                      {CHF(c.total)}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      </div>

      {/* ── New clients chart + health ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* New clients per month */}
        <Card className="p-5">
          <SectionLabel>Neue Klienten · Letzte 6 Monate</SectionLabel>
          <div className="flex items-end gap-2 mt-4" style={{ height: 100 }}>
            {newClientEntries.map(([month, count], i) => {
              const isCurrentMonth = i === newClientEntries.length - 1
              const barH = count > 0 ? Math.max(Math.round((count / maxMonth) * 72), 4) : 2
              return (
                <div key={month} className="flex-1 flex flex-col items-center gap-1" style={{ height: '100%' }}>
                  <div style={{ flex: 1 }} />
                  {count > 0 && (
                    <span className="text-[9px] font-mono tabular-nums mb-1" style={{ color: 'var(--accent)' }}>
                      {count}
                    </span>
                  )}
                  <div
                    className="w-full rounded-lg"
                    style={{
                      height: barH,
                      background: isCurrentMonth
                        ? 'var(--accent)'
                        : 'color-mix(in srgb, var(--accent) 28%, var(--hover))',
                    }}
                  />
                  <span className="text-[9px] font-mono text-[#3a3a3a] mt-1.5">{month}</span>
                </div>
              )
            })}
          </div>
        </Card>

        {/* Health averages */}
        <Card className="p-5">
          <SectionLabel>Gesundheit · Durchschnitte</SectionLabel>
          <div className="mt-4 divide-y divide-[#1c1c1c]">
            {[
              {
                label: 'Ø Stresslevel',
                value: stressAvg._avg.stressLevel != null
                  ? `${stressAvg._avg.stressLevel.toFixed(1)} / 10` : '—',
                n: stressAvg._count.stressLevel,
              },
              {
                label: 'Ø Schlafstunden',
                value: schlafAvg._avg.schlafStunden != null
                  ? `${schlafAvg._avg.schlafStunden.toFixed(1)} h` : '—',
                n: null,
              },
              {
                label: 'Ø Gewicht',
                value: weightData._avg.aktuellesGewicht != null
                  ? `${weightData._avg.aktuellesGewicht.toFixed(1)} kg` : '—',
                n: weightData._count.aktuellesGewicht,
              },
              {
                label: 'Ø Körperfett',
                value: weightData._avg.koerperfett != null
                  ? `${weightData._avg.koerperfett.toFixed(1)} %` : '—',
                n: null,
              },
            ].map(row => (
              <div key={row.label} className="flex items-center justify-between py-3">
                <span className="text-xs text-[#666666]">{row.label}</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-semibold text-[#efefef] tabular-nums">{row.value}</span>
                  {row.n != null && (
                    <span className="text-[10px] text-[#3a3a3a] tabular-nums">{row.n} Eintr.</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* ── Goals + Presets ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        <Card className="p-5">
          <SectionLabel>Häufigste Ziele</SectionLabel>
          {topGoals.length === 0 ? (
            <p className="text-xs text-[#3a3a3a] mt-4">Keine Ziele erfasst.</p>
          ) : (
            <div className="space-y-2.5 mt-4">
              {topGoals.map(([goal, count], i) => (
                <BarRow key={goal} label={goal} value={count} max={maxGoal} accent={i === 0} />
              ))}
            </div>
          )}
        </Card>

        <Card className="p-5">
          <SectionLabel>Meist genutzte Vorlagen</SectionLabel>
          {presetTop.filter(p => p._count.trainingsplaene > 0).length === 0 ? (
            <p className="text-xs text-[#3a3a3a] mt-4">Keine Vorlagen zugewiesen.</p>
          ) : (
            <div className="space-y-2.5 mt-4">
              {presetTop
                .filter(p => p._count.trainingsplaene > 0)
                .map((p, i) => (
                  <BarRow
                    key={p.name}
                    label={p.name}
                    value={p._count.trainingsplaene}
                    max={maxPreset}
                    accent={i === 0}
                  />
                ))}
            </div>
          )}
        </Card>
      </div>

      {/* ── Herkunft ── */}
      {herkunftEntries.some(([k]) => k !== 'Unbekannt') && (
        <Card className="p-5">
          <SectionLabel>Herkunft der Klienten</SectionLabel>
          <div className="mt-4 space-y-2.5">
            {herkunftEntries.map(([label, count], i) => (
              <BarRow key={label} label={label} value={count} max={maxHerkunft} accent={i === 0} />
            ))}
          </div>
        </Card>
      )}

      {/* ── Churn risk ── */}
      {churnRisk.length > 0 && (
        <Card className="overflow-hidden">
          <div className="px-5 py-4 border-b border-[#1c1c1c] flex items-center justify-between">
            <div>
              <SectionLabel>Churn-Risiko</SectionLabel>
              <p className="text-[10px] text-[#3a3a3a] mt-1">
                {churnRisk.length} aktive{churnRisk.length !== 1 ? 'r' : ''} Klient{churnRisk.length !== 1 ? 'en' : ''} ohne Kontakt seit 60+ Tagen
              </p>
            </div>
          </div>
          <ul className="divide-y divide-[#1c1c1c]">
            {churnRisk.map(c => (
              <li key={c.id}>
                <Link
                  href={`/clients/${c.id}`}
                  className="flex items-center justify-between gap-4 px-5 py-3 hover:bg-[#1c1c1c] transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${c.daysSince > 90 ? 'bg-red-400' : 'bg-orange-400'}`} />
                    <span className="text-sm text-[#efefef] truncate">{c.vorname} {c.nachname}</span>
                  </div>
                  <div className="flex items-center gap-6 shrink-0">
                    <span className="text-xs text-[#444444] hidden sm:block">
                      {c.notizen[0]?.datum
                        ? new Date(c.notizen[0].datum as Date).toLocaleDateString('de-DE')
                        : 'Keine Notiz'}
                    </span>
                    <span className={`text-xs font-semibold tabular-nums ${c.daysSince > 90 ? 'text-red-400' : 'text-orange-400'}`}>
                      {c.daysSince}d
                    </span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                      className="text-[#2e2e2e] group-hover:text-[#555555] transition-colors shrink-0">
                      <polyline points="9 18 15 12 9 6"/>
                    </svg>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}

    </div>
  )
}
