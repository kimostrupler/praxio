import Link from 'next/link'
import type { ClientStatus } from '@/lib/formatting'
import { getCachedClients } from '@/lib/queries'
import { prisma } from '@/lib/db'
import WartelisteForm from '@/components/WartelisteForm'
import WartelisteAktionen from '@/components/WartelisteAktionen'
import NeuerKlientModal from '@/components/NeuerKlientModal'
import ClientListBulk from '@/components/ClientListBulk'
import { CLIENT_STATUS_LABEL } from '@/lib/formatting'
const PRIO_STYLE: Record<string, string> = {
  HOCH:    'bg-orange-950/40 text-orange-400 border border-orange-900/40',
  MITTEL:  'bg-[#1c1c1c] text-[#666666] border border-[#2e2e2e]',
  NIEDRIG: 'bg-[#141414] text-[#3a3a3a] border border-[#2e2e2e]',
}
const PRIO_LABEL: Record<string, string> = { HOCH: 'Hoch', MITTEL: 'Mittel', NIEDRIG: 'Niedrig' }


export default async function ClientsPage(
  props: {
    searchParams: Promise<{ q?: string; status?: string }>
  }
) {
  const searchParams = await props.searchParams;
  const q            = searchParams.q?.trim() ?? ''
  const statusFilter = (['AKTIV', 'PAUSIERT', 'INAKTIV'] as ClientStatus[]).includes(searchParams.status as ClientStatus)
    ? searchParams.status as ClientStatus
    : undefined

  const [allClients, warteliste] = await Promise.all([
    getCachedClients(),
    prisma.warteliste.findMany({ orderBy: [{ prioritaet: 'asc' }, { datum: 'asc' }] }),
  ])

  const clients = allClients.filter(c => {
    if (statusFilter && c.status !== statusFilter) return false
    if (q) {
      const s = q.toLowerCase()
      return (
        c.vorname.toLowerCase().includes(s) ||
        c.nachname.toLowerCase().includes(s) ||
        (c.email?.toLowerCase().includes(s) ?? false)
      )
    }
    return true
  })

  const countMap = { AKTIV: 0, PAUSIERT: 0, INAKTIV: 0 } as Record<string, number>
  for (const c of allClients) countMap[c.status] = (countMap[c.status] ?? 0) + 1

  return (
    <div className="p-4 md:p-6 lg:p-8 w-full">

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-3 mb-5">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-[#efefef]">Klienten</h1>
          <p className="text-xs text-[#3a3a3a] mt-0.5">
            {statusFilter || q
              ? `${clients.length} von ${allClients.length}`
              : `${allClients.length}`} Klienten
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {/* CSV import — icon only on mobile, text on sm+ */}
          <Link href="/clients/import"
            className="flex items-center gap-1.5 text-xs text-[#666666] border border-[#2e2e2e] hover:bg-[#1c1c1c] hover:text-[#efefef] px-2.5 py-2 rounded-lg transition-colors">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            <span className="hidden sm:inline">CSV</span>
          </Link>
          <NeuerKlientModal />
        </div>
      </div>

      {/* ── Search + filter ── */}
      <div className="space-y-3 mb-5">
        <form>
          {statusFilter && <input type="hidden" name="status" value={statusFilter} />}
          <input name="q" defaultValue={q} placeholder="Name oder E-Mail suchen…"
            className="w-full px-3 py-2.5 bg-[#141414] border border-[#2e2e2e] rounded-lg text-sm text-[#efefef] placeholder:text-[#3a3a3a] focus:outline-none focus:border-[#555555] transition-colors" />
        </form>
        <div className="flex gap-2 flex-wrap">
          {([undefined, 'AKTIV', 'PAUSIERT', 'INAKTIV'] as const).map(s => {
            const isActive = (statusFilter ?? undefined) === s
            const label    = s ? CLIENT_STATUS_LABEL[s] : 'Alle'
            const count    = s ? (countMap[s] ?? 0) : Object.values(countMap).reduce((a, b) => a + b, 0)
            return (
              <Link key={s ?? 'all'}
                href={`/clients${s ? `?status=${s}` : ''}${q ? `${s ? '&' : '?'}q=${q}` : ''}`}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  isActive ? 'bg-white text-black' : 'bg-[#0a0a0a] border border-[#2e2e2e] text-[#666666] hover:text-[#efefef] hover:border-[#3a3a3a]'
                }`}>
                {label} <span className={`ml-1 ${isActive ? 'text-black/50' : 'text-[#3a3a3a]'}`}>{count}</span>
              </Link>
            )
          })}
        </div>
      </div>

      {/* ── Client cards ── */}
      {clients.length === 0 && !q && !statusFilter ? (
        <div className="bg-[#141414] border border-[#2e2e2e] rounded-xl py-16 text-center space-y-3">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"
            className="text-[#2e2e2e] mx-auto">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          <div>
            <p className="text-sm font-medium text-[#3a3a3a]">Noch keine Klienten.</p>
            <p className="text-xs text-[#2e2e2e] mt-1">Lege jetzt deinen ersten Klienten an.</p>
          </div>
          <Link href="/clients/new"
            className="inline-flex items-center gap-2 bg-white hover:bg-[#e8e8e8] text-black text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors">
            + Klient anlegen
          </Link>
        </div>
      ) : (
        <ClientListBulk clients={clients} />
      )}

      {/* ── Warteliste ── */}
      <div className="mt-8 pb-24 md:pb-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-[10px] font-mono font-semibold text-[#555555] uppercase tracking-widest">Warteliste</h2>
            {warteliste.length > 0 && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-[#1c1c1c] text-[#666666] border border-[#2e2e2e]">
                {warteliste.length}
              </span>
            )}
          </div>
          <WartelisteForm />
        </div>

        {warteliste.length === 0 ? (
          <div className="bg-[#141414] border border-[#2e2e2e] rounded-xl py-8 text-center">
            <p className="text-sm text-[#3a3a3a]">Keine Einträge auf der Warteliste.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2.5">
            {warteliste.map(entry => (
              <div key={entry.id} className="bg-[#141414] border border-[#2e2e2e] rounded-xl p-4">
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-full bg-[#1c1c1c] border border-[#2e2e2e] flex items-center justify-center text-xs font-semibold text-[#666666] shrink-0 mt-0.5">
                    {entry.vorname[0]}{entry.nachname[0]}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-sm font-semibold text-[#efefef]">
                        {entry.vorname} {entry.nachname}
                      </p>
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${PRIO_STYLE[entry.prioritaet] ?? PRIO_STYLE.MITTEL}`}>
                        {PRIO_LABEL[entry.prioritaet] ?? 'Mittel'}
                      </span>
                    </div>
                    <p className="text-xs text-[#666666] mt-0.5 truncate">
                      {entry.email ?? entry.telefon ?? '—'}
                    </p>
                    <p className="text-xs text-[#3a3a3a] mt-0.5">
                      {new Date(entry.datum).toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' })}
                      {entry.notizen && <span className="text-[#2e2e2e]"> · {entry.notizen}</span>}
                    </p>
                  </div>

                  {/* Actions dropdown */}
                  <WartelisteAktionen id={entry.id} entry={entry} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
