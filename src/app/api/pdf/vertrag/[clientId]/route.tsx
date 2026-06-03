import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Document, Page, Text, View, StyleSheet, Image, renderToStream } from '@react-pdf/renderer'
import { getLogoData } from '@/lib/logo'
import { nodeStreamToWeb } from '@/lib/pdf'
import { praxisName, praxisSubtitle, praxisAdresse, praxisEmail, praxisTel } from '@/lib/praxis'
import fs from 'fs'
import path from 'path'

// ── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  black:  '#111111',
  dark:   '#2d2d2d',
  body:   '#444444',
  mid:    '#777777',
  light:  '#a0a0a0',
  faint:  '#cccccc',
  line:   '#f0ede8',
  bg:     '#fdf9f5',
  white:  '#ffffff',
  accent: '#bba282',   // warm orange — visible on white
}

const s = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    backgroundColor: C.white,
    paddingTop: 44,
    paddingBottom: 36,
    paddingHorizontal: 52,
  },

  // Top strip
  topStrip: { position: 'absolute', top: 0, left: 0, right: 0, height: 4, backgroundColor: C.accent },

  // ── Header ──────────────────────────────────────────────────────────────────
  header:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12 },
  brand:     { fontSize: 15, fontFamily: 'Helvetica-Bold', color: C.black, letterSpacing: 0.3 },
  brandSub:  { fontSize: 7.5, color: C.light, marginTop: 2 },
  docRight:  { alignItems: 'flex-end' },
  docTitle:  { fontSize: 18, fontFamily: 'Helvetica-Bold', color: C.black },
  docDate:   { fontSize: 7.5, color: C.mid, marginTop: 2, textAlign: 'right' },
  divider:   { borderBottomWidth: 1.5, borderBottomColor: C.black, marginBottom: 16 },

  // ── Parties ─────────────────────────────────────────────────────────────────
  parties:     { flexDirection: 'row', gap: 12, marginBottom: 14 },
  partyBox:    { flex: 1, borderRadius: 4, borderWidth: 1, borderColor: C.line, backgroundColor: C.bg, padding: 10 },
  partyRole:   { fontSize: 6.5, fontFamily: 'Helvetica-Bold', color: C.mid, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 },
  partyName:   { fontSize: 10, fontFamily: 'Helvetica-Bold', color: C.black, marginBottom: 2 },
  partyLine:   { fontSize: 7.5, color: C.body, marginBottom: 1, lineHeight: 1.4 },

  thinLine: { borderBottomWidth: 0.5, borderBottomColor: C.line, marginBottom: 12, marginTop: 2 },

  // ── Sections ────────────────────────────────────────────────────────────────
  section:   { marginBottom: 10 },
  secRow:    { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  secBar:    { width: 2.5, height: 10, backgroundColor: C.accent, borderRadius: 1, marginRight: 6 },
  secNum:    { fontSize: 6.5, fontFamily: 'Helvetica-Bold', color: C.accent, marginRight: 3 },
  secTitle:  { fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.black, textTransform: 'uppercase', letterSpacing: 0.3 },
  secBody:   { fontSize: 8, color: C.body, lineHeight: 1.55, paddingLeft: 8.5 },

  // ── Signature ───────────────────────────────────────────────────────────────
  sigNote:  { fontSize: 7.5, color: C.mid, marginTop: 14, marginBottom: 16, lineHeight: 1.5 },
  sigRow:   { flexDirection: 'row', gap: 24 },
  sigBox:   { flex: 1 },
  sigSpace: { height: 32 },
  sigLine:  { borderBottomWidth: 0.75, borderBottomColor: C.faint, marginBottom: 4 },
  sigName:  { fontSize: 7, fontFamily: 'Helvetica-Bold', color: C.mid },
  sigLabel: { fontSize: 7, color: C.light },

  // ── Footer ──────────────────────────────────────────────────────────────────
  footer:     { position: 'absolute', bottom: 20, left: 52, right: 52, borderTopWidth: 0.5, borderTopColor: C.line, paddingTop: 6, flexDirection: 'row', justifyContent: 'space-between' },
  footerText: { fontSize: 6.5, color: C.faint },
})

function D(d: Date) {
  return d.toLocaleDateString('de-CH', { day: '2-digit', month: 'long', year: 'numeric' })
}
function Ds(d: Date) {
  return d.toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function Sec({ num, title, text }: { num: string; title: string; text: string }) {
  return (
    <View style={s.section}>
      <View style={s.secRow}>
        <View style={s.secBar} />
        <Text style={s.secNum}>§{num}</Text>
        <Text style={s.secTitle}>{title}</Text>
      </View>
      <Text style={s.secBody}>{text}</Text>
    </View>
  )
}

async function fetchClient(id: string) {
  return prisma.client.findUnique({
    where: { id },
    select: { vorname: true, nachname: true, email: true, telefon: true, adresse: true },
  })
}


function VertragPDF({ client, leistungen, datum, logoData }: {
  client: NonNullable<Awaited<ReturnType<typeof fetchClient>>>
  leistungen: string
  datum: Date
  logoData: string | null
}) {
  return (
    <Document title={`Coaching-Vertrag – ${client.vorname} ${client.nachname}`} author={praxisName}>
      <Page size="A4" style={s.page}>
        <View style={s.topStrip} fixed />

        {/* ── Header ── */}
        <View style={s.header}>
          <View>
            {logoData
              ? <Image src={logoData} style={{ height: 38, objectFit: 'contain' }} />
              : <>
                  <Text style={s.brand}>{praxisName}</Text>
                  <Text style={s.brandSub}>{praxisSubtitle}</Text>
                </>
            }
          </View>
          <View style={s.docRight}>
            <Text style={s.docTitle}>Coaching-Vertrag</Text>
            <Text style={s.docDate}>{D(datum)}</Text>
          </View>
        </View>
        <View style={s.divider} />

        {/* ── Parties ── */}
        <View style={s.parties}>
          <View style={s.partyBox}>
            <Text style={s.partyRole}>Klientin · Auftraggeber</Text>
            <Text style={s.partyName}>{client.vorname} {client.nachname}</Text>
            {client.adresse ? client.adresse.split('\n').map((l, i) => <Text key={i} style={s.partyLine}>{l}</Text>) : null}
            {client.email   ? <Text style={s.partyLine}>{client.email}</Text>   : null}
            {client.telefon ? <Text style={s.partyLine}>{client.telefon}</Text> : null}
          </View>
          <View style={s.partyBox}>
            <Text style={s.partyRole}>Coach · Auftragnehmerin</Text>
            <Text style={s.partyName}>{praxisName}</Text>
            {praxisAdresse ? praxisAdresse.split(',').map((l, i) => <Text key={i} style={s.partyLine}>{l.trim()}</Text>) : null}
            {praxisEmail ? <Text style={s.partyLine}>{praxisEmail}</Text> : null}
            {praxisTel   ? <Text style={s.partyLine}>{praxisTel}</Text>   : null}
          </View>
        </View>

        <View style={s.thinLine} />

        {/* ── Sections ── */}
        <Sec num="1" title="Vertragsgegenstand & Leistungen" text={leistungen} />

        <Sec num="2" title="Vertraulichkeit & Datenschutz"
          text="Die Auftragnehmerin behandelt alle persönlichen Informationen streng vertraulich. Personenbezogene Daten werden ausschliesslich zur Leistungserbringung verarbeitet und nicht an Dritte weitergegeben (Art. 6 nDSG)." />

        <Sec num="3" title="Mitwirkungspflicht & medizinischer Hinweis"
          text="Die Klientin gibt alle relevanten Gesundheitsinformationen wahrheitsgemäss an. Die Beratung ersetzt keine medizinische Behandlung. Bei bestehenden Erkrankungen wird eine ärztliche Abklärung empfohlen." />

        <Sec num="4" title="Haftungsausschluss"
          text="Die Auftragnehmerin haftet nicht für Schäden aus unvollständigen oder unrichtigen Angaben. Die erzielten Ergebnisse hängen massgeblich von der Eigenverantwortung der Klientin ab." />

        <Sec num="5" title="Allgemeine Bestimmungen"
          text="Dieser Vertrag untersteht schweizerischem Recht. Gerichtsstand ist der Sitz der Auftragnehmerin. Änderungen bedürfen der Schriftform. Unwirksame Bestimmungen berühren den Bestand des Vertrags nicht." />

        <View style={s.thinLine} />

        {/* ── Signatures ── */}
        <Text style={s.sigNote}>
          Mit ihrer Unterschrift bestätigt die Klientin, diesen Vertrag vollständig gelesen, verstanden und akzeptiert zu haben.
        </Text>
        <View style={s.sigRow}>
          <View style={s.sigBox}>
            <View style={s.sigSpace} />
            <View style={s.sigLine} />
            <Text style={s.sigName}>{client.vorname} {client.nachname}</Text>
            <Text style={s.sigLabel}>Ort, Datum · Klientin</Text>
          </View>
          <View style={s.sigBox}>
            <View style={s.sigSpace} />
            <View style={s.sigLine} />
            <Text style={s.sigName}>{praxisName}</Text>
            <Text style={s.sigLabel}>Ort, Datum · Coach</Text>
          </View>
        </View>

        {/* ── Footer ── */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>{praxisName} · Coaching-Vertrag · {client.vorname} {client.nachname}</Text>
          <Text style={s.footerText}>{Ds(datum)}</Text>
        </View>

      </Page>
    </Document>
  )
}

export async function GET(_: Request, props: { params: Promise<{ clientId: string }> }) {
  const params = await props.params;
  const session = await getServerSession(authOptions)
  if (!session) return new Response('Unauthorized', { status: 401 })

  const client = await fetchClient(params.clientId)
  if (!client) return new Response('Not found', { status: 404 })

  const leistungenFile = path.join(process.cwd(), 'data', 'vertrag-leistungen.txt')
  const leistungen = fs.existsSync(leistungenFile)
    ? fs.readFileSync(leistungenFile, 'utf-8').trim()
    : 'Ernährungs- und Trainingsberatung nach individueller Vereinbarung.'

  const logoData = getLogoData()
  const stream = await renderToStream(
    <VertragPDF client={client} leistungen={leistungen} datum={new Date()} logoData={logoData} />
  )
  const filename = `Vertrag_${client.nachname}_${client.vorname.replace(/\s/g, '_')}.pdf`
  return new Response(nodeStreamToWeb(stream), {
    headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="${filename}"` },
  })
}
