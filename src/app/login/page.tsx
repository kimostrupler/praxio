'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const result = await signIn('credentials', { email, password, redirect: false })
    setLoading(false)
    if (result?.error) setError('E-Mail oder Passwort falsch.')
    else router.push('/dashboard')
  }

  return (
    // bg-[#0a0a0a] → var(--page) via override — themes correctly in both modes
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] px-4 relative overflow-hidden">

      {/* Precision grid — .login-grid in globals.css handles dark/light variants */}
      <div className="login-grid" aria-hidden="true" />

      {/* Ambient accent glow — color follows --accent-glow CSS variable */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          background: 'radial-gradient(ellipse 60% 50% at 50% 38%, var(--accent-glow, rgba(232,154,60,0.08)) 0%, transparent 72%)',
          opacity: 0.35,
        }}
      />

      {/* Content */}
      <div className="relative w-full max-w-[360px]">

        {/* Wordmark */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center gap-3 mb-4">
            {/* Icon mark — uses current accent color */}
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{
                background: 'var(--accent)',
                boxShadow: '0 4px 16px var(--accent-glow, rgba(232,154,60,0.32))',
              }}
            >
              {/* text-black → var(--accent-fg) via CSS override system */}
              <span className="text-black text-base font-bold font-mono">F</span>
            </div>
            {/* text-[#efefef] → var(--text) via override */}
            <span className="text-xl font-bold text-[#efefef] tracking-tight">FitAllCoach</span>
          </div>
          {/* text-[#3a3a3a] → var(--muted) */}
          <p className="text-[10px] text-[#3a3a3a] font-mono tracking-[0.18em] uppercase">
            Praxis-Verwaltung · by Joelle
          </p>
        </div>

        {/* Glass card — .login-card handles dark/light glass in globals.css */}
        <div className="login-card">

          {/* Section label with border-based dividers — border-[#2e2e2e] → var(--border) */}
          <div className="flex items-center gap-2.5 mb-7">
            <div className="h-px flex-1 border-t border-[#2e2e2e]" />
            {/* text-[#444444] → var(--faint) */}
            <span className="text-[10px] font-mono text-[#444444] tracking-[0.15em] uppercase">
              Anmelden
            </span>
            <div className="h-px flex-1 border-t border-[#2e2e2e]" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              {/* text-[#555555] → var(--mid) */}
              <label className="block text-[10px] font-mono font-medium text-[#555555] mb-2 tracking-[0.12em] uppercase">
                E-Mail
              </label>
              {/* .login-input class in globals.css handles dark/light styling + focus */}
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="deine@email.de"
                autoComplete="email"
                className="login-input"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono font-medium text-[#555555] mb-2 tracking-[0.12em] uppercase">
                Passwort
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                autoComplete="current-password"
                className="login-input"
              />
            </div>

            {error && (
              <p className="text-xs text-red-400 bg-red-950/20 border border-red-900/30 px-3 py-2 rounded-lg">
                {error}
              </p>
            )}

            {/* Amber CTA — bg-white → var(--accent) = #e89a3c in both modes via override */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white hover:bg-[#e8e8e8] text-black font-semibold text-sm py-2.5 rounded-lg transition-colors mt-1 disabled:opacity-50"
              style={{ boxShadow: loading ? 'none' : '0 4px 16px var(--accent-glow, rgba(232,154,60,0.24))' }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" opacity="0.3"/>
                    <path d="M12 2v4"/>
                  </svg>
                  Anmelden…
                </span>
              ) : 'Anmelden →'}
            </button>
          </form>
        </div>

        {/* Footer — text-[#2e2e2e] → var(--muted) */}
        <p className="text-center text-[10px] text-[#2e2e2e] mt-6 font-mono">
          FitAllCoach · Praxis-Verwaltung
        </p>
      </div>
    </div>
  )
}
