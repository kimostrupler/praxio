import { getToken } from 'next-auth/jwt'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const token = await getToken({ req })
  const { pathname } = req.nextUrl

  // Next.js 15 builds req.nextUrl from the internal binding (localhost:3000).
  // Cloudflare Tunnel sets x-forwarded-host/proto — use those for the public URL.
  const host  = req.headers.get('x-forwarded-host') ?? req.headers.get('host') ?? req.nextUrl.host
  const proto = req.headers.get('x-forwarded-proto') ?? req.nextUrl.protocol.replace(':', '')
  const origin = `${proto}://${host}`

  if (!token || !token.role) {
    const callbackUrl = `${origin}${pathname}${req.nextUrl.search}`
    const loginUrl    = new URL(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`, origin)
    return NextResponse.redirect(loginUrl)
  }

  if (token.role !== 'ADMIN' && pathname.startsWith('/settings/benutzer')) {
    return NextResponse.redirect(new URL('/dashboard', origin))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!login|api|_next/static|_next/image|favicon.ico|icon|apple-icon).*)'],
}
