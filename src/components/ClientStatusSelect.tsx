'use client'

import { useTransition } from 'react'
import { updateClientStatus } from '@/app/actions/clients'
import type { ClientStatus } from '@/lib/formatting'

const OPTIONS: { value: ClientStatus; label: string }[] = [
  { value: 'AKTIV',    label: 'Aktiv'    },
  { value: 'PAUSIERT', label: 'Pausiert' },
  { value: 'INAKTIV',  label: 'Inaktiv'  },
]

const ACTIVE_STYLE: Record<string, string> = {
  AKTIV:    'bg-emerald-950/40 text-emerald-400 border-emerald-900/40',
  PAUSIERT: 'bg-orange-950/40 text-orange-400 border-orange-900/40',
  INAKTIV:  'bg-[#1c1c1c] text-[#555555] border-[#2e2e2e]',
}

export default function ClientStatusSelect({ clientId, status }: { clientId: string; status: string }) {
  const [pending, start] = useTransition()

  return (
    <div className={`flex rounded-lg border border-[#2e2e2e] overflow-hidden transition-opacity ${pending ? 'opacity-50 pointer-events-none' : ''}`}>
      {OPTIONS.map(opt => {
        const isActive = opt.value === status
        return (
          <button key={opt.value} type="button"
            disabled={pending || isActive}
            onClick={() => start(async () => { await updateClientStatus(clientId, opt.value) })}
            className={`px-3 py-1 text-[11px] font-medium transition-colors border-r border-[#2e2e2e] last:border-r-0 ${
              isActive
                ? ACTIVE_STYLE[opt.value]
                : 'bg-transparent text-[#555555] hover:text-[#efefef] hover:bg-[#1c1c1c]'
            }`}>
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
