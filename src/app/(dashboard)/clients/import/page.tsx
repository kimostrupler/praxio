'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { importSingleClient } from '@/app/actions/clients'

type ParsedRow = {
  vorname: string
  nachname: string
  email: string
  telefon: string
  adresse: string
  beruf: string
  geburtsdatum: string
  valid: boolean
}

function parseCSV(text: string): ParsedRow[] {
  const lines = text.split(/\r?\n/).filter(l => l.trim())
  if (lines.length < 2) return []

  // Parse a CSV line handling quoted fields
  function parseLine(line: string): string[] {
    const fields: string[] = []
    let current = ''
    let inQuotes = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') { current += '"'; i++ }
        else inQuotes = !inQuotes
      } else if (ch === ',' && !inQuotes) {
        fields.push(current.trim())
        current = ''
      } else {
        current += ch
      }
    }
    fields.push(current.trim())
    return fields
  }

  const headers = parseLine(lines[0]).map(h => h.toLowerCase().trim())

  const idx = (name: string) => headers.indexOf(name)
  const iVorname      = idx('vorname')
  const iNachname     = idx('nachname')
  const iEmail        = idx('email')
  const iTelefon      = idx('telefon')
  const iAdresse      = idx('adresse')
  const iBeruf        = idx('beruf')
  const iGeburtsdatum = idx('geburtsdatum')

  const rows: ParsedRow[] = []
  for (let i = 1; i < lines.length; i++) {
    const cols = parseLine(lines[i])
    const get  = (idx: number) => (idx >= 0 ? cols[idx] ?? '' : '')
    const vorname  = get(iVorname)
    const nachname = get(iNachname)
    rows.push({
      vorname,
      nachname,
      email:        get(iEmail),
      telefon:      get(iTelefon),
      adresse:      get(iAdresse),
      beruf:        get(iBeruf),
      geburtsdatum: get(iGeburtsdatum),
      valid: !!vorname.trim() && !!nachname.trim(),
    })
  }
  return rows
}

export default function ImportPage() {
  const [rows, setRows]           = useState<ParsedRow[]>([])
  const [fileName, setFileName]   = useState('')
  const [progress, setProgress]   = useState(0)
  const [done, setDone]           = useState(false)
  const [errors, setErrors]       = useState<{ row: number; msg: string }[]>([])
  const [pending, start]          = useTransition()

  function handleFile(file: File) {
    setFileName(file.name)
    setRows([])
    setDone(false)
    setErrors([])
    setProgress(0)
    const reader = new FileReader()
    reader.onload = e => {
      const text = e.target?.result as string
      setRows(parseCSV(text))
    }
    reader.readAsText(file, 'UTF-8')
  }

  const validRows   = rows.filter(r => r.valid)
  const skippedRows = rows.filter(r => !r.valid)

  function handleImport() {
    start(async () => {
      const errs: { row: number; msg: string }[] = []
      let count = 0
      for (let i = 0; i < validRows.length; i++) {
        const r = validRows[i]
        const result = await importSingleClient({
          vorname:      r.vorname,
          nachname:     r.nachname,
          email:        r.email || undefined,
          telefon:      r.telefon || undefined,
          adresse:      r.adresse || undefined,
          beruf:        r.beruf || undefined,
          geburtsdatum: r.geburtsdatum || undefined,
        })
        if (result && 'error' in result && result.error) {
          errs.push({ row: i + 1, msg: result.error })
        }
        count++
        setProgress(count)
      }
      setErrors(errs)
      setDone(true)
    })
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 w-full max-w-4xl">
      <Link href="/clients" className="text-xs text-[#555555] hover:text-[#efefef] transition-colors inline-flex items-center gap-1 mb-5">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        Klientenliste
      </Link>

      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">CSV importieren</h1>
        <p className="text-xs text-[#3a3a3a] mt-0.5">Klienten aus einer CSV-Datei importieren</p>
      </div>

      {/* File input */}
      {!done && (
        <div className="space-y-4">
          <div className="bg-[#141414] border border-[#2e2e2e] rounded-xl p-5">
            <p className="text-sm text-[#efefef] mb-2">CSV-Datei auswählen</p>
            <p className="text-xs text-[#444444] mb-3">
              Erwartete Spalten (erste Zeile = Header, Groß-/Kleinschreibung egal):<br />
              <span className="font-mono text-[#666666]">vorname, nachname, email, telefon, adresse, beruf, geburtsdatum</span>
            </p>
            <label className="inline-block cursor-pointer">
              <span className="text-xs text-[#666666] border border-[#2e2e2e] hover:bg-[#1c1c1c] px-4 py-2 rounded-lg transition-colors">
                {fileName || 'Datei auswählen…'}
              </span>
              <input type="file" accept=".csv,text/csv"
                className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
            </label>
          </div>

          {rows.length > 0 && (
            <>
              <div className="flex items-center gap-3">
                <span className="text-xs text-emerald-400">{validRows.length} gültige Zeilen</span>
                {skippedRows.length > 0 && (
                  <span className="text-xs text-[#666666]">{skippedRows.length} übersprungen (kein Vor-/Nachname)</span>
                )}
              </div>

              <div className="bg-[#141414] border border-[#2e2e2e] rounded-xl overflow-x-auto">
                <table className="w-full text-xs min-w-[600px]">
                  <thead>
                    <tr className="border-b border-[#1c1c1c]">
                      {['', 'Vorname', 'Nachname', 'E-Mail', 'Telefon', 'Adresse', 'Beruf', 'Geburtsdatum'].map(h => (
                        <th key={h} className="px-3 py-2 text-left text-[10px] font-medium text-[#3a3a3a] uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1c1c1c]">
                    {rows.map((r, i) => (
                      <tr key={i} className={r.valid ? '' : 'opacity-40'}>
                        <td className="px-3 py-2">
                          {r.valid
                            ? <span className="text-emerald-400">✓</span>
                            : <span className="text-[#444444]">—</span>}
                        </td>
                        <td className="px-3 py-2 text-[#efefef]">{r.vorname || '—'}</td>
                        <td className="px-3 py-2 text-[#efefef]">{r.nachname || '—'}</td>
                        <td className="px-3 py-2 text-[#666666]">{r.email || '—'}</td>
                        <td className="px-3 py-2 text-[#666666]">{r.telefon || '—'}</td>
                        <td className="px-3 py-2 text-[#666666]">{r.adresse || '—'}</td>
                        <td className="px-3 py-2 text-[#666666]">{r.beruf || '—'}</td>
                        <td className="px-3 py-2 text-[#666666]">{r.geburtsdatum || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {validRows.length > 0 && (
                <div className="flex items-center gap-3">
                  <button type="button" onClick={handleImport} disabled={pending}
                    className="bg-white hover:bg-[#e8e8e8] disabled:opacity-40 text-black text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors">
                    {pending ? `${progress} von ${validRows.length} importiert…` : `${validRows.length} Klienten importieren`}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {done && (
        <div className="bg-[#141414] border border-[#2e2e2e] rounded-xl p-5 space-y-3">
          <p className="text-sm font-semibold text-emerald-400">Import abgeschlossen</p>
          <p className="text-xs text-[#666666]">
            {validRows.length - errors.length} von {validRows.length} Klienten erfolgreich importiert.
          </p>
          {errors.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-[#efefef]">Fehler:</p>
              {errors.map((e, i) => (
                <p key={i} className="text-xs text-red-400">Zeile {e.row}: {e.msg}</p>
              ))}
            </div>
          )}
          <Link href="/clients"
            className="inline-block bg-white hover:bg-[#e8e8e8] text-black text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
            Zur Klientenliste →
          </Link>
        </div>
      )}
    </div>
  )
}
