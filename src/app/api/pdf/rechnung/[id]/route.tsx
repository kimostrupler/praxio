import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { NextRequest } from 'next/server'
import { Document, Page, Text, View, StyleSheet, Image, Svg, Rect, renderToStream } from '@react-pdf/renderer'
import { getLogoData } from '@/lib/logo'
import { nodeStreamToWeb } from '@/lib/pdf'
import { praxisName, praxisSubtitle, praxisAdresse, praxisEmail, praxisTel, praxisStrasse, praxisPlz, praxisOrt, praxisWebsite, praxisMwstNr, praxisIban, praxisQrIban, praxisBank, praxisBic } from '@/lib/praxis'
import QRCode from 'qrcode'

// ── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  black: '#0a0a0a', dark: '#333333', mid: '#666666', light: '#999999',
  faint: '#bbbbbb', line: '#f0ede8', bg: '#fdf9f5', white: '#ffffff',
  orange: '#bba282',
}

// ── Invoice page styles ───────────────────────────────────────────────────────
const inv = StyleSheet.create({
  page:            { fontFamily: 'Helvetica', backgroundColor: C.white, paddingTop: 52, paddingBottom: 70, paddingHorizontal: 48 },
  topStrip:        { position: 'absolute', top: 0, left: 0, right: 0, height: 4, backgroundColor: C.orange },
  companyName:     { fontSize: 17, fontFamily: 'Helvetica-Bold', color: C.black, letterSpacing: 0.3, marginBottom: 2 },
  companySubtitle: { fontSize: 8.5, color: C.mid, marginBottom: 28 },
  dividerBold:     { borderBottomWidth: 1.5, borderBottomColor: C.black, marginBottom: 18 },
  dividerThin:     { borderBottomWidth: 0.75, borderBottomColor: C.line },
  metaRow:         { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  metaLeft:        { flexDirection: 'column' },
  docTitle:        { fontSize: 11, fontFamily: 'Helvetica-Bold', color: C.black, marginBottom: 7 },
  metaLine:        { fontSize: 8.5, color: C.dark, marginBottom: 3.5 },
  metaLabel:       { color: C.light },
  metaRight:       { flexDirection: 'column', alignItems: 'flex-end', maxWidth: 210 },
  clientName:      { fontSize: 10, fontFamily: 'Helvetica-Bold', color: C.black, textAlign: 'right', marginBottom: 3 },
  clientAddr:      { fontSize: 8.5, color: C.dark, textAlign: 'right', marginBottom: 2 },
  betreff:         { fontSize: 11, fontFamily: 'Helvetica-Bold', color: C.black, marginBottom: 5 },
  anrede:          { fontSize: 9, color: C.dark, marginBottom: 8, lineHeight: 1.5 },
  textBodyText:    { fontSize: 9, color: C.dark, lineHeight: 1.6, marginBottom: 14 },
  tableHead:       { flexDirection: 'row', backgroundColor: C.black, paddingHorizontal: 8, paddingVertical: 6 },
  tableRow:        { flexDirection: 'row', paddingHorizontal: 8, paddingVertical: 7, borderBottomWidth: 0.75, borderBottomColor: C.line },
  tableAlt:        { backgroundColor: C.bg },
  th:              { fontSize: 7, fontFamily: 'Helvetica-Bold', color: C.white, textTransform: 'uppercase', letterSpacing: 0.4 },
  td:              { fontSize: 8.5, color: C.dark },
  tdBold:          { fontSize: 8.5, color: C.black, fontFamily: 'Helvetica-Bold' },
  colPos:          { width: 22 }, colDesc: { flex: 1 },
  colMenge:        { width: 44, textAlign: 'right' }, colEinheit: { width: 48, textAlign: 'right' },
  colPreis:        { width: 68, textAlign: 'right' }, colTotal:  { width: 72, textAlign: 'right' },
  totals:          { alignItems: 'flex-end', marginTop: 10, marginBottom: 16 },
  totalRow:        { flexDirection: 'row', marginBottom: 3.5 },
  totalKey:        { fontSize: 8.5, color: C.mid, width: 150, textAlign: 'right', marginRight: 12 },
  totalVal:        { fontSize: 8.5, color: C.dark, width: 72, textAlign: 'right' },
  sumKey:          { fontSize: 11, fontFamily: 'Helvetica-Bold', color: C.black, width: 150, textAlign: 'right', marginRight: 12 },
  sumVal:          { fontSize: 11, fontFamily: 'Helvetica-Bold', color: C.black, width: 72, textAlign: 'right' },
  payText:         { fontSize: 9, color: C.dark, marginBottom: 5, lineHeight: 1.6 },
  signoff:         { fontSize: 9, color: C.dark, marginTop: 6 },
  notizBox:        { backgroundColor: C.bg, borderRadius: 3, padding: 10, marginTop: 10 },
  notizLabel:      { fontSize: 7, fontFamily: 'Helvetica-Bold', color: C.light, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 4 },
  notizText:       { fontSize: 8.5, color: C.dark, lineHeight: 1.5 },
  footer:          { position: 'absolute', bottom: 0, left: 0, right: 0, borderTopWidth: 0.5, borderTopColor: C.faint, paddingTop: 8, paddingHorizontal: 48, flexDirection: 'row' },
  footerCol:       { flex: 1, paddingHorizontal: 4 },
  footerLine:      { fontSize: 7, color: C.faint, marginBottom: 2 },
  footerBold:      { fontFamily: 'Helvetica-Bold', color: C.light },
})

// ── QR bill page styles (bottom 105mm of A4, absolute-positioned) ────────────
const qr = StyleSheet.create({
  page:       { fontFamily: 'Helvetica', backgroundColor: C.white, padding: 0 },
  body:       { flexDirection: 'row', flex: 1 },
  receipt:    { width: 175.75, paddingHorizontal: 12, paddingTop: 10, paddingBottom: 8, flexDirection: 'column' },
  sep:        { width: 0.75, backgroundColor: C.line },
  payment:    { flex: 1, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 8, flexDirection: 'column' },
  title:      { fontSize: 11, fontFamily: 'Helvetica-Bold', color: C.black, marginBottom: 8 },
  label:      { fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.black, marginBottom: 1, marginTop: 7 },
  value:      { fontSize: 9, color: C.black, lineHeight: 1.3 },
  valueBold:  { fontSize: 9, fontFamily: 'Helvetica-Bold', color: C.black },
  qrWrap:     { width: 130, height: 130, position: 'relative', marginRight: 12 },
  qrImg:      { width: 130, height: 130 },
  midRow:     { flexDirection: 'row', flex: 1 },
  amtRow:     { flexDirection: 'row', gap: 24, marginTop: 8 },
  amtLabel:   { fontSize: 8, fontFamily: 'Helvetica-Bold', color: C.black, marginBottom: 2 },
  amtVal:     { fontSize: 11, fontFamily: 'Helvetica-Bold', color: C.black },
  acceptance: { fontSize: 7, color: C.mid, textAlign: 'right', marginTop: 4 },
  debtorBox:  { width: 52, height: 20, borderWidth: 0.75, borderColor: C.mid, borderRadius: 2, marginTop: 3 },
})

// ── Helpers ───────────────────────────────────────────────────────────────────
const D = (d: Date | string) =>
  new Date(d).toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric' })

const fmtCHF = (n: number) => {
  const [i, d] = n.toFixed(2).split('.')
  return `CHF ${i.replace(/\B(?=(\d{3})+(?!\d))/g, "'")}.${d}`;
}

function isQrIban(iban: string): boolean {
  const c = iban.replace(/\s/g, '').toUpperCase()
  if (!c.startsWith('CH') || c.length !== 21) return false
  const iid = parseInt(c.slice(4, 9))
  return iid >= 30000 && iid < 32000
}

// Build 27-digit QR reference from invoice number (padded + Modulo 10 recursive check digit)
function buildQrReference(invoiceNumber: string): string {
  const digits = invoiceNumber.replace(/\D/g, '').padStart(26, '0').slice(-26)
  const table  = [0, 9, 4, 6, 8, 2, 7, 1, 3, 5]
  let carry = 0
  for (const d of digits) { carry = table[(carry + parseInt(d)) % 10] }
  const check = (10 - carry) % 10
  return digits + check
}

// Build Swiss Payment Standard (SPS) QR code data string
function buildSpsData(params: {
  iban: string; name: string; strasse: string; plz: string; ort: string
  amount: number | null; invoiceNumber: string
}): string {
  const cleanIban  = params.iban.replace(/\s/g, '').toUpperCase()
  const useQrRef   = isQrIban(cleanIban)
  const refType    = useQrRef ? 'QRR' : 'NON'
  const reference  = useQrRef ? buildQrReference(params.invoiceNumber) : ''
  const amtStr     = params.amount != null ? params.amount.toFixed(2) : ''

  return [
    'SPC', '0200', '1',
    cleanIban,
    'S',                       // structured address
    params.name,               // creditor name
    params.strasse,            // street + number
    '',                        // house number (empty — combined with street)
    params.plz,                // postal code
    params.ort,                // city
    'CH',                      // country
    '', '', '', '', '', '', '', // ultimate creditor (7 empty)
    amtStr,
    'CHF',
    '', '', '', '', '', '', '', // ultimate debtor (7 empty)
    refType,
    reference,
    params.invoiceNumber,      // additional info
    'EPD',
  ].join('\n')
}

// ── Data fetching ─────────────────────────────────────────────────────────────
async function fetchData(id: string) {
  return prisma.rechnung.findUnique({
    where: { id },
    include: {
      client:     { select: { id: true, vorname: true, nachname: true, email: true, adresse: true } },
      positionen: { orderBy: { reihenfolge: 'asc' } },
    },
  })
}
type Data = NonNullable<Awaited<ReturnType<typeof fetchData>>>

// ── Invoice PDF component ────────────────────────────────────────────────────
function InvoicePage({ r, praxis }: { r: Data; praxis: ReturnType<typeof readPraxis> }) {
  const netto   = r.positionen.reduce((s, p) => s + p.menge * p.einzelpreis, 0)
  const mwstAmt = netto * r.mwst / 100
  const brutto  = netto + mwstAmt
  const tage     = r.zahlungszielTage ?? 20
  const kundennr = `KD-${r.client.id.slice(0, 4).toUpperCase()}`

  // Detect tone from anrede
  const formal   = r.anrede?.toLowerCase().startsWith('sehr geehrte') ?? false
  const signoff  = formal ? 'Freundliche Grüsse' : 'Liebe Grüsse'

  // Only show payment line if the intro text doesn't already mention payment
  const bodyMentionsPayment = r.textBody
    ? /tage|überweis|zahlung|frist/i.test(r.textBody)
    : false

  const payLine = bodyMentionsPayment || !r.faellig && !r.zahlungszielTage ? null : (() => {
    if (formal) {
      return r.faellig
        ? `Wir bedanken uns für Ihre Überweisung bis zum ${D(r.faellig)}.`
        : `Wir bedanken uns für Ihre Überweisung innerhalb von ${tage} Tagen.`
    }
    return r.faellig
      ? `Bitte überweise den Betrag bis zum ${D(r.faellig)}.`
      : `Bitte überweise den Betrag innerhalb von ${tage} Tagen.`
  })()

  return (
    <Page size="A4" style={inv.page}>
      <View style={inv.topStrip} fixed />
      {praxis.logoData
        ? <Image src={praxis.logoData} style={{ height: 44, marginBottom: 12, objectFit: 'contain', alignSelf: 'flex-start' }} />
        : <>
            <Text style={inv.companyName}>{praxis.name}</Text>
            <Text style={inv.companySubtitle}>{praxis.subtitle}</Text>
          </>
      }
      <View style={inv.dividerBold} />

      <View style={inv.metaRow}>
        <View style={inv.metaLeft}>
          <Text style={inv.docTitle}>Rechnung</Text>
          <Text style={inv.metaLine}><Text style={inv.metaLabel}>Datum:          </Text>{D(r.datum)}</Text>
          <Text style={inv.metaLine}><Text style={inv.metaLabel}>Rechnungs-Nr.:  </Text>{r.nummer}</Text>
          <Text style={inv.metaLine}><Text style={inv.metaLabel}>Kunden-Nr.:     </Text>{kundennr}</Text>
          {praxis.mwstNr ? <Text style={inv.metaLine}><Text style={inv.metaLabel}>MwSt-Nr.:       </Text>{praxis.mwstNr}</Text> : null}
        </View>
        <View style={inv.metaRight}>
          <Text style={inv.clientName}>{r.client.vorname} {r.client.nachname}</Text>
          {r.client.adresse
            ? r.client.adresse.split('\n').map((l, i) => <Text key={i} style={inv.clientAddr}>{l}</Text>)
            : null}
          {r.client.email ? <Text style={[inv.clientAddr, { color: C.light }]}>{r.client.email}</Text> : null}
        </View>
      </View>

      {r.betreff ? <Text style={inv.betreff}>{r.betreff}</Text> : null}
      {r.anrede  ? <Text style={inv.anrede}>{r.anrede}</Text>   : null}
      {r.textBody ? <Text style={inv.textBodyText}>{r.textBody}</Text> : null}

      <View style={inv.tableHead}>
        <Text style={[inv.th, inv.colPos]}>#</Text>
        <Text style={[inv.th, inv.colDesc]}>Beschreibung</Text>
        <Text style={[inv.th, inv.colMenge]}>Menge</Text>
        <Text style={[inv.th, inv.colEinheit]}>Einheit</Text>
        <Text style={[inv.th, inv.colPreis]}>Preis CHF</Text>
        <Text style={[inv.th, inv.colTotal]}>Betrag CHF</Text>
      </View>
      {r.positionen.map((p, i) => (
        <View key={p.id} style={[inv.tableRow, i % 2 === 1 ? inv.tableAlt : {}]} wrap={false}>
          <Text style={[inv.td, inv.colPos]}>{i + 1}</Text>
          <Text style={[inv.td, inv.colDesc]}>{p.beschreibung}</Text>
          <Text style={[inv.td, inv.colMenge]}>{p.menge % 1 === 0 ? p.menge.toFixed(0) : p.menge.toFixed(2)}</Text>
          <Text style={[inv.td, inv.colEinheit]}>{p.einheit ?? '—'}</Text>
          <Text style={[inv.td, inv.colPreis]}>{p.einzelpreis.toFixed(2)}</Text>
          <Text style={[inv.tdBold, inv.colTotal]}>{(p.menge * p.einzelpreis).toFixed(2)}</Text>
        </View>
      ))}
      <View style={inv.dividerThin} />

      <View style={inv.totals}>
        <View style={inv.totalRow}>
          <Text style={inv.totalKey}>Zwischentotal CHF</Text>
          <Text style={inv.totalVal}>{netto.toFixed(2)}</Text>
        </View>
        {r.mwst > 0 && (
          <View style={inv.totalRow}>
            <Text style={inv.totalKey}>MwSt {r.mwst}% auf {netto.toFixed(2)}</Text>
            <Text style={inv.totalVal}>{mwstAmt.toFixed(2)}</Text>
          </View>
        )}
        <View style={[{ flexDirection: 'row', width: 234, marginBottom: 4, marginTop: 2 }]}>
          <View style={{ flex: 1, borderBottomWidth: 1.2, borderBottomColor: C.black }} />
        </View>
        <View style={inv.totalRow}>
          <Text style={inv.sumKey}>Rechnungsbetrag  CHF</Text>
          <Text style={inv.sumVal}>{brutto.toFixed(2)}</Text>
        </View>
      </View>

      {payLine ? <Text style={inv.payText}>{payLine}</Text> : null}
      <Text style={inv.signoff}>{signoff}</Text>
      <Text style={[inv.signoff, { marginTop: 2 }]}>{praxis.name}</Text>

      {r.notizen ? (
        <View style={inv.notizBox}>
          <Text style={inv.notizLabel}>Hinweise</Text>
          <Text style={inv.notizText}>{r.notizen}</Text>
        </View>
      ) : null}

      <View style={inv.footer} fixed>
        <View style={inv.footerCol}>
          <Text style={[inv.footerLine, inv.footerBold]}>{praxis.name}</Text>
          {praxis.adresse.split(',').map((l, i) => <Text key={i} style={inv.footerLine}>{l.trim()}</Text>)}
        </View>
        <View style={inv.footerCol}>
          {praxis.telefon ? <Text style={inv.footerLine}><Text style={inv.footerBold}>Tel: </Text>{praxis.telefon}</Text> : null}
          {praxis.email   ? <Text style={inv.footerLine}><Text style={inv.footerBold}>E-Mail: </Text>{praxis.email}</Text> : null}
          {praxis.website ? <Text style={inv.footerLine}><Text style={inv.footerBold}>Web: </Text>{praxis.website}</Text> : null}
        </View>
        <View style={inv.footerCol}>
          {praxis.bank ? <Text style={inv.footerLine}><Text style={inv.footerBold}>Bank: </Text>{praxis.bank}</Text> : null}
          {praxis.iban ? <Text style={inv.footerLine}><Text style={inv.footerBold}>IBAN: </Text>{praxis.iban}</Text> : null}
          {praxis.bic  ? <Text style={inv.footerLine}><Text style={inv.footerBold}>BIC: </Text>{praxis.bic}</Text>  : null}
        </View>
      </View>
    </Page>
  )
}

// ── QR Bill page component ───────────────────────────────────────────────────
function QrBillPage({ r, praxis, qrBase64, brutto }: {
  r: Data; praxis: ReturnType<typeof readPraxis>; qrBase64: string; brutto: number
}) {
  const activeIban  = (praxis.qrIban || praxis.iban).replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim()
  const usingQrIban = !!praxis.qrIban
  const reference   = usingQrIban ? buildQrReference(r.nummer) : null

  const creditorLines = [praxis.name, praxis.strasse, `${praxis.plz} ${praxis.ort}`.trim()].filter(Boolean)
  const payerLines    = [
    `${r.client.vorname} ${r.client.nachname}`.trim(),
    ...(r.client.adresse ? r.client.adresse.split('\n').map(l => l.trim()).filter(Boolean) : []),
  ]

  const CreditorBlock = () => (
    <>
      <Text style={qr.label}>Konto / Zahlbar an</Text>
      <Text style={qr.valueBold}>{activeIban}</Text>
      <Text style={qr.label}>Zugunsten von</Text>
      {creditorLines.map((l, i) => <Text key={i} style={qr.value}>{l}</Text>)}
      {reference && <>
        <Text style={qr.label}>QR-Referenz</Text>
        <Text style={qr.value}>{reference}</Text>
      </>}
      <Text style={qr.label}>Mitteilung</Text>
      <Text style={qr.value}>{r.nummer}</Text>
    </>
  )

  const PayerBlock = () => (
    <>
      <Text style={qr.label}>Zahlbar durch</Text>
      {payerLines.map((l, i) => <Text key={i} style={qr.value}>{l}</Text>)}
    </>
  )

  const AmtBlock = () => (
    <View style={qr.amtRow}>
      <View>
        <Text style={qr.amtLabel}>Währung</Text>
        <Text style={qr.amtVal}>CHF</Text>
      </View>
      <View>
        <Text style={qr.amtLabel}>Betrag</Text>
        <Text style={qr.amtVal}>{brutto.toFixed(2)}</Text>
      </View>
    </View>
  )

  return (
    <Page size="A4" style={qr.page}>
      {/* Pinned to bottom 105mm. height: 298 is required — flex:1 on body needs
          a concrete parent height, otherwise it collapses to 0. */}
      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 298 }}>

        {/* ── Horizontal cut line ── */}
        <View style={{ borderTopWidth: 0.75, borderTopColor: C.mid, borderTopStyle: 'dashed' }} />

        {/* ── Vertical separator — absolute so top touches the cut line above ── */}
        <View style={{ position: 'absolute', top: 0, bottom: 0, left: 175.75, borderLeftWidth: 0.75, borderLeftColor: C.mid, borderLeftStyle: 'dashed' }} />

        {/* ── Body row ── */}
        <View style={qr.body}>

          {/* EMPFANGSSCHEIN (left, 62mm) */}
          <View style={qr.receipt}>
            <Text style={qr.title}>Empfangsschein</Text>
            <CreditorBlock />
            <PayerBlock />
            {/* Spacer pushes amount to bottom */}
            <View style={{ flex: 1 }} />
            <AmtBlock />
            <Text style={qr.acceptance}>Annahmestelle</Text>
          </View>

          {/* ZAHLTEIL (right, 148mm) */}
          <View style={qr.payment}>
            <Text style={qr.title}>Zahlteil</Text>

            {/* QR code (left) + info (right) */}
            <View style={qr.midRow}>
              <View style={qr.qrWrap}>
                <Image src={qrBase64} style={qr.qrImg} />
                {/* Swiss cross — black square, white cross 1:3 arms */}
                <Svg viewBox="0 0 132 132" style={{ position: 'absolute', top: 0, left: 0, width: 130, height: 130 }}>
                  <Rect x="56" y="56" width="20" height="20" rx="1" fill="black" />
                  <Rect x="60" y="64" width="12" height="4" fill="white" />
                  <Rect x="64" y="60" width="4" height="12" fill="white" />
                </Svg>
              </View>

              {/* Creditor + payer to the right of QR */}
              <View style={{ flex: 1 }}>
                <CreditorBlock />
                <PayerBlock />
              </View>
            </View>

            {/* Amount below QR+info */}
            <AmtBlock />
          </View>

        </View>
      </View>
    </Page>
  )
}

function readPraxis() {
  return {
    name: praxisName, subtitle: praxisSubtitle, logoData: getLogoData(),
    adresse: praxisAdresse, strasse: praxisStrasse, plz: praxisPlz, ort: praxisOrt,
    telefon: praxisTel, email: praxisEmail, website: praxisWebsite,
    mwstNr: praxisMwstNr, iban: praxisIban, qrIban: praxisQrIban,
    bank: praxisBank, bic: praxisBic,
  }
}

// ── Route handler ─────────────────────────────────────────────────────────────
export async function GET(_req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await getServerSession(authOptions)
  if (!session) return new Response('Unauthorized', { status: 401 })

  const data = await fetchData(params.id)
  if (!data) return new Response('Not found', { status: 404 })

  const praxis  = readPraxis()
  const netto   = data.positionen.reduce((s, p) => s + p.menge * p.einzelpreis, 0)
  const brutto  = netto * (1 + data.mwst / 100)

  // Generate QR bill if IBAN is configured
  const activeIban = praxis.qrIban || praxis.iban
  let qrBase64: string | null = null

  if (activeIban && praxis.strasse && praxis.ort) {
    try {
      const spsData = buildSpsData({
        iban:          activeIban,
        name:          praxis.name,
        strasse:       praxis.strasse,
        plz:           praxis.plz,
        ort:           praxis.ort,
        amount:        brutto,
        invoiceNumber: data.nummer,
      })
      const buf = await QRCode.toBuffer(spsData, {
        errorCorrectionLevel: 'M',
        type: 'png',
        width: 264, // 132pt × 2 for resolution
        margin: 1,
        color: { dark: '#000000', light: '#ffffff' },
      })
      qrBase64 = `data:image/png;base64,${buf.toString('base64')}`
    } catch (e) {
      console.error('QR code generation failed:', e)
    }
  }

  const stream = await renderToStream(
    <Document title={`Rechnung ${data.nummer}`} author={praxis.name}>
      <InvoicePage r={data} praxis={praxis} />
      {qrBase64 && <QrBillPage r={data} praxis={praxis} qrBase64={qrBase64} brutto={brutto} />}
    </Document>
  )

  return new Response(nodeStreamToWeb(stream), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="Rechnung_${data.nummer}_${data.client.nachname}.pdf"`,
    },
  })
}
