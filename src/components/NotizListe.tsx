'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import { deleteNotiz, updateNotiz } from '@/app/actions/clients'
import type { Notiz } from '@prisma/client'
import EmptyState from '@/components/EmptyState'

const KATEGORIEN = ['Alle', 'Sitzung', 'Telefonat', 'E-Mail', 'Hausaufgabe', 'Sonstiges']

function NotizItem({ n, clientId }: { n: Notiz; clientId: string }) {
  const [editing, setEditing]   = useState(false)
  const [draft, setDraft]       = useState(n.inhalt)
  const [pending, startTrans]   = useTransition()
  const taRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (editing) taRef.current?.focus()
  }, [editing])

  function handleSave() {
    if (!draft.trim() || draft === n.inhalt) { setEditing(false); return }
    startTrans(async () => {
      await updateNotiz(n.id, clientId, draft.trim())
      setEditing(false)
    })
  }

  function handleDelete() {
    startTrans(async () => { await deleteNotiz(n.id, clientId) })
  }

  return (
    <li className={`flex items-start gap-3 group ${pending ? 'opacity-50' : ''}`}>
      <div className="flex-1 bg-[#0a0a0a] border border-[#1c1c1c] rounded-xl px-4 py-3">
        <div className="flex items-center gap-2 mb-1.5">
          {n.kategorie && (
            <span className="text-[10px] font-medium text-white/50 bg-white/5 border border-white/10 px-1.5 py-0.5 rounded">
              {n.kategorie}
            </span>
          )}
          <span className="text-[10px] text-[#3a3a3a]">
            {new Date(n.datum).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        {editing ? (
          <div className="space-y-2">
            <textarea
              ref={taRef}
              value={draft}
              onChange={e => setDraft(e.target.value)}
              rows={3}
              onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSave(); if (e.key === 'Escape') { setDraft(n.inhalt); setEditing(false) } }}
              className="w-full bg-[#141414] border border-[#2e2e2e] rounded-lg px-3 py-2 text-sm text-[#efefef] focus:outline-none focus:border-[#555555] resize-none transition-colors"
            />
            <div className="flex gap-2">
              <button type="button" onClick={handleSave} disabled={pending}
                className="text-xs bg-white hover:bg-[#e8e8e8] text-black font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50">
                Speichern
              </button>
              <button type="button" onClick={() => { setDraft(n.inhalt); setEditing(false) }}
                className="text-xs text-[#666666] border border-[#2e2e2e] hover:bg-[#1c1c1c] px-3 py-1.5 rounded-lg transition-colors">
                Abbrechen
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-[#efefef] leading-relaxed whitespace-pre-wrap">{n.inhalt}</p>
        )}
      </div>

      {!editing && (
        <div className="flex flex-col gap-1 mt-3 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
          <button type="button" aria-label="Notiz bearbeiten" onClick={() => setEditing(true)} disabled={pending}
            className="text-[#3a3a3a] hover:text-[#efefef] transition-colors">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <button type="button" aria-label="Notiz löschen" onClick={handleDelete} disabled={pending}
            className="text-[#3a3a3a] hover:text-red-500 transition-colors">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
              <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
            </svg>
          </button>
        </div>
      )}
    </li>
  )
}

export default function NotizListe({ clientId, notizen }: { clientId: string; notizen: Notiz[] }) {
  const [filter, setFilter] = useState('Alle')

  const visible = filter === 'Alle' ? notizen : notizen.filter(n => n.kategorie === filter)

  const counts: Record<string, number> = { Alle: notizen.length }
  for (const k of KATEGORIEN.slice(1)) counts[k] = notizen.filter(n => n.kategorie === k).length

  return (
    <div>
      {notizen.length > 0 && (
        <div className="flex gap-1.5 flex-wrap mb-4">
          {KATEGORIEN.filter(k => k === 'Alle' || counts[k] > 0).map(k => (
            <button key={k} type="button" onClick={() => setFilter(k)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                filter === k
                  ? 'bg-white text-black'
                  : 'bg-[#0a0a0a] border border-[#1c1c1c] text-[#555555] hover:text-[#efefef]'
              }`}>
              {k} <span className={`ml-1 ${filter === k ? 'text-black/50' : 'text-[#3a3a3a]'}`}>{counts[k]}</span>
            </button>
          ))}
        </div>
      )}

      {notizen.length === 0 ? (
        <EmptyState inline
          icon={<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>}
          title="Noch keine Notizen."
          description="Schreibe die erste Notiz oben."
        />
      ) : visible.length === 0 ? (
        <EmptyState inline
          title={`Keine ${filter}-Notizen.`}
        />
      ) : (
        <ul className="space-y-2">
          {visible.map(n => <NotizItem key={n.id} n={n} clientId={clientId} />)}
        </ul>
      )}
    </div>
  )
}
