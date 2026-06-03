'use client'

import { useState, useEffect } from 'react'

type Status = 'idle' | 'loading' | 'ok' | 'error'

function useAction(fn: () => Promise<Response>) {
  const [status, setStatus] = useState<Status>('idle')
  const [msg, setMsg] = useState('')

  async function run() {
    setStatus('loading')
    setMsg('')
    try {
      const res = await fn()
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { setStatus('error'); setMsg(data.error ?? 'Fehler'); return }
      setStatus('ok')
      setMsg(data.msg ?? '')
    } catch {
      setStatus('error')
      setMsg('Verbindung fehlgeschlagen')
    }
    setTimeout(() => setStatus('idle'), 4000)
  }

  return { status, msg, run }
}

function ActionButton({ label, description, onClick, status, destructive }: {
  label: string
  description: string
  onClick: () => void
  status: Status
  destructive?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-[#1c1c1c] last:border-0">
      <div>
        <p className="text-sm text-[#efefef]">{label}</p>
        <p className="text-xs text-[#444444] mt-0.5">{description}</p>
        {status === 'ok'    && <p className="text-xs text-emerald-400 mt-1">✓ Erledigt</p>}
        {status === 'error' && <p className="text-xs text-red-400 mt-1">✗ Fehler aufgetreten</p>}
      </div>
      <button
        type="button"
        onClick={onClick}
        disabled={status === 'loading'}
        className={`shrink-0 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors disabled:opacity-40 ${
          destructive
            ? 'text-red-400 border-red-900/40 hover:bg-red-950/20'
            : 'text-[#efefef] border-[#2e2e2e] hover:bg-[#1c1c1c]'
        }`}>
        {status === 'loading' ? (
          <span className="flex items-center gap-1.5">
            <svg className="animate-spin" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
            </svg>
            Läuft…
          </span>
        ) : label}
      </button>
    </div>
  )
}

// Restart button has inline confirm step (window.confirm doesn't work in iOS PWA)
function RestartButton() {
  const [phase, setPhase] = useState<'idle' | 'confirm' | 'loading' | 'done'>('idle')
  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    if (phase !== 'done') return
    if (countdown <= 0) { window.location.reload(); return }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [phase, countdown])

  async function handleConfirm() {
    setPhase('loading')
    try {
      const res = await fetch('/api/admin/restart', { method: 'POST' })
      if (!res.ok) { setPhase('idle'); return }
      setPhase('done')
      setCountdown(5)
    } catch {
      setPhase('idle')
    }
  }

  return (
    <div className="flex items-center justify-between gap-4 px-5 py-4">
      <div>
        <p className="text-sm text-[#efefef]">App neu starten</p>
        <p className="text-xs text-[#444444] mt-0.5">
          {phase === 'done'
            ? `Server restartet — Seite wird in ${countdown}s neu geladen…`
            : 'Server neu starten — dauert ca. 5 Sekunden'}
        </p>
        {phase === 'confirm' && (
          <p className="text-xs text-orange-400 mt-1">Wirklich neu starten?</p>
        )}
      </div>

      <div className="flex gap-2 shrink-0">
        {phase === 'confirm' && (
          <button type="button" onClick={() => setPhase('idle')}
            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-[#2e2e2e] text-[#666666] hover:bg-[#1c1c1c] transition-colors">
            Abbrechen
          </button>
        )}
        <button
          type="button"
          disabled={phase === 'loading' || phase === 'done'}
          onClick={phase === 'idle' ? () => setPhase('confirm') : handleConfirm}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors disabled:opacity-40 ${
            phase === 'confirm'
              ? 'text-white bg-red-600 border-red-600 hover:bg-red-700'
              : 'text-red-400 border-red-900/40 hover:bg-red-950/20'
          }`}>
          {phase === 'loading' ? (
            <span className="flex items-center gap-1.5">
              <svg className="animate-spin" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
              </svg>
              Läuft…
            </span>
          ) : phase === 'done' ? (
            '✓ Neustart läuft'
          ) : phase === 'confirm' ? (
            'Ja, neu starten'
          ) : (
            'App neu starten'
          )}
        </button>
      </div>
    </div>
  )
}

function fmtUptime(s: number) {
  if (s > 3600) return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`
  if (s > 60)   return `${Math.floor(s / 60)}m ${s % 60}s`
  return `${s}s`
}

export default function SystemControls() {
  const [uptime, setUptime] = useState<string | null>(null)
  const cache  = useAction(() => fetch('/api/admin/cache',  { method: 'POST' }))
  const health = useAction(() => fetch('/api/admin/health', { method: 'GET'  }))

  useEffect(() => {
    fetch('/api/admin/health')
      .then(r => r.json())
      .then(d => { if (d.uptime) setUptime(fmtUptime(d.uptime)) })
      .catch(() => {})
  }, [])

  return (
    <div className="bg-[#141414] border border-[#2e2e2e] rounded-xl overflow-hidden">
      {uptime && (
        <div className="px-5 py-3 border-b border-[#1c1c1c]">
          <p className="text-xs text-[#444444] font-medium uppercase tracking-wider">Laufzeit: {uptime}</p>
        </div>
      )}
      <ActionButton
        label="Cache leeren"
        description="Alle zwischengespeicherten Daten neu laden"
        onClick={cache.run}
        status={cache.status}
      />
      <ActionButton
        label="Datenbankverbindung prüfen"
        description="Verbindung zur PostgreSQL-Datenbank testen"
        onClick={health.run}
        status={health.status}
      />
      <RestartButton />
    </div>
  )
}
