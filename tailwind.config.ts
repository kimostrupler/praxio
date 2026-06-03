import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  darkMode: 'class',
  theme: {
    extend: {
      // ── Semantic color tokens ─────────────────────────────────────────────
      // Tied to CSS variables in globals.css — use these for new components.
      // Legacy arbitrary-value overrides (bg-[#141414] etc.) still work.
      colors: {
        // Surfaces
        surface:   'var(--page)',       // bg-surface
        card:      'var(--card)',       // bg-card
        lift:      'var(--hover)',      // bg-lift (hover/active state)

        // Borders
        'line-s':  'var(--border-s)',
        'line':    'var(--border)',
        'line-m':  'var(--border-m)',

        // Text hierarchy
        content:   'var(--text)',       // text-content
        sub:       'var(--sub)',        // text-sub
        mid:       'var(--mid)',        // text-mid
        faint:     'var(--faint)',      // text-faint
        muted:     'var(--muted)',      // text-muted
        ph:        'var(--ph)',         // text-ph (placeholder)

        // Interactive
        accent:    'var(--accent)',     // bg-accent / text-accent — amber-gold in dark
        'accent-fg': 'var(--accent-fg)', // text-accent-fg — CTA button text
        'accent-hv': 'var(--accent-hv)', // bg-accent-hv — CTA hover
        'input-bg':  'var(--input)',     // bg-input-bg — form field

        // Brand — warm taupe #bba282
        brand: {
          DEFAULT: '#bba282',
          50:  '#faf8f5',
          100: '#f3ece3',
          200: '#e6d8c6',
          300: '#d4bda4',
          400: '#c5a68a',
          500: '#bba282',
          600: '#a08569',
          700: '#836854',
          800: '#6a5445',
          900: '#564438',
          950: '#2c2219',
        },

        // Accent palette — amber-gold family (matches --accent in dark mode)
        amber: {
          50:  '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#e89a3c',  // ← our UI accent
          700: '#cf8426',
          800: '#a16207',
          900: '#78350f',
          950: '#451a03',
        },
      },

      // ── Typography ────────────────────────────────────────────────────────
      fontFamily: {
        // --font-inter injected by next/font in layout.tsx
        sans: ['var(--font-inter)', 'system-ui', '-apple-system', 'sans-serif'],
        // --font-mono injected by next/font in layout.tsx — use for stats/numbers/IDs
        mono: ['var(--font-mono)', 'JetBrains Mono', 'Fira Code', 'ui-monospace', 'monospace'],
      },

      // ── Transitions ───────────────────────────────────────────────────────
      transitionDuration: {
        fast:    '120ms',
        DEFAULT: '150ms',
        slow:    '250ms',
      },
      transitionTimingFunction: {
        DEFAULT: 'ease-out',
      },
    },
  },
  plugins: [],
}

export default config
