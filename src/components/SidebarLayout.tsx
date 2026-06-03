'use client'

import { useState, useEffect } from 'react'
import SidebarNav from './SidebarNav'
import GlobalSearch from './GlobalSearch'

// Compact labeled sidebar is always 72px — no collapse state needed.
// Cmd+K keyboard shortcut remains; the sidebar no longer hosts a search button with text.

export default function SidebarLayout({ children }: { children: React.ReactNode }) {
  const [searchOpen, setSearchOpen] = useState(false)

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(v => !v)
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  return (
    <>
      <SidebarNav onSearch={() => setSearchOpen(true)} />
      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
      {/* Fixed 72px left offset — matches the compact sidebar width */}
      <div className="min-h-screen pb-20 md:pb-0 md:pl-[72px]">
        {children}
      </div>
    </>
  )
}
