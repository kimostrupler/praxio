import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Document, Page, Text, View, StyleSheet, renderToStream } from '@react-pdf/renderer'
import { getLogoData } from '@/lib/logo'
import { C, base, formatDate, nodeStreamToWeb, praxisName, PdfHeader } from '@/lib/pdf'
import { parseJsonArray } from '@/lib/client-utils'

const s = StyleSheet.create({
  clientRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  clientName: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: C.black },
  badgeRow:   { flexDirection: 'row', gap: 4 },
  badge:      { fontSize: 7, fontFamily: 'Helvetica-Bold', color: C.mid, backgroundColor: C.bg, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 3 },
  section:    { marginBottom: 16 },
  secHead:    { fontSize: 7, fontFamily: 'Helvetica-Bold', color: C.orange, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6, paddingBottom: 4, borderBottomWidth: 1, borderBottomColor: C.line, borderLeftWidth: 2, borderLeftColor: C.orange, paddingLeft: 8 },
  grid:       { flexDirection: 'row', flexWrap: 'wrap' },
  cell:       { width: '50%', marginBottom: 6 },
  cellFull:   { width: '100%', marginBottom: 6 },
  label:      { fontSize: 7, color: C.light, marginBottom: 1.5, textTransform: 'uppercase', letterSpacing: 0.5 },
  value:      { fontSize: 9, color: C.black },
  tags:       { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  tag:        { fontSize: 7, color: C.mid, backgroundColor: C.bg, paddingHorizontal: 5, paddingVertical: 2, borderRadius: 3 },
})

function B(v: boolean | null | undefined) { return v === true ? 'Ja' : v === false ? 'Nein' : null }
function V(v: string | number | null | undefined, suf = '') { return (v != null && v !== '') ? `${v}${suf}` : null }

function Row({ label, value }: { label: string; value?: string | number | null }) {
  if (value == null || value === '') return null
  return (
    <View style={s.cell}>
      <Text style={s.label}>{label}</Text>
      <Text style={s.value}>{String(value)}</Text>
    </View>
  )
}

function RowFull({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <View style={s.cellFull}>
      <Text style={s.label}>{label}</Text>
      <Text style={s.value}>{value}</Text>
    </View>
  )
}

function Sec({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={s.section}>
      <Text style={s.secHead}>{title}</Text>
      <View style={s.grid}>{children}</View>
    </View>
  )
}

async function fetchData(id: string) {
  return prisma.anamnese.findUnique({
    where: { id },
    include: { client: { select: { vorname: true, nachname: true } } },
  })
}

type AnamneseData = NonNullable<Awaited<ReturnType<typeof fetchData>>>

function AnamnesesPDF({ a, logoData }: { a: AnamneseData; logoData: string | null }) {
  const client = a.client
  const bmiVal = a.aktuellesGewicht && a.groesse
    ? (a.aktuellesGewicht / Math.pow(a.groesse / 100, 2)).toFixed(1)
    : null
  const aZiele = parseJsonArray(a.ziele)
  const aEssgewohnheiten = parseJsonArray(a.essgewohnheiten)

  return (
    <Document title={`Anamnesebogen – ${client.vorname} ${client.nachname}`} author={praxisName}>
      <Page size="A4" style={base.page}>
        <View style={base.topStrip} fixed />
        <PdfHeader title="Anamnesebogen" date={formatDate(a.datum)} logoData={logoData} />
        <View style={base.dividerBold} />

        <View style={s.clientRow}>
          <Text style={s.clientName}>{client.vorname} {client.nachname}</Text>
          <View style={s.badgeRow}>
            {bmiVal && <Text style={s.badge}>BMI {bmiVal}</Text>}
            {a.aktuellesGewicht != null && <Text style={s.badge}>{a.aktuellesGewicht} kg</Text>}
            {a.koerperfett != null && <Text style={s.badge}>{a.koerperfett}% KF</Text>}
          </View>
        </View>

        {(aZiele.length > 0 || a.motivation) && (
          <Sec title="Ziele & Motivation">
            {aZiele.length > 0 && (
              <View style={s.cellFull}>
                <Text style={s.label}>Ziele</Text>
                <View style={s.tags}>
                  {aZiele.map(z => <Text key={z} style={s.tag}>{z}</Text>)}
                </View>
              </View>
            )}
            <Row label="Wichtigkeit (1–10)" value={a.zielWichtigkeit != null ? `${a.zielWichtigkeit}/10` : null} />
            <Row label="Bis wann" value={a.zielDatum} />
            <RowFull label="Motivation" value={a.motivation} />
            <RowFull label="Ziele sonstiges" value={a.zieleSonstiges} />
          </Sec>
        )}

        <Sec title="Körperdaten">
          <Row label="Größe"               value={V(a.groesse, ' cm')} />
          <Row label="Aktuelles Gewicht"   value={V(a.aktuellesGewicht, ' kg')} />
          <Row label="Gewicht vor 3 Mon."  value={V(a.gewichtVor3Monaten, ' kg')} />
          <Row label="Gewicht vor 1 Jahr"  value={V(a.gewichtVor1Jahr, ' kg')} />
          <Row label="Wunschgewicht"        value={V(a.wunschgewicht, ' kg')} />
          <Row label="Körperfettanteil"     value={V(a.koerperfett, ' %')} />
          <Row label="Taillenumfang"        value={V(a.taillenumfang, ' cm')} />
          <Row label="Gewicht verändert"    value={B(a.gewichtVeraendert)} />
          <RowFull label="Wie verändert"   value={a.gewichtVeraendert ? a.gewichtVeraendertWie : null} />
          <RowFull label="Sonstige Maße"   value={a.sonstigeMasse} />
        </Sec>

        <Sec title="Ernährung">
          <Row label="Selbsteinschätzung"    value={a.ernaehrungBewertung} />
          <Row label="Mahlzeiten / Tag"      value={a.mahlzeitenProTag} />
          <Row label="Wasser"               value={V(a.wasserLiter, ' L/Tag')} />
          <Row label="Kaffee"               value={V(a.kaffeeTassen, ' Tassen/Tag')} />
          <Row label="Alkohol"              value={V(a.alkoholPortionen, ' Port./Woche')} />
          <Row label="Softdrinks"           value={V(a.softdrinksLiter, ' L/Tag')} />
          <Row label="Ernährungstagebuch"   value={B(a.ernaehrungstagebuch)} />
          {aEssgewohnheiten.length > 0 && <RowFull label="Essgewohnheiten" value={aEssgewohnheiten.join(', ')} />}
          {a.lebensmittelUnvertraeglichkeit && <RowFull label="Unverträglichkeiten" value={a.lebensmittelUnvertraeglichkeitWelche} />}
        </Sec>

        <View style={base.footer} fixed>
          <Text style={base.footerText}>{praxisName} · Anamnesebogen · {client.vorname} {client.nachname}</Text>
          <Text style={base.footerText} render={({ pageNumber, totalPages }) => `Seite ${pageNumber} von ${totalPages}`} />
        </View>
      </Page>

      <Page size="A4" style={base.page}>
        <View style={base.topStrip} fixed />
        <PdfHeader title="Anamnesebogen" date={`${client.vorname} ${client.nachname} · ${formatDate(a.datum)}`} logoData={logoData} />
        <View style={base.dividerBold} />

        <Sec title="Alltag & Lifestyle">
          <Row label="Arbeitstag"         value={a.arbeitstag} />
          <Row label="Freizeitaktivität"  value={a.freizeitAktivitaet} />
          <Row label="Sport / Woche"      value={a.sportProWoche != null ? `${a.sportProWoche}×` : null} />
          <Row label="Sportart"           value={a.sportArt} />
          <Row label="Schritte / Tag"     value={a.schritte} />
          <Row label="Raucher"            value={B(a.raucher)} />
          {a.raucher && <Row label="Menge" value={a.raucherMenge} />}
        </Sec>

        <Sec title="Schlaf">
          <Row label="Stunden / Nacht"  value={V(a.schlafStunden, ' h')} />
          <Row label="Qualität"         value={a.schlafQualitaet} />
          <Row label="Schlafprobleme"   value={B(a.schlafProbleme)} />
          {a.schlafProbleme && <RowFull label="Welche" value={a.schlafProblemeWelche} />}
        </Sec>

        <Sec title="Stress & Wohlbefinden">
          <Row label="Stresslevel"        value={a.stressLevel != null ? `${a.stressLevel} / 10` : null} />
          <Row label="Allg. Wohlbefinden" value={a.wohlbefinden} />
          <RowFull label="Stressfaktoren"    value={a.stressfaktoren} />
          <RowFull label="Stressbewältigung" value={a.stressBewaeltigung} />
        </Sec>

        <Sec title="Gesundheit">
          <Row label="Erkrankungen"        value={B(a.erkrankungen)} />
          {a.erkrankungen && <RowFull label="Welche Erkrankungen" value={a.erkrankungenWelche} />}
          <Row label="Medikamente / NEM"   value={B(a.medikamente)} />
          {a.medikamente && <RowFull label="Welche" value={a.medikamenteWelche} />}
          <Row label="Operationen"         value={B(a.operationen)} />
          {a.operationen && <RowFull label="Wann & welche" value={a.operationenWann} />}
          <RowFull label="Sonstige Informationen" value={a.sonstigeInfos} />
        </Sec>

        <View style={base.footer} fixed>
          <Text style={base.footerText}>{praxisName} · Anamnesebogen · {client.vorname} {client.nachname}</Text>
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
  const stream = await renderToStream(<AnamnesesPDF a={data} logoData={logoData} />)
  const name = `Anamnesebogen_${data.client.nachname}_${formatDate(data.datum).replace(/\./g, '-')}.pdf`
  return new Response(nodeStreamToWeb(stream), {
    headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="${name}"` },
  })
}
