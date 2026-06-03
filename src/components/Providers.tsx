'use client'

import { SessionProvider } from 'next-auth/react'
import { SettingsProvider, type Settings } from './SettingsProvider'

export default function Providers({
  children,
  initialSettings,
}: {
  children: React.ReactNode
  initialSettings: Settings
}) {
  return (
    <SessionProvider>
      <SettingsProvider initialSettings={initialSettings}>
        {children}
      </SettingsProvider>
    </SessionProvider>
  )
}
