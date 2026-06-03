import Link from 'next/link'
import ErnaehrungsBuilder from '@/components/ErnaehrungsBuilder'

export default function NeueVorlagePage() {
  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-3xl">
      <Link href="/ernaehrung" className="text-xs text-[#555555] hover:text-[#efefef] transition-colors inline-flex items-center gap-1 mb-2">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
          Ernährung
      </Link>
      <h1 className="text-xl font-bold text-white mt-3 mb-6">Neue Vorlage</h1>
      <ErnaehrungsBuilder cancelHref="/ernaehrung" />
    </div>
  )
}
