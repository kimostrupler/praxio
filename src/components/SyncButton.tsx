'use client'

import { useState, useTransition } from 'react'

export default function SyncButton({ action }: { action: () => Promise<void> }) {
  const [pending, start] = useTransition()
  const [done, setDone]  = useState(false)

  function handleSync() {
    start(async () => {
      await action()
      setDone(true)
      setTimeout(() => setDone(false), 2500)
    })
  }

  return (
    <button
      type="button"
      onClick={handleSync}
      disabled={pending}
      title="Cal.com Termine neu laden"
      className="flex items-center gap-1.5 px-3 py-2 text-xs border rounded-lg transition-colors disabled:opacity-50
        border-[#2e2e2e] text-[#666666] hover:bg-[#1c1c1c] hover:text-[#efefef]">
      <svg
        width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
        className={pending ? 'animate-spin' : ''}>
        <path d="M23 4v6h-6"/>
        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
      </svg>
      {done ? 'Aktualisiert' : 'Sync'}
    </button>
  )
}
