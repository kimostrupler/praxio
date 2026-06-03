'use client'

import { useState, useTransition } from 'react'
import { addNotiz } from '@/app/actions/clients'
import NotizListe from './NotizListe'
import type { Notiz } from '@prisma/client'

type Chip = 'Freitext' | 'Sitzung' | 'Telefonat' | 'Hausaufgaben'

const CHIPS: Chip[] = ['Freitext', 'Sitzung', 'Telefonat', 'Hausaufgaben']

const KATEGORIE: Record<Chip, string | undefined> = {
  Freitext:    undefined,
  Sitzung:     'Sitzung',
  Telefonat:   'Telefonat',
  Hausaufgaben:'Hausaufgabe',
}

const ic = 'w-full px-3 py-2 bg-[#0a0a0a] border border-[#2e2e2e] rounded-lg text-sm text-[#efefef] placeholder:text-[#3a3a3a] focus:outline-none focus:border-[#555555] transition-colors resize-none'
const label = 'block text-[10px] text-[#444444] uppercase tracking-wider mb-1'

const INITIAL_SITZUNG    = { ziel: '', fortschritt: '', anpassungen: '', naechste: '' }
const INITIAL_TELEFONAT  = { thema: '', ergebnis: '', naechste: '' }

export default function NotizBlock({ clientId, notizen }: { clientId: string; notizen: Notiz[] }) {
  const [chip, setChip] = useState<Chip>('Freitext')
  const [pending, start] = useTransition()

  // Freitext
  const [freitext, setFreitext] = useState('')

  // Sitzung
  const [sitzung, setSitzung] = useState(INITIAL_SITZUNG)

  // Telefonat
  const [telefonat, setTelefonat] = useState(INITIAL_TELEFONAT)

  // Hausaufgaben
  const [aufgaben, setAufgaben] = useState(['', '', ''])

  function resetAll() {
    setFreitext('')
    setSitzung({ ...INITIAL_SITZUNG })
    setTelefonat({ ...INITIAL_TELEFONAT })
    setAufgaben(['', '', ''])
  }

  function assemble(): string {
    if (chip === 'Freitext') return freitext.trim()

    if (chip === 'Sitzung') {
      const parts: string[] = []
      if (sitzung.ziel.trim())        parts.push(`Ziel der Sitzung:\n${sitzung.ziel.trim()}`)
      if (sitzung.fortschritt.trim()) parts.push(`Fortschritt:\n${sitzung.fortschritt.trim()}`)
      if (sitzung.anpassungen.trim()) parts.push(`Anpassungen:\n${sitzung.anpassungen.trim()}`)
      if (sitzung.naechste.trim())    parts.push(`Nächste Schritte:\n${sitzung.naechste.trim()}`)
      return parts.join('\n\n')
    }

    if (chip === 'Telefonat') {
      const parts: string[] = ['Telefonat:']
      if (telefonat.thema.trim())   parts.push(`Thema: ${telefonat.thema.trim()}`)
      if (telefonat.ergebnis.trim()) parts.push(`Ergebnis:\n${telefonat.ergebnis.trim()}`)
      if (telefonat.naechste.trim()) parts.push(`Nächste Schritte:\n${telefonat.naechste.trim()}`)
      return parts.join('\n\n')
    }

    if (chip === 'Hausaufgaben') {
      const filled = aufgaben.map((a, i) => ({ n: i + 1, v: a.trim() })).filter(x => x.v)
      return 'Hausaufgaben:\n' + filled.map(x => `${x.n}. ${x.v}`).join('\n')
    }

    return ''
  }

  function canSubmit(): boolean {
    if (chip === 'Freitext') return freitext.trim().length > 0
    if (chip === 'Sitzung')  return Object.values(sitzung).some(v => v.trim())
    if (chip === 'Telefonat') return Object.values(telefonat).some(v => v.trim())
    if (chip === 'Hausaufgaben') return aufgaben.some(a => a.trim())
    return false
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const text = assemble()
    if (!text) return
    start(async () => {
      await addNotiz(clientId, text, KATEGORIE[chip])
      resetAll()
    })
  }

  // Active chip: color-mix derives the tinted border and background from --accent.
  // Inline style is necessary because Tailwind's /opacity modifier doesn't accept CSS vars.
  const chipCls = (c: Chip) =>
    `px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
      chip === c
        ? ''
        : 'border-[#2e2e2e] text-[#666666] hover:border-[#3a3a3a] hover:text-[#efefef] bg-transparent'
    }`

  const activeChipStyle = (c: Chip): React.CSSProperties | undefined =>
    chip === c ? {
      borderColor: 'color-mix(in srgb, var(--accent) 40%, transparent)',
      color:       'var(--accent)',
      background:  'color-mix(in srgb, var(--accent) 7%, transparent)',
    } : undefined

  return (
    <div className="bg-[#141414] border border-[#2e2e2e] rounded-xl p-5 md:p-6">
      <h3 className="text-xs font-semibold text-[#3a3a3a] uppercase tracking-wider mb-4 pb-3 border-b border-[#1c1c1c]">
        Sitzungsnotizen
      </h3>

      <form onSubmit={handleSubmit} className="mb-5">
        {/* Chip row */}
        <div className="flex gap-2 flex-wrap mb-4">
          {CHIPS.map(c => (
            <button key={c} type="button" onClick={() => setChip(c)}
              className={chipCls(c)} style={activeChipStyle(c)}>
              {c}
            </button>
          ))}
        </div>

        {/* Forms */}
        {chip === 'Freitext' && (
          <div className="space-y-3">
            <textarea
              rows={3}
              value={freitext}
              onChange={e => setFreitext(e.target.value)}
              placeholder="Notiz hinzufügen…"
              className={ic}
            />
          </div>
        )}

        {chip === 'Sitzung' && (
          <div className="space-y-3">
            <div>
              <label className={label}>Ziel der Sitzung</label>
              <textarea rows={2} className={ic} value={sitzung.ziel} onChange={e => setSitzung(s => ({ ...s, ziel: e.target.value }))} />
            </div>
            <div>
              <label className={label}>Fortschritt</label>
              <textarea rows={2} className={ic} value={sitzung.fortschritt} onChange={e => setSitzung(s => ({ ...s, fortschritt: e.target.value }))} />
            </div>
            <div>
              <label className={label}>Anpassungen</label>
              <textarea rows={2} className={ic} value={sitzung.anpassungen} onChange={e => setSitzung(s => ({ ...s, anpassungen: e.target.value }))} />
            </div>
            <div>
              <label className={label}>Nächste Schritte</label>
              <textarea rows={2} className={ic} value={sitzung.naechste} onChange={e => setSitzung(s => ({ ...s, naechste: e.target.value }))} />
            </div>
          </div>
        )}

        {chip === 'Telefonat' && (
          <div className="space-y-3">
            <div>
              <label className={label}>Thema</label>
              <textarea rows={2} className={ic} value={telefonat.thema} onChange={e => setTelefonat(s => ({ ...s, thema: e.target.value }))} />
            </div>
            <div>
              <label className={label}>Ergebnis</label>
              <textarea rows={2} className={ic} value={telefonat.ergebnis} onChange={e => setTelefonat(s => ({ ...s, ergebnis: e.target.value }))} />
            </div>
            <div>
              <label className={label}>Nächste Schritte</label>
              <textarea rows={2} className={ic} value={telefonat.naechste} onChange={e => setTelefonat(s => ({ ...s, naechste: e.target.value }))} />
            </div>
          </div>
        )}

        {chip === 'Hausaufgaben' && (
          <div className="space-y-3">
            <div className="space-y-2">
              {aufgaben.map((a, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-xs text-[#444444] w-5 shrink-0 text-right">{i + 1}.</span>
                  <input
                    type="text"
                    className={ic}
                    value={a}
                    onChange={e => setAufgaben(arr => arr.map((x, j) => j === i ? e.target.value : x))}
                  />
                  {aufgaben.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setAufgaben(arr => arr.filter((_, j) => j !== i))}
                      className="text-[#3a3a3a] hover:text-red-500 shrink-0 text-sm transition-colors"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
            {aufgaben.length < 10 && (
              <button
                type="button"
                onClick={() => setAufgaben(arr => [...arr, ''])}
                className="text-xs text-[#555555] hover:text-[#efefef] transition-colors"
              >
                + Aufgabe hinzufügen
              </button>
            )}
          </div>
        )}

        <div className="flex justify-end mt-4">
          <button
            type="submit"
            disabled={pending || !canSubmit()}
            className="bg-white hover:bg-[#e8e8e8] text-black text-sm font-semibold px-4 py-2 rounded-lg disabled:opacity-50 transition-colors"
          >
            {pending ? '…' : 'Speichern'}
          </button>
        </div>
      </form>

      <NotizListe clientId={clientId} notizen={notizen} />
    </div>
  )
}
