'use client'

import { useTransition } from 'react'

export default function ClientActionMenu({ deleteAction }: { deleteAction: () => Promise<void> }) {
  const [pending, start] = useTransition()

  function handleDelete() {
    if (!confirm('Klient wirklich unwiderruflich löschen? Diese Aktion kann nicht rückgängig gemacht werden.')) return
    start(deleteAction)
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={pending}
      title="Klient löschen"
      className="w-9 h-9 flex items-center justify-center rounded-lg border border-[#2e2e2e] text-[#555555] hover:text-red-400 hover:border-red-900/40 hover:bg-red-950/20 transition-all disabled:opacity-40"
    >
      {pending ? (
        <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
          <polyline points="3 6 5 6 21 6"/>
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
          <path d="M10 11v6"/><path d="M14 11v6"/>
          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
        </svg>
      )}
    </button>
  )
}
