import { prisma } from '@/lib/db'
import Link from 'next/link'
import { fetchCalcomEvents, type CalEvent } from '@/lib/ical'
import { avatarColor } from '@/lib/avatar'
import { revalidatePath } from 'next/cache'
import SyncButton from '@/components/SyncButton'
import BookingClientButton from '@/components/BookingClientButton'
import BookingActions from '@/components/BookingActions'

async function syncCalcom() {
  'use server'
  revalidatePath('/termine')
  revalidatePath('/dashboard')
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function T(d: Date) {
  return d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Zurich' })
}
function D(d: Date | string) { return new Date(d).toLocaleDateString('de-DE') }
function dur(start: Date, end: Date) {
  const m = Math.round((end.getTime() - start.getTime()) / 60000)
  if (m < 60) return `${m} Min.`
  const h = Math.floor(m / 60), rm = m % 60
  return rm ? `${h} h ${rm} Min.` : `${h} h`
}
function groupByMonth(events: CalEvent[]): [string, CalEvent[]][] {
  const map = new Map<string, CalEvent[]>()
  for (const e of events) {
    const key = e.start.toLocaleDateString('de-DE', { month: 'long', year: 'numeric', timeZone: 'Europe/Zurich' })
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(e)
  }
  return Array.from(map.entries())
}

// ── Calendar helpers ──────────────────────────────────────────────────────────
const WEEKDAYS    = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']
const MONTH_NAMES = ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember']
function mParam(y: number, m: number) { return `${y}-${String(m).padStart(2,'0')}` }
function prevM(y: number, m: number)  { return m === 1  ? mParam(y-1, 12) : mParam(y, m-1) }
function nextM(y: number, m: number)  { return m === 12 ? mParam(y+1, 1)  : mParam(y, m+1) }

// ── Page ──────────────────────────────────────────────────────────────────────
export default async function TerminePage(
  props: {
    searchParams: Promise<{ monat?: string; q?: string }>
  }
) {
  const searchParams = await props.searchParams;
  const q = searchParams.q?.trim() ?? ''
  const { events, configured, error } = await fetchCalcomEvents()
  const now = new Date()

  // ── Heute: fetch client context for today's events ────────────────────────
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const todayEnd   = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
  const todayEvents = configured && !error
    ? events.filter(e => e.start >= todayStart && e.start <= todayEnd && e.status !== 'CANCELLED')
        .sort((a, b) => a.start.getTime() - b.start.getTime())
    : []

  const allEventEmails = Array.from(new Set(events.map(e => e.attendeeEmail).filter(Boolean))) as string[]
  const clientByEmail: Record<string, {
    id: string; vorname: string; nachname: string; email: string | null; createdAt: Date
    anamnesen: { aktuellesGewicht: number | null; ziele: string[] }[]
    notizen: { datum: Date; inhalt: string }[]
    trainingsplaene: { name: string }[]
    messungen: { datum: Date; gewicht: number | null }[]
  }> = {}

  if (allEventEmails.length > 0) {
    const matched = await prisma.client.findMany({
      where: { email: { in: allEventEmails, mode: 'insensitive' } },
      include: {
        anamnesen:       { orderBy: { datum: 'desc' }, take: 1, select: { aktuellesGewicht: true, ziele: true } },
        notizen:         { orderBy: { datum: 'desc' }, take: 1, select: { datum: true, inhalt: true } },
        trainingsplaene: { orderBy: { datum: 'desc' }, take: 1, select: { name: true } },
        messungen:       { orderBy: { datum: 'desc' }, take: 1, select: { datum: true, gewicht: true } },
      },
    })
    for (const c of matched) if (c.email) clientByEmail[c.email.toLowerCase()] = c
  }

  // ── Calendar data ─────────────────────────────────────────────────────────
  let calYear  = now.getFullYear()
  let calMonth = now.getMonth() + 1
  if (searchParams.monat) {
    const [y, m] = searchParams.monat.split('-').map(Number)
    if (y > 2000 && m >= 1 && m <= 12) { calYear = y; calMonth = m }
  }
  function matches(e: CalEvent) {
    if (!q) return true
    const s = q.toLowerCase()
    return e.title.toLowerCase().includes(s) || (e.attendeeName?.toLowerCase().includes(s) ?? false)
  }
  const byDay: Record<number, CalEvent[]> = {}
  const calFmt = new Intl.DateTimeFormat('de-DE', { day: 'numeric', month: 'numeric', year: 'numeric', timeZone: 'Europe/Zurich' })
  for (const e of events) {
    if (e.status === 'CANCELLED' || !matches(e)) continue
    const parts = calFmt.formatToParts(e.start)
    const eYear = +parts.find(p => p.type === 'year')!.value
    const eM    = +parts.find(p => p.type === 'month')!.value
    const eDay  = +parts.find(p => p.type === 'day')!.value
    if (eYear === calYear && eM === calMonth) {
      if (!byDay[eDay]) byDay[eDay] = []
      byDay[eDay].push(e)
    }
  }
  const daysInMonth = new Date(calYear, calMonth, 0).getDate()
  const startWD     = ((new Date(calYear, calMonth - 1, 1).getDay() + 6) % 7)
  const cells: (number | null)[] = [...Array(startWD).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]
  while (cells.length % 7 !== 0) cells.push(null)
  const weeks       = Array.from({ length: cells.length / 7 }, (_, i) => cells.slice(i*7, i*7+7))
  const isCurrentMo = now.getFullYear() === calYear && now.getMonth() + 1 === calMonth
  const monthEvents = Object.values(byDay).flat().sort((a, b) => a.start.getTime() - b.start.getTime())

  // ── List data ─────────────────────────────────────────────────────────────
  const upcoming = events.filter(e => e.start >= now && matches(e))
  const past     = events.filter(e => e.start <  now && matches(e)).reverse()
  const qParam   = q ? `&q=${encodeURIComponent(q)}` : ''

  return (
    <div className="p-4 md:p-6 lg:p-8 w-full space-y-8">

      {/* ── Header ── */}
      <div>
        <div className="flex items-center justify-between gap-3 mb-3">
          <div>
            <h1 className="text-xl font-bold text-white">Termine</h1>
            {configured && !error && (
              <p className="text-xs text-[#3a3a3a] mt-0.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                Cal.com verbunden
              </p>
            )}
          </div>
          {configured && <SyncButton action={syncCalcom} />}
        </div>
        {configured && !error && (
          <form>
            {searchParams.monat && <input type="hidden" name="monat" value={searchParams.monat} />}
            <input name="q" defaultValue={q} placeholder="Klient oder Terminbezeichnung suchen…"
              className="w-full px-3 py-2.5 bg-[#141414] border border-[#2e2e2e] rounded-lg text-sm text-[#efefef] placeholder:text-[#3a3a3a] focus:outline-none focus:border-[#555555] transition-colors" />
          </form>
        )}
      </div>

      {/* ── Not configured ── */}
      {!configured && (
        <div className="bg-[#141414] border border-[#2e2e2e] rounded-xl px-5 py-10 text-center space-y-3">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[#2e2e2e] mx-auto">
            <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <p className="text-sm text-[#555555]">Cal.com ist nicht verbunden.</p>
          <Link href="/settings" className="inline-block text-xs text-[#666666] border border-[#2e2e2e] hover:bg-[#1c1c1c] px-4 py-2 rounded-lg transition-colors">
            In Einstellungen konfigurieren →
          </Link>
        </div>
      )}

      {configured && error && (
        <div className="bg-red-950/20 border border-red-900/30 rounded-xl px-5 py-4">
          <p className="text-sm text-red-400">Cal.com-Fehler: {error}</p>
        </div>
      )}

      {configured && !error && (
        <>
          {/* ══ HEUTE ══ */}
          {todayEvents.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <h2 className="text-xs font-semibold text-[#3a3a3a] uppercase tracking-wider">
                  Heute
                </h2>
                <span className="text-xs text-[#3a3a3a]">·</span>
                <span className="text-xs text-[#555555]">
                  {now.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })}
                </span>
              </div>
              <div className="space-y-3">
                {todayEvents.map(event => {
                  const client = event.attendeeEmail ? clientByEmail[event.attendeeEmail.toLowerCase()] : null
                  const weight = client?.messungen[0]?.gewicht != null
                    ? { v: client.messungen[0].gewicht, d: client.messungen[0].datum as Date | null }
                    : client?.anamnesen[0]?.aktuellesGewicht != null
                      ? { v: client.anamnesen[0].aktuellesGewicht, d: null }
                      : null

                  return (
                    <div key={event.uid} className="bg-[#141414] border border-[#2e2e2e] rounded-xl overflow-hidden">
                      <div className="flex items-center gap-3 px-4 py-3 border-b border-[#1c1c1c]">
                        <div className="shrink-0 text-center w-10">
                          <p className="text-sm font-bold text-white leading-none">{T(event.start)}</p>
                          <p className="text-[9px] text-[#3a3a3a] mt-0.5">{dur(event.start, event.end)}</p>
                        </div>
                        <div className="w-px h-7 bg-[#2e2e2e] shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">{event.title}</p>
                          {event.attendeeName && <p className="text-xs text-[#555555] truncate">{event.attendeeName}</p>}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {event.meetingUrl && (
                            <a href={event.meetingUrl} target="_blank" rel="noopener noreferrer"
                              className="text-xs text-[#555555] hover:text-white border border-[#2e2e2e] hover:border-[#3a3a3a] px-3 py-1.5 rounded-lg transition-colors">
                              Meeting →
                            </a>
                          )}
                          {client && (
                            <Link href={`/clients/${client.id}`}
                              className="text-xs text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors">
                              Klient
                            </Link>
                          )}
                          <BookingActions uid={event.uid} title={event.title} />
                        </div>
                      </div>

                      {client ? (
                        <div className="px-4 py-3 flex flex-wrap items-center gap-5">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${avatarColor(client.vorname + client.nachname)}`}>
                              {client.vorname[0]}{client.nachname[0]}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-white">{client.vorname} {client.nachname}</p>
                              <p className="text-[10px] text-[#555555]">seit {D(client.createdAt)}</p>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-4 text-xs">
                            {weight && (
                              <div>
                                <p className="text-[10px] text-[#3a3a3a] uppercase tracking-wider mb-0.5">Gewicht</p>
                                <p className="text-[#efefef] font-medium">{weight.v} kg{weight.d ? <span className="text-[#555555] font-normal ml-1">({D(weight.d)})</span> : ''}</p>
                              </div>
                            )}
                            {client.trainingsplaene[0] && (
                              <div>
                                <p className="text-[10px] text-[#3a3a3a] uppercase tracking-wider mb-0.5">Plan</p>
                                <p className="text-[#efefef] font-medium truncate max-w-[120px]">{client.trainingsplaene[0].name}</p>
                              </div>
                            )}
                            {client.notizen[0] && (
                              <div className="max-w-[200px]">
                                <p className="text-[10px] text-[#3a3a3a] uppercase tracking-wider mb-0.5">Letzte Notiz</p>
                                <p className="text-[#efefef] truncate">{client.notizen[0].inhalt}</p>
                              </div>
                            )}
                            {client.anamnesen[0]?.ziele.length > 0 && (
                              <div>
                                <p className="text-[10px] text-[#3a3a3a] uppercase tracking-wider mb-0.5">Ziele</p>
                                <p className="text-[#efefef] truncate max-w-[140px]">{client.anamnesen[0].ziele.slice(0, 2).join(', ')}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="px-4 py-3 flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            {event.attendeeEmail && (
                              <p className="text-xs font-mono text-[#efefef] truncate">{event.attendeeEmail}</p>
                            )}
                            <p className="text-[10px] text-[#3a3a3a] mt-0.5">Noch nicht als Klient erfasst</p>
                          </div>
                          {event.attendeeEmail && (
                            <BookingClientButton name={event.attendeeName} email={event.attendeeEmail} />
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {/* ══ KALENDER ══ */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-baseline gap-2">
                <h2 className="text-lg font-bold text-white">{MONTH_NAMES[calMonth - 1]}</h2>
                <span className="text-sm text-[#3a3a3a]">{calYear}</span>
              </div>
              <div className="flex items-center gap-1.5">
                {!isCurrentMo && (
                  <Link href={`/termine${qParam ? `?${qParam.slice(1)}` : ''}`}
                    className="px-3 py-1.5 text-xs text-[#666666] border border-[#2e2e2e] hover:bg-[#1c1c1c] rounded-lg transition-colors">
                    Heute
                  </Link>
                )}
                <Link href={`/termine?monat=${prevM(calYear, calMonth)}${qParam}`}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-[#555555] hover:text-[#efefef] hover:bg-[#1c1c1c] transition-colors">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
                </Link>
                <Link href={`/termine?monat=${nextM(calYear, calMonth)}${qParam}`}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-[#555555] hover:text-[#efefef] hover:bg-[#1c1c1c] transition-colors">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                </Link>
              </div>
            </div>

            <div className="bg-[#141414] border border-[#2e2e2e] rounded-xl overflow-hidden">
              {/* Weekday header */}
              <div className="grid grid-cols-7 border-b border-[#1c1c1c]">
                {WEEKDAYS.map((d, i) => (
                  <div key={d} className={`py-2.5 text-center text-[10px] font-semibold uppercase tracking-widest ${i >= 5 ? 'text-[#2e2e2e]' : 'text-[#3a3a3a]'}`}>{d}</div>
                ))}
              </div>
              {/* Day cells */}
              {weeks.map((week, wi) => (
                <div key={wi} className="grid grid-cols-7">
                  {week.map((day, di) => {
                    const dayEvts  = day ? (byDay[day] ?? []) : []
                    const isToday  = isCurrentMo && day === now.getDate()
                    const isWeekend = di >= 5
                    const hasPast  = day && isCurrentMo && day < now.getDate()
                    return (
                      <div key={di} className={[
                        'min-h-[64px] p-1.5',
                        di < 6 ? 'border-r border-[#1c1c1c]' : '',
                        wi < weeks.length - 1 ? 'border-b border-[#1c1c1c]' : '',
                        !day ? 'opacity-0 pointer-events-none' : '',
                        hasPast ? 'opacity-50' : '',
                      ].join(' ')}>
                        {day && (
                          <>
                            <div className="flex justify-end mb-1">
                              <span className={`inline-flex items-center justify-center w-6 h-6 text-[11px] rounded-full font-medium ${
                                isToday ? 'bg-white text-black font-bold' : isWeekend ? 'text-[#3a3a3a]' : 'text-[#555555]'
                              }`}>{day}</span>
                            </div>
                            <div className="space-y-0.5">
                              {dayEvts.slice(0, 2).map(e => (
                                <div key={e.uid} className="flex items-center gap-1 rounded px-1 py-0.5 bg-orange-500/10 border border-orange-500/20">
                                  <span className="w-1 h-1 rounded-full bg-orange-400 shrink-0" />
                                  <span className="text-[8px] text-orange-300 truncate leading-none">{T(e.start)}</span>
                                </div>
                              ))}
                              {dayEvts.length > 2 && (
                                <p className="text-[8px] text-[#3a3a3a] px-1">+{dayEvts.length - 2}</p>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>

            {/* This month's event list */}
            {monthEvents.length > 0 && (
              <div className="mt-3 bg-[#141414] border border-[#2e2e2e] rounded-xl overflow-hidden">
                <ul className="divide-y divide-[#1c1c1c]">
                  {monthEvents.map(e => {
                    const eDay = parseInt(e.start.toLocaleDateString('de-DE', { day: 'numeric', timeZone: 'Europe/Zurich' }))
                    const isPast = isCurrentMo && eDay < now.getDate()
                    const knownClient = e.attendeeEmail ? clientByEmail[e.attendeeEmail.toLowerCase()] : null
                    return (
                      <li key={e.uid} className={`flex hover:bg-[#1c1c1c] transition-colors ${isPast ? 'opacity-50' : ''}`}>
                        <div className="w-14 shrink-0 flex flex-col items-center justify-center border-r border-[#1c1c1c] py-3">
                          <span className="text-[9px] font-semibold text-[#3a3a3a] uppercase">{e.start.toLocaleDateString('de-DE', { weekday: 'short', timeZone: 'Europe/Zurich' })}</span>
                          <span className="text-xl font-bold text-[#efefef] leading-none">{e.start.toLocaleDateString('de-DE', { day: '2-digit', timeZone: 'Europe/Zurich' })}</span>
                        </div>
                        <div className="flex-1 px-4 py-3 flex items-center justify-between gap-3 min-w-0">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-[#efefef] truncate">{e.title}</p>
                            {e.attendeeName && <p className="text-xs text-[#555555] mt-0.5">{e.attendeeName}</p>}
                            {knownClient ? (
                              <Link href={`/clients/${knownClient.id}`} className="text-[10px] text-[#555555] hover:text-[#efefef] transition-colors">
                                Klient ansehen →
                              </Link>
                            ) : e.attendeeEmail && !isPast ? (
                              <div className="flex items-center gap-2 mt-0.5">
                                <p className="text-[10px] text-[#3a3a3a]">{e.attendeeEmail}</p>
                                <BookingClientButton name={e.attendeeName} email={e.attendeeEmail} compact />
                              </div>
                            ) : e.attendeeEmail ? (
                              <p className="text-[10px] text-[#3a3a3a]">{e.attendeeEmail}</p>
                            ) : null}
                            {e.meetingUrl && (
                              <a href={e.meetingUrl} target="_blank" rel="noopener noreferrer"
                                className="text-[10px] text-blue-400 hover:text-blue-300 mt-0.5 inline-block transition-colors">
                                Meeting öffnen
                              </a>
                            )}
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-xs font-medium text-[#efefef]">{T(e.start)}</p>
                            <p className="text-[10px] text-[#3a3a3a]">{dur(e.start, e.end)}</p>
                          </div>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}
          </section>

          {/* ══ LISTE: UPCOMING ══ */}
          <section>
            <h2 className="text-xs font-semibold text-[#3a3a3a] uppercase tracking-wider mb-3">
              Kommende Buchungen · {upcoming.filter(e => e.status !== 'CANCELLED').length}
            </h2>
            {upcoming.length === 0 ? (
              <div className="bg-[#141414] border border-[#2e2e2e] rounded-xl px-5 py-8 text-center">
                <p className="text-sm text-[#3a3a3a]">{q ? 'Keine Buchungen gefunden.' : 'Keine kommenden Buchungen.'}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {groupByMonth(upcoming).map(([month, evts]) => (
                  <div key={month}>
                    <p className="text-[10px] font-semibold text-[#555555] uppercase tracking-wider mb-1.5 px-1">{month}</p>
                    <div className="bg-[#141414] border border-[#2e2e2e] rounded-xl overflow-hidden">
                      <ul className="divide-y divide-[#1c1c1c]">
                        {evts.map(e => {
                          const cancelled = e.status === 'CANCELLED'
                          const knownClient = e.attendeeEmail ? clientByEmail[e.attendeeEmail.toLowerCase()] : null
                          return (
                            <li key={e.uid} className="flex">
                              <div className="w-14 shrink-0 flex flex-col items-center justify-center border-r border-[#1c1c1c] py-3">
                                <span className="text-[9px] font-medium text-[#3a3a3a] uppercase">{e.start.toLocaleDateString('de-DE', { weekday: 'short', timeZone: 'Europe/Zurich' })}</span>
                                <span className="text-xl font-bold text-[#efefef] leading-none">{e.start.toLocaleDateString('de-DE', { day: '2-digit', timeZone: 'Europe/Zurich' })}</span>
                              </div>
                              <div className={`flex-1 px-4 py-3 flex items-start justify-between gap-3 min-w-0 ${cancelled ? 'opacity-50' : ''}`}>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <p className={`text-sm font-medium truncate ${cancelled ? 'line-through text-[#444444]' : 'text-[#efefef]'}`}>{e.title}</p>
                                    {cancelled && <span className="text-[9px] font-semibold text-red-400 border border-red-900/40 px-1.5 py-0.5 rounded">Abgesagt</span>}
                                    {e.status === 'TENTATIVE' && <span className="text-[9px] font-semibold text-orange-400 border border-orange-900/40 px-1.5 py-0.5 rounded">Provisorisch</span>}
                                  </div>
                                  {e.attendeeName && <p className="text-xs text-[#555555] mt-0.5">{e.attendeeName}</p>}
                                  {!cancelled && (knownClient ? (
                                    <Link href={`/clients/${knownClient.id}`} className="text-[10px] text-[#555555] hover:text-[#efefef] transition-colors mt-0.5 inline-block">
                                      Klient ansehen →
                                    </Link>
                                  ) : e.attendeeEmail ? (
                                    <div className="flex items-center gap-2 mt-1">
                                      <p className="text-[10px] text-[#3a3a3a]">{e.attendeeEmail}</p>
                                      <BookingClientButton name={e.attendeeName} email={e.attendeeEmail} compact />
                                    </div>
                                  ) : null)}
                                  {e.meetingUrl && (
                                    <a href={e.meetingUrl} target="_blank" rel="noopener noreferrer"
                                      className="text-[10px] text-blue-400 hover:text-blue-300 mt-1 inline-flex items-center gap-1 transition-colors">
                                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M15 10l4.553-2.069A1 1 0 0 1 21 8.82v6.36a1 1 0 0 1-1.447.889L15 14M3 8a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8z"/>
                                      </svg>
                                      Meeting öffnen
                                    </a>
                                  )}
                                </div>
                                <div className="shrink-0 flex flex-col items-end gap-1.5">
                                  <div className="text-right">
                                    <p className="text-sm font-medium text-[#efefef]">{T(e.start)}</p>
                                    <p className="text-[10px] text-[#3a3a3a]">{dur(e.start, e.end)}</p>
                                  </div>
                                  {!cancelled && <BookingActions uid={e.uid} title={e.title} />}
                                </div>
                              </div>
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ══ LISTE: PAST ══ */}
          {past.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold text-[#3a3a3a] uppercase tracking-wider mb-3">
                Vergangene Buchungen · {past.filter(e => e.status !== 'CANCELLED').length}
              </h2>
              <div className="bg-[#141414] border border-[#2e2e2e] rounded-xl overflow-hidden opacity-60">
                <ul className="divide-y divide-[#1c1c1c]">
                  {past.slice(0, 20).map(e => {
                    const knownClient = e.attendeeEmail ? clientByEmail[e.attendeeEmail.toLowerCase()] : null
                    return (
                      <li key={e.uid} className="flex">
                        <div className="w-14 shrink-0 flex flex-col items-center justify-center border-r border-[#1c1c1c] py-3">
                          <span className="text-[9px] font-medium text-[#3a3a3a] uppercase">{e.start.toLocaleDateString('de-DE', { weekday: 'short', timeZone: 'Europe/Zurich' })}</span>
                          <span className="text-lg font-bold text-[#555555] leading-none">{e.start.toLocaleDateString('de-DE', { day: '2-digit', timeZone: 'Europe/Zurich' })}</span>
                          <span className="text-[9px] text-[#3a3a3a]">{e.start.toLocaleDateString('de-DE', { month: 'short', year: '2-digit', timeZone: 'Europe/Zurich' })}</span>
                        </div>
                        <div className="flex-1 px-4 py-3 flex items-start justify-between gap-3 min-w-0">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-[#555555] truncate">{e.title}</p>
                            {e.attendeeName && <p className="text-xs text-[#3a3a3a] mt-0.5">{e.attendeeName}</p>}
                            {knownClient ? (
                              <Link href={`/clients/${knownClient.id}`} className="text-[10px] text-[#444444] hover:text-[#efefef] transition-colors">
                                Klient ansehen →
                              </Link>
                            ) : e.attendeeEmail ? (
                              <p className="text-[10px] text-[#444444]">{e.attendeeEmail}</p>
                            ) : null}
                          </div>
                          <p className="text-xs text-[#3a3a3a] shrink-0">{T(e.start)}</p>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}
