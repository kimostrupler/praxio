import ClientForm from '@/components/ClientForm'
import Link from 'next/link'

export default function NewClientPage() {
  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-3xl">
      <div className="mb-6">
        <Link href="/clients" className="text-xs text-[#555555] hover:text-[#efefef] transition-colors inline-flex items-center gap-1 mb-2">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
          Zurück zu Klienten
        </Link>
        <h1 className="text-xl font-bold text-white mt-2">Neuer Klient</h1>
        <p className="text-sm text-[#3a3a3a] mt-1">
          Persönliche Daten erfassen. Den Anamnesebogen kannst du danach im Profil hinzufügen.
        </p>
      </div>
      <div className="bg-[#141414] border border-[#2e2e2e] rounded-2xl p-6 md:p-8">
        <ClientForm />
      </div>
    </div>
  )
}
