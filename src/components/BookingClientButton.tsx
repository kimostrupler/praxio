'use client'

import { useState, useEffect, useTransition } from 'react'
import { createPortal } from 'react-dom'
import { createClient } from '@/app/actions/clients'

const HERKUNFT_OPTIONS = ['Instagram', 'Website', 'Empfehlung', 'Flyer', 'Sonstiges']
const ic = 'w-full px-3 py-2.5 bg-[#0a0a0a] border border-[#2e2e2e] rounded-lg text-sm text-[#efefef] placeholder:text-[#3a3a3a] focus:outline-none focus:border-[#555555] focus:ring-1 focus:ring-white/10 transition-colors'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-[#666666] mb-1.5">{label}</label>
      {children}
    </div>
  )
}

function splitName(name: string | null): { vorname: string; nachname: string } {
  if (!name) return { vorname: '', nachname: '' }
  const parts = name.trim().split(' ')
  if (parts.length === 1) return { vorname: parts[0], nachname: '' }
  return { vorname: parts[0], nachname: parts.slice(1).join(' ') }
}

export default function BookingClientButton({
  name,
  email,
  compact = false,
}: {
  name: string | null
  email: string | null
  compact?: boolean
}) {
  const [open, setOpen] = useState(false)
  const { vorname: initV, nachname: initN } = splitName(name)
  const [vorname, setVorname] = useState(initV)
  const [nachname, setNachname] = useState(initN)
  const [emailVal, setEmailVal] = useState(email ?? '')
  const [herkunft, setHerkunft] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [duplicate, setDuplicate] = useState<{ name: string; id: string } | null>(null)
  const [isPending, start] = useTransition()

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  function handleSubmit(e: React.FormEvent, force = false) {
    e.preventDefault()
    setError(null)
    setDuplicate(null)
    start(async () => {
      const result = await createClient(
        { vorname, nachname, email: emailVal, adresse: '', telefon: '', beruf: '', geburtsdatum: '', geschlecht: '', herkunft },
        force
      )
      if (!result) return
      if ('duplicate' in result && result.duplicate) {
        setDuplicate({ name: result.existingName!, id: result.existingId! })
      } else if ('error' in result) {
        setError(result.error ?? null)
      }
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={compact
          ? 'text-[10px] text-[#efefef] border border-[#3a3a3a] hover:bg-[#1c1c1c] px-2 py-0.5 rounded transition-colors shrink-0'
          : 'text-xs text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors shrink-0'
        }
      >
        {compact ? '+ Klient' : 'Als Klient anlegen'}
      </button>

      {open && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.82)' }}
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-[#141414] border border-[#2e2e2e] rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div
              className="flex items-center justify-between px-6 py-4 border-b border-[#2e2e2e] sticky top-0 bg-[#141414] z-10"
              style={{ boxShadow: 'none' }}
            >
              <div>
                <h2 className="text-base font-semibold text-[#efefef]">Klient anlegen</h2>
                {email && <p className="text-[10px] text-[#555555] mt-0.5">Buchung: {email}</p>}
              </div>
              <button type="button" onClick={() => setOpen(false)}
                className="text-[#444444] hover:text-[#efefef] transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <form onSubmit={e => handleSubmit(e)} className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Vorname *">
                  <input className={ic} value={vorname} onChange={e => setVorname(e.target.value)}
                    placeholder="Anna" required />
                </Field>
                <Field label="Nachname *">
                  <input className={ic} value={nachname} onChange={e => setNachname(e.target.value)}
                    placeholder="Müller" required />
                </Field>
              </div>
              <Field label="E-Mail">
                <input type="email" className={ic} value={emailVal} onChange={e => setEmailVal(e.target.value)}
                  placeholder="anna@beispiel.ch" />
              </Field>
              <Field label="Wie wurde der Klient aufmerksam?">
                <div className="relative">
                  <select value={herkunft} onChange={e => setHerkunft(e.target.value)}
                    className={`${ic} appearance-none pr-8 cursor-pointer`}>
                    <option value="">— Unbekannt —</option>
                    {HERKUNFT_OPTIONS.map(o => <option key={o} value={o} className="bg-[#141414]">{o}</option>)}
                  </select>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#555555]">
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </div>
              </Field>

              {error && (
                <p className="text-xs text-red-400 bg-red-950/20 border border-red-900/30 px-3 py-2 rounded-lg">{error}</p>
              )}

              {duplicate && (
                <div className="bg-orange-950/30 border border-orange-900/40 rounded-xl px-4 py-3.5 space-y-3">
                  <p className="text-sm font-medium text-orange-400">Mögliches Duplikat</p>
                  <p className="text-xs text-orange-400/70">
                    Es gibt bereits einen Klienten namens <strong>{duplicate.name}</strong>. Trotzdem anlegen?
                  </p>
                  <div className="flex gap-2">
                    <button type="button" onClick={e => handleSubmit(e as any, true)} disabled={isPending}
                      className="px-3 py-1.5 text-xs font-semibold bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 border border-orange-900/40 rounded-lg transition-colors disabled:opacity-50">
                      {isPending ? 'Erstellen…' : 'Trotzdem erstellen'}
                    </button>
                    <button type="button" onClick={() => setDuplicate(null)}
                      className="px-3 py-1.5 text-xs text-[#666666] border border-[#2e2e2e] hover:bg-[#1c1c1c] rounded-lg transition-colors">
                      Abbrechen
                    </button>
                  </div>
                </div>
              )}

              {!duplicate && (
                <button type="submit" disabled={isPending}
                  className="bg-white hover:bg-[#e8e8e8] disabled:opacity-50 text-black font-semibold text-sm px-6 py-2.5 rounded-lg transition-colors">
                  {isPending ? 'Speichern…' : 'Klient anlegen'}
                </button>
              )}
            </form>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
