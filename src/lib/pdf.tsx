import { StyleSheet, Text, View, Image } from '@react-pdf/renderer'

export const C = {
  black:       '#0a0a0a',
  dark:        '#222222',
  mid:         '#555555',
  light:       '#888888',
  faint:       '#bbbbbb',
  line:        '#f0ede8',
  bg:          '#fdf9f5',
  tableHeader: '#1a1a1a',
  orange:      '#bba282',
  white:       '#ffffff',
}

export const base = StyleSheet.create({
  page:          { fontFamily: 'Helvetica', backgroundColor: C.white, paddingTop: 48, paddingBottom: 40, paddingHorizontal: 48 },
  topStrip:      { position: 'absolute', top: 0, left: 0, right: 0, height: 4, backgroundColor: C.orange },
  dividerBold:   { borderBottomWidth: 1.5, borderBottomColor: C.black, marginBottom: 20 },
  dividerBoldLg: { borderBottomWidth: 1.5, borderBottomColor: C.black, marginBottom: 24 },
  header:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  headerLg:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 },
  headerRight:   { flexDirection: 'column', alignItems: 'flex-end' },
  headerTitle: { fontSize: 9, color: C.orange, letterSpacing: 1, textTransform: 'uppercase', fontFamily: 'Helvetica-Bold' },
  headerDate:  { fontSize: 10, fontFamily: 'Helvetica-Bold', color: C.black, marginTop: 3, textAlign: 'right' },
  brand:       { fontSize: 13, fontFamily: 'Helvetica-Bold', color: C.black, letterSpacing: 0.3 },
  brandBy:     { fontSize: 8, color: C.light, marginTop: 2 },
  footer:      { position: 'absolute', bottom: 24, left: 48, right: 48, flexDirection: 'row', justifyContent: 'space-between' },
  footerText:  { fontSize: 7, color: C.faint },
  clientName:  { fontSize: 20, fontFamily: 'Helvetica-Bold', color: C.black, marginBottom: 4 },
  clientSub:   { fontSize: 9, color: C.mid, marginBottom: 20 },
})

export function formatDate(d: Date | string | null | undefined): string {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

// react-pdf's renderToStream has unreliable type declarations that vary by version.
// The runtime value is always a Node.js Readable; we accept any and call .on() which works.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function nodeStreamToWeb(stream: any): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(ctrl) {
      stream.on('data', (c: Buffer) => ctrl.enqueue(c))
      stream.on('end', () => ctrl.close())
      stream.on('error', (e: unknown) => ctrl.error(e))
    },
  })
}

export function PdfHeader({
  title, date, logoData, praxisName, praxisSubtitle, large,
}: {
  title: string
  date: string
  logoData: string | null
  praxisName: string
  praxisSubtitle: string
  large?: boolean
}) {
  return (
    <View style={large ? base.headerLg : base.header}>
      <View>
        {logoData
          ? <Image src={logoData} style={{ height: 36, objectFit: 'contain' }} />
          : <><Text style={base.brand}>{praxisName}</Text><Text style={base.brandBy}>{praxisSubtitle}</Text></>
        }
      </View>
      <View style={base.headerRight}>
        <Text style={base.headerTitle}>{title}</Text>
        <Text style={base.headerDate}>{date}</Text>
      </View>
    </View>
  )
}
