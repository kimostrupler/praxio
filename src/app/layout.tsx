import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import Providers from '@/components/Providers'
import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import type { Settings } from '@/components/SettingsProvider'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '500', '600'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'FitAllCoach – Praxis',
  description: 'Klientenverwaltung',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'FitAllCoach',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
}

const SETTING_DEFAULTS: Settings = {
  theme:         'system',
  accentPreset:  'amber',
  praxisName:    'FitAllCoach',
  coachName:     'by Joelle',
  trainSaetze:   3,
  trainWdh:      10,
  trainPause:    60,
  clientDefault: 'AKTIV',
  revenueGoal:   0,
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Load settings from DB so they're available server-side for flash-free hydration
  const session = await getServerSession(authOptions)
  const userId = (session?.user as any)?.id as string | undefined

  const [dbSettings, userRecord] = await Promise.all([
    prisma.appSettings.findUnique({ where: { id: 'singleton' } }).catch(() => null),
    userId ? prisma.user.findUnique({ where: { id: userId }, select: { theme: true } }).catch(() => null) : null,
  ])

  const initialSettings: Settings = {
    theme:         ((userRecord?.theme ?? dbSettings?.theme) as Settings['theme']) ?? SETTING_DEFAULTS.theme,
    accentPreset:  dbSettings?.accentPreset                ?? SETTING_DEFAULTS.accentPreset,
    praxisName:    dbSettings?.praxisName                  ?? SETTING_DEFAULTS.praxisName,
    coachName:     dbSettings?.coachName                   ?? SETTING_DEFAULTS.coachName,
    trainSaetze:   dbSettings?.trainSaetze                 ?? SETTING_DEFAULTS.trainSaetze,
    trainWdh:      dbSettings?.trainWdh                    ?? SETTING_DEFAULTS.trainWdh,
    trainPause:    dbSettings?.trainPause                  ?? SETTING_DEFAULTS.trainPause,
    clientDefault: (dbSettings?.clientDefault as Settings['clientDefault']) ?? SETTING_DEFAULTS.clientDefault,
    revenueGoal:   dbSettings?.revenueGoal                 ?? SETTING_DEFAULTS.revenueGoal,
  }

  // Sanitize values before embedding in script
  const safeTheme = (['system', 'light', 'dark'] as const).includes(initialSettings.theme as 'system' | 'light' | 'dark')
    ? initialSettings.theme
    : 'system'
  const safeAp = /^(#[0-9a-fA-F]{6}|[a-z]+)$/.test(initialSettings.accentPreset)
    ? initialSettings.accentPreset
    : 'amber'

  // Runs before React hydration — applies theme AND accent color tokens synchronously.
  // Uses server-fetched values so all devices/sessions get the same theme without flash.
  // The compact accent preset table mirrors ACCENT_PRESETS in SettingsProvider.tsx.
  const initScript = `
(function(){
  try {
    var theme = ${JSON.stringify(safeTheme)};
    var ap    = ${JSON.stringify(safeAp)};
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var dark = theme === 'dark' || (theme === 'system' && prefersDark);
    if (dark) document.documentElement.classList.add('dark');

    var AP = {
      amber:  ['#e89a3c','#160c00','#cf8426','rgba(232,154,60,0.14)','rgba(232,154,60,0.24)','#b45309','#ffffff','#92400e','rgba(180,83,9,0.11)','rgba(180,83,9,0.20)'],
      sage:   ['#86c286','#0a160a','#6aaa6a','rgba(134,194,134,0.14)','rgba(134,194,134,0.22)','#15803d','#ffffff','#166534','rgba(21,128,61,0.11)','rgba(21,128,61,0.22)'],
      violet: ['#a78bfa','#1a0a2e','#9061f9','rgba(167,139,250,0.14)','rgba(167,139,250,0.24)','#6d28d9','#ffffff','#5b21b6','rgba(109,40,217,0.11)','rgba(109,40,217,0.22)'],
      cobalt: ['#60a5fa','#04122a','#3b82f6','rgba(96,165,250,0.14)','rgba(96,165,250,0.22)','#1d4ed8','#ffffff','#1e40af','rgba(29,78,216,0.11)','rgba(29,78,216,0.22)'],
      rose:   ['#fb7185','#2a0010','#f43f5e','rgba(251,113,133,0.14)','rgba(251,113,133,0.22)','#be123c','#ffffff','#9f1239','rgba(190,18,60,0.11)','rgba(190,18,60,0.22)'],
      teal:   ['#2dd4bf','#002820','#14b8a6','rgba(45,212,191,0.14)','rgba(45,212,191,0.22)','#0f766e','#ffffff','#115e59','rgba(15,118,110,0.11)','rgba(15,118,110,0.22)'],
      copper: ['#fb923c','#1f0a00','#f97316','rgba(251,146,60,0.14)','rgba(251,146,60,0.22)','#c2410c','#ffffff','#9a3412','rgba(194,65,12,0.11)','rgba(194,65,12,0.22)'],
      slate:  ['#94a3b8','#0a0f18','#64748b','rgba(148,163,184,0.14)','rgba(148,163,184,0.22)','#334155','#ffffff','#1e293b','rgba(51,65,85,0.11)','rgba(51,65,85,0.22)'],
    };
    var d = document.documentElement;
    if (ap.length === 7 && ap[0] === '#') {
      var r0=parseInt(ap.slice(1,3),16),g0=parseInt(ap.slice(3,5),16),b0=parseInt(ap.slice(5,7),16);
      var tL=function(c){var s=c/255;return s<=0.04045?s/12.92:Math.pow((s+0.055)/1.055,2.4);};
      var r1=r0,g1=g0,b1=b0;
      if(!dark && 0.2126*tL(r0)+0.7152*tL(g0)+0.0722*tL(b0)>0.45){r1=Math.round(r0*0.52);g1=Math.round(g0*0.52);b1=Math.round(b0*0.52);}
      var hex2=function(v){return Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0');};
      var acc='#'+hex2(r1)+hex2(g1)+hex2(b1);
      var lum=0.2126*tL(r1)+0.7152*tL(g1)+0.0722*tL(b1);
      d.style.setProperty('--accent',acc);
      d.style.setProperty('--accent-fg',lum>0.18?'#0a0a0a':'#ffffff');
      d.style.setProperty('--accent-hv','#'+hex2(r1*0.82)+hex2(g1*0.82)+hex2(b1*0.82));
      d.style.setProperty('--accent-dim','rgba('+r1+','+g1+','+b1+','+(dark?'0.14':'0.11')+')');
      d.style.setProperty('--accent-glow','rgba('+r1+','+g1+','+b1+','+(dark?'0.22':'0.16')+')');
    } else {
      var pt = AP[ap] || AP.amber;
      var o = dark ? 0 : 5;
      d.style.setProperty('--accent',      pt[o]);
      d.style.setProperty('--accent-fg',   pt[o+1]);
      d.style.setProperty('--accent-hv',   pt[o+2]);
      d.style.setProperty('--accent-dim',  pt[o+3]);
      d.style.setProperty('--accent-glow', pt[o+4]);
    }
  } catch(e) {}
  function hideBoot() {
    var el = document.getElementById('boot-screen');
    if (!el) return;
    el.style.opacity = '0';
    setTimeout(function(){ el.style.display = 'none'; }, 350);
  }
  if (document.readyState === 'complete') { hideBoot(); }
  else { window.addEventListener('load', hideBoot); }
})();
`

  return (
    <html lang="de" suppressHydrationWarning className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: initScript }} />
        <meta name="theme-color" content="#0a0a0a" />
      </head>
      <body>
        <div id="boot-screen" style={{
          position: 'fixed', inset: 0, background: 'var(--page)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, transition: 'opacity 0.35s ease',
        }}>
          <div style={{ marginBottom: 32, opacity: 0.9 }}>
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" style={{ color: 'var(--text)' }}>
              <rect width="48" height="48" rx="12" fill="currentColor" fillOpacity="0.08"/>
              <text x="50%" y="56%" dominantBaseline="middle" textAnchor="middle"
                fontSize="26" fontWeight="700" fill="currentColor" fontFamily="system-ui,sans-serif">F</text>
            </svg>
          </div>
          <p style={{ color: 'var(--text)', fontSize: 15, fontWeight: 600, fontFamily: 'system-ui,sans-serif', letterSpacing: '0.01em', marginBottom: 8 }}>
            FitAllCoach
          </p>
          <p style={{ color: 'var(--faint)', fontSize: 12, fontFamily: 'system-ui,sans-serif', marginBottom: 32 }}>
            Praxis
          </p>
          <style dangerouslySetInnerHTML={{ __html: `
            @keyframes boot-pulse {
              0%,80%,100% { opacity: 0.2; transform: scale(0.8); }
              40% { opacity: 1; transform: scale(1); }
            }
            .boot-dot { width:7px;height:7px;border-radius:50%;background:var(--muted);display:inline-block;margin:0 4px;animation:boot-pulse 1.2s ease-in-out infinite; }
            .boot-dot:nth-child(2){animation-delay:.2s}
            .boot-dot:nth-child(3){animation-delay:.4s}
          `}} />
          <div>
            <span className="boot-dot" />
            <span className="boot-dot" />
            <span className="boot-dot" />
          </div>
        </div>
        <Providers initialSettings={initialSettings}>
          {children}
        </Providers>
      </body>
    </html>
  )
}
