import Link from 'next/link'
import PresetKarte from '@/components/PresetKarte'
import { parseJsonArray } from '@/lib/client-utils'
import ErnaehrungsVorlageKarte from '@/components/ErnaehrungsVorlageKarte'
import PlaeneFilter from '@/components/PlaeneFilter'
import UebungHinzufuegenForm from '@/components/UebungHinzufuegenForm'
import { deleteUebung } from '@/app/actions/training'
import { getCachedPlaeneData } from '@/lib/queries'

type Props = { searchParams: Promise<{ tab?: string }> }

const TABS = [
  { key: 'vorlagen', label: 'Vorlagen' },
  { key: 'zugewiesen', label: 'Zugewiesen' },
  { key: 'uebungen', label: 'Übungen' },
]

const SCHW_STYLE: Record<string, string> = {
  Anfänger: 'text-emerald-400',
  Fortgeschritten: 'text-orange-400',
  Profi: 'text-red-400',
}

async function DeleteUebungButton({ id }: { id: string }) {
  async function handleDelete() {
    'use server'
    await deleteUebung(id)
  }
  return (
    <form action={handleDelete}>
      <button type="submit"
        className="text-[#3a3a3a] hover:text-red-500 transition-colors text-xs">
        Löschen
      </button>
    </form>
  )
}

export default async function PlaenePage(props: Props) {
  const searchParams = await props.searchParams;
  const tab = searchParams.tab ?? 'vorlagen'

  const { presets, ernaehrungsVorlagen, alleClients, alleUebungen, allePlaene, alleErnaehrungsPlaene } = await getCachedPlaeneData()

  // Group exercises by category
  const byKat: Record<string, typeof alleUebungen> = {}
  for (const u of alleUebungen) {
    if (!byKat[u.kategorie]) byKat[u.kategorie] = []
    byKat[u.kategorie].push(u)
  }

  // Build combined plan list for Zugewiesen tab
  const combinedPlans = [
    ...allePlaene.map(p => ({
      id: p.id,
      name: p.name,
      datum: p.datum,
      typ: 'training' as const,
      clientId: p.client.id,
      clientVorname: p.client.vorname,
      clientNachname: p.client.nachname,
      meta: `${p.uebungen.length} Übung${p.uebungen.length !== 1 ? 'en' : ''}`,
      href: `/clients/${p.client.id}?tab=training`,
    })),
    ...alleErnaehrungsPlaene.map(p => {
      const totalKcal = p.zeilen.reduce((s, z) => s + (z.kalorien ?? 0), 0)
      return {
        id: p.id,
        name: p.name,
        datum: p.datum,
        typ: 'ernaehrung' as const,
        clientId: p.client.id,
        clientVorname: p.client.vorname,
        clientNachname: p.client.nachname,
        meta: totalKcal > 0 ? `${totalKcal} kcal/Tag` : `${p.zeilen.length} Mahlzeit${p.zeilen.length !== 1 ? 'en' : ''}`,
        href: `/clients/${p.client.id}?tab=ernaehrung`,
      }
    }),
  ].sort((a, b) => new Date(b.datum).getTime() - new Date(a.datum).getTime())

  return (
    <div className="p-4 md:p-6 lg:p-8 w-full">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">Pläne</h1>
        <p className="text-xs text-[#3a3a3a] mt-0.5">
          {presets.length} Training-Vorlagen · {ernaehrungsVorlagen.length} Ernährungs-Vorlagen · {allePlaene.length + alleErnaehrungsPlaene.length} zugewiesen
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-[#1c1c1c]">
        {TABS.map(t => (
          <Link key={t.key} href={`/plaene?tab=${t.key}`}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              tab === t.key
                ? 'text-white border-white'
                : 'text-[#555555] border-transparent hover:text-[#888888]'
            }`}>
            {t.label}
          </Link>
        ))}
      </div>

      {/* ── Vorlagen ── */}
      {tab === 'vorlagen' && (
        <div className="space-y-8">
          {/* Training section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-[#3a3a3a] uppercase tracking-wider">Training-Vorlagen</p>
              <Link href="/training/presets/neu"
                className="bg-white hover:bg-[#e8e8e8] text-black text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
                + Neue Training-Vorlage
              </Link>
            </div>
            {presets.length === 0 ? (
              <div className="bg-[#141414] border border-[#2e2e2e] rounded-xl py-12 text-center">
                <p className="text-sm text-[#3a3a3a] mb-3">Noch keine Training-Vorlagen vorhanden.</p>
                <Link href="/training/presets/neu" className="text-sm text-white/60 hover:text-white transition-colors">
                  Erste Vorlage erstellen →
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {presets.map(preset => (
                  <PresetKarte key={preset.id} preset={{ ...preset, ziele: parseJsonArray(preset.ziele) }} clients={alleClients} />
                ))}
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="border-t border-[#1c1c1c]" />

          {/* Ernährung section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-[#3a3a3a] uppercase tracking-wider">Ernährungs-Vorlagen</p>
              <Link href="/ernaehrung/vorlagen/neu"
                className="bg-white hover:bg-[#e8e8e8] text-black text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
                + Neue Ernährungs-Vorlage
              </Link>
            </div>
            {ernaehrungsVorlagen.length === 0 ? (
              <div className="bg-[#141414] border border-[#2e2e2e] rounded-xl py-12 text-center">
                <p className="text-sm text-[#3a3a3a] mb-3">Noch keine Ernährungs-Vorlagen vorhanden.</p>
                <Link href="/ernaehrung/vorlagen/neu" className="text-sm text-white/60 hover:text-white transition-colors">
                  Erste Vorlage erstellen →
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {ernaehrungsVorlagen.map(v => (
                  <ErnaehrungsVorlageKarte key={v.id} vorlage={v} clients={alleClients} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Zugewiesen ── */}
      {tab === 'zugewiesen' && (
        <div>
          {combinedPlans.length === 0 ? (
            <div className="bg-[#141414] border border-[#2e2e2e] rounded-xl py-12 text-center space-y-1">
              <p className="text-sm text-[#3a3a3a]">Noch keine Pläne zugewiesen.</p>
              <p className="text-xs text-[#3a3a3a]">Öffne einen Klienten oder weise eine Vorlage zu.</p>
            </div>
          ) : (
            <PlaeneFilter plans={combinedPlans} />
          )}
        </div>
      )}

      {/* ── Übungen ── */}
      {tab === 'uebungen' && (
        <div className="space-y-6">
          <UebungHinzufuegenForm />

          {Object.entries(byKat).map(([kat, uebungen]) => (
            <div key={kat}>
              <p className="text-xs font-semibold text-[#3a3a3a] uppercase tracking-wider mb-2">{kat}</p>
              <div className="bg-[#141414] border border-[#2e2e2e] rounded-xl overflow-hidden">
                {uebungen.map((u, idx) => (
                  <div key={u.id} className={`flex items-center justify-between px-4 py-3 ${
                    idx !== uebungen.length - 1 ? 'border-b border-[#1c1c1c]' : ''
                  }`}>
                    <div className="flex items-center gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-[#efefef]">{u.name}</p>
                          {u.isCustom && (
                            <span className="text-[9px] text-[#444444] border border-[#2e2e2e] px-1 py-0.5 rounded">
                              Eigene
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          {u.schwierigkeit && (
                            <span className={`text-[10px] ${SCHW_STYLE[u.schwierigkeit] ?? 'text-[#444444]'}`}>
                              {u.schwierigkeit}
                            </span>
                          )}
                          {u.ausruestung && (
                            <span className="text-[10px] text-[#3a3a3a]">{u.ausruestung}</span>
                          )}
                          {parseJsonArray(u.ziele).length > 0 && (
                            <span className="text-[10px] text-[#3a3a3a]">{parseJsonArray(u.ziele).join(', ')}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    {u.isCustom && <DeleteUebungButton id={u.id} />}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
