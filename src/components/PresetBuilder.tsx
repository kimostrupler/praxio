'use client'

import { useState, useTransition, useRef } from 'react'
import { createPreset, updatePreset, updatePresetAndPlans, type PresetUebungInput } from '@/app/actions/training'
import { getStoredSettings } from '@/components/SettingsProvider'

type Uebung = {
  id: string
  name: string
  kategorie: string
  schwierigkeit: string | null
  ausruestung: string | null
}

type PlanItem = PresetUebungInput & { tempId: string; uebungName: string; kategorie: string }

type InitialUebung = {
  uebungId: string; uebungName: string; kategorie: string
  saetze: number | null; wiederholungen: number | null; gewicht: number | null
  dauer: number | null; pause: number | null
}

const KATEGORIEN = ['Alle', 'Brust', 'Rücken', 'Beine', 'Schultern', 'Arme', 'Bauch', 'Kardio', 'Ganzkörper']
const ZIELE = ['Abnehmen', 'Muskelaufbau', 'Körperfett reduzieren', 'Gesünder leben', 'Leistungssteigerung', 'Mehr Energie']

const ic = (extra = '') =>
  `px-2.5 py-1.5 bg-[#0a0a0a] border border-[#2e2e2e] rounded-lg text-xs text-[#efefef] placeholder:text-[#3a3a3a] focus:outline-none focus:border-[#555555] transition-colors ${extra}`

const schwStyle = (s: string | null) => {
  if (s === 'Anfänger') return 'text-emerald-400'
  if (s === 'Fortgeschritten') return 'text-orange-400'
  if (s === 'Profi') return 'text-red-400'
  return ''
}

type Props = {
  alleUebungen: Uebung[]
  editPresetId?: string
  assignedCount?: number
  initialName?: string
  initialBeschreibung?: string
  initialZiele?: string[]
  initialUebungen?: InitialUebung[]
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
    reihenfolge: i,
  }
}

export default function PresetBuilder({
  alleUebungen,
  editPresetId,
  assignedCount = 0,
  initialName = '',
  initialBeschreibung = '',
  initialZiele = [],
  initialUebungen = [],
}: Props) {
  const [name, setName] = useState(initialName)
  const [beschreibung, setBeschreibung] = useState(initialBeschreibung)
  const [ziele, setZiele] = useState<string[]>(initialZiele)
  const [search, setSearch] = useState('')
  const [katFilter, setKatFilter] = useState('Alle')
  const [plan, setPlan] = useState<PlanItem[]>(() => initialUebungen.map(toItem))
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const dragIdx = useRef<number | null>(null)
  const [dragOver, setDragOver] = useState<number | null>(null)

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
      reihenfolge: p.length,
    }])
  }

  const updateItem = (tempId: string, field: string, value: string) => {
    setPlan(p => p.map(item => item.tempId === tempId ? { ...item, [field]: value } : item))
  }

  const removeItem = (tempId: string) => {
    setPlan(p => p.filter(item => item.tempId !== tempId).map((item, i) => ({ ...item, reihenfolge: i })))
  }

  const toggleZiel = (z: string) =>
    setZiele(prev => prev.includes(z) ? prev.filter(x => x !== z) : [...prev, z])

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

  const [choosing, setChoosing] = useState(false)

  const validate = () => {
    setError(null)
    if (!name.trim()) { setError('Bitte einen Namen eingeben.'); return false }
    if (plan.length === 0) { setError('Bitte mindestens eine Übung hinzufügen.'); return false }
    return true
  }

  const handleSaveClick = () => {
    if (!validate()) return
    // In edit mode with assigned clients → show choice panel
    if (editPresetId && assignedCount > 0) { setChoosing(true); return }
    // Otherwise just save
    startTransition(async () => {
      const result = editPresetId
        ? await updatePreset(editPresetId, name, beschreibung, ziele, plan)
        : await createPreset(name, beschreibung, ziele, plan)
      if (result?.error) setError(result.error)
    })
  }

  const executeSave = (mode: 'all' | 'preset-only' | 'new') => {
    startTransition(async () => {
      let result
      if (mode === 'all') {
        result = await updatePresetAndPlans(editPresetId!, name, beschreibung, ziele, plan)
      } else if (mode === 'preset-only') {
        result = await updatePreset(editPresetId!, name, beschreibung, ziele, plan)
      } else {
        result = await createPreset(name, beschreibung, ziele, plan)
      }
      if (result?.error) { setError(result.error); setChoosing(false) }
    })
  }

  return (
    <div className="space-y-4">
      {/* Preset info */}
      <div className="bg-[#141414] border border-[#2e2e2e] rounded-xl p-5 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-[#666666] mb-1.5">Vorlagenname *</label>
            <input className={ic('w-full text-sm py-2')} value={name}
              onChange={e => setName(e.target.value)} placeholder="z. B. Ganzkörper Einsteiger, Push A…" />
          </div>
          <div>
            <label className="block text-xs text-[#666666] mb-1.5">Beschreibung (optional)</label>
            <input className={ic('w-full text-sm py-2')} value={beschreibung}
              onChange={e => setBeschreibung(e.target.value)} placeholder="Ziel, Intensität, Hinweise…" />
          </div>
        </div>
        <div>
          <label className="block text-xs text-[#666666] mb-2">Ziele dieser Vorlage</label>
          <div className="flex flex-wrap gap-2">
            {ZIELE.map(z => (
              <button key={z} type="button" onClick={() => toggleZiel(z)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                  ziele.includes(z) ? 'bg-white text-black' : 'bg-[#1c1c1c] text-[#666666] hover:text-white border border-[#2e2e2e]'
                }`}>
                {z}
              </button>
            ))}
          </div>
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
          <div className="flex-1 overflow-y-auto px-4 pb-4 pt-3 space-y-1">
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
                      {u.schwierigkeit && (
                        <span className={`text-[10px] ${schwStyle(u.schwierigkeit)}`}>{u.schwierigkeit}</span>
                      )}
                    </div>
                  </div>
                  {inPlan
                    ? <span className="text-[10px] text-[#444444]">✓</span>
                    : <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity font-medium">+</span>
                  }
                </button>
              )
            })}
            {filtered.length === 0 && (
              <p className="text-sm text-[#3a3a3a] text-center py-6">Keine Übungen gefunden.</p>
            )}
          </div>
        </div>

        {/* RIGHT: Current plan */}
        <div className="bg-[#141414] border border-[#2e2e2e] rounded-xl overflow-hidden flex flex-col">
          <div className="px-4 pt-4 pb-3 border-b border-[#1c1c1c] flex items-center justify-between">
            <p className="text-xs font-semibold text-[#666666] uppercase tracking-wider">Vorlage</p>
            <span className="text-[10px] text-[#3a3a3a]">{plan.length} Übungen</span>
          </div>

          {plan.length === 0 ? (
            <div className="flex-1 flex items-center justify-center py-16 text-center px-6">
              <p className="text-sm text-[#3a3a3a]">Klicke auf eine Übung links, um sie hinzuzufügen.</p>
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
                      <label className="block text-[9px] text-[#3a3a3a] mb-1">kg</label>
                      <input type="number" step="0.5" className={ic('w-full')}
                        value={item.gewicht} onChange={e => updateItem(item.tempId, 'gewicht', e.target.value)} placeholder="—" />
                    </div>
                    <div>
                      <label className="block text-[9px] text-[#3a3a3a] mb-1">Pause s</label>
                      <input type="number" className={ic('w-full')}
                        value={item.pause} onChange={e => updateItem(item.tempId, 'pause', e.target.value)} placeholder="60" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {choosing ? (
            <div className="border-t border-[#1c1c1c] px-4 py-4 space-y-3">
              <div>
                <p className="text-sm font-semibold text-[#efefef] mb-0.5">Wie speichern?</p>
                <p className="text-xs text-[#444444]">
                  {assignedCount} Klient{assignedCount !== 1 ? 'en' : ''} {assignedCount !== 1 ? 'sind' : 'ist'} diese Vorlage zugewiesen.
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <button type="button" disabled={isPending}
                  onClick={() => executeSave('all')}
                  className="w-full bg-white hover:bg-[#e8e8e8] disabled:opacity-50 text-black text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors text-left">
                  {isPending ? 'Speichern…' : `Vorlage & ${assignedCount} Plan${assignedCount !== 1 ? 'e' : ''} aktualisieren`}
                </button>
                <button type="button" disabled={isPending}
                  onClick={() => executeSave('preset-only')}
                  className="w-full bg-[#1c1c1c] hover:bg-[#242424] disabled:opacity-50 text-[#efefef] text-sm px-4 py-2.5 rounded-lg transition-colors text-left border border-[#2e2e2e]">
                  Nur Vorlage aktualisieren
                </button>
                <button type="button" disabled={isPending}
                  onClick={() => executeSave('new')}
                  className="w-full bg-[#1c1c1c] hover:bg-[#242424] disabled:opacity-50 text-[#efefef] text-sm px-4 py-2.5 rounded-lg transition-colors text-left border border-[#2e2e2e]">
                  Als neue Vorlage speichern
                </button>
              </div>
              {error && <p className="text-xs text-red-400">{error}</p>}
              <button type="button" onClick={() => { setChoosing(false); setError(null) }}
                className="text-xs text-[#3a3a3a] hover:text-[#666666] transition-colors">
                Abbrechen
              </button>
            </div>
          ) : (
            <div className="border-t border-[#1c1c1c] px-4 py-3 flex items-center justify-between gap-3">
              {error
                ? <p className="text-xs text-red-400">{error}</p>
                : <p className="text-xs text-[#3a3a3a]">{plan.length > 0 ? `${plan.length} Übung${plan.length > 1 ? 'en' : ''} bereit` : 'Vorlage aufbauen…'}</p>
              }
              <button type="button" onClick={handleSaveClick} disabled={isPending}
                className="bg-white hover:bg-[#e8e8e8] disabled:opacity-50 text-black text-sm font-semibold px-5 py-2 rounded-lg transition-colors shrink-0">
                {isPending ? 'Speichern…' : editPresetId ? 'Vorlage aktualisieren' : 'Vorlage speichern'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
