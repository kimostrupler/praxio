import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'

export default async function AuditLogPage() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') redirect('/dashboard')

  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take:    200,
  })

  const users = await prisma.user.findMany({ select: { id: true, name: true, email: true } })
  const userMap = Object.fromEntries(users.map(u => [u.id, u.name ?? u.email]))

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-5xl">
      <div className="mb-6">
        <Link href="/settings" className="text-xs text-[#555555] hover:text-[#efefef] transition-colors inline-flex items-center gap-1 mb-2">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
          Einstellungen
        </Link>
        <h1 className="text-xl font-bold text-white mt-1.5">Audit-Log</h1>
        <p className="text-xs text-[#444444] mt-0.5">Letzte 200 Systemereignisse</p>
      </div>

      <div className="bg-[#141414] border border-[#2e2e2e] rounded-xl overflow-hidden">
        {logs.length === 0 ? (
          <p className="px-5 py-6 text-sm text-[#3a3a3a] text-center">Noch keine Einträge.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[#1c1c1c] text-[#555555] text-left">
                  <th className="px-4 py-3 font-mono uppercase tracking-wider whitespace-nowrap">Zeitpunkt</th>
                  <th className="px-4 py-3 font-mono uppercase tracking-wider">Benutzer</th>
                  <th className="px-4 py-3 font-mono uppercase tracking-wider">Aktion</th>
                  <th className="px-4 py-3 font-mono uppercase tracking-wider">ID</th>
                  <th className="px-4 py-3 font-mono uppercase tracking-wider">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1c1c1c]">
                {logs.map(log => (
                  <tr key={log.id} className="hover:bg-[#1c1c1c] transition-colors">
                    <td className="px-4 py-2.5 font-mono text-[#444444] whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString('de-DE', {
                        day: '2-digit', month: '2-digit', year: '2-digit',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </td>
                    <td className="px-4 py-2.5 text-[#666666] whitespace-nowrap">
                      {log.userId ? (userMap[log.userId] ?? log.userId.slice(0, 8)) : '—'}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="font-mono text-[#efefef]">{log.action}</span>
                    </td>
                    <td className="px-4 py-2.5 font-mono text-[#3a3a3a] max-w-[120px] truncate">
                      {log.entityId ?? '—'}
                    </td>
                    <td className="px-4 py-2.5 text-[#555555] max-w-[200px] truncate">
                      {log.details ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
