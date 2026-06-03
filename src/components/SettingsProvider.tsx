'use client'

import { createContext, useContext, useEffect, useState, startTransition } from 'react'
import { saveAppSettings, saveUserTheme } from '@/app/actions/settings'

// ── Accent preset system ──────────────────────────────────────────────────────

type AccentTokens = {
  accent: string
  fg:     string
  hv:     string
  dim:    string
  glow:   string
}

export type AccentPreset = {
  id:     string
  name:   string
  swatch: string
  dark:   AccentTokens
  light:  AccentTokens
}

export const ACCENT_PRESETS: AccentPreset[] = [
  {
    id: 'amber', name: 'Amber', swatch: '#e89a3c',
    dark:  { accent: '#e89a3c', fg: '#160c00', hv: '#cf8426', dim: 'rgba(232,154,60,0.14)',   glow: 'rgba(232,154,60,0.24)' },
    light: { accent: '#b45309', fg: '#ffffff',  hv: '#92400e', dim: 'rgba(180,83,9,0.11)',    glow: 'rgba(180,83,9,0.20)'  },
  },
  {
    id: 'sage', name: 'Sage', swatch: '#86c286',
    dark:  { accent: '#86c286', fg: '#0a160a', hv: '#6aaa6a', dim: 'rgba(134,194,134,0.14)', glow: 'rgba(134,194,134,0.22)' },
    light: { accent: '#15803d', fg: '#ffffff',  hv: '#166534', dim: 'rgba(21,128,61,0.11)',   glow: 'rgba(21,128,61,0.22)'  },
  },
  {
    id: 'violet', name: 'Violet', swatch: '#a78bfa',
    dark:  { accent: '#a78bfa', fg: '#1a0a2e', hv: '#9061f9', dim: 'rgba(167,139,250,0.14)', glow: 'rgba(167,139,250,0.24)' },
    light: { accent: '#6d28d9', fg: '#ffffff',  hv: '#5b21b6', dim: 'rgba(109,40,217,0.11)',  glow: 'rgba(109,40,217,0.22)'  },
  },
  {
    id: 'cobalt', name: 'Cobalt', swatch: '#60a5fa',
    dark:  { accent: '#60a5fa', fg: '#04122a', hv: '#3b82f6', dim: 'rgba(96,165,250,0.14)',  glow: 'rgba(96,165,250,0.22)' },
    light: { accent: '#1d4ed8', fg: '#ffffff',  hv: '#1e40af', dim: 'rgba(29,78,216,0.11)',   glow: 'rgba(29,78,216,0.22)'  },
  },
  {
    id: 'rose', name: 'Rose', swatch: '#fb7185',
    dark:  { accent: '#fb7185', fg: '#2a0010', hv: '#f43f5e', dim: 'rgba(251,113,133,0.14)', glow: 'rgba(251,113,133,0.22)' },
    light: { accent: '#be123c', fg: '#ffffff',  hv: '#9f1239', dim: 'rgba(190,18,60,0.11)',   glow: 'rgba(190,18,60,0.22)'  },
  },
  {
    id: 'teal', name: 'Teal', swatch: '#2dd4bf',
    dark:  { accent: '#2dd4bf', fg: '#002820', hv: '#14b8a6', dim: 'rgba(45,212,191,0.14)',  glow: 'rgba(45,212,191,0.22)' },
    light: { accent: '#0f766e', fg: '#ffffff',  hv: '#115e59', dim: 'rgba(15,118,110,0.11)',  glow: 'rgba(15,118,110,0.22)'  },
  },
  {
    id: 'copper', name: 'Copper', swatch: '#fb923c',
    dark:  { accent: '#fb923c', fg: '#1f0a00', hv: '#f97316', dim: 'rgba(251,146,60,0.14)',  glow: 'rgba(251,146,60,0.22)' },
    light: { accent: '#c2410c', fg: '#ffffff',  hv: '#9a3412', dim: 'rgba(194,65,12,0.11)',   glow: 'rgba(194,65,12,0.22)'  },
  },
  {
    id: 'slate', name: 'Slate', swatch: '#94a3b8',
    dark:  { accent: '#94a3b8', fg: '#0a0f18', hv: '#64748b', dim: 'rgba(148,163,184,0.14)', glow: 'rgba(148,163,184,0.22)' },
    light: { accent: '#334155', fg: '#ffffff',  hv: '#1e293b', dim: 'rgba(51,65,85,0.11)',    glow: 'rgba(51,65,85,0.22)'   },
  },
]

// ── Custom hex color derivation ───────────────────────────────────────────────

function hexToRgb(hex: string): [number, number, number] {
  return [parseInt(hex.slice(1,3),16), parseInt(hex.slice(3,5),16), parseInt(hex.slice(5,7),16)]
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r,g,b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2,'0')).join('')
}

function relativeLuminance(r: number, g: number, b: number): number {
  const toLinear = (c: number) => { const s = c/255; return s <= 0.04045 ? s/12.92 : Math.pow((s+0.055)/1.055, 2.4) }
  return 0.2126*toLinear(r) + 0.7152*toLinear(g) + 0.0722*toLinear(b)
}

export function deriveAccentTokens(hex: string, isDark: boolean): AccentTokens {
  let [r, g, b] = hexToRgb(hex)

  if (!isDark && relativeLuminance(r, g, b) > 0.45) {
    r = Math.round(r * 0.52); g = Math.round(g * 0.52); b = Math.round(b * 0.52)
  }

  const accent = rgbToHex(r, g, b)
  const lum    = relativeLuminance(r, g, b)
  const fg     = lum > 0.18 ? '#0a0a0a' : '#ffffff'
  const hv     = rgbToHex(r * 0.82, g * 0.82, b * 0.82)
  const dAlpha = isDark ? '0.14' : '0.11'
  const gAlpha = isDark ? '0.22' : '0.16'
  const dim    = `rgba(${r},${g},${b},${dAlpha})`
  const glow   = `rgba(${r},${g},${b},${gAlpha})`

  return { accent, fg, hv, dim, glow }
}

export function applyAccentTokens(presetId: string, isDark: boolean): void {
  let t: AccentTokens

  if (/^#[0-9a-fA-F]{6}$/.test(presetId)) {
    t = deriveAccentTokens(presetId, isDark)
  } else {
    const preset = ACCENT_PRESETS.find(p => p.id === presetId) ?? ACCENT_PRESETS[0]
    t = isDark ? preset.dark : preset.light
  }

  const root = document.documentElement
  root.style.setProperty('--accent',      t.accent)
  root.style.setProperty('--accent-fg',   t.fg)
  root.style.setProperty('--accent-hv',   t.hv)
  root.style.setProperty('--accent-dim',  t.dim)
  root.style.setProperty('--accent-glow', t.glow)
}

// ── Settings type ─────────────────────────────────────────────────────────────

export type Settings = {
  theme:         'system' | 'light' | 'dark'
  accentPreset:  string
  praxisName:    string
  coachName:     string
  trainSaetze:   number
  trainWdh:      number
  trainPause:    number
  clientDefault: 'AKTIV' | 'PAUSIERT' | 'INAKTIV'
  revenueGoal:   number
}

export const DEFAULTS: Settings = {
  theme:         'system',
  accentPreset:  'amber',
  praxisName:    'FitAllCoach',
  coachName:     'by Joelle',
  trainSaetze:   3,
  trainWdh:      10,
  trainPause:    60,
  clientDefault: 'AKTIV',
  revenueGoal:   0,
}

const STORAGE_KEY = 'praxis_settings'

type Ctx = {
  settings: Settings
  isDark:   boolean
  update:   <K extends keyof Settings>(k: K, v: Settings[K]) => void
}

const SettingsCtx = createContext<Ctx>({ settings: DEFAULTS, isDark: false, update: () => {} })

export function SettingsProvider({
  children,
  initialSettings,
}: {
  children: React.ReactNode
  initialSettings: Settings
}) {
  const [settings, setSettings] = useState<Settings>(initialSettings)
  const [isDark, setIsDark]     = useState(false)

  // Apply theme and accent from server-fetched settings on mount
  useEffect(() => {
    const dark = resolveIsDark(initialSettings.theme)
    document.documentElement.classList.toggle('dark', dark)
    setIsDark(dark)
    applyAccentTokens(initialSettings.accentPreset, dark)
    // Keep localStorage in sync so the initScript works correctly on next visit
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(initialSettings)) } catch {}
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Re-register system color scheme listener when relevant settings change
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => {
      if (settings.theme === 'system') {
        const dark = resolveIsDark('system')
        document.documentElement.classList.toggle('dark', dark)
        setIsDark(dark)
        applyAccentTokens(settings.accentPreset, dark)
      }
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [settings.theme, settings.accentPreset])

  function update<K extends keyof Settings>(k: K, v: Settings[K]) {
    const next = { ...settings, [k]: v }
    setSettings(next)
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch {}

    // Persist to DB (fire and forget)
    // Theme: save both as personal preference and global (saveAppSettings role-checks for ADMIN)
    if (k === 'theme') {
      startTransition(async () => {
        await Promise.all([saveUserTheme(v as string), saveAppSettings(next)])
      })
    } else {
      startTransition(async () => { await saveAppSettings(next) })
    }

    if (k === 'theme') {
      const dark = resolveIsDark(v as Settings['theme'])
      document.documentElement.classList.toggle('dark', dark)
      setIsDark(dark)
      applyAccentTokens(next.accentPreset, dark)
    }
    if (k === 'accentPreset') {
      applyAccentTokens(v as string, isDark)
    }
  }

  return (
    <SettingsCtx.Provider value={{ settings, isDark, update }}>
      {children}
    </SettingsCtx.Provider>
  )
}

export function useSettings() {
  return useContext(SettingsCtx)
}

export function getStoredSettings(): Settings {
  if (typeof window === 'undefined') return DEFAULTS
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') }
  } catch {
    return DEFAULTS
  }
}

function resolveIsDark(theme: Settings['theme']): boolean {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  return theme === 'dark' || (theme === 'system' && prefersDark)
}
