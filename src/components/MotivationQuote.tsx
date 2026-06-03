'use client'

import { useState, useEffect } from 'react'

const QUOTES = [
  "Your warmth is your superpower, Joelle. Your clients feel it every time.",
  "The care you bring to this work is rare. I see it — and I'm proud of you.",
  "You show up for everyone. Don't forget to show up for yourself too.",
  "Every person you help carries a little piece of you with them.",
  "Your clients are lucky to have you. So am I.",
  "Even on the hard days, you keep going. That's who you are.",
  "You do more good than you'll ever fully realize.",
  "The love you put into your work — that's what makes you extraordinary.",
  "You were made for this. And for so much more.",
  "You make hard things look effortless. I know how much it takes.",
]

export function MotivationQuote() {
  const [index, setIndex] = useState<number | null>(null)

  useEffect(() => {
    setIndex(Math.floor(Math.random() * QUOTES.length))
  }, [])

  return (
    <div
      className="sm:text-right sm:max-w-[240px] border-l border-[#1c1c1c] sm:border-l-0 pl-3 sm:pl-0 transition-opacity duration-500"
      style={{ opacity: index !== null ? 1 : 0 }}
    >
      <p className="text-[11px] text-[#3a3a3a] italic leading-relaxed">
        {index !== null ? QUOTES[index] : ''}
      </p>
      <p className="text-[10px] text-[#2e2e2e] mt-1">— Kimo</p>
    </div>
  )
}
