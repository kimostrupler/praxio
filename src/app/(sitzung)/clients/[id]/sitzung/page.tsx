import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { avatarColor } from '@/lib/avatar'
import { fetchCalcomEvents } from '@/lib/ical'
import NotizBlock from '@/components/NotizBlock'
import ZieleBlock from '@/components/ZieleBlock'
import MessungForm from '@/components/MessungForm'
import GewichtsChart from '@/components/GewichtsChart'
import ErrorBoundary from '@/components/ErrorBoundary'
import PdfMenu from '@/components/PdfMenu'
import { buildGewichtsDaten } from '@/lib/client-utils'

const D = (d: Date | string) =>
  new Date(d).toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' })
const T = (d: Date | string) =>
  new Date(d).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Zurich' })
const Dfull = (d: Date | string) =>
  new Date(d).toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: 'long' })

function dur(start: Date, end?: Date | null) {
  if (!end) return null
  const m = Math.round((end.getTime() - start.getTime()) / 60000)
  if (m < 60) return `${m} Min.`
  const h = Math.floor(m / 60), rm = m % 60
  return rm ? `${h}h ${rm}m` : `${h}h`
}

export default async function SitzungsPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const [client, messungen, notizCount, calcomResult] = await Promise.all([
    prisma.client.findUnique({
      where: { id: params.id },
      include: {
        // All notizen (active only) — latest 30 shown in NotizBlock
        notizen: { where: { deletedAt: null }, orderBy: { createdAt: 'desc' }, take: 30 },
        // All goals — ZieleBlock handles display of open vs completed
        ziele: { orderBy: { createdAt: 'asc' } },
        // All training plans
        trainingsplaene: {
          orderBy: { datum: 'desc' },
          include: {
            uebungen: {
              orderBy: { reihenfolge: 'asc' },
              include: { uebung: { select: { name: true, kategorie: true } } },
            },
          },
        },
        // All nutrition plans
        ernaehrungsplaene: {
          orderBy: { datum: 'desc' },
          include: { zeilen: { orderBy: { reihenfolge: 'asc' } } },
        },
        // ALL anamnesen — needed for chart + full history display
        anamnesen: { orderBy: { datum: 'desc' } },
      },
    }),
    prisma.messung.findMany({
      where: { clientId: params.id },
      orderBy: { datum: 'asc' },
    }),
    // Total note count (not capped at 30)
    prisma.notiz.count({ where: { clientId: params.id, deletedAt: null } }),
    fetchCalcomEvents(),
  ])

  if (!client) notFound()

  const clientEvents = client.email
    ? calcomResult.events.filter(e => e.attendeeEmail?.toLowerCase() === client.email!.toLowerCase())
    : []
  const upcomingEvents = clientEvents.filter(e => e.start >= new Date() && e.status !== 'CANCELLED')
  const pastEvents     = clientEvents.filter(e => e.start < new Date()).reverse()

  const latestAnamnese = client.anamnesen[0] ?? null
  const messungenDesc  = [...messungen].reverse()
  const currentWeight  = messungenDesc[0]?.gewicht ?? latestAnamnese?.aktuellesGewicht ?? null
  const nextEvent      = upcomingEvents[0] ?? null
  const openGoals      = client.ziele.filter(z => !z.erreicht).length

  const gewichtsDaten = buildGewichtsDaten(client.anamnesen, messungen)

  const now       = new Date()
  const dateLabel = now.toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
  const timeLabel = now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Zurich' })
  const name      = `${client.vorname} ${client.nachname}`
  const initials  = `${client.vorname[0]}${client.nachname[0]}`
  const base      = `/clients/${params.id}`

  const btnSm = 'px-2.5 py-1 text-[10px] text-[#666666] border border-[#2e2e2e] hover:bg-[#1c1c1c] hover:text-[#efefef] rounded-lg transition-colors whitespace-nowrap shrink-0'
  const btnXs = 'flex items-center gap-1 px-2.5 py-1.5 text-xs text-[#666666] border border-[#2e2e2e] hover:bg-[#1c1c1c] hover:text-[#efefef] rounded-lg transition-colors whitespace-nowrap shrink-0'
  const pdfBtn = 'w-7 h-7 flex items-center justify-center text-[#3a3a3a] border border-[#2e2e2e] hover:bg-[#1c1c1c] hover:text-accent rounded-lg transition-colors shrink-0'

  let nextLabel: { when: string; sub: string } | null = null
  if (nextEvent) {
    const diff = Math.ceil((nextEvent.start.getTime() - Date.now()) / 86400000)
    const when = diff === 0 ? 'Heute' : diff === 1 ? 'Morgen' : Dfull(nextEvent.start)
    nextLabel = { when, sub: T(nextEvent.start) }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">

      {/* ── Sticky top bar ── */}
      <div className="sticky top-0 z-50 bg-[#0a0a0a]/95 backdrop-blur border-b border-[#1c1c1c]">
        <div className="flex items-center justify-between px-4 md:px-6 h-14">
          <div className="flex items-center gap-3 min-w-0">
            <Link href={base} className="w-8 h-8 flex items-center justify-center rounded-lg text-[#555555] hover:text-[#efefef] hover:bg-[#1c1c1c] transition-colors shrink-0">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </Link>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${avatarColor(name)}`}>
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-[#efefef] truncate leading-tight">{name}</p>
              <p className="text-[10px] text-[#444444] leading-tight">Sitzungsansicht</p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="hidden md:flex items-center gap-1.5">
              <Link href={`${base}/training/neu`} className={btnXs}>+ Plan</Link>
              <Link href={`/rechnungen/neu?clientId=${params.id}`} className={btnXs}>+ Rechnung</Link>
              <PdfMenu
                clientId={params.id}
                latestAnamneseId={client.anamnesen[0]?.id ?? null}
                hasPlaene={client.trainingsplaene.length > 0}
                hasErnaehrung={client.ernaehrungsplaene.length > 0}
              />
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold text-[#efefef] tabular-nums">{timeLabel}</p>
              <p className="text-[10px] text-[#3a3a3a]">{dateLabel}</p>
            </div>
          </div>
        </div>

        {/* Stats strip */}
        <div className="flex overflow-x-auto scrollbar-none border-t border-[#1c1c1c]">
          {[
            { label: 'Gewicht',         value: currentWeight ? `${currentWeight} kg` : '—',  accent: false },
            { label: 'Ziele offen',     value: String(openGoals),                             accent: openGoals > 0 },
            { label: 'Notizen',         value: String(notizCount),                            accent: false },
            { label: 'Anamnesen',       value: String(client.anamnesen.length),               accent: false },
            { label: 'Trainingspläne',  value: String(client.trainingsplaene.length),         accent: false },
            { label: 'Ernährungspläne', value: String(client.ernaehrungsplaene.length),       accent: false },
            { label: 'Nächster Termin', value: nextLabel ? nextLabel.when : '—',              accent: !!nextLabel },
          ].map(({ label, value, accent }) => (
            <div key={label} className="px-4 py-2 border-r border-[#1c1c1c] last:border-0 shrink-0 min-w-[80px]">
              <p className="text-[9px] text-[#3a3a3a] uppercase tracking-wider">{label}</p>
              <p className={`text-sm font-semibold mt-0.5 tabular-nums ${accent ? 'text-accent' : 'text-[#efefef]'}`}>{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Main 2-column grid — natural height, page scrolls as one ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] lg:items-start pb-24 lg:pb-8">

        {/* LEFT — Notes (sticky on lg so it stays in view while right scrolls) */}
        <div className="p-4 md:p-6 lg:sticky lg:top-[var(--bar-height,110px)] lg:max-h-[calc(100vh-120px)] lg:overflow-y-auto">
          <NotizBlock clientId={params.id} notizen={client.notizen} />
        </div>

        {/* RIGHT — All reference data, natural flow */}
        <div className="p-4 md:p-6 border-t border-[#1c1c1c] lg:border-t-0 lg:border-l lg:border-[#1c1c1c]">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* Weight chart + log — full width */}
            <div className="col-span-full bg-[#141414] border border-[#2e2e2e] rounded-xl overflow-hidden">
              {gewichtsDaten.length >= 2 ? (
                <>
                  <div className="px-4 pt-4 pb-2">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xs font-semibold text-[#3a3a3a] uppercase tracking-wider">Gewichtsverlauf</h3>
                      {currentWeight && <span className="text-sm font-bold text-[#efefef] tabular-nums">{currentWeight} kg</span>}
                    </div>
                    <ErrorBoundary><GewichtsChart eintraege={gewichtsDaten} /></ErrorBoundary>
                  </div>
                  <div className="border-t border-[#1c1c1c] px-4 py-3">
                    <p className="text-[10px] text-[#3a3a3a] uppercase tracking-wider mb-2">Messung erfassen</p>
                    <MessungForm clientId={params.id} />
                  </div>
                </>
              ) : (
                <div className="p-4">
                  <h3 className="text-xs font-semibold text-[#3a3a3a] uppercase tracking-wider mb-3">Gewicht erfassen</h3>
                  <MessungForm clientId={params.id} />
                </div>
              )}
            </div>

            {/* Goals — half width */}
            {client.ziele.length > 0 && (
              <div className="bg-[#141414] border border-[#2e2e2e] rounded-xl p-4">
                <h3 className="text-xs font-semibold text-[#3a3a3a] uppercase tracking-wider mb-3">
                  Ziele
                  {openGoals > 0 && <span className="ml-1.5 text-accent font-normal normal-case">{openGoals} offen</span>}
                </h3>
                <ZieleBlock clientId={params.id} ziele={client.ziele} />
              </div>
            )}

            {/* ALL Anamnesen — half width, loop over all */}
            <div className="bg-[#141414] border border-[#2e2e2e] rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-[#3a3a3a] uppercase tracking-wider">
                  Anamnesen
                  {client.anamnesen.length > 0 && <span className="ml-1.5 text-[#666666] font-normal normal-case">{client.anamnesen.length}</span>}
                </h3>
                <Link href={`${base}/anamnese/neu`} className={btnSm}>+ Neu</Link>
              </div>
              {client.anamnesen.length === 0 ? (
                <Link href={`${base}/anamnese/neu`} className="text-xs text-[#2e2e2e] hover:text-[#444444] transition-colors">
                  Neu erstellen →
                </Link>
              ) : (
                <div className="space-y-3">
                  {client.anamnesen.map((a, idx) => (
                    <div key={a.id} className={idx > 0 ? 'pt-3 border-t border-[#1c1c1c]' : ''}>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <p className="text-xs font-semibold text-[#efefef]">{D(a.datum)}</p>
                        <div className="flex items-center gap-1">
                          <a href={`/api/pdf/anamnese/${a.id}`} target="_blank" title="PDF herunterladen" className={pdfBtn}>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                          </a>
                          <Link href={`${base}/anamnese/${a.id}/bearbeiten`} className={btnSm}>Bearb.</Link>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                        {[
                          ['Gewicht', a.aktuellesGewicht ? `${a.aktuellesGewicht} kg` : null],
                          ['KF%',     a.koerperfett != null ? `${a.koerperfett}%` : null],
                          ['Grösse',  a.groesse ? `${a.groesse} cm` : null],
                          ['Stress',  a.stressLevel != null ? `${a.stressLevel}/10` : null],
                        ].filter(([, v]) => v).map(([l, v]) => (
                          <div key={String(l)}>
                            <p className="text-[9px] text-[#3a3a3a] uppercase tracking-wide">{l}</p>
                            <p className="text-[11px] text-[#efefef] font-medium">{v}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Training plans — half width */}
            <div className="bg-[#141414] border border-[#2e2e2e] rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-[#3a3a3a] uppercase tracking-wider">
                  Trainingspläne {client.trainingsplaene.length > 0 && <span className="text-[#666666] font-normal normal-case">{client.trainingsplaene.length}</span>}
                </h3>
                <Link href={`${base}/training/neu`} className={btnSm}>+ Neu</Link>
              </div>
              {client.trainingsplaene.length === 0 ? (
                <p className="text-xs text-[#2e2e2e]">Noch kein Plan.</p>
              ) : (
                <div className="space-y-3">
                  {client.trainingsplaene.map((plan, idx) => (
                    <div key={plan.id} className={idx > 0 ? 'pt-3 border-t border-[#1c1c1c]' : ''}>
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-[#efefef] truncate">{plan.name}</p>
                          <p className="text-[10px] text-[#3a3a3a]">{plan.uebungen.length} Übungen · {D(plan.datum)}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <a href={`/api/pdf/plan/${plan.id}`} target="_blank" title="PDF herunterladen" className={pdfBtn}>
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                          </a>
                          <Link href={`${base}/training/${plan.id}/bearbeiten`} className={btnSm}>Bearb.</Link>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {plan.uebungen.slice(0, 4).map(u => (
                          <span key={u.id} className="text-[10px] bg-[#1c1c1c] text-[#555555] border border-[#2e2e2e] px-1.5 py-0.5 rounded truncate max-w-[100px]">{u.uebung.name}</span>
                        ))}
                        {plan.uebungen.length > 4 && <span className="text-[10px] text-[#3a3a3a]">+{plan.uebungen.length - 4}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Nutrition plans — half width */}
            <div className="bg-[#141414] border border-[#2e2e2e] rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-[#3a3a3a] uppercase tracking-wider">
                  Ernährung {client.ernaehrungsplaene.length > 0 && <span className="text-[#666666] font-normal normal-case">{client.ernaehrungsplaene.length}</span>}
                </h3>
                <Link href={`${base}/ernaehrung/neu`} className={btnSm}>+ Neu</Link>
              </div>
              {client.ernaehrungsplaene.length === 0 ? (
                <p className="text-xs text-[#2e2e2e]">Noch kein Plan.</p>
              ) : (
                <div className="space-y-3">
                  {client.ernaehrungsplaene.map((plan, idx) => {
                    const kcal = plan.zeilen.reduce((s, z) => s + (z.kalorien ?? 0), 0)
                    const prot = plan.zeilen.reduce((s, z) => s + (z.protein ?? 0), 0)
                    const kh   = plan.zeilen.reduce((s, z) => s + (z.kohlenhydrate ?? 0), 0)
                    const fett = plan.zeilen.reduce((s, z) => s + (z.fett ?? 0), 0)
                    return (
                      <div key={plan.id} className={idx > 0 ? 'pt-3 border-t border-[#1c1c1c]' : ''}>
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-[#efefef] truncate">{plan.name}</p>
                            {kcal > 0 && <p className="text-[10px] text-[#3a3a3a]">{kcal} kcal · P {prot}g · KH {kh}g · F {fett}g</p>}
                          </div>
                          <div className="flex items-center gap-1">
                            <a href={`/api/pdf/ernaehrung/${plan.id}`} target="_blank" title="PDF herunterladen" className={pdfBtn}>
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                            </a>
                            <Link href={`${base}/ernaehrung/${plan.id}/bearbeiten`} className={btnSm}>Bearb.</Link>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Appointment history — full width */}
            {(upcomingEvents.length > 0 || pastEvents.length > 0) && (
              <div className="col-span-full bg-[#141414] border border-[#2e2e2e] rounded-xl p-4">
                <h3 className="text-xs font-semibold text-[#3a3a3a] uppercase tracking-wider mb-3">Terminverlauf</h3>
                <div className="space-y-1.5">
                  {upcomingEvents.map(e => (
                    <div key={e.uid} className="flex items-center gap-2.5 py-1.5 px-2 rounded-lg bg-emerald-950/10 border border-emerald-900/20">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                      <p className="text-xs text-emerald-300 truncate flex-1">{Dfull(e.start)} · {T(e.start)}{e.end ? ` · ${dur(e.start, e.end)}` : ''}</p>
                      <span className="text-[10px] text-emerald-500 shrink-0">↑</span>
                    </div>
                  ))}
                  {pastEvents.slice(0, 8).map(e => (
                    <div key={e.uid} className="flex items-center gap-2.5 py-1 px-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#2e2e2e] shrink-0" />
                      <p className="text-[11px] text-[#3a3a3a] truncate">{D(e.start)} · {T(e.start)}</p>
                    </div>
                  ))}
                  {pastEvents.length > 8 && <p className="text-[10px] text-[#2e2e2e] pl-6">+{pastEvents.length - 8} weitere</p>}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}
