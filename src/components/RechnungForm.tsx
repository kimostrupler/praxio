'use client'

import { useState } from 'react'
import { createRechnung, updateRechnung, type PositionInput } from '@/app/actions/rechnungen'
import ClientSearchSelect from '@/components/ClientSearchSelect'

const ic     = 'px-3 py-2 bg-[#0a0a0a] border border-[#2e2e2e] rounded-lg text-sm text-[#efefef] placeholder:text-[#3a3a3a] focus:outline-none focus:border-[#555555] transition-colors w-full'
const icSm   = 'px-2.5 py-1.5 bg-[#0a0a0a] border border-[#2e2e2e] rounded-lg text-sm text-[#efefef] focus:outline-none focus:border-[#555555] transition-colors'

type Client = {
  id: string
  vorname: string
  nachname: string
  geschlecht: 'WEIBLICH' | 'MAENNLICH' | 'DIVERS' | null
}

// ── Presets from fitallcoach.ch ───────────────────────────────────────────────
const PRESETS = [
  { key: 'trainingsplan',       label: 'Trainingsplan',      preis: 250, perHour: false },
  { key: 'ernaehrungsberatung', label: 'Ernährungsberatung', preis: 80,  perHour: true  },
  { key: 'plan-optimierung',    label: 'Plan-Optimierung',   preis: 150, perHour: false },
  { key: 'absage',              label: 'Absagegebühr',       preis: 100, perHour: false },
] as const

// ── Anrede options ────────────────────────────────────────────────────────────
function anredeOptions(client: Client | undefined): { value: string; label: string }[] {
  const none = { value: '', label: '— Keine Anrede —' }
  if (!client) return [none]
  const v = client.vorname, n = client.nachname
  if (client.geschlecht === 'WEIBLICH') return [
    { value: `Liebe ${v},`,              label: `Liebe ${v},` },
    { value: `Hallo ${v},`,              label: `Hallo ${v},` },
    { value: `Sehr geehrte Frau ${n},`,  label: `Sehr geehrte Frau ${n},` },
    { value: 'Sehr geehrte Damen und Herren,', label: 'Sehr geehrte Damen und Herren,' },
    none,
  ]
  if (client.geschlecht === 'MAENNLICH') return [
    { value: `Lieber ${v},`,             label: `Lieber ${v},` },
    { value: `Hallo ${v},`,              label: `Hallo ${v},` },
    { value: `Sehr geehrter Herr ${n},`, label: `Sehr geehrter Herr ${n},` },
    { value: 'Sehr geehrte Damen und Herren,', label: 'Sehr geehrte Damen und Herren,' },
    none,
  ]
  return [
    { value: `Hallo ${v},`,   label: `Hallo ${v},` },
    { value: `Liebe ${v},`,   label: `Liebe ${v},` },
    { value: 'Sehr geehrte Damen und Herren,', label: 'Sehr geehrte Damen und Herren,' },
    none,
  ]
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function todayStr() { return new Date().toISOString().split('T')[0] }
function addDays(d: string, n: number) {
  const date = new Date(d); date.setDate(date.getDate() + n)
  return date.toISOString().split('T')[0]
}

type Props = {
  clients:              Client[]
  editId?:              string
  initialClientId?:     string
  initialDatum?:        string
  initialFaellig?:      string
  initialMwst?:         string
  initialBetreff?:      string
  initialAnrede?:       string
  initialTextBody?:     string
  initialEmailVorlage?: string
  initialNotizen?:      string
  initialPositionen?:   PositionInput[]
}

export default function RechnungForm({
  clients,
  editId,
  initialClientId,
  initialDatum,
  initialFaellig      = '',
  initialMwst         = '0',
  initialBetreff      = '',
  initialAnrede       = '',
  initialTextBody     = '',
  initialEmailVorlage = '',
  initialNotizen      = '',
  initialPositionen,
}: Props) {
  const [clientId, setClientId]   = useState(initialClientId ?? clients[0]?.id ?? '')
  const [datum, setDatum]         = useState(initialDatum ?? todayStr())
  const [zahlTage, setZahlTage]   = useState<number | null>(() => {
    if (initialFaellig && initialDatum) {
      const d = Math.round((new Date(initialFaellig).getTime() - new Date(initialDatum).getTime()) / 86400000)
      if ([20, 30, 60].includes(d)) return d
    }
    return initialFaellig ? null : 30
  })
  const [mwst, setMwst]           = useState(initialMwst)
  const [betreff, setBetreff]     = useState(initialBetreff)
  const [anrede, setAnrede]       = useState(initialAnrede)
  const [textBody, setTextBody]   = useState(initialTextBody)
  const [notizen, setNotizen]     = useState(initialNotizen)
  const [positionen, setPositionen] = useState<PositionInput[]>(initialPositionen ?? [])
  const [error, setError]           = useState('')
  const [loading, setLoading]       = useState(false)

  const faellig        = zahlTage !== null ? addDays(datum, zahlTage) : ''
  const selectedClient = clients.find(c => c.id === clientId)
  const options        = anredeOptions(selectedClient)
  const netto          = positionen.reduce((s, p) => s + (parseFloat(p.menge) || 0) * (parseFloat(p.einzelpreis) || 0), 0)
  const mwstPct        = parseFloat(mwst) || 0
  const brutto         = netto * (1 + mwstPct / 100)

  // ── Dynamic text templates ───────────────────────────────────────────────────
  const pdfTemplates = (() => {
    const isTraining = positionen.some(p => p.beschreibung.toLowerCase().includes('trainingsplan'))
    const isFood     = positionen.some(p => p.beschreibung.toLowerCase().includes('ernährung'))
    const isOptimize = positionen.some(p => p.beschreibung.toLowerCase().includes('optimierung'))
    const isAbsage   = positionen.some(p => p.beschreibung.toLowerCase().includes('absage'))
    const multi      = positionen.length > 1

    // Detect formality from the selected anrede
    const formal = anrede.toLowerCase().startsWith('sehr geehrte')

    // Du vs. Sie forms
    const anbei      = formal ? 'Anbei finden Sie'      : 'Anbei findest du'
    const erhalten   = formal ? 'erhalten Sie'           : 'erhältst du'
    const melden     = formal ? 'melden Sie sich'        : 'melde dich'
    const ihr        = formal ? 'Ihr'                    : 'dein'
    const ihnen      = formal ? 'Ihnen'                  : 'dir'
    const sie        = formal ? 'Sie'                    : 'du'
    const bitte      = formal ? 'Bitte überweisen Sie'   : 'Bitte überweise'

    let service = 'die erbrachten Leistungen'
    if (isTraining && !isFood && !isOptimize) service = formal ? 'Ihren Trainingsplan' : 'deinen Trainingsplan'
    else if (isFood && !isTraining && !isOptimize) service = 'die Ernährungsberatung'
    else if (isOptimize && !isTraining && !isFood) service = 'die Plan-Optimierung'

    const faelligFormatted = faellig
      ? new Date(faellig).toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric' })
      : ''
    const frist = zahlTage
      ? faelligFormatted
        ? ` ${bitte} den Betrag bis zum ${faelligFormatted}.`
        : ` ${bitte} den Betrag innerhalb von ${zahlTage} Tagen.`
      : ''

    if (isAbsage) return [
      { label: 'Freundlich', text: formal
          ? `Gemäss unserer Vereinbarung stelle ich Ihnen bei kurzfristiger Absage eine Gebühr in Rechnung.${frist} Ich freue mich auf unseren nächsten Termin.`
          : `Ich hoffe, du bist wohlauf. Gemäss unserer Vereinbarung stelle ich dir bei kurzfristiger Absage eine Gebühr in Rechnung.${frist} Ich freue mich auf unseren nächsten gemeinsamen Termin.` },
      { label: 'Sachlich', text: `Gemäss unserer Vereinbarung wird bei kurzfristiger Absage oder Nichterscheinen eine Gebühr in Rechnung gestellt.${frist}` },
    ]

    const out: { label: string; text: string }[] = []

    if (isFood) {
      out.push({ label: 'Nach Sitzung', text: formal
        ? `Vielen Dank für unsere Sitzung. ${anbei} die Rechnung für ${service}.${frist} Ich freue mich auf unsere weitere Zusammenarbeit.`
        : `Vielen Dank für unsere Sitzung, es war schön mit dir zu arbeiten! ${anbei} die Rechnung für ${service}.${frist}` })
    } else if (isTraining || isOptimize) {
      out.push({ label: 'Nach Sitzung', text: `Vielen Dank für ${ihr} Vertrauen. ${anbei} die Rechnung für ${service}.${frist} Ich freue mich auf unsere weitere Zusammenarbeit.` })
    } else {
      out.push({ label: 'Nach Sitzung', text: `Vielen Dank für unsere Zusammenarbeit. ${anbei} die Rechnung für ${service}.${frist}` })
    }

    out.push({ label: 'Freundlich', text: `Vielen Dank für ${ihr} Vertrauen! ${anbei} die Rechnung für ${service}.${frist} Bei Fragen ${melden} ${ihnen} jederzeit gerne.` })
    out.push({ label: 'Professionell', text: `${anbei} die Rechnung für ${service}.${frist} Für allfällige Rückfragen stehe ich ${ihnen} gerne zur Verfügung.` })

    if (isTraining || isOptimize || multi) {
      out.push({ label: 'Abschluss', text: formal
        ? `Herzlichen Glückwunsch zu ${ihr}em Abschluss. ${anbei} die abschliessende Rechnung für ${service}.${frist} Vielen Dank für ${ihr} Vertrauen.`
        : `Herzlichen Glückwunsch! Du hast tolle Fortschritte gemacht. Anbei erhältst du die abschliessende Rechnung für ${service}.${frist}` })
    }

    return out
  })()

  // ── Preset add ──────────────────────────────────────────────────────────────
  function addPreset(p: typeof PRESETS[number]) {
    setPositionen(prev => [...prev, {
      beschreibung: p.label,
      menge:        '1',
      einzelpreis:  String(p.preis),
      einheit:      p.perHour ? 'h' : 'einmalig',
      reihenfolge:  prev.length,
    }])
    if (!betreff) setBetreff(p.label)
    if (!anrede && selectedClient) {
      const opts = anredeOptions(selectedClient)
      setAnrede(opts[0]?.value ?? '')
    }
  }

  function addCustom() {
    setPositionen(prev => [...prev, {
      beschreibung: '', menge: '1', einzelpreis: '', einheit: 'einmalig', reihenfolge: prev.length,
    }])
  }

  function removePos(i: number) {
    setPositionen(p => p.filter((_, idx) => idx !== i).map((x, idx) => ({ ...x, reihenfolge: idx })))
  }

  function updPos(i: number, field: keyof PositionInput, val: string | number) {
    setPositionen(p => p.map((x, idx) => idx === i ? { ...x, [field]: val } : x))
  }

  function handleClientChange(id: string) {
    setClientId(id)
    const c = clients.find(cl => cl.id === id)
    const opts = anredeOptions(c)
    setAnrede(opts[0]?.value ?? '')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!positionen.length) { setError('Bitte mindestens eine Leistung hinzufügen.'); return }
    const valid = positionen.filter(p => p.beschreibung.trim())
    if (!valid.length) { setError('Bitte Beschreibung für jede Position ausfüllen.'); return }
    setLoading(true)
    const args = [datum, faellig, mwst, betreff, anrede, notizen, valid, textBody, initialEmailVorlage] as const
    const result = editId
      ? await updateRechnung(editId, ...args)
      : await createRechnung(clientId, ...args)
    if (result?.error) { setError(result.error); setLoading(false) }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      {/* ── 1. Leistungen ── */}
      <div className="bg-[#141414] border border-[#2e2e2e] rounded-2xl p-5 space-y-4">
        <p className="text-xs font-semibold text-[#3a3a3a] uppercase tracking-wider">Leistung</p>

        {/* Preset pills */}
        <div className="flex flex-wrap gap-2">
          {PRESETS.map(p => (
            <button key={p.key} type="button" onClick={() => addPreset(p)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-[#2e2e2e] bg-[#0a0a0a] hover:border-[#555555] hover:bg-[#1c1c1c] transition-all group">
              <span className="text-sm font-medium text-[#efefef]">{p.label}</span>
              <span className="text-xs text-[#3a3a3a] group-hover:text-[#666666]">
                CHF {p.preis}{p.perHour ? '/h' : ''}
              </span>
            </button>
          ))}
          <button type="button" onClick={addCustom}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-dashed border-[#2e2e2e] text-sm text-[#444444] hover:border-[#444444] hover:text-[#666666] transition-all">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Eigene
          </button>
        </div>

        {/* Positions */}
        {positionen.length > 0 && (
          <div className="space-y-1 border-t border-[#1c1c1c] pt-3">
            {positionen.map((p, i) => {
              const total  = (parseFloat(p.menge) || 0) * (parseFloat(p.einzelpreis) || 0)
              const isHour = p.einheit === 'h'
              return (
                <div key={i} className="flex items-center gap-3 py-2.5 border-b border-[#1c1c1c] last:border-0">
                  {/* Description */}
                  <input
                    value={p.beschreibung}
                    onChange={e => updPos(i, 'beschreibung', e.target.value)}
                    placeholder="Beschreibung"
                    className="flex-1 min-w-0 bg-transparent text-sm text-[#efefef] placeholder:text-[#2e2e2e] focus:outline-none"
                  />

                  {/* Quantity × Price */}
                  <div className="flex items-center gap-1.5 shrink-0 text-xs text-[#444444]">
                    {isHour && (
                      <>
                        <input type="number" step="0.5" min="0.5" value={p.menge}
                          onChange={e => updPos(i, 'menge', e.target.value)}
                          className={`${icSm} w-14 text-center`} />
                        <span>h ×</span>
                      </>
                    )}
                    <span>CHF</span>
                    <input type="number" step="0.01" min="0" value={p.einzelpreis}
                      onChange={e => updPos(i, 'einzelpreis', e.target.value)}
                      placeholder="0"
                      className={`${icSm} w-20`} />
                  </div>

                  {/* Total */}
                  <span className="text-sm font-semibold text-[#efefef] tabular-nums shrink-0 w-24 text-right">
                    {total > 0 ? `CHF ${total.toFixed(2)}` : '—'}
                  </span>

                  {/* Remove */}
                  <button type="button" onClick={() => removePos(i)}
                    className="text-[#2e2e2e] hover:text-red-500 transition-colors shrink-0">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── 2. Klient & Datum ── */}
      <div className="bg-[#141414] border border-[#2e2e2e] rounded-2xl p-5 space-y-4">
        <p className="text-xs font-semibold text-[#3a3a3a] uppercase tracking-wider">Details</p>

        {/* Klient */}
        {editId ? (
          <div>
            <label className="block text-[10px] text-[#3a3a3a] uppercase tracking-wider mb-1">Klient</label>
            <p className="text-sm text-[#666666] px-3 py-2 bg-[#0a0a0a] border border-[#2e2e2e] rounded-lg">
              {selectedClient?.vorname} {selectedClient?.nachname}
            </p>
          </div>
        ) : (
          <div>
            <label className="block text-[10px] text-[#3a3a3a] uppercase tracking-wider mb-1">Klient</label>
            <ClientSearchSelect clients={clients} value={clientId} onChange={handleClientChange} placeholder="Klient suchen…" />
          </div>
        )}

        {/* Datum + Zahlungsfrist */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] text-[#3a3a3a] uppercase tracking-wider mb-1">Datum</label>
            <input type="date" value={datum} onChange={e => setDatum(e.target.value)} className={ic} />
          </div>
          <div>
            <label className="block text-[10px] text-[#3a3a3a] uppercase tracking-wider mb-1">Zahlungsfrist</label>
            <div className="flex gap-1.5">
              {[{ l: '20T', d: 20 }, { l: '30T', d: 30 }, { l: '60T', d: 60 }, { l: 'Kein', d: null }].map(z => (
                <button key={String(z.d)} type="button" onClick={() => setZahlTage(z.d)}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-colors ${
                    zahlTage === z.d
                      ? 'bg-white text-black border-transparent'
                      : 'bg-[#0a0a0a] border-[#2e2e2e] text-[#555555] hover:text-[#efefef] hover:border-[#3a3a3a]'
                  }`}>
                  {z.l}
                </button>
              ))}
            </div>
            {faellig && (
              <p className="text-[10px] text-[#3a3a3a] mt-1.5">
                Fällig: {new Date(faellig).toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric' })}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── 3. Anrede & Brief ── */}
      <div className="bg-[#141414] border border-[#2e2e2e] rounded-2xl p-5 space-y-3">
        <p className="text-xs font-semibold text-[#3a3a3a] uppercase tracking-wider">Anrede & Brieftext</p>

        {/* Anrede dropdown */}
        <div>
          <label className="block text-[10px] text-[#3a3a3a] uppercase tracking-wider mb-1">Anrede</label>
          <div className="relative">
            <select value={anrede} onChange={e => setAnrede(e.target.value)}
              className={`${ic} appearance-none pr-8 cursor-pointer`}>
              {options.map(o => (
                <option key={o.value} value={o.value} className="bg-[#141414]">{o.label}</option>
              ))}
            </select>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
              className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#555555]">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </div>
        </div>

        {/* Betreff */}
        <div>
          <label className="block text-[10px] text-[#3a3a3a] uppercase tracking-wider mb-1">Betreff</label>
          <input type="text" value={betreff} onChange={e => setBetreff(e.target.value)}
            placeholder="z. B. Ernährungsberatung" className={ic} />
        </div>

        {/* PDF Einleitungstext — always visible */}
        <div className="space-y-2">
          <label className="block text-[10px] text-[#3a3a3a] uppercase tracking-wider">Einleitungstext PDF</label>
          <div className="flex flex-wrap gap-1.5">
            {pdfTemplates.map(t => (
              <button key={t.label} type="button" onClick={() => setTextBody(t.text)}
                className={`text-[11px] px-2.5 py-1 rounded-lg border transition-colors ${
                  textBody === t.text
                    ? 'bg-white text-black border-transparent'
                    : 'bg-[#0a0a0a] border-[#2e2e2e] text-[#555555] hover:text-[#efefef] hover:border-[#3a3a3a]'
                }`}>
                {t.label}
              </button>
            ))}
            {textBody && (
              <button type="button" onClick={() => setTextBody('')}
                className="text-[11px] px-2.5 py-1 text-[#3a3a3a] hover:text-red-500 transition-colors">
                Leeren
              </button>
            )}
          </div>
          <textarea rows={3} value={textBody} onChange={e => setTextBody(e.target.value)}
            placeholder="Erscheint zwischen Anrede und Positionen im PDF. Vorlage oben wählen oder frei schreiben."
            className={`${ic} resize-none`} />
        </div>
      </div>

      {/* ── 4. MwSt + Notiz ── */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#141414] border border-[#2e2e2e] rounded-2xl p-4 space-y-2">
          <label className="block text-[10px] text-[#3a3a3a] uppercase tracking-wider">MwSt</label>
          <div className="flex gap-1.5">
            {[{ l: '0 %', v: '0' }, { l: '2.6 %', v: '2.6' }, { l: '8.1 %', v: '8.1' }].map(m => (
              <button key={m.v} type="button" onClick={() => setMwst(m.v)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  mwst === m.v
                    ? 'bg-white text-black border-transparent'
                    : 'bg-[#0a0a0a] border-[#2e2e2e] text-[#555555] hover:text-[#efefef] hover:border-[#3a3a3a]'
                }`}>
                {m.l}
              </button>
            ))}
          </div>
        </div>
        <div className="bg-[#141414] border border-[#2e2e2e] rounded-2xl p-4 space-y-2">
          <label className="block text-[10px] text-[#3a3a3a] uppercase tracking-wider">Notiz (intern)</label>
          <input value={notizen} onChange={e => setNotizen(e.target.value)}
            placeholder="Nur für dich sichtbar…" className={ic} />
        </div>
      </div>

      {/* ── Error ── */}
      {error && (
        <p className="text-sm text-red-400 bg-red-950/20 border border-red-900/30 px-4 py-3 rounded-xl">{error}</p>
      )}

      {/* ── Total + Submit ── */}
      <div className="bg-[#141414] border border-[#2e2e2e] rounded-2xl px-5 py-4 flex items-center justify-between gap-4">
        <div>
          {netto > 0 ? (
            <>
              <p className="text-2xl font-bold text-white tabular-nums">CHF {brutto.toFixed(2)}</p>
              {mwstPct > 0 && <p className="text-xs text-[#444444] mt-0.5">inkl. {mwst}% MwSt</p>}
            </>
          ) : (
            <p className="text-sm text-[#3a3a3a]">Noch keine Leistung gewählt</p>
          )}
        </div>
        <button type="submit"
          disabled={loading || positionen.length === 0}
          className="bg-white hover:bg-[#e8e8e8] disabled:opacity-40 text-black font-semibold text-sm px-6 py-2.5 rounded-xl transition-colors whitespace-nowrap">
          {loading ? 'Speichern…' : editId ? 'Speichern' : 'Rechnung erstellen'}
        </button>
      </div>

    </form>
  )
}
