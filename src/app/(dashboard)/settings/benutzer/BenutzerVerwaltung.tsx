'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createUser, adminResetPassword, toggleUserActive, deleteUser } from '@/app/actions/users'

type UserRow = {
  id: string
  email: string
  name: string
  role: string
  active: boolean
  createdAt: Date
}

const ic = 'w-full px-3 py-2.5 bg-[#0a0a0a] border border-[#2e2e2e] rounded-lg text-sm text-[#efefef] placeholder:text-[#3a3a3a] focus:outline-none focus:border-[#555555] transition-colors'

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-medium text-[#666666] mb-1.5">{children}</p>
}

function Banner({ type, msg, onClose }: { type: 'error' | 'success'; msg: string; onClose: () => void }) {
  return (
    <div className={`flex items-center justify-between gap-3 px-4 py-3 rounded-lg text-sm mb-4 ${
      type === 'error'
        ? 'bg-red-950/40 border border-red-900/30 text-red-400'
        : 'bg-emerald-950/40 border border-emerald-900/30 text-emerald-400'
    }`}>
      <span>{msg}</span>
      <button type="button" onClick={onClose} className="opacity-60 hover:opacity-100 text-xs">✕</button>
    </div>
  )
}

export default function BenutzerVerwaltung({ users: initial, currentUserId }: { users: UserRow[]; currentUserId: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState('')
  const [showCreate, setShowCreate]   = useState(false)
  const [resetingId, setResetingId]   = useState<string | null>(null)

  function notify(err?: string, ok?: string) {
    setError(err ?? '')
    setSuccess(ok ?? '')
  }

  function refresh() { router.refresh() }

  function handleCreate(formData: FormData) {
    startTransition(async () => {
      const r = await createUser(formData)
      if (r.error) { notify(r.error); return }
      notify('', 'Benutzer erstellt.')
      setShowCreate(false)
      refresh()
    })
  }

  function handleResetPassword(userId: string, formData: FormData) {
    startTransition(async () => {
      const r = await adminResetPassword(userId, formData)
      if (r.error) { notify(r.error); return }
      notify('', 'Passwort zurückgesetzt.')
      setResetingId(null)
      refresh()
    })
  }

  function handleToggle(userId: string) {
    startTransition(async () => {
      const r = await toggleUserActive(userId)
      if (r.error) { notify(r.error); return }
      refresh()
    })
  }

  function handleDelete(userId: string, email: string) {
    if (!confirm(`Benutzer ${email} wirklich löschen?`)) return
    startTransition(async () => {
      const r = await deleteUser(userId)
      if (r.error) { notify(r.error); return }
      notify('', 'Benutzer gelöscht.')
      refresh()
    })
  }

  return (
    <div className="space-y-4">
      {error   && <Banner type="error"   msg={error}   onClose={() => setError('')}   />}
      {success && <Banner type="success" msg={success} onClose={() => setSuccess('')} />}

      {/* User list */}
      <div className="bg-[#141414] border border-[#2e2e2e] rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-[#1c1c1c] flex items-center justify-between">
          <p className="text-[10px] font-mono font-semibold text-[#555555] uppercase tracking-widest">Benutzer</p>
          <button
            type="button"
            onClick={() => { setShowCreate(v => !v); setResetingId(null) }}
            className="text-xs px-3 py-1.5 bg-white hover:bg-[#e8e8e8] text-black font-semibold rounded-lg transition-colors"
          >
            + Neu
          </button>
        </div>

        <div className="divide-y divide-[#1c1c1c]">
          {initial.map(user => (
            <div key={user.id} className="px-5 py-4">
              <div className="flex items-start justify-between gap-4">
                {/* Info */}
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-[#efefef]">{user.name}</span>
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold ${
                      user.role === 'ADMIN'
                        ? 'bg-amber-950/50 text-amber-400 border border-amber-900/30'
                        : 'bg-[#1c1c1c] text-[#666666] border border-[#2e2e2e]'
                    }`}>
                      {user.role}
                    </span>
                    {!user.active && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-red-950/40 text-red-400 border border-red-900/30">
                        INAKTIV
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#666666] mt-0.5">{user.email}</p>
                </div>

                {/* Actions */}
                {user.id !== currentUserId && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setResetingId(resetingId === user.id ? null : user.id)}
                      disabled={isPending}
                      className="text-xs px-2.5 py-1.5 text-[#666666] border border-[#2e2e2e] hover:bg-[#1c1c1c] rounded-lg transition-colors disabled:opacity-40"
                    >
                      PW
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggle(user.id)}
                      disabled={isPending}
                      className="text-xs px-2.5 py-1.5 text-[#666666] border border-[#2e2e2e] hover:bg-[#1c1c1c] rounded-lg transition-colors disabled:opacity-40"
                    >
                      {user.active ? 'Deakt.' : 'Akt.'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(user.id, user.email)}
                      disabled={isPending}
                      className="text-xs px-2.5 py-1.5 text-red-500 border border-red-900/30 hover:bg-red-950/20 rounded-lg transition-colors disabled:opacity-40"
                    >
                      Löschen
                    </button>
                  </div>
                )}
                {user.id === currentUserId && (
                  <span className="text-[10px] text-[#444444] font-mono shrink-0">Du</span>
                )}
              </div>

              {/* Reset password form */}
              {resetingId === user.id && (
                <form
                  action={handleResetPassword.bind(null, user.id)}
                  className="mt-3 flex gap-2"
                >
                  <input
                    name="password"
                    type="password"
                    placeholder="Neues Passwort (min. 8 Zeichen)"
                    className={ic + ' flex-1'}
                    minLength={8}
                    required
                  />
                  <button
                    type="submit"
                    disabled={isPending}
                    className="px-3 py-2 bg-white hover:bg-[#e8e8e8] text-black text-sm font-semibold rounded-lg transition-colors disabled:opacity-40 shrink-0"
                  >
                    Speichern
                  </button>
                </form>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Create user form */}
      {showCreate && (
        <form action={handleCreate} className="bg-[#141414] border border-[#2e2e2e] rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-[#1c1c1c]">
            <p className="text-[10px] font-mono font-semibold text-[#555555] uppercase tracking-widest">Neuer Benutzer</p>
          </div>
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Name</Label>
                <input name="name" type="text" className={ic} placeholder="Vorname Nachname" required />
              </div>
              <div>
                <Label>E-Mail</Label>
                <input name="email" type="email" className={ic} placeholder="user@fitallcoach.ch" required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Passwort</Label>
                <input name="password" type="password" className={ic} placeholder="Min. 8 Zeichen" minLength={8} required />
              </div>
              <div>
                <Label>Rolle</Label>
                <select name="role" className={ic + ' appearance-none'} defaultValue="STAFF" required>
                  <option value="STAFF">STAFF – eingeschränkt</option>
                  <option value="ADMIN">ADMIN – voll</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={isPending}
                className="px-4 py-2 bg-white hover:bg-[#e8e8e8] text-black text-sm font-semibold rounded-lg transition-colors disabled:opacity-40"
              >
                Erstellen
              </button>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 text-sm text-[#666666] border border-[#2e2e2e] hover:bg-[#1c1c1c] rounded-lg transition-colors"
              >
                Abbrechen
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  )
}
