'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import { useSettings, applyAccentTokens, ACCENT_PRESETS } from '@/components/SettingsProvider'
import { signOut, useSession } from 'next-auth/react'
import { updateEmail, updatePassword, uploadLogo, removeLogo, updateCalcomApiKey, updateVertragLeistungen } from '@/app/actions/account'
import SystemControls from '@/components/SystemControls'

// ── Reusable primitives ───────────────────────────────────────────────────────

function Section({ title, description, children }: {
  title: string; description?: string; children: React.ReactNode
}) {
  return (
    <div className="bg-[#141414] border border-[#2e2e2e] rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-[#1c1c1c]">
        <h2 className="text-sm font-semibold text-[#efefef]">{title}</h2>
        {description && <p className="text-xs text-[#444444] mt-0.5">{description}</p>}
      </div>
      <div className="divide-y divide-[#1c1c1c]">{children}</div>
    </div>
  )
}

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-4">
      <div className="min-w-0">
        <p className="text-sm text-[#efefef]">{label}</p>
        {hint && <p className="text-xs text-[#444444] mt-0.5">{hint}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

function RowFull({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="px-5 py-4 space-y-2">
      <div>
        <p className="text-sm text-[#efefef]">{label}</p>
        {hint && <p className="text-xs text-[#444444] mt-0.5">{hint}</p>}
      </div>
      {children}
    </div>
  )
}

const inputCls = 'w-full px-3 py-2 bg-[#0a0a0a] border border-[#2e2e2e] rounded-lg text-sm text-[#efefef] placeholder:text-[#3a3a3a] focus:outline-none focus:border-[#555555] transition-colors'

// ── AccentPicker ──────────────────────────────────────────────────────────────
// Hover = live preview (direct CSS var manipulation, no React state).
// Click = persist to settings store.
// Mouse-leave from the picker grid = restore saved selection.

function AccentPicker() {
  const { settings, isDark, update } = useSettings()
  const [hexInput, setHexInput] = useState('')

  useEffect(() => {
    if (/^#[0-9a-fA-F]{6}$/.test(settings.accentPreset)) {
      setHexInput(settings.accentPreset.slice(1).toLowerCase())
    }
  }, [settings.accentPreset])

  const isHex = (v: string) => /^[0-9a-fA-F]{6}$/i.test(v)
  const isCustomActive = /^#[0-9a-fA-F]{6}$/.test(settings.accentPreset)

  function handleHexChange(raw: string) {
    const v = raw.replace(/^#/, '').slice(0, 6)
    setHexInput(v)
    if (isHex(v)) applyAccentTokens('#' + v, isDark)
  }

  function commitHex() {
    if (isHex(hexInput)) update('accentPreset', '#' + hexInput.toLowerCase())
    else applyAccentTokens(settings.accentPreset, isDark)
  }

  return (
    <div onMouseLeave={() => applyAccentTokens(settings.accentPreset, isDark)}>
      <div className="flex flex-wrap gap-2.5">
        {ACCENT_PRESETS.map(preset => {
          const active = settings.accentPreset === preset.id
          return (
            <button
              key={preset.id}
              type="button"
              aria-label={preset.name}
              aria-pressed={active}
              title={preset.name}
              onMouseEnter={() => applyAccentTokens(preset.id, isDark)}
              onClick={() => { update('accentPreset', preset.id); setHexInput('') }}
              className="relative w-8 h-8 rounded-full transition-transform hover:scale-110 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-1"
              style={{
                background: preset.swatch,
                boxShadow: active
                  ? `0 0 0 2px var(--card), 0 0 0 4px ${preset.swatch}`
                  : '0 1px 3px rgba(0,0,0,0.30)',
              }}
            >
              {active && (
                <svg
                  className="absolute inset-0 m-auto drop-shadow-sm"
                  width="11" height="11"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ color: '#ffffff', filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.4))' }}
                >
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              )}
            </button>
          )
        })}

        {/* Custom color swatch — shown when a custom hex is the active preset */}
        {isCustomActive && (
          <div
            className="relative w-8 h-8 rounded-full shrink-0"
            style={{
              background: settings.accentPreset,
              boxShadow: `0 0 0 2px var(--card), 0 0 0 4px ${settings.accentPreset}`,
            }}
          >
            <svg
              className="absolute inset-0 m-auto drop-shadow-sm"
              width="11" height="11"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ color: '#ffffff', filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.4))' }}
            >
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
        )}
      </div>

      {/* Custom hex input */}
      <div className="flex items-center gap-2 mt-3">
        <div
          className="w-5 h-5 rounded shrink-0 transition-colors"
          style={{
            background: isHex(hexInput) ? '#' + hexInput : 'transparent',
            border: '1px solid #2e2e2e',
          }}
        />
        <div className="flex items-center bg-[#0a0a0a] border border-[#2e2e2e] rounded-lg">
          <span className="pl-2.5 text-xs text-[#444444] font-mono select-none">#</span>
          <input
            type="text"
            value={hexInput}
            onChange={e => handleHexChange(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') commitHex() }}
            onBlur={commitHex}
            placeholder="e89a3c"
            maxLength={6}
            spellCheck={false}
            className="py-1.5 px-1 pr-2.5 w-20 bg-transparent text-sm text-[#efefef] placeholder:text-[#3a3a3a] focus:outline-none font-mono"
          />
        </div>
        <span className="text-[10px] text-[#3a3a3a] leading-none">Eigene Farbe</span>
      </div>
    </div>
  )
}

// ── Stepper ───────────────────────────────────────────────────────────────────

function Stepper({ value, onChange, min, max, unit }: {
  value: number; onChange: (v: number) => void; min: number; max: number; unit?: string
}) {
  return (
    <div className="flex items-center gap-2">
      <button type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className="w-7 h-7 flex items-center justify-center bg-[#1c1c1c] hover:bg-[#2e2e2e] disabled:opacity-30 border border-[#2e2e2e] rounded-lg text-[#efefef] text-sm transition-colors">
        −
      </button>
      <span className="w-12 text-center text-sm font-medium text-[#efefef]">
        {value}{unit}
      </span>
      <button type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className="w-7 h-7 flex items-center justify-center bg-[#1c1c1c] hover:bg-[#2e2e2e] disabled:opacity-30 border border-[#2e2e2e] rounded-lg text-[#efefef] text-sm transition-colors">
        +
      </button>
    </div>
  )
}

// ── Logo upload ───────────────────────────────────────────────────────────────

function LogoSection() {
  const [logoUrl, setLogoUrl]   = useState<string | null>(null)
  const [loading, setLoading]   = useState(false)
  const [msg, setMsg]           = useState<{ ok: boolean; text: string } | null>(null)
  const fileRef                 = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/logo', { method: 'HEAD' }).then(r => {
      if (r.ok) setLogoUrl('/api/logo?t=' + Date.now())
    }).catch(() => {})
  }, [])

  async function handleFile(file: File) {
    setMsg(null)
    if (file.size > 500_000) {
      setMsg({ ok: false, text: 'Datei zu gross (max. 500 KB).' })
      return
    }
    if (!file.type.startsWith('image/')) {
      setMsg({ ok: false, text: 'Nur Bilddateien erlaubt (PNG, JPEG).' })
      return
    }
    setLoading(true)
    const reader = new FileReader()
    reader.onload = async e => {
      const dataUrl = e.target?.result as string
      const r = await uploadLogo(dataUrl)
      if (r.error) {
        setMsg({ ok: false, text: r.error })
      } else {
        setLogoUrl(dataUrl)
        setMsg({ ok: true, text: 'Logo gespeichert.' })
      }
      setLoading(false)
    }
    reader.readAsDataURL(file)
  }

  async function handleRemove() {
    setLoading(true)
    setMsg(null)
    const r = await removeLogo()
    if (r.error) {
      setMsg({ ok: false, text: r.error })
    } else {
      setLogoUrl(null)
      setMsg({ ok: true, text: 'Logo entfernt.' })
    }
    setLoading(false)
  }

  return (
    <div className="px-5 py-4 space-y-3">
      <div>
        <p className="text-sm text-[#efefef]">Logo</p>
        <p className="text-xs text-[#444444] mt-0.5">Wird in PDF-Exporten angezeigt (Rechnungen, Verträge, Berichte). PNG oder JPEG, max. 500 KB.</p>
      </div>

      {logoUrl && (
        <div className="flex items-center gap-3 px-3 py-3 bg-[#0a0a0a] rounded-lg border border-[#2e2e2e]">
          <img src={logoUrl} alt="Logo" className="h-12 max-w-[160px] object-contain" />
          <span className="text-xs text-[#444444]">Aktuelles Logo</span>
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        <button type="button" onClick={() => fileRef.current?.click()} disabled={loading}
          className="text-xs text-[#666666] border border-[#2e2e2e] hover:bg-[#1c1c1c] px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40">
          {loading ? 'Speichern…' : logoUrl ? 'Logo ändern' : 'Logo hochladen'}
        </button>
        {logoUrl && (
          <button type="button" onClick={handleRemove} disabled={loading}
            className="text-xs text-red-500 border border-red-900/30 hover:bg-red-950/20 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40">
            Entfernen
          </button>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={e => {
          const f = e.target.files?.[0]
          if (f) handleFile(f)
          e.target.value = ''
        }}
      />

      {msg && (
        <p className={`text-xs ${msg.ok ? 'text-emerald-400' : 'text-red-400'}`}>{msg.text}</p>
      )}
    </div>
  )
}

// ── Cal.com integration ───────────────────────────────────────────────────────

function CalcomSection() {
  const [apiKey, setApiKey]         = useState('')
  const [configured, setConfigured] = useState(false)
  const [pending, start]            = useTransition()
  const [msg, setMsg]               = useState<{ ok: boolean; text: string } | null>(null)

  useEffect(() => {
    fetch('/api/calcom/status')
      .then(r => r.json())
      .then(d => setConfigured(d.configured))
      .catch(() => {})
  }, [])

  function handleSave() {
    setMsg(null)
    start(async () => {
      const r = await updateCalcomApiKey(apiKey)
      if (r.error) {
        setMsg({ ok: false, text: r.error })
      } else {
        setMsg({ ok: true, text: 'API-Key gespeichert. Termine werden ab sofort geladen.' })
        setConfigured(!!apiKey.trim())
        setApiKey('')
      }
    })
  }

  const ic = 'w-full px-3 py-2 bg-[#0a0a0a] border border-[#2e2e2e] rounded-lg text-sm text-[#efefef] placeholder:text-[#3a3a3a] focus:outline-none focus:border-[#555555] transition-colors font-mono'

  return (
    <Section title="Cal.com" description="API-Key verbinden – Buchungen im Dashboard anzeigen">
      <div className="px-5 py-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${configured ? 'bg-emerald-400' : 'bg-[#3a3a3a]'}`} />
          <span className="text-xs text-[#444444]">
            {configured ? 'Verbunden mit cal.com' : 'Nicht verbunden'}
          </span>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs text-[#666666]">
            API-Key {configured ? '(neuen Key eingeben zum Überschreiben)' : ''}
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            placeholder="cal_live_…"
            className={ic}
            autoComplete="off"
          />
          <p className="text-[10px] text-[#3a3a3a]">
            Zu finden unter: app.cal.com → Einstellungen → Entwickler → API-Keys
          </p>
        </div>

        {msg && (
          <p className={`text-xs ${msg.ok ? 'text-emerald-400' : 'text-red-400'}`}>{msg.text}</p>
        )}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={pending || !apiKey.trim()}
            className="bg-white hover:bg-[#e8e8e8] disabled:opacity-40 text-black text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
            {pending ? 'Speichern…' : 'Speichern'}
          </button>
          {configured && (
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                start(async () => {
                  await updateCalcomApiKey('')
                  setConfigured(false)
                  setMsg({ ok: true, text: 'Cal.com-Verbindung entfernt.' })
                })
              }}
              className="text-xs text-red-500 border border-red-900/30 hover:bg-red-950/20 px-3 py-2 rounded-lg transition-colors disabled:opacity-40">
              Trennen
            </button>
          )}
        </div>
      </div>
    </Section>
  )
}

// ── Vertragsvorlage ───────────────────────────────────────────────────────────

const DEFAULT_LEISTUNGEN = `Ernährungs- und Trainingsberatung, inkl. individuellem Ernährungsplan, Trainingsplan und regelmässiger Betreuung im vereinbarten Umfang.

Die Sitzungen finden nach gegenseitiger Vereinbarung statt (persönlich, telefonisch oder per Videokonferenz). Die Vergütung wird individuell festgelegt und vor Beginn der Zusammenarbeit schriftlich bestätigt.

Termine sind mindestens 24 Stunden im Voraus abzusagen. Bei kurzfristiger Absage oder Nichterscheinen wird die Sitzung mit CHF 100.– in Rechnung gestellt.`

function VertragSection() {
  const [text, setText]   = useState(DEFAULT_LEISTUNGEN)
  const [pending, start]  = useTransition()
  const [msg, setMsg]     = useState<{ ok: boolean; text: string } | null>(null)

  useEffect(() => {
    fetch('/api/vertrag/leistungen').then(r => r.text()).then(t => { if (t) setText(t) }).catch(() => {})
  }, [])

  function handleSave() {
    setMsg(null)
    start(async () => {
      const r = await updateVertragLeistungen(text)
      if (r.error) setMsg({ ok: false, text: r.error })
      else setMsg({ ok: true, text: 'Vertragstext gespeichert.' })
    })
  }

  return (
    <Section title="Vertragsvorlage" description="§1 Leistungsbeschreibung im Coaching-Vertrag (PDF)">
      <div className="px-5 py-4 space-y-3">
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          rows={6}
          className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#2e2e2e] rounded-lg text-sm text-[#efefef] placeholder:text-[#3a3a3a] focus:outline-none focus:border-[#555555] transition-colors resize-y font-sans"
        />
        <p className="text-[10px] text-[#3a3a3a]">Erscheint unter §1 im Coaching-Vertrag PDF. Wird pro Klient über «Vertrag PDF» generiert.</p>
        {msg && <p className={`text-xs ${msg.ok ? 'text-emerald-400' : 'text-red-400'}`}>{msg.text}</p>}
        <div className="flex gap-2">
          <button type="button" onClick={handleSave} disabled={pending}
            className="bg-white hover:bg-[#e8e8e8] disabled:opacity-40 text-black text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
            {pending ? 'Speichern…' : 'Speichern'}
          </button>
          <button type="button" onClick={() => setText(DEFAULT_LEISTUNGEN)}
            className="text-xs text-[#666666] border border-[#2e2e2e] hover:bg-[#1c1c1c] px-3 py-2 rounded-lg transition-colors">
            Standardtext
          </button>
        </div>
      </div>
    </Section>
  )
}

// ── Credential forms ─────────────────────────────────────────────────────────

function CredentialSection({ currentEmail, isAdmin }: { currentEmail: string; isAdmin: boolean }) {
  const [panel, setPanel]   = useState<'email' | 'password' | null>(null)

  // Email form
  const [newEmail, setNewEmail]         = useState('')
  const [emailPw, setEmailPw]           = useState('')
  const [emailMsg, setEmailMsg]         = useState<{ ok: boolean; text: string } | null>(null)
  const [emailPending, startEmail]      = useTransition()

  // Password form
  const [curPw, setCurPw]               = useState('')
  const [newPw, setNewPw]               = useState('')
  const [confirmPw, setConfirmPw]       = useState('')
  const [pwMsg, setPwMsg]               = useState<{ ok: boolean; text: string } | null>(null)
  const [pwPending, startPw]            = useTransition()

  const ic = 'w-full px-3 py-2 bg-[#0a0a0a] border border-[#2e2e2e] rounded-lg text-sm text-[#efefef] placeholder:text-[#3a3a3a] focus:outline-none focus:border-[#555555] transition-colors'

  function toggle(p: 'email' | 'password') {
    setPanel(prev => prev === p ? null : p)
    setEmailMsg(null); setPwMsg(null)
  }

  function handleEmailSubmit() {
    setEmailMsg(null)
    startEmail(async () => {
      const r = await updateEmail(emailPw, newEmail)
      if (r.error) {
        setEmailMsg({ ok: false, text: r.error })
      } else {
        setEmailMsg({ ok: true, text: 'E-Mail wurde geändert. Bitte melde dich erneut an.' })
        setNewEmail(''); setEmailPw('')
        setTimeout(() => signOut({ callbackUrl: '/login' }), 2000)
      }
    })
  }

  function handlePwSubmit() {
    setPwMsg(null)
    startPw(async () => {
      const r = await updatePassword(curPw, newPw, confirmPw)
      if (r.error) {
        setPwMsg({ ok: false, text: r.error })
      } else {
        setPwMsg({ ok: true, text: 'Passwort wurde geändert. Bitte melde dich erneut an.' })
        setCurPw(''); setNewPw(''); setConfirmPw('')
        setTimeout(() => signOut({ callbackUrl: '/login' }), 2000)
      }
    })
  }

  return (
    <Section title="Zugangsdaten" description="E-Mail-Adresse und Passwort für die Anmeldung">
      {/* Current email display */}
      <Row label="Aktuelle E-Mail">
        <span className="text-xs text-[#444444] font-mono">{currentEmail}</span>
      </Row>

      {/* E-Mail ändern — ADMIN only */}
      {isAdmin && (
      <div>
        <button type="button" onClick={() => toggle('email')}
          className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-[#1c1c1c] transition-colors text-left">
          <span className="text-sm text-[#efefef]">E-Mail ändern</span>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            className={`text-[#3a3a3a] transition-transform duration-200 ${panel === 'email' ? 'rotate-180' : ''}`}>
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>

        {panel === 'email' && (
          <div className="px-5 pb-5 space-y-3 border-t border-[#1c1c1c] pt-4">
            <div>
              <label className="block text-xs text-[#666666] mb-1.5">Neue E-Mail-Adresse</label>
              <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)}
                placeholder="neue@email.de" className={ic} autoComplete="off" />
            </div>
            <div>
              <label className="block text-xs text-[#666666] mb-1.5">Aktuelles Passwort zur Bestätigung</label>
              <input type="password" value={emailPw} onChange={e => setEmailPw(e.target.value)}
                placeholder="••••••••" className={ic} autoComplete="current-password" />
            </div>
            {emailMsg && (
              <p className={`text-xs ${emailMsg.ok ? 'text-emerald-400' : 'text-red-400'}`}>
                {emailMsg.text}
              </p>
            )}
            <button type="button" onClick={handleEmailSubmit}
              disabled={emailPending || !newEmail || !emailPw}
              className="bg-white hover:bg-[#e8e8e8] disabled:opacity-40 text-black text-sm font-semibold px-5 py-2 rounded-lg transition-colors">
              {emailPending ? 'Speichern…' : 'E-Mail speichern'}
            </button>
          </div>
        )}
      </div>
      )}

      {/* Passwort ändern */}
      <div>
        <button type="button" onClick={() => toggle('password')}
          className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-[#1c1c1c] transition-colors text-left">
          <span className="text-sm text-[#efefef]">Passwort ändern</span>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            className={`text-[#3a3a3a] transition-transform duration-200 ${panel === 'password' ? 'rotate-180' : ''}`}>
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>

        {panel === 'password' && (
          <div className="px-5 pb-5 space-y-3 border-t border-[#1c1c1c] pt-4">
            <div>
              <label className="block text-xs text-[#666666] mb-1.5">Aktuelles Passwort</label>
              <input type="password" value={curPw} onChange={e => setCurPw(e.target.value)}
                placeholder="••••••••" className={ic} autoComplete="current-password" />
            </div>
            <div>
              <label className="block text-xs text-[#666666] mb-1.5">Neues Passwort</label>
              <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)}
                placeholder="Mindestens 8 Zeichen" className={ic} autoComplete="new-password" />
            </div>
            <div>
              <label className="block text-xs text-[#666666] mb-1.5">Neues Passwort bestätigen</label>
              <input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)}
                placeholder="••••••••" className={ic} autoComplete="new-password" />
            </div>
            {pwMsg && (
              <p className={`text-xs ${pwMsg.ok ? 'text-emerald-400' : 'text-red-400'}`}>
                {pwMsg.text}
              </p>
            )}
            <button type="button" onClick={handlePwSubmit}
              disabled={pwPending || !curPw || !newPw || !confirmPw}
              className="bg-white hover:bg-[#e8e8e8] disabled:opacity-40 text-black text-sm font-semibold px-5 py-2 rounded-lg transition-colors">
              {pwPending ? 'Speichern…' : 'Passwort ändern'}
            </button>
          </div>
        )}
      </div>
    </Section>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { settings, isDark, update } = useSettings()
  const { data: session } = useSession()
  const isAdmin = (session?.user as any)?.role === 'ADMIN'

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">Einstellungen</h1>
        <p className="text-xs text-[#3a3a3a] mt-0.5">Passe die App nach deinen Wünschen an</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">

      {/* LEFT column */}
      <div className="space-y-5">

      {/* ── Darstellung ── */}
      <Section title="Darstellung" description="Farbschema und Erscheinungsbild der App">

        {/* Theme */}
        <div className="px-5 py-4">
          <p className="text-sm text-[#efefef] mb-3">Thema</p>
          <div className="grid grid-cols-3 gap-2">
            {([
              { value: 'light',  label: 'Hell',    icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <circle cx="12" cy="12" r="5"/>
                  <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                  <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                </svg>
              )},
              { value: 'system', label: 'System',  icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <rect x="2" y="3" width="20" height="14" rx="2"/>
                  <line x1="8" y1="21" x2="16" y2="21"/>
                  <line x1="12" y1="17" x2="12" y2="21"/>
                </svg>
              )},
              { value: 'dark',   label: 'Dunkel',  icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
              )},
            ] as const).map(opt => (
              <button key={opt.value} type="button"
                onClick={() => update('theme', opt.value)}
                className={`flex flex-col items-center gap-2 px-3 py-4 rounded-xl border transition-all ${
                  settings.theme === opt.value
                    ? 'bg-white text-black border-transparent'
                    : 'bg-[#0a0a0a] text-[#666666] border-[#2e2e2e] hover:border-[#3a3a3a] hover:text-[#efefef]'
                }`}>
                {opt.icon}
                <span className="text-xs font-medium">{opt.label}</span>
              </button>
            ))}
          </div>
          <p className="text-[10px] text-[#3a3a3a] mt-2.5">
            Aktuell: <span className="text-[#555555]">{isDark ? 'Dunkelmodus' : 'Hellmodus'} aktiv</span>
          </p>
        </div>

        {/* Accent color picker */}
        <div className="px-5 py-4 border-t border-[#1c1c1c]">
          <p className="text-sm text-[#efefef] mb-1">Akzentfarbe</p>
          <p className="text-xs text-[#444444] mb-3">
            Hover zum Vorschau · Klick zum Speichern
          </p>
          <AccentPicker />
        </div>
      </Section>

      {/* ── Training-Standards ── */}
      <Section title="Training-Standards" description="Standardwerte beim Hinzufügen einer Übung zu einem Trainingsplan">
        <Row label="Sätze" hint="Standard-Satzzahl für neue Übungen">
          <Stepper value={settings.trainSaetze} onChange={v => update('trainSaetze', v)} min={1} max={10} />
        </Row>
        <Row label="Wiederholungen" hint="Standard-Wdh. für neue Übungen">
          <Stepper value={settings.trainWdh} onChange={v => update('trainWdh', v)} min={1} max={30} />
        </Row>
        <Row label="Pause" hint="Standard-Pause zwischen den Sätzen">
          <Stepper value={settings.trainPause} onChange={v => update('trainPause', v)} min={15} max={300} unit="s" />
        </Row>
      </Section>

      {/* ── Klienten ── */}
      <Section title="Klienten" description="Standardverhalten bei neuen Klienten">
        <div className="px-5 py-4">
          <p className="text-sm text-[#efefef] mb-3">Standard-Status für neue Klienten</p>
          <div className="flex gap-2">
            {([
              { v: 'AKTIV',    l: 'Aktiv',    c: 'emerald' },
              { v: 'PAUSIERT', l: 'Pausiert',  c: 'orange'  },
              { v: 'INAKTIV',  l: 'Inaktiv',   c: 'neutral' },
            ] as const).map(opt => (
              <button key={opt.v} type="button"
                onClick={() => update('clientDefault', opt.v)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  settings.clientDefault === opt.v
                    ? 'bg-white text-black border-transparent'
                    : 'bg-[#0a0a0a] text-[#666666] border-[#2e2e2e] hover:text-[#efefef] hover:border-[#3a3a3a]'
                }`}>
                {opt.l}
              </button>
            ))}
          </div>
        </div>
      </Section>

      {/* ── System ── */}
      <Section title="System" description="App-Status und Steuerung">
        <div className="px-0 py-0">
          <SystemControls />
        </div>
      </Section>

      {/* ── Über die App ── */}
      <Section title="Über die App">
        <Row label="Version" hint="FitAllCoach Praxis">
          <span className="text-xs text-[#444444]">1.0.0</span>
        </Row>
        <Row label="Datenbank" hint="PostgreSQL via Prisma">
          <span className="text-xs text-[#444444]">Verbunden</span>
        </Row>
        {isAdmin && (
        <div className="px-5 py-4">
          <p className="text-sm text-[#efefef] mb-1">Daten exportieren</p>
          <p className="text-xs text-[#444444] mb-3">Lade alle Klientendaten als JSON-Datei herunter</p>
          <a href="/api/export/clients"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs text-[#666666] border border-[#2e2e2e] hover:border-[#3a3a3a] hover:text-[#efefef] rounded-lg transition-colors">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Klienten exportieren
          </a>
        </div>
        )}
      </Section>

      </div>{/* end LEFT column */}

      {/* RIGHT column */}
      <div className="space-y-5">

      {/* ── Praxis ── ADMIN only */}
      {isAdmin && (
      <Section title="Praxis" description="Name und Untertitel erscheinen in der Navigation und in PDFs">
        <LogoSection />
        <RowFull label="Praxisname" hint="Fallback-Text wenn kein Logo hochgeladen ist">
          <input type="text" value={settings.praxisName}
            onChange={e => update('praxisName', e.target.value)}
            placeholder="FitAllCoach"
            className={inputCls} />
        </RowFull>
        <RowFull label="Coach-Name / Untertitel">
          <input type="text" value={settings.coachName}
            onChange={e => update('coachName', e.target.value)}
            placeholder="by Joelle"
            className={inputCls} />
        </RowFull>
      </Section>
      )}

      {/* ── Cal.com ── ADMIN only */}
      {isAdmin && <CalcomSection />}

      {/* ── Zugangsdaten ── */}
      <CredentialSection currentEmail={session?.user?.email ?? 'admin@praxis.de'} isAdmin={isAdmin} />

      {/* ── Vertragsvorlage ── ADMIN only */}
      {isAdmin && <VertragSection />}

      {/* ── Rechnungen ── ADMIN only */}
      {isAdmin && (
      <Section title="Rechnungen" description="Adresse, Bankverbindung und MwSt-Nr. für PDF-Rechnungen">
        <Row label="Rechnungs-Einstellungen" hint="Kontaktdaten, IBAN und MwSt-Nr. bearbeiten">
          <a href="/settings/kontakt"
            className="text-xs text-[#666666] border border-[#2e2e2e] hover:bg-[#1c1c1c] px-3 py-1.5 rounded-lg transition-colors">
            Bearbeiten →
          </a>
        </Row>
        <RowFull label="Monatsziel (CHF)" hint="Zeigt einen Fortschrittsbalken auf dem Dashboard. 0 = deaktiviert.">
          <input
            type="number"
            min={0}
            step={100}
            value={settings.revenueGoal}
            onChange={e => update('revenueGoal', Math.max(0, Number(e.target.value)))}
            className={inputCls}
          />
        </RowFull>
      </Section>
      )}

      {/* ── Konto ── */}
      <Section title="Konto">
        <Row label="Angemeldet als">
          <span className="text-xs text-[#444444] font-mono">{session?.user?.email ?? '—'}</span>
        </Row>
        <div className="px-5 py-4">
          <button type="button"
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm text-red-500 border border-red-900/30 hover:bg-red-950/20 rounded-lg transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Abmelden
          </button>
        </div>
      </Section>


      {/* ── Benutzerverwaltung ── */}
      {(session?.user as any)?.role === 'ADMIN' && (
        <Section title="Benutzerverwaltung" description="Zugänge und Rollen verwalten">
          <Row label="Benutzer verwalten" hint="Passwörter zurücksetzen, Rollen ändern, Zugänge aktivieren">
            <a href="/settings/benutzer"
              className="text-xs text-[#666666] border border-[#2e2e2e] hover:bg-[#1c1c1c] px-3 py-1.5 rounded-lg transition-colors">
              Öffnen →
            </a>
          </Row>
          <Row label="Audit-Log" hint="Protokoll aller sicherheitsrelevanten Systemereignisse">
            <a href="/settings/audit"
              className="text-xs text-[#666666] border border-[#2e2e2e] hover:bg-[#1c1c1c] px-3 py-1.5 rounded-lg transition-colors">
              Öffnen →
            </a>
          </Row>
        </Section>
      )}

      </div>{/* end RIGHT column */}

      </div>{/* end grid */}
    </div>
  )
}
