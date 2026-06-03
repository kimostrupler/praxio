'use client'

import { useState, useMemo } from 'react'

type Entry = { datum: Date | string; gewicht: number; koerperfett: number | null }

export default function GewichtsChart({ eintraege }: { eintraege: Entry[] }) {
  const [hovered, setHovered] = useState<number | null>(null)

  const sorted = useMemo(
    () => [...eintraege].sort((a, b) => new Date(a.datum).getTime() - new Date(b.datum).getTime()),
    [eintraege]
  )

  if (sorted.length < 2) return null

  const W = 500, H = 160
  const pad = { top: 12, right: 16, bottom: 28, left: 38 }
  const cW = W - pad.left - pad.right
  const cH = H - pad.top - pad.bottom

  const weights  = sorted.map(e => e.gewicht)
  const rawMin   = Math.min(...weights)
  const rawMax   = Math.max(...weights)
  const spread   = rawMax - rawMin || 2
  const minW     = Math.floor(rawMin - spread * 0.15)
  const maxW     = Math.ceil(rawMax  + spread * 0.15)

  const xScale = (i: number) => (i / (sorted.length - 1)) * cW
  const yScale = (w: number) => cH - ((w - minW) / (maxW - minW)) * cH

  const pts = sorted.map((e, i) => ({
    x: xScale(i), y: yScale(e.gewicht),
    datum: new Date(e.datum), gewicht: e.gewicht, kf: e.koerperfett,
  }))

  // Smooth line using cubic bezier
  const pathD = pts.reduce((acc, p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`
    const prev = pts[i - 1]
    const cpx  = (prev.x + p.x) / 2
    return `${acc} C ${cpx} ${prev.y} ${cpx} ${p.y} ${p.x} ${p.y}`
  }, '')

  const areaD = `${pathD} L ${pts[pts.length - 1].x} ${cH} L 0 ${cH} Z`

  const yTicks = 3
  const yLabels = Array.from({ length: yTicks + 1 }, (_, i) =>
    minW + ((maxW - minW) * i) / yTicks
  )

  // x-axis: show up to 5 evenly-spaced labels
  const xLabelIdxs = (() => {
    if (sorted.length <= 5) return sorted.map((_, i) => i)
    const step = Math.floor((sorted.length - 1) / 4)
    return [0, step, step * 2, step * 3, sorted.length - 1]
  })()

  const diff    = sorted[sorted.length - 1].gewicht - sorted[0].gewicht
  const diffStr = (diff > 0 ? '+' : '') + diff.toFixed(1) + ' kg'
  const diffCol = diff < 0 ? '#059669' : diff > 0 ? '#d97706' : '#666666'

  return (
    <div className="space-y-1">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 160 }}>
        <defs>
          <linearGradient id="wg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#efefef" stopOpacity="0.10" />
            <stop offset="100%" stopColor="#efefef" stopOpacity="0"    />
          </linearGradient>
          <clipPath id="wclip">
            <rect x="0" y="0" width={cW} height={cH} />
          </clipPath>
        </defs>

        <g transform={`translate(${pad.left},${pad.top})`}>
          {/* Grid */}
          {yLabels.map((v, i) => (
            <g key={i}>
              <line x1={0} y1={yScale(v)} x2={cW} y2={yScale(v)}
                stroke="#1c1c1c" strokeWidth="1" />
              <text x={-5} y={yScale(v)} textAnchor="end" dominantBaseline="middle"
                fontSize="8" fill="#3a3a3a">{v.toFixed(0)}</text>
            </g>
          ))}

          {/* Area */}
          <path d={areaD} fill="url(#wg)" clipPath="url(#wclip)" />

          {/* Line */}
          <path d={pathD} fill="none" stroke="#666666" strokeWidth="1.5"
            strokeLinecap="round" strokeLinejoin="round" clipPath="url(#wclip)" />

          {/* Hovered vertical */}
          {hovered !== null && (
            <line x1={pts[hovered].x} y1={0} x2={pts[hovered].x} y2={cH}
              stroke="#2e2e2e" strokeWidth="1" strokeDasharray="3 3" />
          )}

          {/* Dots */}
          {pts.map((p, i) => (
            <g key={i}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}>
              <circle cx={p.x} cy={p.y} r={10} fill="transparent" />
              <circle cx={p.x} cy={p.y}
                r={hovered === i ? 4 : 2.5}
                fill={hovered === i ? '#efefef' : '#3a3a3a'}
                stroke={hovered === i ? '#0a0a0a' : 'none'}
                strokeWidth="1.5"
                style={{ transition: 'r 0.1s' }}
              />
            </g>
          ))}

          {/* Tooltip */}
          {hovered !== null && (() => {
            const p   = pts[hovered]
            const tx  = Math.min(Math.max(p.x - 36, 0), cW - 76)
            const ty  = Math.max(p.y - 38, 0)
            return (
              <g pointerEvents="none">
                <rect x={tx} y={ty} width={76} height={p.kf != null ? 36 : 26}
                  rx="4" fill="#141414" stroke="#2e2e2e" strokeWidth="1" />
                <text x={tx + 38} y={ty + 10} textAnchor="middle" fontSize="8" fill="#666666">
                  {p.datum.toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: '2-digit' })}
                </text>
                <text x={tx + 38} y={ty + 21} textAnchor="middle" fontSize="10"
                  fontWeight="600" fill="#efefef">{p.gewicht} kg</text>
                {p.kf != null && (
                  <text x={tx + 38} y={ty + 32} textAnchor="middle" fontSize="8" fill="#666666">
                    {p.kf}% KF
                  </text>
                )}
              </g>
            )
          })()}

          {/* X labels */}
          {xLabelIdxs.map(i => (
            <text key={i} x={pts[i].x} y={cH + 14}
              textAnchor="middle" fontSize="8" fill="#3a3a3a">
              {new Date(sorted[i].datum).toLocaleDateString('de-DE', { day: '2-digit', month: 'short' })}
            </text>
          ))}
        </g>
      </svg>

      {/* Summary */}
      <div className="flex items-center gap-3 text-xs">
        <span className="text-[#3a3a3a]">Verlauf ({sorted.length} Einträge):</span>
        <span style={{ color: diffCol }} className="font-medium">{diffStr}</span>
        <span className="text-[#3a3a3a]">
          {sorted[0].gewicht} → {sorted[sorted.length - 1].gewicht} kg
        </span>
      </div>
    </div>
  )
}
