import Link from 'next/link'
import PraxisKontaktForm from '@/components/PraxisKontaktForm'
import { getPraxisConfig } from '@/lib/praxis'

export default async function KontaktSettingsPage() {
  const praxis = await getPraxisConfig()

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-3xl">
      <div className="mb-6">
        <Link href="/settings" className="text-xs text-[#555555] hover:text-[#efefef] transition-colors inline-flex items-center gap-1 mb-2">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
          Einstellungen
        </Link>
        <h1 className="text-xl font-bold text-white mt-1.5">Rechnungs-Einstellungen</h1>
        <p className="text-xs text-[#444444] mt-0.5">Kontaktdaten, Bankverbindung und QR-Rechnung</p>
      </div>
      <PraxisKontaktForm
        initialAdresse={praxis.adresse}
        initialStrasse={praxis.strasse}
        initialPlz={praxis.plz}
        initialOrt={praxis.ort}
        initialTelefon={praxis.telefon}
        initialEmail={praxis.email}
        initialWebsite={praxis.website}
        initialMwstNr={praxis.mwstNr}
        initialIban={praxis.iban}
        initialQrIban={praxis.qrIban}
        initialBank={praxis.bank}
        initialBic={praxis.bic}
        initialRechnungMwst={praxis.rechnungMwst}
        initialRechnungBetreff={praxis.rechnungBetreff}
        initialRechnungText={praxis.rechnungText}
      />
    </div>
  )
}
