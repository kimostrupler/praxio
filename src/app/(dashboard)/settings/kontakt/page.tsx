import Link from 'next/link'
import PraxisKontaktForm from '@/components/PraxisKontaktForm'

export default function KontaktSettingsPage() {
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
        initialAdresse={process.env.PRAXIS_ADRESSE              ?? ''}
        initialStrasse={process.env.PRAXIS_STRASSE              ?? ''}
        initialPlz={process.env.PRAXIS_PLZ                      ?? ''}
        initialOrt={process.env.PRAXIS_ORT                      ?? ''}
        initialTelefon={process.env.PRAXIS_TELEFON              ?? ''}
        initialEmail={process.env.PRAXIS_EMAIL_ADDR             ?? ''}
        initialWebsite={process.env.PRAXIS_WEBSITE              ?? ''}
        initialMwstNr={process.env.PRAXIS_MWST_NR               ?? ''}
        initialIban={process.env.PRAXIS_IBAN                    ?? ''}
        initialQrIban={process.env.PRAXIS_QR_IBAN               ?? ''}
        initialBank={process.env.PRAXIS_BANK                    ?? ''}
        initialBic={process.env.PRAXIS_BIC                      ?? ''}
        initialRechnungMwst={process.env.RECHNUNG_MWST_DEFAULT     ?? '0'}
        initialRechnungBetreff={process.env.RECHNUNG_BETREFF_DEFAULT ?? ''}
        initialRechnungText={process.env.RECHNUNG_TEXT_DEFAULT     ?? ''}
      />
    </div>
  )
}
