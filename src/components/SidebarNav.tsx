'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { signOut, useSession } from 'next-auth/react'

type NavItem = { href: string; label: string; exact?: boolean; icon: React.ReactNode }

const NAV: NavItem[] = [
  {
    href: '/dashboard', label: 'Home', exact: true,
    icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  },
  {
    href: '/clients', label: 'Klienten',
    icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  },
  {
    href: '/termine', label: 'Termine',
    icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  },
  {
    href: '/rechnungen', label: 'Faktura',
    icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="15" y2="17"/></svg>,
  },
  {
    href: '/plaene', label: 'Pläne',
    icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="12" y2="16"/></svg>,
  },
  {
    href: '/statistiken', label: 'Stats',
    icon: <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  },
]

const SEARCH_ICON = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
)

const SETTINGS_ICON = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
)

const LOGOUT_ICON = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
)

const itemBase = 'flex flex-col items-center justify-center gap-1.5 w-full py-2.5 rounded-xl transition-all duration-200'
const itemIdle = 'text-[#555555] hover:text-[#cccccc] hover:bg-white/[0.05]'
const itemActive = ''

export default function SidebarNav({ onSearch }: { onSearch: () => void }) {
  const path = usePathname()
  const { data: session } = useSession()
  const isAdmin = (session?.user as any)?.role === 'ADMIN'

  function isActive(href: string, exact?: boolean) {
    if (exact) return path === href
    if (href === '/termine') return path.startsWith('/termine') || path.startsWith('/kalender')
    return path.startsWith(href)
  }

  function NavItem({ item }: { item: NavItem }) {
    const active = isActive(item.href, item.exact)
    return (
      <Link
        href={item.href}
        title={item.label}
        className={`${itemBase} ${active ? itemActive : itemIdle}`}
        style={active ? {
          background: 'var(--accent-dim)',
          color: 'var(--accent)',
          boxShadow: '0 0 0 1px var(--accent-glow)',
        } : undefined}
      >
        <span className={active ? '' : 'opacity-60'}>{item.icon}</span>
        <span className="text-[9px] font-mono tracking-[0.06em] leading-none">{item.label}</span>
      </Link>
    )
  }

  const settingsActive = path.startsWith('/settings')

  return (
    <aside className="hidden md:flex fixed inset-y-0 left-0 w-[72px] flex-col bg-[#0a0a0a] border-r border-[#1c1c1c] z-40 overflow-hidden">

      {/* Search */}
      <div className="shrink-0 p-2 pb-1 border-b border-[#1c1c1c]">
        <button
          type="button"
          onClick={onSearch}
          title="Suchen (⌘K)"
          className={`${itemBase} ${itemIdle}`}
        >
          {SEARCH_ICON}
          <span className="text-[8px] font-mono tracking-[0.08em] text-[#3a3a3a] leading-none">⌘K</span>
        </button>
      </div>

      {/* Primary nav */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-1 px-2 space-y-0.5">
        {NAV.map(item => <NavItem key={item.href} item={item} />)}
      </nav>

      {/* Settings + logout */}
      <div className="border-t border-[#1c1c1c] shrink-0 p-2 pt-1 space-y-0.5">
        {(
          <Link
            href="/settings"
            title="Einstellungen"
            className={`${itemBase} ${settingsActive ? itemActive : itemIdle}`}
            style={settingsActive ? {
              background: 'var(--accent-dim)',
              color: 'var(--accent)',
              boxShadow: '0 0 0 1px var(--accent-glow)',
            } : undefined}
          >
            <span className={settingsActive ? '' : 'opacity-60'}>{SETTINGS_ICON}</span>
            <span className="text-[9px] font-mono tracking-[0.06em] leading-none">Config</span>
          </Link>
        )}

        <button
          type="button"
          title="Abmelden"
          onClick={() => signOut({ callbackUrl: '/login' })}
          className={`${itemBase} text-[#555555] hover:text-red-400 hover:bg-red-950/20`}
        >
          <span className="opacity-60">{LOGOUT_ICON}</span>
          <span className="text-[9px] font-mono tracking-[0.06em] leading-none">Logout</span>
        </button>
      </div>
    </aside>
  )
}
