import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { avatarColor } from '@/lib/avatar'
import { CHF, rBrutto, RECHNUNG_STATUS_LABEL, RECHNUNG_STATUS_STYLE } from '@/lib/formatting'
import { buildGewichtsDaten, parseJsonArray } from '@/lib/client-utils'
import { getPraxisConfig } from '@/lib/praxis'
import ZieleBlock from '@/components/ZieleBlock'
import CollapsibleSection from '@/components/CollapsibleSection'
import MessungForm from '@/components/MessungForm'
import {
  deleteClient,
  updateClientStatus,
  restoreNotiz,
} from '@/app/actions/clients'
import { fetchCalcomEvents } from '@/lib/ical'
import ClientActionMenu from '@/components/ClientActionMenu'
import ClientStatusSelect from '@/components/ClientStatusSelect'
import EmailMenu from '@/components/EmailMenu'
import PdfMenu from '@/components/PdfMenu'
import RechnungAktionen from '@/components/RechnungAktionen'
import { deleteErnaehrungsPlan } from '@/app/actions/ernaehrung'
import AnamneseVergleich from '@/components/AnamneseVergleich'
import AnamneseKarte from '@/components/AnamneseKarte'
import NotizBlock from '@/components/NotizBlock'
import TrainingsPlanKarte from '@/components/TrainingsPlanKarte'
import GewichtsChart from '@/components/GewichtsChart'
import ClientTags from '@/components/ClientTags'
import ErrorBoundary from '@/components/ErrorBoundary'
import ClientTabs from '@/components/ClientTabs'

const D = (d: Date | string) => new Date(d).toLocaleDateString('de-DE')

const GESCHLECHT_LABEL: Record<string, string> = { WEIBLICH: 'Weiblich', MAENNLICH: 'Männlich', DIVERS: 'Divers' }

const TL_META: Record<string, { dot: string; text: string; label: string }> = {
  notiz:          { dot: 'bg-blue-500/70',    text: 'text-blue-400',    label: 'Notiz' },
  anamnese:       { dot: 'bg-purple-500/70',  text: 'text-purple-400',  label: 'Anamnese' },
  training:       { dot: 'bg-emerald-500/70', text: 'text-emerald-400', label: 'Training' },
  ernaehrung:     { dot: 'bg-orange-500/70',  text: 'text-orange-400',  label: 'Ernährung' },
  rechnung:       { dot: 'bg-yellow-500/70',  text: 'text-yellow-400',  label: 'Rechnung' },
  termin:         { dot: 'bg-sky-500/70',     text: 'text-sky-400',     label: 'Termin' },
  'deleted-notiz':{ dot: 'bg-red-500/30',     text: 'text-red-400/60',  label: 'Gelöscht' },
}

function bmi(w: number | null | undefined, h: number | null | undefined) {
  if (!w || !h) return null
  return (w / Math.pow(h / 100, 2)).toFixed(1)
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#141414] border border-[#2e2e2e] rounded-xl p-5 md:p-6 overflow-hidden">
      <h3 className="text-[10px] font-mono font-semibold text-[#555555] uppercase tracking-widest mb-4 pb-3 border-b border-[#1c1c1c]">{title}</h3>
      {children}
    </div>
  )
}

function Grid({ children }: { children: React.ReactNode }) {
  return <dl className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">{children}</dl>
}

function Row({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <>
      <dt className="text-[10px] text-[#3a3a3a] uppercase tracking-wide pt-0.5">{label}</dt>
      <dd className="text-sm text-[#efefef] min-w-0 break-words">{value ?? '—'}</dd>
    </>
  )
}

export default async function ClientDetailPage(
  props: {
    params: Promise<{ id: string }>
    searchParams: Promise<{ tab?: string }>
  }
) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  const tab = searchParams.tab ?? 'uebersicht'

  const [client, clientRechnungen, messungen, praxis] = await Promise.all([
    prisma.client.findUnique({
      where: { id: params.id },
      include: {
        anamnesen: { orderBy: { datum: 'desc' } },
        notizen:   { where: { deletedAt: null }, orderBy: { createdAt: 'desc' } },
        ziele:     { orderBy: { createdAt: 'asc' } },
        ernaehrungsplaene: {
          orderBy: { datum: 'desc' },
          include: {
            zeilen: { orderBy: { reihenfolge: 'asc' } },
            vorlage: { select: { name: true } },
          },
        },
        trainingsplaene: {
          orderBy: { datum: 'desc' },
          include: {
            uebungen: {
              orderBy: { reihenfolge: 'asc' },
              include: { uebung: { select: { name: true, kategorie: true, beschreibung: true } } },
            },
          },
        },
      },
    }),
    prisma.rechnung.findMany({
      where: { clientId: params.id },
      orderBy: { datum: 'desc' },
      include: { positionen: { select: { menge: true, einzelpreis: true } } },
    }),
    prisma.messung.findMany({
      where: { clientId: params.id },
      orderBy: { datum: 'asc' },
    }),
    getPraxisConfig(),
  ])
  if (!client) notFound()

  // Fetch soft-deleted notes (only needed for verlauf tab)
  const deletedNotizen = tab === 'verlauf'
    ? await prisma.notiz.findMany({
        where: { clientId: params.id, deletedAt: { not: null } },
        orderBy: { createdAt: 'desc' },
      })
    : []

  // Fetch cal.com bookings for this client (matched by email)
  const calcomResult = await fetchCalcomEvents()
  const clientTermine = client.email
    ? calcomResult.events.filter(
        e => e.attendeeEmail?.toLowerCase() === client.email!.toLowerCase()
      )
    : []
  const upcomingTermine = clientTermine.filter(e => e.start >= new Date() && e.status !== 'CANCELLED')
  const pastTermine     = clientTermine.filter(e => e.start <  new Date()).reverse()

  const gewichtsDaten = buildGewichtsDaten(client.anamnesen, messungen)

  const now = new Date()

  // Financial summary
  const clvTotal   = clientRechnungen.filter(r => r.status === 'BEZAHLT').reduce((s, r) => s + rBrutto(r), 0)
  const offenTotal = clientRechnungen.filter(r => r.status === 'OFFEN').reduce((s, r) => s + rBrutto(r), 0)
  const createdDate = new Date(client.createdAt)
  const monthsSince = Math.max(1,
    (now.getFullYear() - createdDate.getFullYear()) * 12 + (now.getMonth() - createdDate.getMonth())
  )

  // Unified current weight — most recent entry from any source (Anamnese or Messung)
  const currentWeight = gewichtsDaten.length > 0 ? gewichtsDaten[gewichtsDaten.length - 1] : null

  const latest = client.anamnesen[0]
  const previous = client.anamnesen[1]
  const clientBMI = latest ? bmi(latest.aktuellesGewicht, latest.groesse) : null

  const baseHref = `/clients/${params.id}`

  // Collapsed section previews
  const prevNotizen = client.notizen[0]
    ? `${client.notizen[0].inhalt.slice(0, 55)}${client.notizen[0].inhalt.length > 55 ? '…' : ''} · ${D(client.notizen[0].datum)}`
    : 'Noch keine Notizen'

  const aktivZiele = client.ziele.filter(z => !z.erreicht)
  const prevZiele = client.ziele.length === 0
    ? 'Noch keine Ziele'
    : aktivZiele.length === 0
    ? `Alle ${client.ziele.length} erreicht`
    : aktivZiele.slice(0, 3)
        .map(z => z.zielwert != null ? `${z.titel} ${z.zielwert} ${z.einheit ?? ''}`.trim() : z.titel)
        .join(' · ')

  const prevPlaene = [client.trainingsplaene[0]?.name, client.ernaehrungsplaene[0]?.name]
    .filter(Boolean).join(' · ') || 'Kein Plan vorhanden'

  let prevEntwicklung: string
  if (gewichtsDaten.length === 0) {
    prevEntwicklung = 'Noch keine Daten'
  } else if (gewichtsDaten.length === 1) {
    prevEntwicklung = `${gewichtsDaten[0].gewicht} kg`
  } else {
    const gFirst = gewichtsDaten[0]
    const gLast  = gewichtsDaten[gewichtsDaten.length - 1]
    const gDiff  = gLast.gewicht - gFirst.gewicht
    prevEntwicklung = `${gFirst.gewicht} → ${gLast.gewicht} kg (${gDiff > 0 ? '+' : ''}${gDiff.toFixed(1)} kg) · ${gewichtsDaten.length} Einträge`
  }

  let prevTermine = ''
  if (upcomingTermine.length > 0) {
    const e = upcomingTermine[0]
    const diff = Math.ceil((e.start.getTime() - Date.now()) / 86400000)
    const when = diff === 0 ? 'Heute' : diff === 1 ? 'Morgen' : `in ${diff}T`
    prevTermine = `${when} · ${e.start.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Zurich' })}`
  }

  const prevUmsatz = clientRechnungen.length > 0
    ? `${CHF(clvTotal)} bezahlt${offenTotal > 0 ? ` · ${CHF(offenTotal)} offen` : ''}`
    : ''

  const prevStammdaten = [client.vorname + ' ' + client.nachname, client.email ?? client.telefon].filter(Boolean).join(' · ')

  const prevAnamnese = latest
    ? [
        currentWeight ? `${currentWeight.gewicht} kg` : null,
        latest.koerperfett != null ? `${latest.koerperfett}% KF` : null,
        latest.stressLevel != null ? `Stress ${latest.stressLevel}/10` : null,
      ].filter(Boolean).join(' · ') || D(latest.datum)
    : 'Keine Anamnese'

  const tl = tab !== 'verlauf' ? [] : ([
    ...client.notizen.map(n => ({
      date: new Date(n.datum), kind: 'notiz',
      label: n.kategorie ?? 'Notiz',
      sub: n.inhalt.slice(0, 80) + (n.inhalt.length > 80 ? '…' : ''),
      href: `${baseHref}?tab=uebersicht`,
    })),
    ...deletedNotizen.map(n => ({
      date: new Date(n.datum), kind: 'deleted-notiz',
      label: n.kategorie ?? 'Notiz',
      sub: n.inhalt.slice(0, 80) + (n.inhalt.length > 80 ? '…' : ''),
      notizId: n.id,
      href: undefined,
    })),
    ...client.anamnesen.map(a => ({
      date: new Date(a.datum), kind: 'anamnese',
      label: 'Anamnesebogen',
      sub: a.aktuellesGewicht ? `${a.aktuellesGewicht} kg` : undefined,
      href: `${baseHref}?tab=anamnesen`,
    })),
    ...client.trainingsplaene.map(p => ({
      date: new Date(p.datum), kind: 'training',
      label: p.name,
      sub: `${p.uebungen.length} Übung${p.uebungen.length !== 1 ? 'en' : ''}`,
      href: `${baseHref}?tab=training`,
    })),
    ...client.ernaehrungsplaene.map(p => ({
      date: new Date(p.datum), kind: 'ernaehrung',
      label: p.name,
      sub: p.zeilen.length > 0 ? `${p.zeilen.reduce((s, z) => s + (z.kalorien ?? 0), 0)} kcal` : undefined,
      href: `${baseHref}?tab=ernaehrung`,
    })),
    ...clientRechnungen.map(r => ({
      date: new Date(r.datum), kind: 'rechnung',
      label: `Rechnung ${r.nummer}`,
      sub: r.betreff ?? undefined,
      href: `${baseHref}?tab=rechnungen`,
    })),
    ...clientTermine.map(e => ({
      date: e.start, kind: 'termin',
      label: e.title,
      sub: e.start.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Zurich' }),
      href: `${baseHref}?tab=termine`,
    })),
  ] as Array<{ date: Date; kind: string; label: string; sub?: string; href?: string; notizId?: string }>)
    .sort((a, b) => b.date.getTime() - a.date.getTime())

  async function deleteAction() {
    'use server'
    await deleteClient(params.id)
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 w-full">
      {/* ── Client header ── */}
      <div className="mb-4">
        <Link href="/clients" className="text-xs text-[#555555] hover:text-[#efefef] transition-colors inline-flex items-center gap-1 mb-3">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
          Klientenliste
        </Link>
        <div className="flex items-start justify-between gap-3">
          {/* Left: avatar + name + meta + status + tags */}
          <div className="flex items-start gap-3 min-w-0">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-base font-semibold shrink-0 mt-0.5 ${avatarColor(client.vorname + client.nachname)}`}>
              {client.vorname[0]}{client.nachname[0]}
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-[#efefef] truncate">{client.vorname} {client.nachname}</h1>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                {(client.email || client.telefon) && (
                  <span className="text-xs text-[#555555] truncate">{client.email ?? client.telefon}</span>
                )}
                {currentWeight && (
                  <span className="text-xs text-[#555555]">{currentWeight.gewicht} kg</span>
                )}
                {client.notizen[0]?.datum && (
                  <span className="text-xs text-[#555555]">Kontakt {D(client.notizen[0].datum)}</span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <ClientStatusSelect clientId={params.id} status={client.status} />
                <ClientTags clientId={params.id} initialTags={parseJsonArray(client.tags)} />
              </div>
            </div>
          </div>

          {/* Right: action buttons */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
            <Link href={`/clients/${params.id}/sitzung`}
              className="text-xs text-[#666666] border border-[#2e2e2e] hover:bg-[#1c1c1c] hover:text-[#efefef] px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/>
              </svg>
              <span className="hidden sm:inline">Sitzung</span>
            </Link>
            <EmailMenu
              clientId={params.id}
              clientEmail={client.email ?? null}
              clientVorname={client.vorname}
              praxisName={praxis.name}
              hasPlaene={client.trainingsplaene.length > 0}
              hasErnaehrung={client.ernaehrungsplaene.length > 0}
            />
            <PdfMenu
              clientId={params.id}
              latestAnamneseId={client.anamnesen[0]?.id ?? null}
              hasPlaene={client.trainingsplaene.length > 0}
              hasErnaehrung={client.ernaehrungsplaene.length > 0}
            />
            <ClientActionMenu deleteAction={deleteAction} />
            <Link href={`/rechnungen/neu?clientId=${params.id}`}
              className="px-3 py-2 bg-white hover:bg-[#e8e8e8] text-black text-sm font-semibold rounded-lg transition-colors whitespace-nowrap">
              + Rechnung
            </Link>
          </div>
        </div>
      </div>

      {/* ── Tab navigation ── */}
      <ClientTabs activeTab={tab} tabs={[
        { key: 'uebersicht', label: 'Übersicht',  href: baseHref },
        { key: 'anamnesen',  label: 'Anamnesen',  href: `${baseHref}?tab=anamnesen`,  badge: client.anamnesen.length || undefined },
        { key: 'training',   label: 'Training',   href: `${baseHref}?tab=training`,   badge: client.trainingsplaene.length || undefined },
        { key: 'ernaehrung', label: 'Ernährung',  href: `${baseHref}?tab=ernaehrung`, badge: client.ernaehrungsplaene.length || undefined },
        { key: 'rechnungen', label: 'Rechnungen', href: `${baseHref}?tab=rechnungen`, badge: clientRechnungen.length || undefined },
        { key: 'termine',    label: 'Termine',    href: `${baseHref}?tab=termine`,    badge: upcomingTermine.length || undefined, badgeClass: 'text-orange-400' },
        { key: 'verlauf',    label: 'Verlauf',    href: `${baseHref}?tab=verlauf` },
      ]} />

      {/* ── Tab content ── */}

      {/* ÜBERSICHT */}
      {tab === 'uebersicht' && (
        <div className="space-y-2">

          {/* 1. Notizen */}
            <CollapsibleSection title="Sitzungsnotizen" preview={prevNotizen}>
              <NotizBlock clientId={params.id} notizen={client.notizen} />
            </CollapsibleSection>

          {/* 2. Ziele */}
            <CollapsibleSection title="Ziele" badge={client.ziele.filter(z => !z.erreicht).length || undefined} preview={prevZiele}>
              <ErrorBoundary>
                <ZieleBlock clientId={params.id} ziele={client.ziele} />
              </ErrorBoundary>
            </CollapsibleSection>

          {/* 3. Aktuelle Pläne */}
            <CollapsibleSection title="Aktuelle Pläne" preview={prevPlaene}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {client.trainingsplaene.length > 0 ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[10px] font-mono font-semibold text-[#555555] uppercase tracking-widest">Training</p>
                      <Link href={`${baseHref}?tab=training`} className="text-xs text-[#666666] hover:text-white transition-colors">Alle →</Link>
                    </div>
                    {client.trainingsplaene.map(plan => (
                      <div key={plan.id} className="bg-[#1c1c1c] rounded-lg p-3">
                        <p className="text-sm font-medium text-[#efefef] mb-1 truncate">{plan.name}</p>
                        <p className="text-xs text-[#444444] mb-2">{D(plan.datum)} · {plan.uebungen.length} Übungen</p>
                        <div className="flex flex-wrap gap-1">
                          {[...plan.uebungen].sort((a, b) => a.reihenfolge - b.reihenfolge).slice(0, 5).map(u => (
                            <span key={u.id} className="text-[10px] bg-[#141414] text-[#555555] border border-[#2e2e2e] px-1.5 py-0.5 rounded-md truncate max-w-[120px]">{u.uebung.name}</span>
                          ))}
                          {plan.uebungen.length > 5 && (
                            <span className="text-[10px] text-[#3a3a3a]">+{plan.uebungen.length - 5}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Link href={`${baseHref}?tab=training`} className="flex items-center justify-between bg-[#141414] border border-[#2e2e2e] hover:border-[#3a3a3a] rounded-xl px-5 py-4 transition-colors group">
                    <div className="min-w-0">
                      <h3 className="text-[10px] font-mono font-semibold text-[#555555] uppercase tracking-widest mb-1">Training</h3>
                      <p className="text-sm text-[#2e2e2e]">Noch kein Trainingsplan.</p>
                    </div>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#2e2e2e] group-hover:text-[#444444] shrink-0 ml-3"><polyline points="9 18 15 12 9 6"/></svg>
                  </Link>
                )}
                {client.ernaehrungsplaene.length > 0 ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[10px] font-mono font-semibold text-[#555555] uppercase tracking-widest">Ernährung</p>
                      <Link href={`${baseHref}?tab=ernaehrung`} className="text-xs text-[#666666] hover:text-white transition-colors">Alle →</Link>
                    </div>
                    {client.ernaehrungsplaene.map(plan => {
                      const kcal = plan.zeilen.reduce((s, z) => s + (z.kalorien ?? 0), 0)
                      const prot = plan.zeilen.reduce((s, z) => s + (z.protein ?? 0), 0)
                      const kh   = plan.zeilen.reduce((s, z) => s + (z.kohlenhydrate ?? 0), 0)
                      const fett = plan.zeilen.reduce((s, z) => s + (z.fett ?? 0), 0)
                      return (
                        <div key={plan.id} className="bg-[#1c1c1c] rounded-lg p-3">
                          <p className="text-sm font-medium text-[#efefef] mb-1 truncate">{plan.name}</p>
                          {kcal > 0 && (
                            <div className="flex flex-wrap gap-2 text-xs">
                              <span className="text-[#efefef] font-medium">{kcal} kcal</span>
                              {prot > 0 && <span className="text-[#666666]">P: {prot}g</span>}
                              {kh   > 0 && <span className="text-[#666666]">KH: {kh}g</span>}
                              {fett > 0 && <span className="text-[#666666]">F: {fett}g</span>}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <Link href={`${baseHref}?tab=ernaehrung`} className="flex items-center justify-between bg-[#141414] border border-[#2e2e2e] hover:border-[#3a3a3a] rounded-xl px-5 py-4 transition-colors group">
                    <div className="min-w-0">
                      <h3 className="text-[10px] font-mono font-semibold text-[#555555] uppercase tracking-widest mb-1">Ernährungsplan</h3>
                      <p className="text-sm text-[#2e2e2e]">Noch kein Plan.</p>
                    </div>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#2e2e2e] group-hover:text-[#444444] shrink-0 ml-3"><polyline points="9 18 15 12 9 6"/></svg>
                  </Link>
                )}
              </div>
            </CollapsibleSection>

          {/* 4. Gewichtsverlauf */}
            <CollapsibleSection title="Gewichtsverlauf" preview={prevEntwicklung}>
              <div>
                {gewichtsDaten.length >= 2 && (
                  <div className="mb-5">
                    <ErrorBoundary>
                      <GewichtsChart eintraege={gewichtsDaten} />
                    </ErrorBoundary>
                  </div>
                )}
                {gewichtsDaten.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm min-w-[280px]">
                      <thead>
                        <tr className="border-b border-[#1c1c1c]">
                          {['Datum', 'Gewicht', 'KF %'].map(h => (
                            <th key={h} className="pb-2 text-[10px] font-mono font-semibold text-[#555555] uppercase tracking-widest text-left">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1c1c1c]">
                        {[...gewichtsDaten].reverse().map((e, i) => (
                          <tr key={i}>
                            <td className="py-2.5 text-[#3a3a3a] text-xs">{D(e.datum)}</td>
                            <td className="py-2.5 font-semibold text-[#efefef]">{e.gewicht} kg</td>
                            <td className="py-2.5 text-[#666666] text-xs">{e.koerperfett != null ? `${e.koerperfett}%` : '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-[#2e2e2e]">Noch keine Gewichtsdaten.</p>
                )}
                <div className="mt-4 pt-3 border-t border-[#1c1c1c]">
                  <MessungForm clientId={params.id} />
                </div>
              </div>
            </CollapsibleSection>

          {/* 5. Nächste Termine */}
          {calcomResult.configured && upcomingTermine.length > 0 && (
            <CollapsibleSection title="Nächste Termine" badge={upcomingTermine.length} preview={prevTermine}>
                <ul className="divide-y divide-[#1c1c1c] -mx-4 -mb-4">
                    {upcomingTermine.slice(0, 3).map(e => {
                      const diff = Math.ceil((e.start.getTime() - Date.now()) / 86400000)
                      return (
                        <li key={e.uid} className="flex items-center justify-between gap-3 px-5 py-3 min-w-0">
                          <div className="min-w-0">
                            <p className="text-sm text-[#efefef] truncate">{e.title}</p>
                            <p className="text-xs text-[#444444] mt-0.5">
                              {e.start.toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: 'short', timeZone: 'Europe/Zurich' })}
                              {' · '}{e.start.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Zurich' })}
                            </p>
                          </div>
                          <span className="text-xs font-medium text-orange-400 shrink-0">
                            {diff === 0 ? 'Heute' : diff === 1 ? 'Morgen' : `in ${diff}T`}
                          </span>
                        </li>
                      )
                    })}
                </ul>
            </CollapsibleSection>
          )}

          {/* 6. Umsatz */}
          {clientRechnungen.length > 0 && (
            <CollapsibleSection title="Umsatz" preview={prevUmsatz}>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-[#141414] border border-[#1c1c1c] rounded-xl p-4">
                    <p className="text-[10px] font-mono font-semibold text-[#555555] uppercase tracking-widest mb-1.5">Gesamt bezahlt</p>
                    <p className="text-lg font-bold text-emerald-400">{CHF(clvTotal)}</p>
                    <p className="text-[10px] text-[#3a3a3a] mt-0.5">{clientRechnungen.filter(r => r.status === 'BEZAHLT').length} Rechnungen</p>
                  </div>
                  <div className="bg-[#141414] border border-[#1c1c1c] rounded-xl p-4">
                    <p className="text-[10px] font-mono font-semibold text-[#555555] uppercase tracking-widest mb-1.5">Ausstehend</p>
                    <p className={`text-lg font-bold ${offenTotal > 0 ? 'text-orange-400' : 'text-[#3a3a3a]'}`}>{offenTotal > 0 ? CHF(offenTotal) : '—'}</p>
                    <p className="text-[10px] text-[#3a3a3a] mt-0.5">{clientRechnungen.filter(r => r.status === 'OFFEN').length} offen</p>
                  </div>
                  <Link href={`${baseHref}?tab=rechnungen`} className="bg-[#141414] border border-[#1c1c1c] hover:border-[#2e2e2e] rounded-xl p-4 transition-colors">
                    <p className="text-[10px] font-mono font-semibold text-[#555555] uppercase tracking-widest mb-1.5">Klient seit</p>
                    <p className="text-lg font-bold text-[#efefef]">{monthsSince} Mo.</p>
                    <p className="text-[10px] text-[#3a3a3a] mt-0.5">Ø {CHF(monthsSince > 0 ? clvTotal / monthsSince : 0)}/Mo.</p>
                  </Link>
                </div>
            </CollapsibleSection>
          )}

          {/* 7. Stammdaten */}
            <CollapsibleSection title="Stammdaten" preview={prevStammdaten}>
              <Card title="Persönliche Daten">
                <Grid>
                  <Row label="Vorname" value={client.vorname} />
                  <Row label="Nachname" value={client.nachname} />
                  <dt className="text-[10px] text-[#3a3a3a] uppercase tracking-wide pt-0.5">E-Mail</dt>
                  <dd className="text-sm text-[#efefef] min-w-0 break-all">
                    {client.email ? <a href={`mailto:${client.email}`} className="hover:underline">{client.email}</a> : '—'}
                  </dd>
                  <Row label="Telefon" value={client.telefon} />
                  <Row label="Adresse" value={client.adresse} />
                  <Row label="Beruf" value={client.beruf} />
                  <Row label="Geburtsdatum" value={client.geburtsdatum ? D(client.geburtsdatum) : undefined} />
                  <Row label="Geschlecht" value={client.geschlecht ? GESCHLECHT_LABEL[client.geschlecht] : undefined} />
                  {clientBMI && <Row label="BMI" value={clientBMI} />}
                  {client.herkunft && <Row label="Herkunft" value={client.herkunft} />}
                </Grid>
              </Card>
            </CollapsibleSection>

          {/* 8. Anamnese */}
            <CollapsibleSection title="Anamnese" badge={client.anamnesen.length || undefined} preview={prevAnamnese}>
              <div className="space-y-4">
                {latest ? (
                  <div className="bg-[#141414] border border-[#2e2e2e] rounded-xl p-5 overflow-hidden">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xs font-semibold text-[#3a3a3a] uppercase tracking-wider">Letzte Anamnese · {D(latest.datum)}</h3>
                      <Link href={`${baseHref}?tab=anamnesen`} className="text-xs text-[#666666] hover:text-white transition-colors shrink-0 ml-2">Alle →</Link>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                      {latest.aktuellesGewicht != null && <span className="text-[#efefef] font-medium">{latest.aktuellesGewicht} kg</span>}
                      {latest.koerperfett != null && <span className="text-[#666666]">{latest.koerperfett}% KF</span>}
                      {latest.stressLevel != null && <span className="text-[#666666]">Stress {latest.stressLevel}/10</span>}
                      {latest.schlafStunden != null && <span className="text-[#666666]">{latest.schlafStunden}h Schlaf</span>}
                      {latest.wohlbefinden && <span className="text-[#666666]">Befinden: {latest.wohlbefinden}</span>}
                      {parseJsonArray(latest.ziele).length > 0 && <span className="text-[#666666]">Ziele: {parseJsonArray(latest.ziele).join(', ')}</span>}
                    </div>
                  </div>
                ) : (
                  <Link href={`${baseHref}?tab=anamnesen`} className="flex items-center justify-between bg-[#141414] border border-[#2e2e2e] hover:border-[#3a3a3a] rounded-xl px-5 py-4 transition-colors group">
                    <p className="text-sm text-[#2e2e2e]">Noch keine Anamnese vorhanden.</p>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#2e2e2e] group-hover:text-[#444444] shrink-0 ml-3"><polyline points="9 18 15 12 9 6"/></svg>
                  </Link>
                )}
                {latest && previous && <AnamneseVergleich alt={previous} neu={latest} />}
              </div>
            </CollapsibleSection>

        </div>
      )}

      {/* ANAMNESEN */}
      {tab === 'anamnesen' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-[#3a3a3a]">{client.anamnesen.length} {client.anamnesen.length === 1 ? 'Eintrag' : 'Einträge'}</p>
            <Link href={`${baseHref}/anamnese/neu`}
              className="bg-white hover:bg-[#e8e8e8] text-black text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
              + Neue Anamnese
            </Link>
          </div>

          {client.anamnesen.length === 0 ? (
            <div className="bg-[#141414] border border-[#2e2e2e] rounded-xl py-12 text-center">
              <p className="text-sm text-[#3a3a3a] mb-3">Noch keine Anamnese vorhanden.</p>
              <Link href={`${baseHref}/anamnese/neu`} className="text-sm text-white/60 hover:text-white transition-colors">
                Ersten Anamnesebogen hinzufügen →
              </Link>
            </div>
          ) : (
            client.anamnesen.map((a, idx) => (
              <AnamneseKarte key={a.id} anamnese={a} clientId={params.id} isLatest={idx === 0} />
            ))
          )}
        </div>
      )}

      {/* TRAINING */}
      {tab === 'training' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-[#3a3a3a]">{client.trainingsplaene.length} {client.trainingsplaene.length === 1 ? 'Plan' : 'Pläne'}</p>
            <Link href={`${baseHref}/training/neu`}
              className="bg-white hover:bg-[#e8e8e8] text-black text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
              + Neuer Trainingsplan
            </Link>
          </div>

          {client.trainingsplaene.length === 0 ? (
            <div className="bg-[#141414] border border-[#2e2e2e] rounded-xl py-12 text-center">
              <p className="text-sm text-[#3a3a3a] mb-3">Noch kein Trainingsplan vorhanden.</p>
              <Link href={`${baseHref}/training/neu`} className="text-sm text-white/60 hover:text-white transition-colors">
                Ersten Plan erstellen →
              </Link>
            </div>
          ) : (
            client.trainingsplaene.map(plan => (
              <TrainingsPlanKarte key={plan.id} plan={plan} clientId={params.id}
                clientEmail={client.email ?? null} clientVorname={client.vorname} />
            ))
          )}
        </div>
      )}

      {/* RECHNUNGEN */}
      {tab === 'rechnungen' && (
        <div className="space-y-4">
          <p className="text-xs text-[#3a3a3a]">
            {clientRechnungen.length} {clientRechnungen.length === 1 ? 'Rechnung' : 'Rechnungen'}
          </p>

          {clientRechnungen.length === 0 ? (
            <div className="bg-[#141414] border border-[#2e2e2e] rounded-xl py-12 text-center space-y-3">
              <p className="text-sm text-[#3a3a3a]">Noch keine Rechnungen vorhanden.</p>
              <Link href={`/rechnungen/neu?clientId=${params.id}`} className="inline-block text-sm text-white/60 hover:text-white transition-colors">
                Erste Rechnung erstellen →
              </Link>
            </div>
          ) : (
            <div className="bg-[#141414] border border-[#2e2e2e] rounded-xl">
              <ul className="divide-y divide-[#1c1c1c]">
                {clientRechnungen.map(r => {
                  return (
                    <li key={r.id} className="flex items-center gap-3 px-4 py-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-[#efefef]">{r.nummer}</p>
                          {r.betreff && <p className="text-xs text-[#555555] truncate">{r.betreff}</p>}
                        </div>
                        <p className="text-[10px] text-[#3a3a3a] mt-0.5">
                          {new Date(r.datum).toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                        </p>
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md shrink-0 ${RECHNUNG_STATUS_STYLE[r.status]}`}>
                        {RECHNUNG_STATUS_LABEL[r.status]}
                      </span>
                      {r.status === 'OFFEN' && r.faellig && new Date(r.faellig) < new Date() && (() => {
                        const days = Math.floor((Date.now() - new Date(r.faellig).getTime()) / 86400000)
                        return (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-md border shrink-0 bg-red-950/40 text-red-400 border-red-900/40">
                            {days}T überfällig
                          </span>
                        )
                      })()}
                      <span className="text-sm font-semibold text-[#efefef] shrink-0">{CHF(rBrutto(r))}</span>
                      <RechnungAktionen
                        rechnungId={r.id}
                        rechnungNr={r.nummer}
                        clientEmail={client.email ?? null}
                        clientVorname={client.vorname}
                        anrede={r.anrede}
                        status={r.status}
                      />
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* TERMINE */}
      {tab === 'termine' && (
        <div className="space-y-5">
          {/* Not configured */}
          {!calcomResult.configured && (
            <div className="bg-[#141414] border border-[#2e2e2e] rounded-xl px-5 py-8 text-center space-y-3">
              <p className="text-sm text-[#666666]">Cal.com ist noch nicht verbunden.</p>
              <Link href="/settings" className="inline-block text-xs text-[#666666] border border-[#2e2e2e] hover:bg-[#1c1c1c] px-4 py-2 rounded-lg transition-colors">
                In Einstellungen konfigurieren →
              </Link>
            </div>
          )}

          {/* Configured but client has no email */}
          {calcomResult.configured && !client.email && (
            <div className="bg-[#141414] border border-[#2e2e2e] rounded-xl px-5 py-6">
              <p className="text-sm text-[#666666]">Diesem Klienten ist keine E-Mail-Adresse hinterlegt.</p>
              <p className="text-xs text-[#3a3a3a] mt-1">Cal.com-Buchungen werden anhand der E-Mail-Adresse zugeordnet.</p>
            </div>
          )}

          {/* Error */}
          {calcomResult.configured && calcomResult.error && (
            <div className="bg-red-950/20 border border-red-900/30 rounded-xl px-5 py-4">
              <p className="text-sm text-red-400">Cal.com-Fehler: {calcomResult.error}</p>
            </div>
          )}

          {/* Upcoming */}
          {calcomResult.configured && client.email && !calcomResult.error && (
            <>
              <div>
                <h2 className="text-xs font-semibold text-[#3a3a3a] uppercase tracking-wider mb-3">
                  Kommende Termine · {upcomingTermine.length}
                </h2>
                {upcomingTermine.length === 0 ? (
                  <div className="bg-[#141414] border border-[#2e2e2e] rounded-xl px-5 py-6 text-center">
                    <p className="text-sm text-[#3a3a3a]">Keine kommenden Buchungen für {client.email}.</p>
                  </div>
                ) : (
                  <div className="bg-[#141414] border border-[#2e2e2e] rounded-xl overflow-hidden">
                    <ul className="divide-y divide-[#1c1c1c]">
                      {upcomingTermine.map(e => (
                        <li key={e.uid} className="flex">
                          <div className="w-16 shrink-0 flex flex-col items-center justify-center border-r border-[#1c1c1c] px-2 py-4">
                            <span className="text-[10px] font-medium text-[#444444] uppercase">
                              {e.start.toLocaleDateString('de-DE', { weekday: 'short', timeZone: 'Europe/Zurich' })}
                            </span>
                            <span className="text-xl font-bold text-[#efefef] leading-none mt-0.5">
                              {e.start.toLocaleDateString('de-DE', { day: '2-digit', timeZone: 'Europe/Zurich' })}
                            </span>
                            <span className="text-[9px] text-[#3a3a3a] mt-0.5">
                              {e.start.toLocaleDateString('de-DE', { month: 'short', timeZone: 'Europe/Zurich' })}
                            </span>
                          </div>
                          <div className="flex-1 px-4 py-3.5">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-medium text-[#efefef]">{e.title}</p>
                                <p className="text-xs text-[#666666] mt-0.5">
                                  {e.start.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Zurich' })}
                                  {' – '}
                                  {e.end.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Zurich' })}
                                </p>
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
                              <span className="text-xs text-orange-400 shrink-0 font-medium">
                                {(() => {
                                  const diff = Math.ceil((e.start.getTime() - Date.now()) / 86400000)
                                  if (diff === 0) return 'Heute'
                                  if (diff === 1) return 'Morgen'
                                  return `in ${diff} Tagen`
                                })()}
                              </span>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Past */}
              {pastTermine.length > 0 && (
                <div>
                  <h2 className="text-xs font-semibold text-[#3a3a3a] uppercase tracking-wider mb-3">
                    Vergangene Termine · {pastTermine.length}
                  </h2>
                  <div className="bg-[#141414] border border-[#2e2e2e] rounded-xl overflow-hidden opacity-70">
                    <ul className="divide-y divide-[#1c1c1c]">
                      {pastTermine.map(e => (
                        <li key={e.uid} className="flex">
                          <div className="w-16 shrink-0 flex flex-col items-center justify-center border-r border-[#1c1c1c] px-2 py-3">
                            <span className="text-[10px] font-medium text-[#444444] uppercase">
                              {e.start.toLocaleDateString('de-DE', { weekday: 'short', timeZone: 'Europe/Zurich' })}
                            </span>
                            <span className="text-lg font-bold text-[#666666] leading-none mt-0.5">
                              {e.start.toLocaleDateString('de-DE', { day: '2-digit', timeZone: 'Europe/Zurich' })}
                            </span>
                            <span className="text-[9px] text-[#3a3a3a] mt-0.5">
                              {e.start.toLocaleDateString('de-DE', { month: 'short', year: '2-digit', timeZone: 'Europe/Zurich' })}
                            </span>
                          </div>
                          <div className="flex-1 px-4 py-3">
                            <p className="text-sm text-[#666666]">{e.title}</p>
                            <p className="text-xs text-[#3a3a3a] mt-0.5">
                              {e.start.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Zurich' })}
                              {' – '}
                              {e.end.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Zurich' })}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* VERLAUF */}
      {tab === 'verlauf' && (
        <div className="space-y-1.5">
          {tl.length === 0 ? (
            <div className="bg-[#141414] border border-[#2e2e2e] rounded-xl py-12 text-center">
              <p className="text-sm text-[#3a3a3a]">Noch keine Aktivitäten vorhanden.</p>
            </div>
          ) : tl.map((item, i) => {
            async function handleRestore() {
              'use server'
              await restoreNotiz(item.notizId!, params.id)
            }
            const meta = TL_META[item.kind] ?? TL_META['notiz']
            const dateStr = item.date.toLocaleDateString('de-DE', {
              day: '2-digit', month: 'short',
              ...(item.date.getFullYear() !== now.getFullYear() ? { year: 'numeric' } : {}),
            })
            if (item.kind === 'deleted-notiz') {
              return (
                <div key={i} className="flex items-center gap-3 bg-[#141414] border border-[#1c1c1c] rounded-xl px-4 py-3 opacity-50">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${meta.dot}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[9px] font-semibold uppercase tracking-wide ${meta.text}`}>{meta.label}</span>
                      <span className="text-[10px] text-red-400/60 bg-red-950/20 px-1.5 py-0.5 rounded">[Gelöscht]</span>
                    </div>
                    <p className="text-sm text-[#3a3a3a] line-through truncate mt-0.5">{item.label}</p>
                    {item.sub && <p className="text-xs text-[#3a3a3a] mt-0.5 truncate line-through">{item.sub}</p>}
                  </div>
                  <span className="text-[10px] text-[#3a3a3a] shrink-0 whitespace-nowrap">{dateStr}</span>
                  <form action={handleRestore}>
                    <button type="submit" className="text-[10px] text-[#666666] border border-[#2e2e2e] hover:bg-[#1c1c1c] px-2 py-1 rounded-lg transition-colors whitespace-nowrap">
                      Wiederherstellen
                    </button>
                  </form>
                </div>
              )
            }
            return (
              <Link key={i} href={item.href!}
                className="flex items-center gap-3 bg-[#141414] border border-[#1c1c1c] hover:border-[#2e2e2e] hover:bg-[#1c1c1c] rounded-xl px-4 py-3 transition-all group">
                <div className={`w-2 h-2 rounded-full shrink-0 ${meta.dot}`} />
                <div className="flex-1 min-w-0">
                  <span className={`text-[9px] font-semibold uppercase tracking-wide ${meta.text}`}>{meta.label}</span>
                  <p className="text-sm text-[#efefef] truncate mt-0.5">{item.label}</p>
                  {item.sub && <p className="text-xs text-[#444444] mt-0.5 truncate">{item.sub}</p>}
                </div>
                <span className="text-[10px] text-[#3a3a3a] shrink-0 whitespace-nowrap">{dateStr}</span>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  className="text-[#2e2e2e] group-hover:text-[#444444] transition-colors shrink-0">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </Link>
            )
          })}
        </div>
      )}

      {/* ERNÄHRUNG */}
      {tab === 'ernaehrung' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-[#3a3a3a]">{client.ernaehrungsplaene.length} {client.ernaehrungsplaene.length === 1 ? 'Plan' : 'Pläne'}</p>
            <Link href={`${baseHref}/ernaehrung/neu`}
              className="bg-white hover:bg-[#e8e8e8] text-black text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
              + Neuer Ernährungsplan
            </Link>
          </div>

          {client.ernaehrungsplaene.length === 0 ? (
            <div className="bg-[#141414] border border-[#2e2e2e] rounded-xl py-12 text-center">
              <p className="text-sm text-[#3a3a3a] mb-3">Noch kein Ernährungsplan vorhanden.</p>
              <Link href={`${baseHref}/ernaehrung/neu`} className="text-sm text-white/60 hover:text-white transition-colors">
                Ersten Plan erstellen →
              </Link>
            </div>
          ) : (
            client.ernaehrungsplaene.map(plan => {
              async function handleDeletePlan() {
                'use server'
                await deleteErnaehrungsPlan(plan.id, params.id)
              }
              const totalKcal = plan.zeilen.reduce((s, z) => s + (z.kalorien ?? 0), 0)
              const totalProt = plan.zeilen.reduce((s, z) => s + (z.protein ?? 0), 0)
              const totalKH   = plan.zeilen.reduce((s, z) => s + (z.kohlenhydrate ?? 0), 0)
              const totalFett = plan.zeilen.reduce((s, z) => s + (z.fett ?? 0), 0)
              return (
                <div key={plan.id} className="bg-[#141414] border border-[#2e2e2e] rounded-xl p-5">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div>
                      <h3 className="text-sm font-semibold text-[#efefef]">{plan.name}</h3>
                      <p className="text-xs text-[#444444] mt-0.5">
                        {new Date(plan.datum).toLocaleDateString('de-DE')}
                        {plan.vorlage && ` · Vorlage: ${plan.vorlage.name}`}
                        {plan.notizen ? ` · ${plan.notizen}` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <a href={`/api/pdf/ernaehrung/${plan.id}`} download
                        className="text-xs text-[#666666] border border-[#2e2e2e] hover:bg-[#1c1c1c] px-2.5 py-1.5 rounded-lg transition-colors">
                        PDF
                      </a>
                      <Link href={`${baseHref}/ernaehrung/${plan.id}/bearbeiten`}
                        className="text-xs text-[#666666] border border-[#2e2e2e] hover:bg-[#1c1c1c] px-2.5 py-1.5 rounded-lg transition-colors">
                        Bearbeiten
                      </Link>
                      <form action={handleDeletePlan}>
                        <button type="submit"
                          className="text-xs text-[#3a3a3a] hover:text-red-500 hover:bg-[#1c0000] px-2.5 py-1.5 rounded-lg transition-colors">
                          Löschen
                        </button>
                      </form>
                    </div>
                  </div>

                  {plan.zeilen.length > 0 && (
                    <div className="overflow-x-auto mb-3">
                      <table className="w-full text-xs min-w-[360px]">
                        <thead>
                          <tr className="border-b border-[#1c1c1c]">
                            {['Zeitpunkt', 'Kcal', 'Protein', 'KH', 'Fett', 'Notiz'].map(h => (
                              <th key={h} className="pb-2 text-[10px] font-medium text-[#3a3a3a] uppercase tracking-wider text-left pr-3">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1c1c1c]">
                          {plan.zeilen.map(z => (
                            <tr key={z.id}>
                              <td className="py-1.5 text-[#efefef] pr-3">{z.zeitpunkt}</td>
                              <td className="py-1.5 text-[#666666] pr-3">{z.kalorien ?? '—'}</td>
                              <td className="py-1.5 text-[#666666] pr-3">{z.protein != null ? `${z.protein}g` : '—'}</td>
                              <td className="py-1.5 text-[#666666] pr-3">{z.kohlenhydrate != null ? `${z.kohlenhydrate}g` : '—'}</td>
                              <td className="py-1.5 text-[#666666] pr-3">{z.fett != null ? `${z.fett}g` : '—'}</td>
                              <td className="py-1.5 text-[#3a3a3a]">{z.notizen ?? '—'}</td>
                            </tr>
                          ))}
                          {/* Summary row */}
                          <tr className="border-t border-[#2e2e2e]">
                            <td className="py-1.5 text-[10px] text-[#3a3a3a] uppercase tracking-wide pr-3">Total</td>
                            <td className="py-1.5 text-[#efefef] font-medium pr-3">{totalKcal}</td>
                            <td className="py-1.5 text-[#efefef] font-medium pr-3">{totalProt}g</td>
                            <td className="py-1.5 text-[#efefef] font-medium pr-3">{totalKH}g</td>
                            <td className="py-1.5 text-[#efefef] font-medium pr-3">{totalFett}g</td>
                            <td></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
