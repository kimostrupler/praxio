import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import Link from 'next/link'
import BenutzerVerwaltung from './BenutzerVerwaltung'

export default async function BenutzerPage() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'ADMIN') redirect('/dashboard')

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'asc' },
    select: { id: true, email: true, name: true, role: true, active: true, createdAt: true },
  })

  return (
    <div className="p-4 md:p-6 lg:p-8 w-full max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/settings"
          className="text-[#555555] hover:text-[#efefef] transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-[#efefef]">Benutzerverwaltung</h1>
          <p className="text-xs text-[#555555] mt-0.5">Konten erstellen, deaktivieren und Passwörter zurücksetzen</p>
        </div>
      </div>
      <BenutzerVerwaltung
        users={users}
        currentUserId={(session.user as any).id}
      />
    </div>
  )
}
