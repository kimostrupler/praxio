import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Document, Page, Text, View, StyleSheet, renderToStream } from '@react-pdf/renderer'
import { getLogoData } from '@/lib/logo'
import { C, base, formatDate, nodeStreamToWeb, PdfHeader } from '@/lib/pdf'
import { getPraxisConfig, type PraxisConfig } from '@/lib/praxis'

const s = StyleSheet.create({
  hero:        { marginBottom: 24 },
  planTitle:   { fontSize: 22, fontFamily: 'Helvetica-Bold', color: C.black, marginBottom: 5, lineHeight: 1.2 },
  clientName:  { fontSize: 11, color: C.mid },
  exCard:      { paddingVertical: 12 },
  exSep:       { borderTopWidth: 1, borderTopColor: C.line },
  exRow:       { flexDirection: 'row', alignItems: 'flex-start' },
  exNumWrap:   { width: 28, paddingTop: 1 },
  exNum:       { fontSize: 10, fontFamily: 'Helvetica-Bold', color: C.faint },
  exBody:      { flex: 1, paddingRight: 12 },
  exName:      { fontSize: 11, fontFamily: 'Helvetica-Bold', color: C.black, marginBottom: 2 },
  exKat:       { fontSize: 8, color: C.light, marginBottom: 3, textTransform: 'uppercase', letterSpacing: 0.5 },
  exDesc:      { fontSize: 8, color: C.mid, lineHeight: 1.5 },
  exNote:      { fontSize: 8, color: C.mid, fontFamily: 'Helvetica-Oblique', marginTop: 3 },
  exStats:     { flexDirection: 'column', alignItems: 'flex-end', minWidth: 80 },
  exStatMain:  { fontSize: 13, fontFamily: 'Helvetica-Bold', color: C.black },
  exStatSub:   { fontSize: 8, color: C.light, marginTop: 2, textAlign: 'right' },
  notesBox:    { marginTop: 24, padding: 14, backgroundColor: C.bg, borderRadius: 4, borderLeftWidth: 3, borderLeftColor: C.faint },
  notesLabel:  { fontSize: 7, fontFamily: 'Helvetica-Bold', color: C.light, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 5 },
  notesText:   { fontSize: 9, color: C.dark, lineHeight: 1.6 },
})

async function fetchData(id: string) {
  return prisma.trainingsPlan.findUnique({
    where: { id },
    include: {
      client: { select: { vorname: true, nachname: true } },
      uebungen: {
        orderBy: { reihenfolge: 'asc' },
        include: { uebung: { select: { name: true, kategorie: true, beschreibung: true } } },
      },
    },
  })
}

type PlanData = NonNullable<Awaited<ReturnType<typeof fetchData>>>

function PlanPDF({ plan, logoData, praxis }: { plan: PlanData; logoData: string | null; praxis: PraxisConfig }) {
  return (
    <Document title={plan.name} subject={`Trainingsplan – ${plan.client.vorname} ${plan.client.nachname}`}>
      <Page size="A4" style={base.page}>
        <View style={base.topStrip} fixed />
        <PdfHeader title="Trainingsplan" date={formatDate(plan.datum)} logoData={logoData} praxisName={praxis.name} praxisSubtitle={praxis.subtitle} large />
        <View style={base.dividerBoldLg} />

        <View style={s.hero}>
          <Text style={s.planTitle}>{plan.name}</Text>
          <Text style={s.clientName}>{plan.client.vorname} {plan.client.nachname}</Text>
        </View>

        {plan.uebungen.map((u, idx) => {
          const setsReps = u.saetze && u.wiederholungen ? `${u.saetze} × ${u.wiederholungen}` : u.saetze ? `${u.saetze} Sätze` : null
          const pauseStr = u.pause ? `${u.pause}s Pause` : null
          const durStr   = u.dauer ? `${u.dauer}s` : null
          return (
            <View key={u.id} style={idx > 0 ? [s.exCard, s.exSep] : s.exCard} wrap={false}>
              <View style={s.exRow}>
                <View style={s.exNumWrap}>
                  <Text style={s.exNum}>{String(idx + 1).padStart(2, '0')}</Text>
                </View>
                <View style={s.exBody}>
                  <Text style={s.exName}>{u.uebung.name}</Text>
                  <Text style={s.exKat}>{u.uebung.kategorie}</Text>
                  {u.uebung.beschreibung ? <Text style={s.exDesc}>{u.uebung.beschreibung}</Text> : null}
                  {u.notizen ? <Text style={s.exNote}>Hinweis: {u.notizen}</Text> : null}
                </View>
                <View style={s.exStats}>
                  {setsReps && <Text style={s.exStatMain}>{setsReps}</Text>}
                  {pauseStr && <Text style={s.exStatSub}>{pauseStr}</Text>}
                  {durStr   && <Text style={s.exStatSub}>{durStr}</Text>}
                  {!setsReps && !pauseStr && <Text style={s.exStatMain}>—</Text>}
                </View>
              </View>
            </View>
          )
        })}

        {plan.notizen && (
          <View style={s.notesBox}>
            <Text style={s.notesLabel}>Hinweise</Text>
            <Text style={s.notesText}>{plan.notizen}</Text>
          </View>
        )}

        <View style={base.footer} fixed>
          <Text style={base.footerText}>{plan.client.vorname} {plan.client.nachname} · {plan.name}</Text>
          <Text style={base.footerText} render={({ pageNumber, totalPages }) => `Seite ${pageNumber} von ${totalPages}`} />
        </View>
      </Page>
    </Document>
  )
}

export async function GET(_: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await getServerSession(authOptions)
  if (!session) return new Response('Unauthorized', { status: 401 })

  const data = await fetchData(params.id)
  if (!data) return new Response('Not found', { status: 404 })

  const logoData = getLogoData()
  const praxis = await getPraxisConfig()
  const stream = await renderToStream(<PlanPDF plan={data} logoData={logoData} praxis={praxis} />)
  const filename = `Trainingsplan_${data.client.nachname}_${data.name.replace(/[^a-zA-Z0-9äöüÄÖÜß]/g, '_')}.pdf`
  return new Response(nodeStreamToWeb(stream), {
    headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="${filename}"` },
  })
}
