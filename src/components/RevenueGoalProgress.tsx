'use client'

import { useSettings } from '@/components/SettingsProvider'

export default function RevenueGoalProgress({ currentMonthRevenue }: { currentMonthRevenue: number }) {
  const { settings } = useSettings()
  const goal = settings.revenueGoal

  if (!goal || goal <= 0) return null

  const pct = Math.min(100, Math.round((currentMonthRevenue / goal) * 100))

  return (
    <div className="bg-[#141414] border border-[#2e2e2e] rounded-xl px-4 py-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] font-mono text-[#555555] uppercase tracking-widest">Monatsziel</p>
        <p className="text-[10px] font-mono tabular-nums text-[#444444]">
          {pct}% von CHF {goal.toLocaleString('de-CH')}
        </p>
      </div>
      <div className="h-1.5 w-full bg-[#1c1c1c] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${pct}%`,
            background: pct >= 100 ? '#34d399' : 'var(--accent)',
          }}
        />
      </div>
    </div>
  )
}
