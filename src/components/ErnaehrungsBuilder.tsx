'use client'

import { useState, useTransition } from 'react'
import {
  createErnaehrungsVorlage,
  updateErnaehrungsVorlage,
  createErnaehrungsPlan,
  updateErnaehrungsPlan,
} from '@/app/actions/ernaehrung'
import type { ZeileInput } from '@/app/actions/ernaehrung'
import Link from 'next/link'

export type { ZeileInput }

const ZEITPUNKTE = ['Frühstück', 'Mittagessen', 'Snack', 'Abendessen', 'Vor dem Training', 'Nach dem Training']

type Props = {
  clientId?:            string
  editPlanId?:          string
  editVorlageId?:       string
  initialName?:         string
  initialBeschreibung?: string
  initialNotizen?:      string
  initialZeilen?:       ZeileInput[]
  cancelHref:           string
}

const ic = 'px-3 py-2 bg-[#0a0a0a] border border-[#2e2e2e] rounded-lg text-sm text-[#efefef] placeholder:text-[#3a3a3a] focus:outline-none focus:border-[#555555] transition-colors'

export default function ErnaehrungsBuilder({
  clientId,
  editPlanId,
  editVorlageId,
  initialName = '',
  initialBeschreibung = '',
  initialNotizen = '',
  initialZeilen = [],
  cancelHref,
}: Props) {
  const [name,        setName]        = useState(initialName)
  const [beschreibung,setBeschreibung]= useState(initialBeschreibung)
  const [notizen,     setNotizen]     = useState(initialNotizen)
  const [zeilen,      setZeilen]      = useState<ZeileInput[]>(
    initialZeilen.length > 0 ? initialZeilen : []
  )
  const [error,       setError]       = useState<string | null>(null)
  const [isPending,   startTransition]= useTransition()

  const isVorlage = !!editVorlageId || (!clientId && !editPlanId)

  function addZeile() {
    setZeilen(prev => [...prev, {
      zeitpunkt:     'Frühstück',
      kalorien:      '',
      protein:       '',
      kohlenhydrate: '',
      fett:          '',
      notizen:       '',
      reihenfolge:   prev.length,
    }])
  }

  function removeZeile(idx: number) {
    setZeilen(prev => prev.filter((_, i) => i !== idx).map((z, i) => ({ ...z, reihenfolge: i })))
  }

  function updateZeile(idx: number, field: keyof ZeileInput, value: string | number) {
    setZeilen(prev => prev.map((z, i) => i === idx ? { ...z, [field]: value } : z))
  }

  const totals = zeilen.reduce((acc, z) => ({
    kalorien:      acc.kalorien      + (parseInt(z.kalorien)      || 0),
    protein:       acc.protein       + (parseInt(z.protein)       || 0),
    kohlenhydrate: acc.kohlenhydrate + (parseInt(z.kohlenhydrate) || 0),
    fett:          acc.fett          + (parseInt(z.fett)          || 0),
  }), { kalorien: 0, protein: 0, kohlenhydrate: 0, fett: 0 })

  function handleSave() {
    setError(null)
    startTransition(async () => {
      let result: { error?: string } | undefined

      if (editVorlageId) {
        result = await updateErnaehrungsVorlage(editVorlageId, name, beschreibung, zeilen) ?? undefined
      } else if (editPlanId && clientId) {
        result = await updateErnaehrungsPlan(editPlanId, clientId, name, notizen, zeilen) ?? undefined
      } else if (clientId) {
        result = await createErnaehrungsPlan(clientId, name, notizen, zeilen) ?? undefined
      } else {
        result = await createErnaehrungsVorlage(name, beschreibung, zeilen) ?? undefined
      }

      if (result?.error) setError(result.error)
    })
  }

  return (
    <div className="space-y-5">
      {/* Name */}
      <div className="bg-[#141414] border border-[#2e2e2e] rounded-xl p-5 space-y-4">
        <div>
          <label className="block text-xs text-[#666666] mb-1.5">
            {isVorlage ? 'Vorlagenname' : 'Planname'} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder={isVorlage ? 'z. B. Basisernährung Abnehmen' : 'z. B. Ernährungsplan Januar'}
            className={`${ic} w-full`}
          />
        </div>

        {isVorlage ? (
          <div>
            <label className="block text-xs text-[#666666] mb-1.5">Beschreibung (optional)</label>
            <textarea
              value={beschreibung}
              onChange={e => setBeschreibung(e.target.value)}
              placeholder="Kurze Beschreibung der Vorlage…"
              rows={2}
              className={`${ic} w-full resize-none`}
            />
          </div>
        ) : (
          <div>
            <label className="block text-xs text-[#666666] mb-1.5">Notizen (optional)</label>
            <textarea
              value={notizen}
              onChange={e => setNotizen(e.target.value)}
              placeholder="Hinweise zum Plan…"
              rows={2}
              className={`${ic} w-full resize-none`}
            />
          </div>
        )}
      </div>

      {/* Mahlzeiten */}
      <div className="bg-[#141414] border border-[#2e2e2e] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#1c1c1c] flex items-center justify-between">
          <h3 className="text-xs font-semibold text-[#3a3a3a] uppercase tracking-wider">Mahlzeiten &amp; Makros</h3>
          <span className="text-xs text-[#444444]">{zeilen.length} Einträge</span>
        </div>

        {zeilen.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-sm text-[#3a3a3a] mb-3">Noch keine Mahlzeiten hinzugefügt.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#1c1c1c]">
            {zeilen.map((z, idx) => (
              <div key={idx} className="p-4 space-y-3">
                {/* Row 1: Zeitpunkt + remove */}
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <select
                      value={z.zeitpunkt}
                      onChange={e => updateZeile(idx, 'zeitpunkt', e.target.value)}
                      className={`${ic} w-full appearance-none pr-8 cursor-pointer`}>
                      {ZEITPUNKTE.map(zp => (
                        <option key={zp} value={zp} className="bg-[#141414]">{zp}</option>
                      ))}
                    </select>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#555555]">
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeZeile(idx)}
                    className="text-xs text-[#3a3a3a] hover:text-red-500 hover:bg-[#1c0000] px-2.5 py-2 rounded-lg transition-colors shrink-0">
                    ×
                  </button>
                </div>

                {/* Row 2: Makros */}
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { field: 'kalorien'      as const, label: 'Kcal',   placeholder: '0' },
                    { field: 'protein'       as const, label: 'Protein (g)', placeholder: '0' },
                    { field: 'kohlenhydrate' as const, label: 'KH (g)',  placeholder: '0' },
                    { field: 'fett'          as const, label: 'Fett (g)',placeholder: '0' },
                  ].map(col => (
                    <div key={col.field}>
                      <label className="block text-[10px] text-[#3a3a3a] mb-1">{col.label}</label>
                      <input
                        type="number"
                        min="0"
                        value={z[col.field]}
                        onChange={e => updateZeile(idx, col.field, e.target.value)}
                        placeholder={col.placeholder}
                        className={`${ic} w-full text-xs py-1.5`}
                      />
                    </div>
                  ))}
                </div>

                {/* Row 3: Notizen */}
                <div>
                  <input
                    type="text"
                    value={z.notizen}
                    onChange={e => updateZeile(idx, 'notizen', e.target.value)}
                    placeholder="Notiz (optional)"
                    className={`${ic} w-full text-xs`}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="px-5 py-4 border-t border-[#1c1c1c]">
          <button
            type="button"
            onClick={addZeile}
            className="text-sm text-[#666666] border border-[#2e2e2e] hover:bg-[#1c1c1c] hover:text-[#efefef] px-4 py-2 rounded-lg transition-colors">
            + Mahlzeit hinzufügen
          </button>
        </div>
      </div>

      {/* Totals */}
      {zeilen.length > 0 && (
        <div className="bg-[#141414] border border-[#2e2e2e] rounded-xl px-5 py-4">
          <p className="text-[10px] text-[#3a3a3a] uppercase tracking-wider mb-3">Tagessumme</p>
          <div className="grid grid-cols-4 gap-4 text-center">
            {[
              { label: 'Kalorien', value: totals.kalorien, unit: 'kcal' },
              { label: 'Protein',  value: totals.protein,  unit: 'g' },
              { label: 'Kohlenh.', value: totals.kohlenhydrate, unit: 'g' },
              { label: 'Fett',     value: totals.fett,     unit: 'g' },
            ].map(t => (
              <div key={t.label}>
                <p className="text-lg font-bold text-[#efefef]">{t.value}</p>
                <p className="text-[10px] text-[#444444]">{t.label} {t.unit}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="text-xs text-red-400 px-1">{error}</p>
      )}

      {/* Save/Cancel */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending || !name.trim()}
          className="bg-white hover:bg-[#e8e8e8] disabled:opacity-40 text-black text-sm font-semibold px-6 py-2.5 rounded-lg transition-colors">
          {isPending ? 'Speichern…' : 'Speichern'}
        </button>
        <Link href={cancelHref}
          className="text-sm text-[#444444] hover:text-[#efefef] px-4 py-2.5 rounded-lg transition-colors">
          Abbrechen
        </Link>
      </div>
    </div>
  )
}
