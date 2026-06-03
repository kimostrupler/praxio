'use client'

import { useState } from 'react'
import SchnellEintragWizard from './SchnellEintragWizard'
import AnamneseWizard from './AnamneseWizard'

type Mode = null | 'schnell' | 'voll'

export default function AnamneseWahl({ clientId }: { clientId: string }) {
  const [mode, setMode] = useState<Mode>(null)

  if (mode === 'schnell') return <SchnellEintragWizard clientId={clientId} />
  if (mode === 'voll') return <AnamneseWizard clientId={clientId} />

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <button type="button" onClick={() => setMode('schnell')}
        className="bg-[#141414] border border-[#2e2e2e] hover:border-[#555555] hover:bg-[#1c1c1c] rounded-xl p-6 text-left transition-all group">
        <p className="text-sm font-semibold text-white mb-1.5">Folgebesuch</p>
        <p className="text-xs text-[#444444] mb-5 leading-relaxed">
          Schnell die wichtigsten Werte erfassen — Gewicht, Messungen und aktuelles Befinden.
        </p>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-medium text-white/60 bg-white/10 px-2 py-0.5 rounded">2 Schritte</span>
          <span className="text-[10px] text-[#3a3a3a]">ca. 1 Minute</span>
        </div>
      </button>

      <button type="button" onClick={() => setMode('voll')}
        className="bg-[#141414] border border-[#2e2e2e] hover:border-[#555555] hover:bg-[#1c1c1c] rounded-xl p-6 text-left transition-all group">
        <p className="text-sm font-semibold text-white mb-1.5">Vollständige Anamnese</p>
        <p className="text-xs text-[#444444] mb-5 leading-relaxed">
          Alle Bereiche erfassen — Ziele, Körperdaten, Ernährung, Lifestyle, Schlaf, Stress und Gesundheit.
        </p>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-medium text-[#444444] bg-[#1c1c1c] px-2 py-0.5 rounded border border-[#2e2e2e]">7 Schritte</span>
          <span className="text-[10px] text-[#3a3a3a]">ca. 10 Minuten</span>
        </div>
      </button>
    </div>
  )
}
