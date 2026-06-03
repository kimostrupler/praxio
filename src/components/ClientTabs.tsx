'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

export type ClientTab = {
  key:        string
  label:      string
  href:       string
  badge?:     number
  badgeClass?: string
}

export default function ClientTabs({ tabs, activeTab }: { tabs: ClientTab[]; activeTab: string }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const active = tabs.find(t => t.key === activeTab) ?? tabs[0]
  if (!active) return null

  useEffect(() => {
    if (!open) return
    function onMouseDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <>
      {/* ── Desktop: horizontal underline tab bar ── */}
      <div className="hidden md:block border-b border-[#1c1c1c] mb-5">
        <div className="flex items-center overflow-x-auto scrollbar-none">
          {tabs.map(t => {
            const isActive = t.key === activeTab
            return (
              <Link
                key={t.key}
                href={t.href}
                className={`relative flex items-center gap-1.5 px-4 py-2.5 text-sm whitespace-nowrap transition-colors shrink-0 ${
                  isActive ? '' : 'text-[#555555] hover:text-[#efefef]'
                }`}
                style={isActive ? { color: 'var(--accent)' } : undefined}
              >
                {t.label}
                {t.badge != null && t.badge > 0 && (
                  <span className={`text-[10px] tabular-nums ${
                    t.badgeClass ?? (isActive ? 'text-[#555555]' : 'text-[#3a3a3a]')
                  }`}>
                    {t.badge}
                  </span>
                )}
                {isActive && (
                  <span
                    className="absolute bottom-0 left-0 right-0 h-[2px] rounded-t-sm"
                    style={{ background: 'var(--accent)' }}
                  />
                )}
              </Link>
            )
          })}
        </div>
      </div>

      {/* ── Mobile: dropdown ── */}
      <div ref={ref} className="md:hidden relative mb-4">
        <button
          onClick={() => setOpen(o => !o)}
          aria-haspopup="listbox"
          aria-expanded={open}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
            open
              ? 'bg-[#1c1c1c] border-[#3a3a3a] text-[#efefef]'
              : 'bg-[#141414] border-[#2e2e2e] text-[#efefef] hover:border-[#3a3a3a] hover:bg-[#1c1c1c]'
          }`}
        >
          <span>{active.label}</span>
          {active.badge != null && active.badge > 0 && (
            <span className={`text-[10px] tabular-nums ${active.badgeClass ?? 'text-[#555555]'}`}>
              {active.badge}
            </span>
          )}
          <svg
            className={`ml-1 shrink-0 text-[#555555] transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
            width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
          >
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>

        {open && (
          <div
            role="listbox"
            className="absolute top-full mt-1.5 z-50 min-w-[200px] bg-[#141414] border border-[#2e2e2e] rounded-xl overflow-hidden py-1 shadow-xl left-0"
          >
            {tabs.map(t => {
              const isActive = t.key === activeTab
              return (
                <Link
                  key={t.key}
                  href={t.href}
                  role="option"
                  aria-selected={isActive}
                  onClick={() => setOpen(false)}
                  className={`flex items-center justify-between gap-8 px-4 py-2.5 text-sm transition-colors ${
                    isActive
                      ? 'bg-[#1c1c1c] text-[#efefef]'
                      : 'text-[#666666] hover:text-[#efefef] hover:bg-[#1c1c1c]'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ background: isActive ? 'var(--accent)' : 'transparent' }}
                    />
                    {t.label}
                  </span>
                  {t.badge != null && t.badge > 0 && (
                    <span className={`text-[10px] font-medium tabular-nums ${t.badgeClass ?? 'text-[#3a3a3a]'}`}>
                      {t.badge}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
