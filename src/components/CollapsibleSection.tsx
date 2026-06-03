'use client'

import { useState } from 'react'

export default function CollapsibleSection({
  title,
  defaultOpen = false,
  badge,
  preview,
  children,
}: {
  title: string
  defaultOpen?: boolean
  badge?: number
  preview?: string
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="bg-card border border-line rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2.5 w-full text-left px-4 py-3 group hover:bg-lift transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent"
      >
        <svg
          className={`shrink-0 text-muted group-hover:text-mid transition-transform duration-150 ${open ? '' : '-rotate-90'}`}
          width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
        >
          <polyline points="6 9 12 15 18 9"/>
        </svg>
        <span className="text-xs font-semibold text-mid uppercase tracking-wider shrink-0 group-hover:text-faint transition-colors">
          {title}
        </span>
        {badge != null && badge > 0 && (
          <span className="text-[10px] text-muted tabular-nums shrink-0">{badge}</span>
        )}
        {!open && preview && (
          <span className="ml-auto text-xs text-muted truncate min-w-0 pl-3 text-right">{preview}</span>
        )}
      </button>

      <div className={`grid transition-[grid-template-rows] duration-200 ease-out ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
        <div className="overflow-hidden">
          <div className="border-t border-line-s p-4">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
