'use client'

import { useState, useTransition } from 'react'
import { updatePraxisKontakt } from '@/app/actions/account'

const ic = 'w-full px-3 py-2 bg-[#0a0a0a] border border-[#2e2e2e] rounded-lg text-sm text-[#efefef] placeholder:text-[#3a3a3a] focus:outline-none focus:border-[#555555] transition-colors'

type Props = {
  initialAdresse: string; initialStrasse: string; initialPlz: string; initialOrt: string
  initialTelefon: string; initialEmail: string; initialWebsite: string
  initialMwstNr: string; initialIban: string; initialQrIban: string
  initialBank: string; initialBic: string
  initialRechnungMwst: string; initialRechnungBetreff: string; initialRechnungText: string
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="px-5 py-4 space-y-2">
      <div>
        <p className="text-sm text-[#efefef]">{label}</p>
        {hint && <p className="text-xs text-[#444444] mt-0.5">{hint}</p>}
      </div>
      {children}
    </div>
  )
}

export default function PraxisKontaktForm({
  initialAdresse, initialStrasse, initialPlz, initialOrt,
  initialTelefon, initialEmail, initialWebsite,
  initialMwstNr, initialIban, initialQrIban, initialBank, initialBic,
  initialRechnungMwst, initialRechnungBetreff, initialRechnungText,
}: Props) {
  const [adresse,          setAdresse]          = useState(initialAdresse)
  const [strasse,          setStrasse]          = useState(initialStrasse)
  const [plz,              setPlz]              = useState(initialPlz)
  const [ort,              setOrt]              = useState(initialOrt)
  const [telefon,          setTelefon]          = useState(initialTelefon)
  const [email,            setEmail]            = useState(initialEmail)
  const [website,          setWebsite]          = useState(initialWebsite)
  const [mwstNr,           setMwstNr]           = useState(initialMwstNr)
  const [iban,             setIban]             = useState(initialIban)
  const [qrIban,           setQrIban]           = useState(initialQrIban)
  const [bank,             setBank]             = useState(initialBank)
  const [bic,              setBic]              = useState(initialBic)
  const [rechnungMwst,     setRechnungMwst]     = useState(initialRechnungMwst)
  const [rechnungBetreff,  setRechnungBetreff]  = useState(initialRechnungBetreff)
  const [rechnungText,     setRechnungText]     = useState(initialRechnungText)
  const [msg, setMsg]   = useState<{ ok: boolean; text: string } | null>(null)
  const [isPending, start] = useTransition()

  function handleSave() {
    start(async () => {
      const r = await updatePraxisKontakt({
        adresse, strasse, plz, ort, telefon, email, website, mwstNr,
        iban, qrIban, bank, bic,
        rechnungMwst, rechnungBetreff, rechnungText,
      })
      setMsg(r.error ? { ok: false, text: r.error } : { ok: true, text: 'Einstellungen gespeichert.' })
      setTimeout(() => setMsg(null), 3000)
    })
  }

  return (
    <div className="space-y-4">

      {/* Praxis contact */}
      <div className="bg-[#141414] border border-[#2e2e2e] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#1c1c1c]">
          <h2 className="text-sm font-semibold text-[#efefef]">Praxis-Kontakt</h2>
          <p className="text-xs text-[#444444] mt-0.5">Erscheint im Rechnungs-PDF-Header und Footer</p>
        </div>
        <div className="divide-y divide-[#1c1c1c]">
          <Field label="Adresse (PDF-Footer)" hint="Einzeilig für den Footer — z. B. Musterstrasse 1, 8000 Zürich">
            <input type="text" value={adresse} onChange={e => setAdresse(e.target.value)}
              placeholder="Musterstrasse 1, 8000 Zürich" className={ic} />
          </Field>
          <Field label="Telefon">
            <input type="text" value={telefon} onChange={e => setTelefon(e.target.value)}
              placeholder="+41 XX XXX XX XX" className={ic} />
          </Field>
          <Field label="E-Mail">
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="info@fitallcoach.ch" className={ic} />
          </Field>
          <Field label="Website">
            <input type="text" value={website} onChange={e => setWebsite(e.target.value)}
              placeholder="www.fitallcoach.ch" className={ic} />
          </Field>
          <Field label="MwSt-Nr." hint="Nur ausfüllen falls MwSt-pflichtig (Jahresumsatz > CHF 100'000)">
            <input type="text" value={mwstNr} onChange={e => setMwstNr(e.target.value)}
              placeholder="CHE-XXX.XXX.XXX MWST" className={ic} />
          </Field>
        </div>
      </div>

      {/* QR bill address */}
      <div className="bg-[#141414] border border-[#2e2e2e] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#1c1c1c]">
          <h2 className="text-sm font-semibold text-[#efefef]">Adresse für QR-Rechnung</h2>
          <p className="text-xs text-[#444444] mt-0.5">Der QR-Einzahlungsschein benötigt Strasse, PLZ und Ort separat</p>
        </div>
        <div className="divide-y divide-[#1c1c1c]">
          <Field label="Strasse + Hausnummer">
            <input type="text" value={strasse} onChange={e => setStrasse(e.target.value)}
              placeholder="Musterstrasse 1" className={ic} />
          </Field>
          <div className="px-5 py-4 grid grid-cols-[100px_1fr] gap-3">
            <div className="space-y-2">
              <p className="text-sm text-[#efefef]">PLZ</p>
              <input type="text" value={plz} onChange={e => setPlz(e.target.value)}
                placeholder="8000" className={ic} />
            </div>
            <div className="space-y-2">
              <p className="text-sm text-[#efefef]">Ort</p>
              <input type="text" value={ort} onChange={e => setOrt(e.target.value)}
                placeholder="Zürich" className={ic} />
            </div>
          </div>
        </div>
      </div>

      {/* Bank */}
      <div className="bg-[#141414] border border-[#2e2e2e] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#1c1c1c]">
          <h2 className="text-sm font-semibold text-[#efefef]">Bankverbindung</h2>
          <p className="text-xs text-[#444444] mt-0.5">Erscheint im PDF-Footer und im QR-Einzahlungsschein</p>
        </div>
        <div className="divide-y divide-[#1c1c1c]">
          <Field label="Bank">
            <input type="text" value={bank} onChange={e => setBank(e.target.value)}
              placeholder="Zürcher Kantonalbank" className={ic} />
          </Field>
          <Field label="IBAN (regulär)" hint="Normaler IBAN — wird im PDF-Footer angezeigt">
            <input type="text" value={iban} onChange={e => setIban(e.target.value)}
              placeholder="CH56 0483 5012 3456 7800 9" className={ic} />
          </Field>
          <Field label="QR-IBAN (optional)" hint="Von Ihrer Bank erhältlich — beginnt mit CH3... oder CH4... (IID 30xxx/31xxx). Falls ausgefüllt, wird QR-Einzahlungsschein mit QR-Referenz generiert.">
            <input type="text" value={qrIban} onChange={e => setQrIban(e.target.value)}
              placeholder="CH44 3199 9123 0008 8901 2  ← Beispiel QR-IBAN" className={ic} />
          </Field>
          <Field label="BIC/SWIFT">
            <input type="text" value={bic} onChange={e => setBic(e.target.value)}
              placeholder="ZKBKCHZZ80A" className={ic} />
          </Field>
        </div>
      </div>

      {/* Invoice defaults */}
      <div className="bg-[#141414] border border-[#2e2e2e] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#1c1c1c]">
          <h2 className="text-sm font-semibold text-[#efefef]">Rechnungs-Vorlagen</h2>
          <p className="text-xs text-[#444444] mt-0.5">Diese Werte werden bei jeder neuen Rechnung automatisch vorausgefüllt</p>
        </div>
        <div className="divide-y divide-[#1c1c1c]">
          <Field label="Standard-MwSt (%)" hint="0 = keine MwSt (Standard für Kleinunternehmen)">
            <input type="number" min="0" max="100" step="0.1"
              value={rechnungMwst} onChange={e => setRechnungMwst(e.target.value)}
              placeholder="0" className={ic} style={{ maxWidth: 120 }} />
          </Field>
          <Field label="Standard-Betreff" hint="Erscheint als Betreff-Zeile im Rechnungs-PDF">
            <input type="text" value={rechnungBetreff} onChange={e => setRechnungBetreff(e.target.value)}
              placeholder="Coaching-Dienstleistungen" className={ic} />
          </Field>
          <Field label="Standard-Text" hint="Einleitungstext der Rechnung — z. B. Zahlungsaufforderung">
            <textarea rows={4} value={rechnungText} onChange={e => setRechnungText(e.target.value)}
              placeholder={'Vielen Dank für dein Vertrauen. Ich bitte dich, den Betrag innerhalb von 20 Tagen zu überweisen.'}
              className={ic + ' resize-none'} />
          </Field>
        </div>
      </div>

      {msg && <p className={`text-sm ${msg.ok ? 'text-emerald-400' : 'text-red-400'}`}>{msg.text}</p>}

      <button type="button" onClick={handleSave} disabled={isPending}
        className="bg-white hover:bg-[#e8e8e8] disabled:opacity-50 text-black text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors">
        {isPending ? 'Speichere…' : 'Einstellungen speichern'}
      </button>
    </div>
  )
}
