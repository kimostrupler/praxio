'use client'

import { useState, useRef, useEffect } from 'react'

type Props = {
  clientId:      string
  clientEmail:   string | null
  clientVorname: string
  praxisName:    string
  hasPlaene?:    boolean
  hasErnaehrung?: boolean
}

type Item = {
  label:   string
  subject: string
  body:    string
  pdfUrl?: string
  icon:    React.ReactNode
}

const Icon = ({ children }: { children: React.ReactNode }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
    {children}
  </svg>
)

const PdfBadge = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-[#555555]">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
  </svg>
)

export default function EmailMenu({ clientId, clientEmail, clientVorname, praxisName, hasPlaene, hasErnaehrung }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onMouse(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onMouse)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onMouse)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const items: Item[] = [
    {
      label:   'Willkommen',
      subject: `Willkommen bei ${praxisName}`,
      body:    `Hallo ${clientVorname},\n\nHerzlich willkommen! Ich freue mich, dich auf deinem Weg zu begleiten.\n\nBei Fragen stehe ich dir jederzeit zur Verfügung.\n\nHerzliche Grüsse\n${praxisName}`,
      icon: <Icon><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></Icon>,
    },
    {
      label:   'Fortschrittsbericht',
      subject: `Fortschrittsbericht – ${praxisName}`,
      body:    `Hallo ${clientVorname},\n\nim Anhang findest du deinen aktuellen Fortschrittsbericht.\n\nBei Fragen stehe ich dir gerne zur Verfügung.\n\nHerzliche Grüsse\n${praxisName}`,
      pdfUrl:  `/api/pdf/fortschritt/${clientId}`,
      icon: <Icon><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></Icon>,
    },
    ...(hasPlaene ? [{
      label:   'Trainingsplan',
      subject: 'Dein aktueller Trainingsplan',
      body:    `Hallo ${clientVorname},\n\nim Anhang findest du deinen aktuellen Trainingsplan.\n\nBitte melde dich, falls du Fragen hast oder Anpassungen wünscht.\n\nHerzliche Grüsse\n${praxisName}`,
      pdfUrl:  `/api/pdf/trainingplaene/${clientId}`,
      icon: <Icon><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></Icon>,
    } as Item] : []),
    ...(hasErnaehrung ? [{
      label:   'Ernährungsplan',
      subject: 'Dein Ernährungsplan',
      body:    `Hallo ${clientVorname},\n\nim Anhang findest du deinen aktuellen Ernährungsplan mit deinen persönlichen Makros.\n\nBei Fragen bin ich gerne für dich da.\n\nHerzliche Grüsse\n${praxisName}`,
      pdfUrl:  `/api/pdf/ernaehrungsplaene/${clientId}`,
      icon: <Icon><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></Icon>,
    } as Item] : []),
    {
      label:   'Vertrag',
      subject: `Coaching-Vertrag – ${praxisName}`,
      body:    `Hallo ${clientVorname},\n\nim Anhang findest du unseren Coaching-Vertrag. Bitte prüfe ihn und melde dich bei Fragen.\n\nHerzliche Grüsse\n${praxisName}`,
      pdfUrl:  `/api/pdf/vertrag/${clientId}`,
      icon: <Icon><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></Icon>,
    },
    {
      label:   'Check-in',
      subject: 'Check-in – Wie läuft es?',
      body:    `Hallo ${clientVorname},\n\nich wollte kurz nachfragen, wie es dir geht und wie dein Fortschritt läuft.\n\nHast du Fragen zu deinem Plan oder wünschst du Anpassungen? Ich freue mich von dir zu hören!\n\nHerzliche Grüsse\n${praxisName}`,
      icon: <Icon><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></Icon>,
    },
    {
      label:   'Termin-Erinnerung',
      subject: 'Erinnerung: Unser Termin',
      body:    `Hallo ${clientVorname},\n\nich möchte dich an unseren bevorstehenden Termin erinnern.\n\nBitte melde dich, falls du nicht kommen kannst, damit wir einen neuen Termin finden können.\n\nHerzliche Grüsse\n${praxisName}`,
      icon: <Icon><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></Icon>,
    },
  ]

  function handleSend(item: Item) {
    setOpen(false)
    if (item.pdfUrl) window.open(item.pdfUrl)
    window.location.href = `mailto:${clientEmail}?subject=${encodeURIComponent(item.subject)}&body=${encodeURIComponent(item.body)}`
  }

  const disabled = !clientEmail

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => !disabled && setOpen(v => !v)}
        disabled={disabled}
        title={disabled ? 'Keine E-Mail-Adresse hinterlegt' : undefined}
        className={`flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg border transition-all ${
          disabled
            ? 'border-[#1c1c1c] text-[#3a3a3a] cursor-not-allowed'
            : open
            ? 'bg-[#1c1c1c] border-[#3a3a3a] text-[#efefef]'
            : 'border-[#2e2e2e] text-[#666666] hover:border-[#3a3a3a] hover:text-[#efefef] hover:bg-[#1c1c1c]'
        }`}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
          <polyline points="22,6 12,13 2,6"/>
        </svg>
        <span className="hidden sm:inline">E-Mail</span>
        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="hidden sm:block">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-64 bg-[#141414] border border-[#2e2e2e] rounded-xl shadow-2xl z-50 overflow-hidden py-1 max-w-[calc(100vw-2rem)]">
          {items.map(item => (
            <button
              key={item.label}
              type="button"
              onClick={() => handleSend(item)}
              className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm text-[#efefef] hover:bg-[#1c1c1c] transition-colors text-left"
            >
              <span className="shrink-0 text-[#666666]">{item.icon}</span>
              <span className="flex-1">{item.label}</span>
              {item.pdfUrl && <PdfBadge />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
