import { prisma } from '@/lib/db'
import Link from 'next/link'
import PresetBuilder from '@/components/PresetBuilder'

export default async function NeueVorlagePage() {
  const alleUebungen = await prisma.uebung.findMany({
    orderBy: [{ kategorie: 'asc' }, { name: 'asc' }],
  })

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-5xl">
      <div className="mb-6">
        <Link href="/training?tab=vorlagen"
          className="text-xs text-[#555555] hover:text-[#efefef] transition-colors inline-flex items-center gap-1 mb-2">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
          Training · Vorlagen
        </Link>
        <h1 className="text-xl font-bold text-white mt-2">Neue Vorlage erstellen</h1>
        <p className="text-xs text-[#444444] mt-0.5">
          Vorlagen sind wiederverwendbare Trainingspläne, die du Klienten zuweisen kannst.
        </p>
      </div>
      <PresetBuilder alleUebungen={alleUebungen} />
    </div>
  )
}
