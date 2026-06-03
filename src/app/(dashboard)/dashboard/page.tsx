import Link from 'next/link'
import { fetchCalcomEvents } from '@/lib/ical'
import { getCachedClients, getCachedRecentClients, getCachedRechnungen } from '@/lib/queries'
import { avatarColor } from '@/lib/avatar'
import { CHF, rBrutto, CLIENT_STATUS_LABEL, CLIENT_STATUS_STYLE } from '@/lib/formatting'
import RevenueGoalProgress from '@/components/RevenueGoalProgress'
import BookingClientButton from '@/components/BookingClientButton'

function T(d: Date) {
  return d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Zurich' })
}

function relDay(date: Date, now: Date): string {
  const diff = Math.ceil((date.getTime() - now.getTime()) / 86400000)
  if (diff <= 0) return 'Heute'
  if (diff === 1) return 'Morgen'
  if (diff <= 6) return date.toLocaleDateString('de-DE', { weekday: 'short' })
  return date.toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })
}

function greeting(now: Date): string {
  const h = now.getHours()
  if (h < 12) return 'Guten Morgen'
  if (h < 18) return 'Guten Tag'
  return 'Guten Abend'
}

export default async function DashboardPage() {
  const now          = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const todayStart   = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const todayEnd     = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000)

  const [allClients, recentClients, allRechnungen, calcomResult] = await Promise.all([
    getCachedClients(),
    getCachedRecentClients(),
    getCachedRechnungen(),
    fetchCalcomEvents(),
  ])

  // ── Clients ──────────────────────────────────────────────────────────────────
  const total        = allClients.length
  const aktiv        = allClients.filter(c => c.status === 'AKTIV').length
  const newThisMonth = allClients.filter(c => new Date(c.createdAt) >= startOfMonth).length
  const noContactCount = allClients
    .filter(c => c.status === 'AKTIV')
    .filter(c => new Date((c.notizen[0]?.datum ?? c.createdAt) as Date) < thirtyDaysAgo)
    .length

  // ── Revenue ───────────────────────────────────────────────────────────────────
  const openRechnungen     = allRechnungen.filter(r => r.status === 'OFFEN')
  const openTotal          = openRechnungen.reduce((s, r) => s + rBrutto(r), 0)
  const overdueCount       = openRechnungen.filter(r => r.faellig && new Date(r.faellig) < now).length
  const currentMonthRevenue = allRechnungen
    .filter(r => r.status === 'BEZAHLT' && new Date(r.bezahltAm ?? r.datum) >= startOfMonth)
    .reduce((s, r) => s + rBrutto(r), 0)

  // ── Calendar ──────────────────────────────────────────────────────────────────
  const todayEvents = calcomResult.events
    .filter(e => e.start >= todayStart && e.start <= todayEnd && e.status !== 'CANCELLED')
    .sort((a, b) => a.start.getTime() - b.start.getTime())
  const upcomingEvents = calcomResult.events
    .filter(e => e.start > todayEnd && e.status !== 'CANCELLED')
    .slice(0, 6)
  const clientByEmail = Object.fromEntries(
    allClients.filter(c => c.email).map(c => [c.email!.toLowerCase(), c])
  )

  // ── Birthdays (next 14 days) ───────────────────────────────────────────────
  const upcomingBirthdays = allClients
    .filter(c => c.geburtsdatum != null)
    .map(c => {
      const bday   = new Date(c.geburtsdatum!)
      const thisYr = new Date(now.getFullYear(), bday.getMonth(), bday.getDate())
      const next   = thisYr >= now ? thisYr : new Date(now.getFullYear() + 1, bday.getMonth(), bday.getDate())
      const days   = Math.ceil((next.getTime() - now.getTime()) / 86400000)
      return { ...c, daysUntil: days, age: next.getFullYear() - bday.getFullYear() }
    })
    .filter(c => c.daysUntil >= 0 && c.daysUntil <= 14)
    .sort((a, b) => a.daysUntil - b.daysUntil)
    .slice(0, 4)

  const birthdayToday = upcomingBirthdays.filter(c => c.daysUntil === 0)
  const dateStr = now.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="p-4 md:p-6 lg:p-8 w-full space-y-4">

      {/* ── Header ── */}
      <div>
        <h1 className="text-xl font-bold text-[#efefef]">{greeting(now)}</h1>
        <p className="text-xs text-[#3a3a3a] mt-0.5 capitalize">{dateStr}</p>
      </div>

      {/* ── Alerts ── */}
      {(overdueCount > 0 || noContactCount > 0 || birthdayToday.length > 0) && (
        <div className="flex flex-wrap gap-2">
          {overdueCount > 0 && (
            <Link href="/rechnungen"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-950/30 border border-red-900/30 rounded-lg text-xs text-red-400 hover:bg-red-950/50 transition-colors">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              {overdueCount} überfällige Rechnung{overdueCount !== 1 ? 'en' : ''}
            </Link>
          )}
          {noContactCount > 0 && (
            <Link href="/clients"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-950/20 border border-orange-900/20 rounded-lg text-xs text-orange-400 hover:bg-orange-950/40 transition-colors">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <line x1="23" y1="11" x2="17" y2="11"/>
              </svg>
              {noContactCount} Klient{noContactCount !== 1 ? 'en' : ''} ohne Kontakt (30d)
            </Link>
          )}
          {birthdayToday.map(c => (
            <Link key={c.id} href={`/clients/${c.id}`}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#141414] border border-[#2e2e2e] rounded-lg text-xs text-[#efefef] hover:bg-[#1c1c1c] transition-colors">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                <polyline points="20 12 20 22 4 22 4 12"/>
                <rect x="2" y="7" width="20" height="5"/>
                <line x1="12" y1="22" x2="12" y2="7"/>
                <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/>
                <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
              </svg>
              {c.vorname} hat heute Geburtstag
            </Link>
          ))}
        </div>
      )}

      {/* ── KPI strip ── */}
      <div className="bg-[#1c1c1c] border border-[#2e2e2e] rounded-xl grid grid-cols-2 sm:grid-cols-4 gap-px overflow-hidden">
        <Link href="/clients"
          className="bg-[#141414] px-4 py-4 hover:bg-[#181b1f] transition-colors">
          <p className="text-[10px] font-mono text-[#555555] uppercase tracking-widest">Aktive Klienten</p>
          <p className="text-2xl font-bold text-[#efefef] mt-1.5 tabular-nums">{aktiv}</p>
          <p className="text-[10px] text-[#3a3a3a] mt-0.5">
            {total} gesamt
            {newThisMonth > 0 && <span className="text-emerald-400"> · +{newThisMonth} diesen Monat</span>}
          </p>
        </Link>
        <Link href="/statistiken"
          className="bg-[#141414] px-4 py-4 hover:bg-[#181b1f] transition-colors">
          <p className="text-[10px] font-mono text-[#555555] uppercase tracking-widest">Umsatz diesen Monat</p>
          <p className="text-2xl font-bold text-[#efefef] mt-1.5 tabular-nums">{CHF(currentMonthRevenue)}</p>
          <p className="text-[10px] text-[#3a3a3a] mt-0.5">bezahlte Rechnungen</p>
        </Link>
        <Link href="/rechnungen"
          className="bg-[#141414] px-4 py-4 hover:bg-[#181b1f] transition-colors">
          <p className="text-[10px] font-mono text-[#555555] uppercase tracking-widest">Ausstehend</p>
          <p className={`text-2xl font-bold mt-1.5 tabular-nums ${openTotal > 0 ? 'text-orange-400' : 'text-[#efefef]'}`}>
            {CHF(openTotal)}
          </p>
          <p className="text-[10px] text-[#3a3a3a] mt-0.5">
            {openRechnungen.length} Rechnung{openRechnungen.length !== 1 ? 'en' : ''}
            {overdueCount > 0 && <span className="text-red-400"> · {overdueCount} überfällig</span>}
          </p>
        </Link>
        <Link href="/termine"
          className="bg-[#141414] px-4 py-4 hover:bg-[#181b1f] transition-colors">
          <p className="text-[10px] font-mono text-[#555555] uppercase tracking-widest">Heute</p>
          <p className="text-2xl font-bold text-[#efefef] mt-1.5 tabular-nums">
            {calcomResult.configured ? todayEvents.length : '—'}
          </p>
          <p className="text-[10px] text-[#3a3a3a] mt-0.5">
            {calcomResult.configured ? 'Termine' : 'Cal.com nicht verbunden'}
          </p>
        </Link>
      </div>

      {/* Revenue goal progress — only renders if a goal is set */}
      <RevenueGoalProgress currentMonthRevenue={currentMonthRevenue} />

      {/* ── Heute ── */}
      {calcomResult.configured && (
        <div className="bg-[#141414] border border-[#2e2e2e] rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-[#1c1c1c] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-2 h-2 rounded-full shrink-0" style={{ background: 'var(--accent)' }} />
              <p className="text-[10px] font-mono font-semibold text-[#555555] uppercase tracking-widest">Heute</p>
              <span className="text-xs text-[#444444]">
                {todayEvents.length === 0
                  ? 'kein Termin'
                  : `${todayEvents.length} ${todayEvents.length === 1 ? 'Termin' : 'Termine'}`}
              </span>
            </div>
            <Link href="/termine" className="text-xs text-[#444444] hover:text-[#efefef] transition-colors">
              Kalender →
            </Link>
          </div>
          {todayEvents.length === 0 ? (
            <p className="px-4 py-5 text-sm text-[#3a3a3a] text-center">Kein Termin heute.</p>
          ) : (
            <ul className="divide-y divide-[#1c1c1c]">
              {todayEvents.map(e => {
                const client = e.attendeeEmail ? clientByEmail[e.attendeeEmail.toLowerCase()] : null
                return (
                  <li key={e.uid} className="flex items-center gap-3 px-4 py-3">
                    <span
                      className="text-xs font-mono tabular-nums w-11 shrink-0"
                      style={{ color: 'var(--accent)' }}
                    >
                      {T(e.start)}
                    </span>
                    {client ? (
                      <Link href={`/clients/${client.id}`}
                        className="flex items-center gap-2.5 flex-1 min-w-0 group">
                        <div className={`w-8 h-8 rounded-full text-xs font-semibold flex items-center justify-center shrink-0 ${avatarColor(client.vorname + client.nachname)}`}>
                          {client.vorname[0]}{client.nachname[0]}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-[#efefef] truncate group-hover:text-white transition-colors">
                            {client.vorname} {client.nachname}
                          </p>
                          {client.anamnesen[0]?.aktuellesGewicht != null && (
                            <p className="text-[10px] text-[#3a3a3a]">{client.anamnesen[0].aktuellesGewicht} kg</p>
                          )}
                        </div>
                      </Link>
                    ) : (
                      <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm text-[#555555] truncate">{e.attendeeName ?? e.title}</p>
                          {e.attendeeEmail && <p className="text-[10px] text-[#3a3a3a] truncate">{e.attendeeEmail}</p>}
                        </div>
                        {e.attendeeEmail && <BookingClientButton name={e.attendeeName} email={e.attendeeEmail} compact />}
                      </div>
                    )}
                    {e.meetingUrl && (
                      <a href={e.meetingUrl} target="_blank" rel="noopener noreferrer"
                        className="text-[10px] text-[#444444] hover:text-[#efefef] border border-[#2e2e2e] hover:border-[#3a3a3a] px-2.5 py-1 rounded-lg transition-colors shrink-0">
                        Meeting
                      </a>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}

      {/* ── Two-column: Upcoming (left) + Clients & Birthdays (right) ── */}
      {/*    Mobile order: clients first, upcoming second                  */}
      {/*    Desktop order: upcoming left (2/3), clients right (1/3)       */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">

        {/* Upcoming appointments */}
        {calcomResult.configured && (
          <div className="lg:col-span-2 order-2 lg:order-1">
            <div className="bg-[#141414] border border-[#2e2e2e] rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-[#1c1c1c] flex items-center justify-between">
                <p className="text-[10px] font-mono font-semibold text-[#555555] uppercase tracking-widest">
                  Nächste Termine
                </p>
                <Link href="/termine" className="text-xs text-[#444444] hover:text-[#efefef] transition-colors">
                  Alle →
                </Link>
              </div>
              {upcomingEvents.length === 0 ? (
                <p className="px-4 py-5 text-sm text-[#3a3a3a] text-center">Keine kommenden Termine.</p>
              ) : (
                <ul className="divide-y divide-[#1c1c1c]">
                  {upcomingEvents.map(e => {
                    const client = e.attendeeEmail ? clientByEmail[e.attendeeEmail.toLowerCase()] : null
                    return (
                      <li key={e.uid} className="flex items-center gap-3 px-4 py-3">
                        <div className="w-14 shrink-0 text-right">
                          <p className="text-[10px] font-medium text-[#666666]">{relDay(e.start, now)}</p>
                          <p className="text-[10px] font-mono tabular-nums text-[#3a3a3a]">{T(e.start)}</p>
                        </div>
                        <div className="w-px h-6 bg-[#1c1c1c] shrink-0" />
                        {client ? (
                          <Link href={`/clients/${client.id}`}
                            className="flex items-center gap-2.5 flex-1 min-w-0 group">
                            <div className={`w-7 h-7 rounded-full text-[10px] font-semibold flex items-center justify-center shrink-0 ${avatarColor(client.vorname + client.nachname)}`}>
                              {client.vorname[0]}{client.nachname[0]}
                            </div>
                            <span className="text-sm text-[#efefef] truncate group-hover:text-white transition-colors">
                              {client.vorname} {client.nachname}
                            </span>
                          </Link>
                        ) : (
                          <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <span className="text-sm text-[#555555] truncate block">{e.attendeeName ?? e.title}</span>
                              {e.attendeeEmail && <span className="text-[10px] text-[#3a3a3a] truncate block">{e.attendeeEmail}</span>}
                            </div>
                            {e.attendeeEmail && <BookingClientButton name={e.attendeeName} email={e.attendeeEmail} compact />}
                          </div>
                        )}
                        {e.meetingUrl && (
                          <a href={e.meetingUrl} target="_blank" rel="noopener noreferrer"
                            className="text-[10px] text-[#444444] hover:text-[#efefef] border border-[#2e2e2e] px-2 py-1 rounded-lg transition-colors shrink-0">
                            Link
                          </a>
                        )}
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </div>
        )}

        {/* Recent clients + birthdays */}
        <div className={`space-y-4 order-1 lg:order-2 ${!calcomResult.configured ? 'lg:col-span-3' : ''}`}>

          {/* Recent clients */}
          <div className="bg-[#141414] border border-[#2e2e2e] rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-[#1c1c1c] flex items-center justify-between">
              <p className="text-[10px] font-mono font-semibold text-[#555555] uppercase tracking-widest">
                Zuletzt angelegt
              </p>
              <Link href="/clients" className="text-xs text-[#444444] hover:text-[#efefef] transition-colors">
                Alle →
              </Link>
            </div>
            {recentClients.length === 0 ? (
              <div className="px-4 py-5 text-center">
                <p className="text-sm text-[#3a3a3a] mb-2">Noch keine Klienten.</p>
                <Link href="/clients/new"
                  className="text-xs text-[#555555] hover:text-[#efefef] transition-colors">
                  Ersten anlegen →
                </Link>
              </div>
            ) : (
              <ul className="divide-y divide-[#1c1c1c]">
                {recentClients.map(c => (
                  <li key={c.id}>
                    <Link href={`/clients/${c.id}`}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-[#1c1c1c] transition-colors group">
                      <div className={`w-8 h-8 rounded-full text-xs font-semibold flex items-center justify-center shrink-0 ${avatarColor(c.vorname + c.nachname)}`}>
                        {c.vorname[0]}{c.nachname[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#efefef] truncate">{c.vorname} {c.nachname}</p>
                        <p className="text-[10px] text-[#3a3a3a] mt-0.5 truncate">
                          {c.anamnesen[0]?.aktuellesGewicht != null
                            ? `${c.anamnesen[0].aktuellesGewicht} kg`
                            : c.email ?? c.telefon ?? '—'}
                          {c.trainingsplaene[0] ? ` · ${c.trainingsplaene[0].name}` : ''}
                        </p>
                      </div>
                      <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded shrink-0 ${CLIENT_STATUS_STYLE[c.status]}`}>
                        {CLIENT_STATUS_LABEL[c.status]}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Upcoming birthdays */}
          {upcomingBirthdays.length > 0 && (
            <div className="bg-[#141414] border border-[#2e2e2e] rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-[#1c1c1c]">
                <p className="text-[10px] font-mono font-semibold text-[#555555] uppercase tracking-widest">
                  Geburtstage
                </p>
              </div>
              <ul className="divide-y divide-[#1c1c1c]">
                {upcomingBirthdays.map(c => (
                  <li key={c.id}>
                    <Link href={`/clients/${c.id}`}
                      className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-[#1c1c1c] transition-colors">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-7 h-7 rounded-full text-[10px] font-semibold flex items-center justify-center shrink-0 ${avatarColor(c.vorname + c.nachname)}`}>
                          {c.vorname[0]}{c.nachname[0]}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-[#efefef] truncate">{c.vorname} {c.nachname}</p>
                          <p className="text-[10px] text-[#3a3a3a]">wird {c.age}</p>
                        </div>
                      </div>
                      <span className={`text-xs font-medium tabular-nums shrink-0 ${c.daysUntil === 0 ? 'text-orange-400' : 'text-[#555555]'}`}>
                        {c.daysUntil === 0 ? 'Heute!' : c.daysUntil === 1 ? 'Morgen' : `in ${c.daysUntil}d`}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
