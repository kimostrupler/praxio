import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { checkRateLimit, clearRateLimit } from './rate-limit'
import { prisma } from './db'

const REVALIDATE_MS = 15 * 60 * 1000 // re-check DB every 15 minutes

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email:    { label: 'E-Mail',   type: 'email'    },
        password: { label: 'Passwort', type: 'password' },
      },
      async authorize(credentials, req) {
        const forwarded = req?.headers?.['x-forwarded-for']
        const ip = (Array.isArray(forwarded) ? forwarded[0] : forwarded)
                     ?.split(',')[0]?.trim()
                  ?? (req?.headers?.['x-real-ip'] as string)
                  ?? 'unknown'

        if (!checkRateLimit(ip)) return null
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findUnique({ where: { email: credentials.email } })
        if (!user || !user.active) return null
        if (!await bcrypt.compare(credentials.password, user.passwordHash)) return null

        clearRateLimit(ip)
        return {
          id:             user.id,
          email:          user.email,
          name:           user.name,
          role:           user.role,
          sessionVersion: user.sessionVersion,
        }
      },
    }),
  ],
  session: { strategy: 'jwt', maxAge: 8 * 60 * 60 },
  pages:   { signIn: '/login' },
  secret:  process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // Initial sign-in — populate from the User object returned by authorize()
        token.id             = user.id
        token.role           = user.role
        token.sessionVersion = user.sessionVersion
        token.checkedAt      = Date.now()
        return token
      }

      // Periodic re-validation: check active status and sessionVersion against DB
      if (Date.now() - (token.checkedAt ?? 0) > REVALIDATE_MS) {
        try {
          const dbUser = await prisma.user.findUnique({
            where:  { id: token.id },
            select: { active: true, sessionVersion: true },
          })
          if (!dbUser || !dbUser.active || dbUser.sessionVersion !== token.sessionVersion) {
            // Strip role so middleware redirects to login on next navigation
            const { role: _r, sessionVersion: _sv, ...rest } = token
            return rest as typeof token
          }
          token.checkedAt = Date.now()
        } catch {
          // DB temporarily unreachable — preserve session, retry next cycle
        }
      }

      return token
    },
    async session({ session, token }) {
      if (token.role) {
        session.user.id   = token.id
        session.user.role = token.role
      }
      return session
    },
  },
}

