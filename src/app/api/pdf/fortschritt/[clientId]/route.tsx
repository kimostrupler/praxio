import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Document, Page, Text, View, StyleSheet, renderToStream } from '@react-pdf/renderer'
import { getLogoData } from '@/lib/logo'
import { C, base, formatDate, nodeStreamToWeb, PdfHeader } from '@/lib/pdf'
import { getPraxisConfig, type PraxisConfig } from '@/lib/praxis'
import { buildGewichtsDaten, parseJsonArray } from '@/lib/client-utils'

const s = StyleSheet.create({
  section:     { marginBottom: 20 },
  secHead:     { fontSize: 7, fontFamily: 'Helvetica-Bold', color: C.orange, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8, paddingBottom: 4, borderBottomWidth: 1, borderBottomColor: C.line, borderLeftWidth: 2, borderLeftColor: C.orange, paddingLeft: 8 },
  row:         { flexDirection: 'row', marginBottom: 5 },
  rowLabel:    { width: 120, fontSize: 8, color: C.light, textTransform: 'uppercase', letterSpacing: 0.4 },
  rowVal:      { flex: 1, fontSize: 9, color: C.black, fontFamily: 'Helvetica-Bold' },
  diffPos:     { flex: 1, fontSize: 9, color: '#d97706', fontFamily: 'Helvetica-Bold' },
  diffNeg:     { flex: 1, fontSize: 9, color: '#059669', fontFamily: 'Helvetica-Bold' },
  tableHead:   { flexDirection: 'row', backgroundColor: C.tableHeader, paddingHorizontal: 8, paddingVertical: 6, borderRadius: 3, marginBottom: 2 },
  tableRow:    { flexDirection: 'row', paddingHorizontal: 8, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: C.line },
  tableAlt:    { backgroundColor: C.bg },
  th:          { fontSize: 7, fontFamily: 'Helvetica-Bold', color: C.white, textTransform: 'uppercase', letterSpacing: 0.4 },
  td:          { fontSize: 8, color: C.dark },
  tdBold:      { fontSize: 9, color: C.black, fontFamily: 'Helvetica-Bold' },
  tag:         { fontSize: 7, backgroundColor: C.bg, paddingHorizontal: 5, paddingVertical: 2, borderRadius: 3, marginRight: 4 },
  tagRow:      { flexDirection: 'row', flexWrap: 'wrap', marginTop: 2 },
  healthGrid:  { flexDirection: 'row', flexWrap: 'wrap' },
  healthItem:  { width: '50%', marginBottom: 6 },
  healthLabel: { fontSize: 7, color: C.light, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 1 },
  healthVal:   { fontSize: 9, color: C.black, fontFamily: 'Helvetica-Bold' },
})

function bmi(w: number | null, h: number | null) {
  if (!w || !h) return null
  return (w / Math.pow(h / 100, 2)).toFixed(1)
}

function diffVal(a: number | null | undefined, b: number | null | undefined, unit: string, lowerIsBetter = false) {
  if (a == null || b == null) return null
  const diff = b - a
  if (diff === 0) return null
  const label = (diff > 0 ? '+' : '') + diff.toFixed(1) + unit
  return { label, improved: lowerIsBetter ? diff < 0 : diff > 0 }
}

async function fetchData(clientId: string) {
  return prisma.client.findUnique({
    where: { id: clientId },
    include: {
      anamnesen: { orderBy: { datum: 'asc' } },
      messungen: { orderBy: { datum: 'desc' }, take: 10 },
      ziele:     { orderBy: { createdAt: 'asc' } },
      notizen:   { where: { deletedAt: null }, orderBy: { createdAt: 'desc' }, take: 5 },
    },
  })
}

type ClientData = NonNullable<Awaited<ReturnType<typeof fetchData>>>

function FortschrittPDF({ client, logoData, praxis }: { client: ClientData; logoData: string | null; praxis: PraxisConfig }) {
  const first  = client.anamnesen[0]
  const latest = client.anamnesen[client.anamnesen.length - 1]
  const hasTwo = client.anamnesen.length >= 2 && first?.id !== latest?.id

  const gewichtsDaten = buildGewichtsDaten(client.anamnesen, client.messungen)

  const gwDiff = gewichtsDaten.length >= 2
    ? gewichtsDaten[gewichtsDaten.length - 1].gewicht - gewichtsDaten[0].gewicht
    : null

  return (
    <Document title={`Fortschrittsbericht – ${client.vorname} ${client.nachname}`}>
      <Page size="A4" style={base.page}>
        <View style={base.topStrip} fixed />
        <PdfHeader title="Fortschrittsbericht" date={formatDate(new Date())} logoData={logoData} praxisName={praxis.name} praxisSubtitle={praxis.subtitle} />
        <View style={base.dividerBold} />

        <Text style={base.clientName}>{client.vorname} {client.nachname}</Text>
        <Text style={base.clientSub}>
          Klient seit {formatDate(client.createdAt)}
          {client.email ? ` · ${client.email}` : ''}
          {client.telefon ? ` · ${client.telefon}` : ''}
        </Text>

        {latest && (
          <View style={s.section}>
            <Text style={s.secHead}>
              {hasTwo
                ? `Anamnese-Vergleich — ${formatDate(first.datum)} → ${formatDate(latest.datum)}`
                : `Aktuelle Anamnese — ${formatDate(latest.datum)}`}
            </Text>

            {[
              { label: 'Gewicht',       aVal: first?.aktuellesGewicht, bVal: latest.aktuellesGewicht, unit: ' kg', lower: true },
              { label: 'Körperfett',    aVal: first?.koerperfett,      bVal: latest.koerperfett,      unit: ' %',  lower: true },
              { label: 'Taillenumfang', aVal: first?.taillenumfang,    bVal: latest.taillenumfang,    unit: ' cm', lower: true },
              { label: 'Stresslevel',   aVal: first?.stressLevel,      bVal: latest.stressLevel,      unit: '/10', lower: true },
              { label: 'Schlaf',        aVal: first?.schlafStunden,    bVal: latest.schlafStunden,    unit: ' h',  lower: false },
            ].map(row => {
              const diff       = hasTwo ? diffVal(row.aVal, row.bVal, row.unit, row.lower) : null
              const displayVal = row.bVal != null ? `${row.bVal}${row.unit}` : '—'
              return (
                <View key={row.label} style={s.row}>
                  <Text style={s.rowLabel}>{row.label}</Text>
                  <Text style={s.rowVal}>{hasTwo && row.aVal != null ? `${row.aVal}${row.unit}` : displayVal}</Text>
                  {hasTwo && <Text style={s.rowVal}>{row.bVal != null ? `${row.bVal}${row.unit}` : '—'}</Text>}
                  {diff && <Text style={diff.improved ? s.diffNeg : s.diffPos}>{diff.label}</Text>}
                  {!diff && hasTwo && <Text style={s.rowVal} />}
                </View>
              )
            })}

            {latest.aktuellesGewicht != null && latest.groesse != null && (
              <View style={s.row}>
                <Text style={s.rowLabel}>BMI</Text>
                {hasTwo ? (
                  <>
                    <Text style={s.rowVal}>
                      {first.aktuellesGewicht != null && first.groesse != null ? bmi(first.aktuellesGewicht, first.groesse) : '—'}
                    </Text>
                    <Text style={s.rowVal}>{bmi(latest.aktuellesGewicht, latest.groesse)}</Text>
                    <Text style={s.rowVal} />
                  </>
                ) : (
                  <Text style={s.rowVal}>{bmi(latest.aktuellesGewicht, latest.groesse)}</Text>
                )}
              </View>
            )}

            {parseJsonArray(latest.ziele).length > 0 && (
              <View style={{ marginTop: 8 }}>
                <Text style={[s.rowLabel, { marginBottom: 4 }]}>Ziele</Text>
                <View style={s.tagRow}>
                  {parseJsonArray(latest.ziele).map(z => <Text key={z} style={s.tag}>{z}</Text>)}
                </View>
              </View>
            )}
          </View>
        )}

        {latest && (
          <View style={s.section}>
            <Text style={s.secHead}>Gesundheitsdaten ({formatDate(latest.datum)})</Text>
            <View style={s.healthGrid}>
              {([
                { label: 'Ernährungsbewertung', val: latest.ernaehrungBewertung },
                { label: 'Sport / Woche',        val: latest.sportProWoche != null ? `${latest.sportProWoche}x` : null },
                { label: 'Wohlbefinden',         val: latest.wohlbefinden },
                { label: 'Schlafqualität',        val: latest.schlafQualitaet },
                { label: 'Schlafstunden',         val: latest.schlafStunden != null ? `${latest.schlafStunden}h` : null },
                { label: 'Wasser (L)',            val: latest.wasserLiter != null ? `${latest.wasserLiter}L` : null },
                { label: 'Mahlzeiten/Tag',        val: latest.mahlzeitenProTag != null ? `${latest.mahlzeitenProTag}` : null },
                { label: 'Arbeitstag',            val: latest.arbeitstag },
                { label: 'Sport',                 val: latest.sportArt },
                { label: 'Motivation',            val: latest.motivation },
                { label: 'Stressfaktoren',        val: latest.stressfaktoren },
                { label: 'Erkrankungen',          val: latest.erkrankungen ? (latest.erkrankungenWelche ?? 'Ja') : null },
                { label: 'Medikamente',           val: latest.medikamente ? (latest.medikamenteWelche ?? 'Ja') : null },
                { label: 'Operationen',           val: latest.operationen ? (latest.operationenWann ?? 'Ja') : null },
                { label: 'Raucher',               val: latest.raucher ? (latest.raucherMenge ?? 'Ja') : null },
                { label: 'Beruf',                 val: client.beruf },
              ] as { label: string; val: string | number | null | undefined }[])
                .filter(item => item.val != null && item.val !== '')
                .map(item => (
                  <View key={item.label} style={s.healthItem}>
                    <Text style={s.healthLabel}>{item.label}</Text>
                    <Text style={s.healthVal}>{String(item.val)}</Text>
                  </View>
                ))
              }
            </View>
            {latest.sonstigeInfos && (
              <View style={{ marginTop: 8 }}>
                <Text style={s.healthLabel}>Sonstige Infos</Text>
                <Text style={[s.td, { marginTop: 2 }]}>{latest.sonstigeInfos}</Text>
              </View>
            )}
          </View>
        )}

        {gewichtsDaten.length > 0 && (
          <View style={s.section} wrap={false}>
            <Text style={s.secHead}>Gewichtsverlauf ({gewichtsDaten.length} {gewichtsDaten.length === 1 ? 'Eintrag' : 'Einträge'})</Text>
            <View style={s.tableHead}>
              <Text style={[s.th, { width: 100 }]}>Datum</Text>
              <Text style={[s.th, { width: 80 }]}>Gewicht</Text>
              <Text style={[s.th, { flex: 1 }]}>KF %</Text>
            </View>
            {gewichtsDaten.map((e, i) => (
              <View key={i} style={[s.tableRow, i % 2 === 1 ? s.tableAlt : {}]} wrap={false}>
                <Text style={[s.td, { width: 100 }]}>{formatDate(e.datum)}</Text>
                <Text style={[s.tdBold, { width: 80 }]}>{e.gewicht} kg</Text>
                <Text style={[s.td, { flex: 1 }]}>{e.koerperfett != null ? `${e.koerperfett}%` : '—'}</Text>
              </View>
            ))}
            {gwDiff != null && (
              <View style={{ marginTop: 6, flexDirection: 'row', gap: 8 }}>
                <Text style={s.rowLabel}>Gesamtveränderung</Text>
                <Text style={gwDiff < 0 ? s.diffNeg : gwDiff > 0 ? s.diffPos : s.td}>
                  {(gwDiff > 0 ? '+' : '') + gwDiff.toFixed(1)} kg
                  {' '}({formatDate(gewichtsDaten[0].datum)} → {formatDate(gewichtsDaten[gewichtsDaten.length - 1].datum)})
                </Text>
              </View>
            )}
          </View>
        )}

        {client.ziele.length > 0 && (
          <View style={s.section}>
            <Text style={s.secHead}>Ziele</Text>
            {client.ziele.map(z => (
              <View key={z.id} style={[s.row, { marginBottom: 3 }]}>
                <Text style={[s.rowLabel, { width: 80 }]}>{z.erreicht ? '✓ Erreicht' : 'Offen'}</Text>
                <Text style={[s.rowVal, { flex: 1 }]}>
                  {z.titel}{z.zielwert != null ? ` — ${z.zielwert} ${z.einheit ?? ''}`.trimEnd() : ''}
                </Text>
              </View>
            ))}
          </View>
        )}

        {client.notizen.length > 0 && (
          <View style={s.section}>
            <Text style={s.secHead}>Letzte Notizen</Text>
            {client.notizen.map(n => (
              <View key={n.id} style={{ marginBottom: 8 }}>
                <View style={[s.row, { marginBottom: 2 }]}>
                  {n.kategorie && <Text style={[s.td, { marginRight: 8, color: C.mid }]}>{n.kategorie}</Text>}
                  <Text style={[s.td, { color: C.light }]}>{formatDate(n.datum)}</Text>
                </View>
                <Text style={[s.td, { lineHeight: 1.4 }]}>{n.inhalt.slice(0, 200)}{n.inhalt.length > 200 ? '…' : ''}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={base.footer} fixed>
          <Text style={base.footerText}>Fortschrittsbericht · {client.vorname} {client.nachname}</Text>
          <Text style={base.footerText} render={({ pageNumber, totalPages }) => `Seite ${pageNumber} von ${totalPages}`} />
        </View>
      </Page>
    </Document>
  )
}

export async function GET(_: Request, props: { params: Promise<{ clientId: string }> }) {
  const params = await props.params;
  const session = await getServerSession(authOptions)
  if (!session) return new Response('Unauthorized', { status: 401 })

  const data = await fetchData(params.clientId)
  if (!data) return new Response('Not found', { status: 404 })

  const logoData = getLogoData()
  const praxis = await getPraxisConfig()
  const stream = await renderToStream(<FortschrittPDF client={data} logoData={logoData} praxis={praxis} />)
  const name = `Fortschritt_${data.nachname}_${data.vorname.replace(/\s/g, '_')}.pdf`
  return new Response(nodeStreamToWeb(stream), {
    headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="${name}"` },
  })
}
