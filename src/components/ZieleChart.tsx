'use client'

import { useState, useMemo } from 'react'

type Ziel = {
  id: string
  titel: string
  zieldatum: Date | string | null
  erreicht: boolean
  erreichtAm: Date | string | null
}

export default function ZieleChart({ ziele }: { ziele: Ziel[] }) {
  const [hovered, setHovered] = useState<string | null>(null)

  const points = useMemo(() => {
    return ziele
      .map(z => {
        const datum = z.erreicht && z.erreichtAm
          ? new Date(z.erreichtAm)
          : z.zieldatum ? new Date(z.zieldatum) : null
        if (!datum) return null
        return { id: z.id, datum, titel: z.titel, erreicht: z.erreicht }
      })
      .filter((p): p is NonNullable<typeof p> => p !== null)
      .sort((a, b) => a.datum.getTime() - b.datum.getTime())
  }, [ziele])

  if (points.length === 0) return null

  const W = 500, H = 72
  const pad = { top: 8, right: 16, bottom: 24, left: 16 }
  const cW = W - pad.left - pad.right
  const cH = H - pad.top - pad.bottom   // 40px chart area
  const midY = cH / 2

  const now    = new Date()
  const minT   = Math.min(points[0].datum.getTime(), now.getTime() - 1)
  const maxT   = Math.max(points[points.length - 1].datum.getTime(), now.getTime() + 1)
  const range  = maxT - minT

  const xOf  = (d: Date) => ((d.getTime() - minT) / range) * cW
  const todayX = xOf(now)

  const pts = points.map(p => ({ ...p, x: xOf(p.datum) }))

  return (
    <div className="mb-4 pb-4 border-b border-[#1c1c1c]">
      <p className="text-[10px] font-semibold text-[#2e2e2e] uppercase tracking-wider mb-2">Ziel-Zeitlinie</p>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 72 }}>
        <g transform={`translate(${pad.left},${pad.top})`}>

          {/* Baseline */}
          <line x1={0} y1={midY} x2={cW} y2={midY} stroke="#1c1c1c" strokeWidth="1" />

          {/* Today marker */}
          <line x1={todayX} y1={0} x2={todayX} y2={cH}
            stroke="#2e2e2e" strokeWidth="1" strokeDasharray="3 2" />
          <text x={todayX} y={cH + 13} textAnchor="middle" fontSize="8" fill="#2e2e2e">Heute</text>

          {/* Points */}
          {pts.map(p => {
            const isHov = hovered === p.id
            const tooltipX = Math.min(Math.max(p.x - 48, 0), cW - 100)
            const tooltipY = midY - 38
            const dateStr  = p.datum.toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: '2-digit' })
            const shortTitle = p.titel.length > 15 ? p.titel.slice(0, 14) + '…' : p.titel

            return (
              <g key={p.id}
                onMouseEnter={() => setHovered(p.id)}
                onMouseLeave={() => setHovered(null)}>
                {/* Hit area */}
                <circle cx={p.x} cy={midY} r={12} fill="transparent" />

                {/* Visual dot */}
                {p.erreicht ? (
                  <circle cx={p.x} cy={midY} r={isHov ? 6 : 4.5}
                    fill="#059669" stroke="#0a0a0a" strokeWidth="1.5"
                    style={{ transition: 'r 0.1s' }} />
                ) : (
                  <circle cx={p.x} cy={midY} r={isHov ? 6 : 4.5}
                    fill="#0a0a0a" stroke="#3a3a3a" strokeWidth="1.5"
                    style={{ transition: 'r 0.1s' }} />
                )}

                {/* Tooltip */}
                {isHov && (
                  <g pointerEvents="none">
                    <rect x={tooltipX} y={tooltipY} width={96} height={32}
                      rx="4" fill="#141414" stroke="#2e2e2e" strokeWidth="1" />
                    <text x={tooltipX + 48} y={tooltipY + 11}
                      textAnchor="middle" fontSize="8" fill="#666666">{dateStr}</text>
                    <text x={tooltipX + 48} y={tooltipY + 24}
                      textAnchor="middle" fontSize="9" fontWeight="600" fill="#efefef">{shortTitle}</text>
                  </g>
                )}
              </g>
            )
          })}

          {/* Date labels */}
          <text x={0} y={cH + 13} textAnchor="start" fontSize="8" fill="#2e2e2e">
            {points[0].datum.toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: '2-digit' })}
          </text>
          {/* Only show end label if it's not "Heute" (i.e. last point is in future) */}
          {points[points.length - 1].datum.getTime() > now.getTime() && (
            <text x={cW} y={cH + 13} textAnchor="end" fontSize="8" fill="#2e2e2e">
              {points[points.length - 1].datum.toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: '2-digit' })}
            </text>
          )}
        </g>
      </svg>

      {/* Legend */}
      <div className="flex items-center gap-4 text-[10px] text-[#3a3a3a]">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
          Erreicht ({ziele.filter(z => z.erreicht).length})
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full border border-[#3a3a3a] shrink-0" />
          Zieldatum ({ziele.filter(z => !z.erreicht && z.zieldatum).length})
        </span>
      </div>
    </div>
  )
}
