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
  tableHead:   { flexDirection: 'row', backgroundColor: C.tableHeader, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 3, marginBottom: 2 },
  th:          { fontSize: 7, fontFamily: 'Helvetica-Bold', color: C.white, textTransform: 'uppercase', letterSpacing: 0.5 },
  row:         { flexDirection: 'row', paddingHorizontal: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.line },
  rowLast:     { flexDirection: 'row', paddingHorizontal: 10, paddingVertical: 8 },
  rowTotal:    { flexDirection: 'row', paddingHorizontal: 10, paddingVertical: 8, backgroundColor: C.bg, borderRadius: 3, marginTop: 4 },
  colZeit:     { width: '22%' },
  colNum:      { width: '13%', textAlign: 'right' },
  colNote:     { flex: 1 },
  cellZeit:    { fontSize: 10, color: C.dark },
  cellNum:     { fontSize: 10, color: C.mid, textAlign: 'right' },
  cellNote:    { fontSize: 9, color: C.light },
  totalZeit:   { fontSize: 9, fontFamily: 'Helvetica-Bold', color: C.mid, textTransform: 'uppercase', letterSpacing: 0.5 },
  totalNum:    { fontSize: 10, fontFamily: 'Helvetica-Bold', color: C.black, textAlign: 'right' },
  notesBox:    { marginTop: 24, padding: 14, backgroundColor: C.bg, borderRadius: 4, borderLeftWidth: 3, borderLeftColor: C.faint },
  notesLabel:  { fontSize: 7, fontFamily: 'Helvetica-Bold', color: C.light, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 5 },
  notesText:   { fontSize: 9, color: C.dark, lineHeight: 1.6 },
})

async function fetchData(planId: string) {
  return prisma.ernaehrungsPlan.findUnique({
    where: { id: planId },
    include: {
      client: { select: { vorname: true, nachname: true } },
      zeilen: { orderBy: { reihenfolge: 'asc' } },
    },
  })
}

type PlanData = NonNullable<Awaited<ReturnType<typeof fetchData>>>

function ErnaehrungPDF({ plan, logoData, praxis }: { plan: PlanData; logoData: string | null; praxis: PraxisConfig }) {
  const totalKcal = plan.zeilen.reduce((acc, z) => acc + (z.kalorien ?? 0), 0)
  const totalProt = plan.zeilen.reduce((acc, z) => acc + (z.protein ?? 0), 0)
  const totalKH   = plan.zeilen.reduce((acc, z) => acc + (z.kohlenhydrate ?? 0), 0)
  const totalFett = plan.zeilen.reduce((acc, z) => acc + (z.fett ?? 0), 0)

  return (
    <Document title={plan.name} subject={`Ernährungsplan – ${plan.client.vorname} ${plan.client.nachname}`}>
      <Page size="A4" style={base.page}>
        <View style={base.topStrip} fixed />
        <PdfHeader title="Ernährungsplan" date={formatDate(plan.datum)} logoData={logoData} praxisName={praxis.name} praxisSubtitle={praxis.subtitle} large />
        <View style={base.dividerBoldLg} />

        <View style={s.hero}>
          <Text style={s.planTitle}>{plan.name}</Text>
          <Text style={s.clientName}>{plan.client.vorname} {plan.client.nachname}</Text>
        </View>

        {plan.zeilen.length > 0 && (
          <View wrap={false}>
            <View style={s.tableHead}>
              <Text style={[s.th, s.colZeit]}>Zeitpunkt</Text>
              <Text style={[s.th, s.colNum]}>Kcal</Text>
              <Text style={[s.th, s.colNum]}>Protein</Text>
              <Text style={[s.th, s.colNum]}>KH</Text>
              <Text style={[s.th, s.colNum]}>Fett</Text>
              <Text style={[s.th, s.colNote]}>Notizen</Text>
            </View>
            {plan.zeilen.map((z, idx) => (
              <View key={z.id} style={idx === plan.zeilen.length - 1 ? s.rowLast : s.row}>
                <Text style={[s.cellZeit, s.colZeit]}>{z.zeitpunkt}</Text>
                <Text style={[s.cellNum, s.colNum]}>{z.kalorien ?? '—'}</Text>
                <Text style={[s.cellNum, s.colNum]}>{z.protein != null ? `${z.protein}g` : '—'}</Text>
                <Text style={[s.cellNum, s.colNum]}>{z.kohlenhydrate != null ? `${z.kohlenhydrate}g` : '—'}</Text>
                <Text style={[s.cellNum, s.colNum]}>{z.fett != null ? `${z.fett}g` : '—'}</Text>
                <Text style={[s.cellNote, s.colNote]}>{z.notizen ?? ''}</Text>
              </View>
            ))}
            <View style={s.rowTotal}>
              <Text style={[s.totalZeit, s.colZeit]}>Total</Text>
              <Text style={[s.totalNum, s.colNum]}>{totalKcal}</Text>
              <Text style={[s.totalNum, s.colNum]}>{totalProt}g</Text>
              <Text style={[s.totalNum, s.colNum]}>{totalKH}g</Text>
              <Text style={[s.totalNum, s.colNum]}>{totalFett}g</Text>
              <View style={s.colNote} />
            </View>
          </View>
        )}

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

export async function GET(_: Request, props: { params: Promise<{ planId: string }> }) {
  const params = await props.params;
  const session = await getServerSession(authOptions)
  if (!session) return new Response('Unauthorized', { status: 401 })

  const data = await fetchData(params.planId)
  if (!data) return new Response('Not found', { status: 404 })

  const logoData = getLogoData()
  const praxis = await getPraxisConfig()
  const stream = await renderToStream(<ErnaehrungPDF plan={data} logoData={logoData} praxis={praxis} />)
  const filename = `Ernaehrungsplan_${data.client.nachname}_${data.name.replace(/[^a-zA-Z0-9äöüÄÖÜß]/g, '_')}.pdf`
  return new Response(nodeStreamToWeb(stream), {
    headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="${filename}"` },
  })
}
