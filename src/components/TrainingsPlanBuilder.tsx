'use client'

import { useState, useTransition, useRef } from 'react'
import { createTrainingsPlan, updateTrainingsPlan, type PlanUebungInput } from '@/app/actions/training'
import { getStoredSettings } from '@/components/SettingsProvider'

type Uebung = {
  id: string
  name: string
  kategorie: string
  schwierigkeit: string | null
  ausruestung: string | null
  ziele: string[]
}

type PlanItem = PlanUebungInput & { tempId: string; uebungName: string; kategorie: string }

type InitialUebung = {
  uebungId: string; uebungName: string; kategorie: string
  saetze: number | null; wiederholungen: number | null; gewicht: number | null
  dauer: number | null; pause: number | null; notizen: string | null
}

type Props = {
  clientId: string
  clientZiele: string[]
  alleUebungen: Uebung[]
  previousPlans: { id: string; name: string; datum: Date; uebungen: InitialUebung[] }[]
  // edit mode
  editPlanId?: string
  initialName?: string
  initialNotizen?: string
  initialUebungen?: InitialUebung[]
}

const KATEGORIEN = ['Alle', 'Brust', 'Rücken', 'Beine', 'Schultern', 'Arme', 'Bauch', 'Kardio', 'Ganzkörper']

const GOAL_CATEGORY_MAP: Record<string, string[]> = {
  'Abnehmen': ['Kardio', 'Ganzkörper', 'Bauch'],
  'Muskelaufbau': ['Brust', 'Rücken', 'Beine', 'Schultern', 'Arme'],
  'Körperfett reduzieren': ['Kardio', 'Ganzkörper', 'Bauch'],
  'Leistungssteigerung': ['Beine', 'Rücken', 'Ganzkörper', 'Bauch'],
  'Mehr Energie': ['Kardio', 'Ganzkörper'],
  'Gesünder leben': ['Kardio', 'Rücken', 'Bauch', 'Ganzkörper'],
}

function ic(extra = '') {
  return `px-2.5 py-1.5 bg-[#0a0a0a] border border-[#2e2e2e] rounded-lg text-xs text-[#efefef] placeholder:text-[#3a3a3a] focus:outline-none focus:border-[#555555] transition-colors ${extra}`
}

function toItem(u: InitialUebung, i: number): PlanItem {
  return {
    tempId: `${u.uebungId}-${Date.now()}-${i}`,
    uebungId: u.uebungId,
    uebungName: u.uebungName,
    kategorie: u.kategorie,
    saetze: u.saetze != null ? String(u.saetze) : '3',
    wiederholungen: u.wiederholungen != null ? String(u.wiederholungen) : '10',
    gewicht: u.gewicht != null ? String(u.gewicht) : '',
    dauer: u.dauer != null ? String(u.dauer) : '',
    pause: u.pause != null ? String(u.pause) : '60',
    notizen: u.notizen ?? '',
    reihenfolge: i,
  }
}

export default function TrainingsPlanBuilder({
  clientId, clientZiele, alleUebungen, previousPlans,
  editPlanId, initialName = '', initialNotizen = '', initialUebungen = [],
}: Props) {
  const [planName, setPlanName] = useState(initialName)
  const [planNotizen, setPlanNotizen] = useState(initialNotizen)
  const [search, setSearch] = useState('')
  const [katFilter, setKatFilter] = useState('Alle')
  const [plan, setPlan] = useState<PlanItem[]>(() => initialUebungen.map(toItem))
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Drag state
  const dragIdx = useRef<number | null>(null)
  const [dragOver, setDragOver] = useState<number | null>(null)

  // Suggested exercises based on goals
  const suggestedKats = new Set(clientZiele.flatMap(g => GOAL_CATEGORY_MAP[g] ?? []))
  const suggestions = alleUebungen.filter(u =>
    suggestedKats.has(u.kategorie) && !plan.some(p => p.uebungId === u.id)
  ).slice(0, 8)

  // Filtered catalog
  const filtered = alleUebungen.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase())
    const matchKat = katFilter === 'Alle' || u.kategorie === katFilter
    return matchSearch && matchKat
  })

  const addUebung = (u: Uebung) => {
    const d = getStoredSettings()
    setPlan(p => [...p, {
      tempId: `${u.id}-${Date.now()}`,
      uebungId: u.id,
      uebungName: u.name,
      kategorie: u.kategorie,
      saetze: String(d.trainSaetze),
      wiederholungen: String(d.trainWdh),
      gewicht: '',
      dauer: '',
      pause: String(d.trainPause),
      notizen: '',
      reihenfolge: p.length,
    }])
  }

  const updateItem = (tempId: string, field: keyof PlanItem, value: string) => {
    setPlan(p => p.map(item => item.tempId === tempId ? { ...item, [field]: value } : item))
  }

  const removeItem = (tempId: string) => {
    setPlan(p => p.filter(item => item.tempId !== tempId).map((item, i) => ({ ...item, reihenfolge: i })))
  }

  const loadFromPrevious = (planId: string) => {
    const prev = previousPlans.find(p => p.id === planId)
    if (!prev) return
    setPlan(prev.uebungen.map((u, i) => ({
      tempId: `${u.uebungId}-${Date.now()}-${i}`,
      uebungId: u.uebungId,
      uebungName: u.uebungName,
      kategorie: u.kategorie,
      saetze: u.saetze != null ? String(u.saetze) : '3',
      wiederholungen: u.wiederholungen != null ? String(u.wiederholungen) : '10',
      gewicht: u.gewicht != null ? String(u.gewicht) : '',
      dauer: u.dauer != null ? String(u.dauer) : '',
      pause: u.pause != null ? String(u.pause) : '60',
      notizen: '',
      reihenfolge: i,
    })))
    setPlanName(`Kopie von ${prev.name}`)
  }

  // Drag handlers
  const onDragStart = (idx: number) => { dragIdx.current = idx }
  const onDragEnter = (idx: number) => setDragOver(idx)
  const onDragEnd = () => {
    if (dragIdx.current !== null && dragOver !== null && dragIdx.current !== dragOver) {
      const items = [...plan]
      const [removed] = items.splice(dragIdx.current, 1)
      items.splice(dragOver, 0, removed)
      setPlan(items.map((item, i) => ({ ...item, reihenfolge: i })))
    }
    dragIdx.current = null
    setDragOver(null)
  }

  const handleSave = () => {
    setError(null)
    if (!planName.trim()) { setError('Bitte einen Plannamen eingeben.'); return }
    if (plan.length === 0) { setError('Bitte mindestens eine Übung hinzufügen.'); return }
    startTransition(async () => {
      const result = editPlanId
        ? await updateTrainingsPlan(editPlanId, clientId, planName, planNotizen, plan)
        : await createTrainingsPlan(clientId, planName, planNotizen, plan)
      if (result?.error) setError(result.error)
    })
  }

  const schwStyle = (s: string | null) => {
    if (s === 'Anfänger') return 'text-emerald-400'
    if (s === 'Fortgeschritten') return 'text-orange-400'
    if (s === 'Profi') return 'text-red-400'
    return 'text-[#444444]'
  }

  return (
    <div className="space-y-4">
      {/* Plan info */}
      <div className="bg-[#141414] border border-[#2e2e2e] rounded-xl p-5 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-[#666666] mb-1.5">Planname *</label>
            <input className={ic('w-full text-sm py-2')} value={planName}
              onChange={e => setPlanName(e.target.value)} placeholder="z. B. Oberkörper A, Ganzkörper Woche 1…" />
          </div>
          {previousPlans.length > 0 && (
            <div>
              <label className="block text-xs text-[#666666] mb-1.5">Aus vorherigem Plan kopieren</label>
              <div className="relative">
                <select
                  className={ic('w-full text-sm py-2 appearance-none pr-8 cursor-pointer')}
                  onChange={e => e.target.value && loadFromPrevious(e.target.value)}
                  defaultValue="">
                  <option value="" className="bg-[#141414]">— Plan wählen —</option>
                  {previousPlans.map(p => (
                    <option key={p.id} value={p.id} className="bg-[#141414]">
                      {p.name} ({new Date(p.datum).toLocaleDateString('de-DE')})
                    </option>
                  ))}
                </select>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#555555]">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </div>
            </div>
          )}
        </div>
        <div>
          <label className="block text-xs text-[#666666] mb-1.5">Notizen (optional)</label>
          <input className={ic('w-full')} value={planNotizen}
            onChange={e => setPlanNotizen(e.target.value)} placeholder="Ziel, Intensität, Hinweise…" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* LEFT: Exercise catalog */}
        <div className="bg-[#141414] border border-[#2e2e2e] rounded-xl overflow-hidden flex flex-col max-h-[600px]">
          <div className="px-4 pt-4 pb-3 border-b border-[#1c1c1c] space-y-2.5">
            <p className="text-xs font-semibold text-[#666666] uppercase tracking-wider">Übungskatalog</p>
            <input className={ic('w-full')} placeholder="Übung suchen…"
              value={search} onChange={e => setSearch(e.target.value)} />
            <div className="flex gap-1 flex-wrap">
              {KATEGORIEN.map(k => (
                <button key={k} type="button" onClick={() => setKatFilter(k)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition-colors ${
                    katFilter === k ? 'bg-white text-black' : 'bg-[#1c1c1c] text-[#666666] hover:text-white'
                  }`}>
                  {k}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {/* Suggestions */}
            {suggestions.length > 0 && katFilter === 'Alle' && !search && (
              <div className="px-4 pt-3 pb-1">
                <p className="text-[10px] font-medium text-[#444444] uppercase tracking-wider mb-2">
                  Basierend auf Zielen ({clientZiele.join(', ')})
                </p>
                <div className="space-y-1 mb-3">
                  {suggestions.map(u => (
                    <button key={u.id} type="button" onClick={() => addUebung(u)}
                      className="w-full flex items-center justify-between px-3 py-2 bg-[#1c1c1c] hover:bg-[#242424] rounded-lg text-left transition-colors group">
                      <span>
                        <span className="text-sm text-[#efefef]">{u.name}</span>
                        <span className="text-[10px] text-[#444444] ml-2">{u.kategorie}</span>
                      </span>
                      <span className="text-white text-sm opacity-0 group-hover:opacity-100 transition-opacity font-medium">+</span>
                    </button>
                  ))}
                </div>
                <div className="border-t border-[#2e2e2e] mb-2" />
              </div>
            )}

            {/* All exercises */}
            <div className="px-4 pb-4 space-y-1">
              {filtered.map(u => {
                const inPlan = plan.some(p => p.uebungId === u.id)
                return (
                  <button key={u.id} type="button" onClick={() => !inPlan && addUebung(u)}
                    disabled={inPlan}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-colors group ${
                      inPlan ? 'opacity-40 cursor-not-allowed' : 'hover:bg-[#1c1c1c]'
                    }`}>
                    <div>
                      <span className="text-sm text-[#efefef]">{u.name}</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-[#444444]">{u.kategorie}</span>
                        {u.schwierigkeit && <span className={`text-[10px] ${schwStyle(u.schwierigkeit)}`}>{u.schwierigkeit}</span>}
                        {u.ausruestung && <span className="text-[10px] text-[#2e2e2e]">{u.ausruestung}</span>}
                      </div>
                    </div>
                    {inPlan
                      ? <span className="text-[10px] text-[#444444]">✓ Im Plan</span>
                      : <span className="text-white text-sm opacity-0 group-hover:opacity-100 transition-opacity font-medium">+</span>
                    }
                  </button>
                )
              })}
              {filtered.length === 0 && (
                <p className="text-sm text-[#3a3a3a] text-center py-6">Keine Übungen gefunden.</p>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT: Current plan */}
        <div className="bg-[#141414] border border-[#2e2e2e] rounded-xl overflow-hidden flex flex-col">
          <div className="px-4 pt-4 pb-3 border-b border-[#1c1c1c] flex items-center justify-between">
            <p className="text-xs font-semibold text-[#666666] uppercase tracking-wider">
              Mein Plan
            </p>
            <span className="text-[10px] text-[#3a3a3a]">{plan.length} Übungen</span>
          </div>

          {plan.length === 0 ? (
            <div className="flex-1 flex items-center justify-center py-16 text-center px-6">
              <div>
                <p className="text-sm text-[#3a3a3a] mb-2">Noch keine Übungen hinzugefügt.</p>
                <p className="text-xs text-[#2e2e2e]">Klicke auf eine Übung im Katalog, um sie hinzuzufügen.</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
              {plan.map((item, idx) => (
                <div key={item.tempId}
                  draggable
                  onDragStart={() => onDragStart(idx)}
                  onDragEnter={() => onDragEnter(idx)}
                  onDragEnd={onDragEnd}
                  onDragOver={e => e.preventDefault()}
                  className={`bg-[#0a0a0a] border rounded-xl p-3 transition-all cursor-grab active:cursor-grabbing ${
                    dragOver === idx ? 'border-white/30 scale-[0.99]' : 'border-[#2e2e2e]'
                  }`}>
                  <div className="flex items-start justify-between mb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[#3a3a3a] text-xs select-none">⠿</span>
                      <div>
                        <p className="text-sm font-medium text-[#efefef]">{item.uebungName}</p>
                        <p className="text-[10px] text-[#444444]">{item.kategorie}</p>
                      </div>
                    </div>
                    <button type="button" onClick={() => removeItem(item.tempId)}
                      className="text-[#3a3a3a] hover:text-red-500 transition-colors text-xs ml-2">✕</button>
                  </div>

                  <div className="grid grid-cols-4 gap-1.5">
                    <div>
                      <label className="block text-[9px] text-[#3a3a3a] mb-1">Sätze</label>
                      <input type="number" min="1" className={ic('w-full')}
                        value={item.saetze} onChange={e => updateItem(item.tempId, 'saetze', e.target.value)} placeholder="3" />
                    </div>
                    <div>
                      <label className="block text-[9px] text-[#3a3a3a] mb-1">Wdh.</label>
                      <input type="number" min="1" className={ic('w-full')}
                        value={item.wiederholungen} onChange={e => updateItem(item.tempId, 'wiederholungen', e.target.value)} placeholder="10" />
                    </div>
                    <div>
                      <label className="block text-[9px] text-[#3a3a3a] mb-1">Gewicht kg</label>
                      <input type="number" step="0.5" className={ic('w-full')}
                        value={item.gewicht} onChange={e => updateItem(item.tempId, 'gewicht', e.target.value)} placeholder="—" />
                    </div>
                    <div>
                      <label className="block text-[9px] text-[#3a3a3a] mb-1">Pause s</label>
                      <input type="number" className={ic('w-full')}
                        value={item.pause} onChange={e => updateItem(item.tempId, 'pause', e.target.value)} placeholder="60" />
                    </div>
                  </div>

                  <div className="mt-1.5">
                    <input className={ic('w-full text-[10px]')} value={item.notizen}
                      onChange={e => updateItem(item.tempId, 'notizen', e.target.value)} placeholder="Notiz (optional)…" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Save bar */}
          <div className="border-t border-[#1c1c1c] px-4 py-3 flex items-center justify-between gap-3">
            {error ? (
              <p className="text-xs text-red-400">{error}</p>
            ) : (
              <p className="text-xs text-[#3a3a3a]">
                {plan.length > 0 ? `${plan.length} Übung${plan.length > 1 ? 'en' : ''} bereit` : 'Plan aufbauen…'}
              </p>
            )}
            <button type="button" onClick={handleSave} disabled={isPending}
              className="bg-white hover:bg-[#e8e8e8] disabled:opacity-50 text-black text-sm font-semibold px-5 py-2 rounded-lg transition-colors shrink-0">
              {isPending ? 'Speichern…' : editPlanId ? 'Plan aktualisieren' : 'Plan speichern'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
