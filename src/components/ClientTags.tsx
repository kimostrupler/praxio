'use client'

import { useState, useTransition, useRef } from 'react'
import { updateClientTags } from '@/app/actions/clients'

const COMMON = ['Abnehmen', 'Muskelaufbau', 'Reha', 'Wettkampf', 'Ernährung', 'Online']

export default function ClientTags({ clientId, initialTags }: { clientId: string; initialTags: string[] }) {
  const [tags, setTags]     = useState<string[]>(initialTags)
  const [input, setInput]   = useState('')
  const [open, setOpen]     = useState(false)
  const [, startT]          = useTransition()
  const inputRef            = useRef<HTMLInputElement>(null)

  function save(next: string[]) {
    setTags(next)
    startT(async () => { await updateClientTags(clientId, next) })
  }

  function add(tag: string) {
    const t = tag.trim()
    if (!t || tags.includes(t)) return
    save([...tags, t])
    setInput('')
  }

  function remove(tag: string) {
    save(tags.filter(t => t !== tag))
  }

  const suggestions = COMMON.filter(t => !tags.includes(t) &&
    (!input || t.toLowerCase().includes(input.toLowerCase())))

  return (
    <div className="space-y-2">
      {/* Current tags */}
      <div className="flex flex-wrap gap-1.5 items-center">
        {tags.map(t => (
          <span key={t}
            className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#1c1c1c] border border-[#2e2e2e] text-[#efefef] text-xs rounded-full">
            {t}
            <button type="button" onClick={() => remove(t)}
              className="text-[#3a3a3a] hover:text-red-500 transition-colors leading-none ml-0.5">
              ×
            </button>
          </span>
        ))}
        <button type="button" onClick={() => { setOpen(o => !o); setTimeout(() => inputRef.current?.focus(), 50) }}
          className="text-xs text-[#444444] hover:text-[#efefef] transition-colors px-2 py-0.5 border border-dashed border-[#2e2e2e] hover:border-[#3a3a3a] rounded-full">
          + Tag
        </button>
      </div>

      {/* Input + suggestions */}
      {open && (
        <div className="space-y-1.5">
          <div className="flex gap-2">
            <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { add(input); e.preventDefault() } }}
              placeholder="Tag eingeben…"
              className="flex-1 px-3 py-1.5 bg-[#0a0a0a] border border-[#2e2e2e] rounded-lg text-xs text-[#efefef] placeholder:text-[#3a3a3a] focus:outline-none focus:border-[#555555] transition-colors" />
            <button type="button" onClick={() => add(input)}
              className="px-3 py-1.5 bg-[#1c1c1c] border border-[#2e2e2e] hover:border-[#3a3a3a] text-xs text-[#efefef] rounded-lg transition-colors">
              +
            </button>
          </div>
          {suggestions.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {suggestions.map(s => (
                <button key={s} type="button" onClick={() => add(s)}
                  className="px-2 py-0.5 text-[10px] text-[#444444] border border-[#2e2e2e] hover:border-[#3a3a3a] hover:text-[#efefef] rounded-full transition-colors">
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
