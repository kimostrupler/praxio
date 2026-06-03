'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import GlobalSearch from './GlobalSearch'

// ── Nav data ──────────────────────────────────────────────────────────────────

const PRIMARY = [
  {
    href: '/dashboard', label: 'Home', exact: true,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <rect x="3" y="3" width="7" height="7" rx="1.5"/>
        <rect x="14" y="3" width="7" height="7" rx="1.5"/>
        <rect x="3" y="14" width="7" height="7" rx="1.5"/>
        <rect x="14" y="14" width="7" height="7" rx="1.5"/>
      </svg>
    ),
  },
  {
    href: '/clients', label: 'Klienten',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
  {
    href: '/termine', label: 'Termine',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <rect x="3" y="4" width="18" height="18" rx="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    ),
  },
  {
    href: '/rechnungen', label: 'Faktura',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="9" y1="13" x2="15" y2="13"/>
        <line x1="9" y1="17" x2="15" y2="17"/>
      </svg>
    ),
  },
]

const SECONDARY_ALL = [
  {
    href: '/plaene', label: 'Pläne', adminOnly: false,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
        <rect x="9" y="3" width="6" height="4" rx="1"/>
        <line x1="9" y1="12" x2="15" y2="12"/>
        <line x1="9" y1="16" x2="12" y2="16"/>
      </svg>
    ),
  },
  {
    href: '/statistiken', label: 'Statistiken', adminOnly: false,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <line x1="18" y1="20" x2="18" y2="10"/>
        <line x1="12" y1="20" x2="12" y2="4"/>
        <line x1="6" y1="20" x2="6" y2="14"/>
      </svg>
    ),
  },
  {
    href: '/settings', label: 'Einstellungen', adminOnly: false,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
      </svg>
    ),
  },
]

const SEARCH_ICON = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
    <circle cx="11" cy="11" r="8"/>
    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
)

const MORE_ICON = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <circle cx="5"  cy="12" r="1.5" fill="currentColor"/>
    <circle cx="12" cy="12" r="1.5" fill="currentColor"/>
    <circle cx="19" cy="12" r="1.5" fill="currentColor"/>
  </svg>
)

// ── Component ─────────────────────────────────────────────────────────────────

export default function MobileNav() {
  const path = usePathname()
  const { data: session } = useSession()
  const isAdmin = (session?.user as any)?.role === 'ADMIN'
  const [searchOpen, setSearchOpen] = useState(false)
  const [sheetOpen,  setSheetOpen]  = useState(false)

  const SECONDARY = SECONDARY_ALL.filter(item => !item.adminOnly || isAdmin)

  function isActive(href: string, exact?: boolean) {
    if (exact) return path === href
    if (href === '/termine') return path.startsWith('/termine') || path.startsWith('/kalender')
    return path.startsWith(href)
  }

  const anySecondaryActive = SECONDARY.some(item => isActive(item.href))

  function closeSheet() { setSheetOpen(false) }

  return (
    <>
      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* Sheet backdrop */}
      <div
        className={`md:hidden fixed inset-0 z-[45] transition-all duration-200 ${
          sheetOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
        onClick={closeSheet}
      />

      {/* Secondary items sheet */}
      <div
        className={`md:hidden fixed inset-x-3 z-[46] transition-all duration-250 ease-out ${
          sheetOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3 pointer-events-none'
        }`}
        style={{ bottom: 72 }}
      >
        <div
          className="rounded-2xl overflow-hidden border border-[#2e2e2e]"
          style={{
            background: 'var(--card)',
            boxShadow: '0 -4px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.06)',
          }}
        >
          {/* Search row */}
          <button
            type="button"
            onClick={() => { setSearchOpen(true); closeSheet() }}
            className="w-full flex items-center gap-3.5 px-4 py-3.5 border-b border-[#1c1c1c] text-[#666666] hover:bg-[#1c1c1c] transition-colors active:bg-[#1c1c1c]"
          >
            {SEARCH_ICON}
            <span className="text-sm font-medium flex-1 text-left text-[#efefef]">Suchen</span>
            <span className="text-[10px] font-mono text-[#3a3a3a] tracking-widest">⌘K</span>
          </button>

          {/* Secondary nav items */}
          {SECONDARY.map((item, i) => {
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeSheet}
                className={`flex items-center gap-3.5 px-4 py-3.5 transition-colors ${
                  i < SECONDARY.length - 1 ? 'border-b border-[#1c1c1c]' : ''
                } ${active ? '' : 'text-[#666666] hover:bg-[#1c1c1c] active:bg-[#1c1c1c]'}`}
                style={active ? { color: 'var(--accent)', background: 'var(--accent-dim)' } : undefined}
              >
                {item.icon}
                <span className="text-sm font-medium flex-1 text-[#efefef]">{item.label}</span>
                {active && (
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--accent)' }} />
                )}
              </Link>
            )
          })}
        </div>
      </div>

      {/* Tab bar */}
      <nav
        className="md:hidden fixed inset-x-0 bottom-0 z-50 flex items-stretch"
        style={{
          background: 'color-mix(in srgb, var(--page) 82%, transparent)',
          backdropFilter: 'blur(24px) saturate(160%)',
          WebkitBackdropFilter: 'blur(24px) saturate(160%)',
          borderTop: '1px solid color-mix(in srgb, var(--text) 8%, transparent)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        {PRIMARY.map(item => {
          const active = isActive(item.href, item.exact)
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={closeSheet}
              className="relative flex-1 flex flex-col items-center justify-center gap-1 py-2.5 transition-colors"
              style={{ color: active ? 'var(--accent)' : '#6b7280' }}
            >
              {active && (
                <span
                  className="absolute inset-x-2 top-1.5 bottom-1.5 rounded-xl"
                  style={{ background: 'var(--accent-dim)' }}
                />
              )}
              <span className="relative">{item.icon}</span>
              <span className="relative text-[9px] font-mono tracking-wide">{item.label}</span>
            </Link>
          )
        })}

        {/* Mehr */}
        <button
          type="button"
          onClick={() => setSheetOpen(v => !v)}
          className="relative flex-1 flex flex-col items-center justify-center gap-1 py-2.5 transition-colors"
          style={{ color: anySecondaryActive || sheetOpen ? 'var(--accent)' : '#6b7280' }}
        >
          {(anySecondaryActive || sheetOpen) && (
            <span
              className="absolute inset-x-2 top-1.5 bottom-1.5 rounded-xl"
              style={{ background: 'var(--accent-dim)' }}
            />
          )}
          <span className="relative">{MORE_ICON}</span>
          <span className="relative text-[9px] font-mono tracking-wide">Mehr</span>
        </button>
      </nav>
    </>
  )
}
