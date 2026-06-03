import { fetchCalcomEvents, type CalEvent } from '@/lib/ical'
import Link from 'next/link'

const WEEKDAYS   = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']
const MONTH_NAMES = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
]

function monatParam(y: number, m: number) {
  return `${y}-${String(m).padStart(2, '0')}`
}
function prev(y: number, m: number) {
  return m === 1 ? monatParam(y - 1, 12) : monatParam(y, m - 1)
}
function next(y: number, m: number) {
  return m === 12 ? monatParam(y + 1, 1) : monatParam(y, m + 1)
}

export default async function KalenderPage(
  props: {
    searchParams: Promise<{ monat?: string }>
  }
) {
  const searchParams = await props.searchParams;
  const now = new Date()
  let year  = now.getFullYear()
  let month = now.getMonth() + 1

  if (searchParams.monat) {
    const parts = searchParams.monat.split('-').map(Number)
    if (parts[0] > 2000 && parts[1] >= 1 && parts[1] <= 12) {
      year = parts[0]; month = parts[1]
    }
  }

  const { events, configured, error } = await fetchCalcomEvents()

  // Group this month's non-cancelled events by day number
  const byDay: Record<number, CalEvent[]> = {}
  for (const e of events) {
    if (e.status === 'CANCELLED') continue
    const eDay = parseInt(e.start.toLocaleDateString('de-DE', { day: 'numeric',   timeZone: 'Europe/Zurich' }))
    const eM   = parseInt(e.start.toLocaleDateString('de-DE', { month: 'numeric', timeZone: 'Europe/Zurich' }))
    const eY   = e.start.getFullYear()
    if (eY === year && eM === month) {
      if (!byDay[eDay]) byDay[eDay] = []
      byDay[eDay].push(e)
    }
  }

  const monthEvents = Object.values(byDay).flat()
    .sort((a, b) => a.start.getTime() - b.start.getTime())

  // Calendar grid
  const firstDay    = new Date(year, month - 1, 1)
  const daysInMonth = new Date(year, month, 0).getDate()
  let startWD = firstDay.getDay()
  startWD = (startWD + 6) % 7 // Monday-first

  const cells: (number | null)[] = [
    ...Array(startWD).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)
  const weeks = Array.from({ length: cells.length / 7 }, (_, i) =>
    cells.slice(i * 7, i * 7 + 7)
  )

  const isCurrentMonth = now.getFullYear() === year && now.getMonth() + 1 === month
  const todayNum       = now.getDate()

  return (
    <div className="p-4 md:p-6 lg:p-8 w-full space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">{MONTH_NAMES[month - 1]}</h1>
          <p className="text-xs text-[#3a3a3a] mt-0.5">{year}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/kalender"
            className="px-3 py-1.5 text-xs text-[#666666] border border-[#2e2e2e] hover:bg-[#1c1c1c] hover:text-[#efefef] rounded-lg transition-colors">
            Heute
          </Link>
          <div className="flex items-center gap-0.5">
            <Link href={`/kalender?monat=${prev(year, month)}`}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-[#555555] hover:text-[#efefef] hover:bg-[#1c1c1c] transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </Link>
            <Link href={`/kalender?monat=${next(year, month)}`}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-[#555555] hover:text-[#efefef] hover:bg-[#1c1c1c] transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </Link>
          </div>
        </div>
      </div>

      {/* ── Not configured ── */}
      {!configured && (
        <div className="bg-[#141414] border border-[#2e2e2e] rounded-2xl px-5 py-10 text-center space-y-3">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
            className="text-[#2e2e2e] mx-auto">
            <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <p className="text-sm text-[#555555]">Cal.com ist nicht verbunden.</p>
          <Link href="/settings"
            className="inline-block text-xs text-[#666666] border border-[#2e2e2e] hover:bg-[#1c1c1c] px-4 py-2 rounded-lg transition-colors">
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
          {/* ── Calendar grid ── */}
          <div className="bg-[#141414] border border-[#2e2e2e] rounded-2xl overflow-hidden">

            {/* Weekday header */}
            <div className="grid grid-cols-7">
              {WEEKDAYS.map((d, i) => (
                <div key={d}
                  className={`py-3 text-center text-[11px] font-semibold uppercase tracking-widest border-b border-[#1c1c1c] ${
                    i >= 5 ? 'text-[#3a3a3a]' : 'text-[#555555]'
                  }`}>
                  {d}
                </div>
              ))}
            </div>

            {/* Day grid */}
            {weeks.map((week, wi) => (
              <div key={wi} className="grid grid-cols-7">
                {week.map((day, di) => {
                  const dayEvents = day ? (byDay[day] ?? []) : []
                  const isToday   = isCurrentMonth && day === todayNum
                  const isWeekend = di >= 5
                  const isEmpty   = !day
                  const hasBorder = wi < weeks.length - 1

                  return (
                    <div key={di}
                      className={[
                        'min-h-[88px] p-2',
                        di < 6 ? 'border-r border-[#1c1c1c]' : '',
                        hasBorder ? 'border-b border-[#1c1c1c]' : '',
                        isEmpty   ? 'opacity-30' : '',
                      ].join(' ')}>
                      {day && (
                        <>
                          {/* Day number */}
                          <div className="flex justify-end mb-1.5">
                            <span className={[
                              'inline-flex items-center justify-center w-7 h-7 text-xs rounded-full font-semibold transition-colors',
                              isToday
                                ? 'bg-white text-black'
                                : isWeekend
                                  ? 'text-[#3a3a3a]'
                                  : 'text-[#666666]',
                            ].join(' ')}>
                              {day}
                            </span>
                          </div>

                          {/* Events */}
                          <div className="space-y-1">
                            {dayEvents.slice(0, 2).map(e => (
                              <div key={e.uid}
                                className="flex items-center gap-1 rounded-md px-1.5 py-1 bg-orange-500/15 border border-orange-500/20 group">
                                <span className="w-1 h-1 rounded-full bg-orange-400 shrink-0" />
                                <span className="text-[9px] text-orange-300 truncate leading-none">
                                  {e.start.toLocaleTimeString('de-DE', {
                                    hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Zurich',
                                  })} {e.title}
                                </span>
                              </div>
                            ))}
                            {dayEvents.length > 2 && (
                              <p className="text-[9px] text-[#444444] px-1">
                                +{dayEvents.length - 2} mehr
                              </p>
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

          {/* ── Month list ── */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-semibold text-[#3a3a3a] uppercase tracking-wider">
                {MONTH_NAMES[month - 1]} · {monthEvents.length} Buchung{monthEvents.length !== 1 ? 'en' : ''}
              </h2>
              <Link href="/termine" className="text-xs text-[#666666] hover:text-[#efefef] transition-colors">
                Alle Termine →
              </Link>
            </div>

            {monthEvents.length === 0 ? (
              <div className="bg-[#141414] border border-[#2e2e2e] rounded-2xl px-5 py-8 text-center">
                <p className="text-sm text-[#3a3a3a]">Keine Buchungen in diesem Monat.</p>
              </div>
            ) : (
              <div className="bg-[#141414] border border-[#2e2e2e] rounded-2xl overflow-hidden">
                <ul className="divide-y divide-[#1c1c1c]">
                  {monthEvents.map(e => {
                    const isToday = e.start.toDateString() === now.toDateString()
                    return (
                      <li key={e.uid} className="flex hover:bg-[#1c1c1c] transition-colors">
                        {/* Date column */}
                        <div className="w-16 shrink-0 flex flex-col items-center justify-center border-r border-[#1c1c1c] py-4">
                          <span className="text-[10px] font-semibold text-[#3a3a3a] uppercase tracking-wide">
                            {e.start.toLocaleDateString('de-DE', { weekday: 'short', timeZone: 'Europe/Zurich' })}
                          </span>
                          <span className={`text-2xl font-bold leading-none mt-0.5 ${isToday ? 'text-white' : 'text-[#efefef]'}`}>
                            {e.start.toLocaleDateString('de-DE', { day: '2-digit', timeZone: 'Europe/Zurich' })}
                          </span>
                        </div>

                        {/* Content */}
                        <div className="flex-1 px-4 py-3.5 flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0" />
                              <p className="text-sm font-medium text-[#efefef] truncate">{e.title}</p>
                            </div>
                            {e.attendeeName && (
                              <p className="text-xs text-[#555555] mt-0.5 ml-3.5">{e.attendeeName}</p>
                            )}
                            {e.meetingUrl && (
                              <a href={e.meetingUrl} target="_blank" rel="noopener noreferrer"
                                className="text-[10px] text-blue-400 hover:text-blue-300 mt-1 ml-3.5 inline-flex items-center gap-1 transition-colors">
                                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M15 10l4.553-2.069A1 1 0 0 1 21 8.82v6.36a1 1 0 0 1-1.447.889L15 14M3 8a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8z"/>
                                </svg>
                                Meeting öffnen
                              </a>
                            )}
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-xs font-medium text-[#efefef]">
                              {e.start.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Zurich' })}
                            </p>
                            <p className="text-[10px] text-[#3a3a3a] mt-0.5">
                              {e.end.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Zurich' })}
                            </p>
                          </div>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
