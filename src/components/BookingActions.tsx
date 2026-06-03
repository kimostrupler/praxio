'use client'

import { useState, useTransition } from 'react'
import { cancelBooking } from '@/app/actions/calcom'

export default function BookingActions({ uid, title }: { uid: string; title: string }) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

  function handleCancel() {
    if (!confirm(`Termin "${title}" wirklich absagen?`)) return
    startTransition(async () => {
      const r = await cancelBooking(uid)
      if (r?.error) setError(r.error)
    })
  }

  return (
    <div className="flex items-center gap-1.5 shrink-0">
      {error && <span className="text-[10px] text-red-400 mr-1">{error}</span>}
      <a
        href={`https://cal.com/reschedule/${uid}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-[#555555] hover:text-[#efefef] border border-[#2e2e2e] hover:border-[#3a3a3a] px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap"
      >
        Verschieben
      </a>
      <button
        type="button"
        onClick={handleCancel}
        disabled={isPending}
        className="text-xs text-red-500 border border-red-900/30 hover:bg-red-950/20 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-40 whitespace-nowrap"
      >
        {isPending ? '…' : 'Absagen'}
      </button>
    </div>
  )
}
