# FitAllCoach – Praxis App

Client management web app for **FitAllCoach by Joelle**, a health/nutrition practice. Single-user, German UI throughout.

---

## Behavioral guidelines

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

### 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them — don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

### 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

### 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it — don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

### 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
```

---

## ⚡ Continuation guide (read this first after a context reset)

### What's already built

- Full client CRUD with 8-step German Anamnesebogen wizard
- Weight chart per client — `GewichtsChart.tsx` SVG shown when ≥2 data points. `buildGewichtsDaten()` in `lib/client-utils.ts` merges Anamnese + Messung records.
- **Global search**: `Cmd+K` / `Ctrl+K` opens `GlobalSearch.tsx` modal. Searches clients, Rechnungen, and plans via `/api/search?q=`.
- **Overdue invoice indicator**: Red badge on OFFEN Rechnungen where `faellig` has passed.
- **Notes with structured templates**: `NotizBlock.tsx`. Chips: **Freitext · Sitzung · Telefonat · Hausaufgaben**. Hausaufgaben has a dynamic numbered list with + button. On submit, fields assemble into formatted note text.
- **Soft-delete on Notiz**: `deletedAt DateTime?`. Verlauf tab shows deleted notes with strikethrough + "Wiederherstellen" button.
- **Notiz → Messung link**: `Notiz.messungId @unique`. When a note is soft-deleted, its linked Messung is hard-deleted. Recovery restores note only — weight stays gone.
- **`prisma db push`** — always use `--accept-data-loss` flag. In production: `npx prisma db push --accept-data-loss`. Required for adding unique constraints.
- Session notes, training plan builder + presets, exercise catalog, Ernährungsplan builder
- **PDF export**: Anamnesebogen, Trainingsplan (single), **Trainingspläne (all plans combined)**, Ernährungsplan (single), **Ernährungspläne (all plans combined)**, Fortschrittsbericht, Rechnung + QR-Einzahlungsschein, Vertrag — all use shared design system from `lib/pdf.tsx`
- **PDF dropdown** (`PdfMenu.tsx`): shown on client detail header and Sitzungsansicht top bar. Lists all available PDFs for the client (Fortschrittsbericht, Vertrag, Anamnesebogen if any, Trainingspläne if any, Ernährungspläne if any). Conditional on `hasPlaene`/`hasErnaehrung` props.
- **E-Mail dropdown** (`EmailMenu.tsx`): shown on client detail header. Icons per template. PDF opens automatically alongside mailto for Fortschrittsbericht, Trainingsplan, Ernährungsplan, Vertrag. Conditional templates hidden when client has no plans.
- **Dashboard**: hero stats · action strip (overdue, no-contact, birthdays) · quick actions · cal.com bookings · recent clients · birthdays · Offene Aufgaben widget · Revenue goal progress bar. All data fetched from cache.
- **Revenue dashboard** on `/statistiken`: monthly revenue bar chart, top clients by revenue, summary cards. Also shows client status, health averages, goal frequency, top presets, monthly new clients.
- **`bezahltAm`** field on `Rechnung` — set when status changes to BEZAHLT. Dashboard revenue groups by `bezahltAm ?? datum` for correct monthly reporting.
- Settings page: theme, practice name, training defaults, credential change, logo upload, Cal.com API key, Kontakt/IBAN, revenue goal, System section (cache clear, DB health, app restart)
- Light/dark theme with CSS variable override system (see Theming section)
- **Logo system**: PNG/JPEG upload in Settings. Stored as base64 in `data/logo.b64`. **Never** in `.env` — causes `ARG_MAX` crash. Served via `/api/logo`. Used by all PDFs via `getLogoData()` in `src/lib/logo.ts`.
- **Cal.com API v2**: key `CALCOM_API_KEY` in `.env`. `src/lib/ical.ts` → `fetchCalcomEvents()`. Cached 5 min. Dashboard "Heute" + upcoming. `/termine`: Heute · Liste · Kalender. Client "Termine" tab filters by `attendeeEmail`.
- **BookingClientButton** (`BookingClientButton.tsx`): shown on all Cal.com booking rows where the attendee email does not match an existing client. Pre-fills Vorname/Nachname (split on first space) and Email from the booking. Uses `createClient` server action → redirects to new client on success. Compact variant (`compact` prop) for list rows; full button for the Heute card. `clientByEmail` in `termine/page.tsx` now queries all event emails (not just today's), so client matching works across all sections (Heute, calendar list, Kommende, Vergangene).
- **Security**: Middleware covers all routes. All server actions and API routes check session individually. bcrypt password hashing (cost 12). Login rate limiting: 5 attempts per IP per 15 minutes. CSP header. All other security headers. See Security section.
- **`startTransition` pattern**: all server action calls in client components use `start(async () => { await action() })` — never pass the action directly.
- **Inline server actions in server components**: use `async function foo() { 'use server'; ... }` syntax. Do NOT use arrow functions — Next.js cannot serialize them.
- **Compact sidebar**: `SidebarLayout.tsx`. Fixed 72px. No collapse. Keyboard listener (Cmd+K) uses `useEffect`.
- **Client tab navigation**: `ClientTabs.tsx`. Desktop: horizontal underline tab bar with accent bottom indicator. Mobile: dropdown selector. Active dot in dropdown uses `var(--accent)`.
- **Coloured client avatars**: `src/lib/avatar.ts` → `avatarColor(name)` hashes name to one of 8 colour pairs.
- **Client detail header**: avatar + name + stat strip (email/phone, unified current weight, last contact date).
- **Mobile nav**: 5-tab bottom bar (Dashboard, Klienten, Termine, Rechnungen, Mehr). "Mehr" drawer: Suchen, Pläne, Statistiken, Einstellungen.
- **Rechnungen list**: status-coloured left accent border.
- **SubmitButton**: uses `useFormStatus` to auto-disable + spinner.
- **Herkunft (referral source)**: `herkunft String?` on Client. Bar chart on /statistiken.
- **Quick weight log (Messung)**: `Messung` model. `MessungForm.tsx` adds entry from client Übersicht.
- **Goal milestones (Ziele)**: `Ziel` model with `zielwert Float?` + `einheit String?`. `ZieleBlock.tsx` with 8 preset chips.
- **Business Intelligence**: Client Lifetime Value · Revenue Forecast · Churn Risk list (60+ days no contact).
- **Client Übersicht — accordion cards**: `CollapsibleSection.tsx`. All 8 sections default closed with preview text.
- **Heute view** (top of `/termine`): today's sessions with client context.
- **Warteliste**: `Warteliste` model. Card grid on `/clients`. Transfer-to-client with full validation.
- **CSV Import**: `/clients/import`. Client-side CSV parse, preview table, sequential import with progress.
- **Modal pattern**: `NeuerKlientModal.tsx`. `ClientForm` has no card wrapper — the wrapper is provided by whatever renders it.
- **Error boundaries**: `ErrorBoundary.tsx` class component. Wraps `GewichtsChart`, `ZieleBlock`, Heute section, Aufgaben widget.
- **Boot screen**: Full-screen overlay in `layout.tsx` — fades out on `window load` via inline script.
- **System controls** (Settings → System): `GET /api/admin/health` (DB ping + uptime), `POST /api/admin/cache` (revalidates all tags), `POST /api/admin/restart` (process.exit → PM2 restarts).
- **Sitzungsansicht** (`/clients/[id]/sitzung`): focused view, no sidebar. Left: `NotizBlock` (pass `notizen={client.notizen}`, NEVER `notizen={[]}`; sticky on desktop). Right: 2-column grid — chart+log · goals·anamnesen · training·nutrition plans · Terminverlauf. Stats strip: Gewicht/Ziele/Notizen/Anamnesen/Pläne/Nächster Termin.

### Patterns to follow when building new features

**New DB model** → add to `prisma/schema.prisma` → run `npx prisma db push --accept-data-loss` then `npm run build && pm2 restart praxis`

**New server actions** → create `src/app/actions/[feature].ts`, export typed async functions, return `{ error }` on failure. Guard every mutation:
```ts
if (!await getServerSession(authOptions)) return { error: 'Nicht angemeldet.' }
```
Call `revalidateTag('tag')` + `revalidatePath()` then `redirect()` on success.

**Auth in server actions**: import `getServerSession` from `next-auth` and `authOptions` from `@/lib/auth`. Do NOT create wrapper functions. Do NOT import from a separate authed module — `lib/authed.ts` was deleted. Call `getServerSession(authOptions)` directly.

**New page** → place under `src/app/(dashboard)/[feature]/page.tsx` so it gets the sidebar layout automatically.

**Next.js 15 async params** -- `params` and `searchParams` are now Promises. Always destructure with `await props.params` / `await props.searchParams` before accessing fields.

**Praxis config** (name, address, phone, etc.) → import from `@/lib/praxis`. Never read `process.env.PRAXIS_*` directly in routes or components.

**File paths** (logo.b64, vertrag-leistungen.txt) → import `LOGO_FILE` / `VERTRAG_FILE` from `@/lib/data-paths`. Never hardcode these paths.

**Form number parsing** → use `toInt` / `toPositiveInt` / `toFloat` from `@/lib/form-parse`.

**Weight data merge** → use `buildGewichtsDaten(anamnesen, messungen)` from `@/lib/client-utils`.

**German UI** — all labels, buttons, section headers in German. English only in code identifiers.

**Colours** — never hardcode hex values. Use existing tokens from the CSS variable system (see Theming section).

**Client component in server page** — keep the page as a server component and import a `'use client'` component for interactive parts only.

**Page layout width** — most pages use `w-full` with `p-4 md:p-6 lg:p-8`. Don't add `max-w-*` unless explicitly needed.

**Charts** — no chart library. Build SVG by hand (see `GewichtsChart.tsx`). Lines and dots only.

**PDF routes** — `GET` route, session check, fetch data, call `getLogoData()`, `renderToStream`, wrap with `nodeStreamToWeb()` from `@/lib/pdf`, return with `Content-Disposition: attachment`. Import C tokens, base styles, and `PdfHeader` from `@/lib/pdf`.

**New nav items** — add to the `NAV` array in `SidebarNav.tsx` (desktop sidebar). For mobile, primary tabs hardcoded in `PRIMARY`; secondary items in `SECONDARY` in `MobileNav.tsx`.

**Dropdown menus** — use `absolute right-0 top-full` on a `relative` wrapper. Include `max-w-[calc(100vw-2rem)]`. Add `useEffect` to close on outside click.

**Status select** — use the `ClientStatusSelect` pattern (segmented button with `useTransition`).

**Submit buttons in forms** — use `<SubmitButton>` from `src/components/SubmitButton.tsx`.

---

## Running the app

**Production (Proxmox LXC container 100):**

PM2 runs as the  user. Run commands as that user:
```bash
# Enter the container first:
pct enter 100
su - praxis

# Then:
PM2_HOME=/home/praxis/.pm2 pm2 status
PM2_HOME=/home/praxis/.pm2 pm2 restart praxis      # restart after code changes
PM2_HOME=/home/praxis/.pm2 pm2 logs praxis          # follow logs
PM2_HOME=/home/praxis/.pm2 pm2 restart praxis --update-env  # after .env changes

# To rebuild (can run as root — app files owned by praxis, but root can write):
cd /opt/praxis-app && npm run build && sudo -u praxis bash -c 'PM2_HOME=/home/praxis/.pm2 pm2 restart praxis'
```

App: `https://praxis.fitallcoach.ch` (Cloudflare Tunnel) or `http://localhost:3000` inside container
Login: `info@fitallcoach.ch` / (bcrypt hash stored in `/opt/praxis-app/.env`)

The app runs in **production mode** (`npm run build && npm run start`) managed by PM2. After editing any source file, rebuild with `npm run build`, then `pm2 restart praxis`.

**Local dev only** (Docker Compose is for local development, not production):

```bash
docker compose up -d          # start (app + postgres)
docker compose restart app    # rebuild after code/schema changes
docker compose logs app -f    # follow logs
```

Schema changes use `prisma db push` — in production, run manually: `npx prisma db push`.

`next.config.mjs` has NO `output: 'standalone'` — do not add it.

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v3 |
| ORM | Prisma v5 + PostgreSQL 16 |
| Auth | NextAuth v4 (credentials, bcryptjs) |
| PDF | `@react-pdf/renderer` v3 |
| Runtime (production) | Node 22 LTS + PM2 on Ubuntu 22.04 LXC |
| Runtime (local dev) | Node 22 Alpine via Docker Compose |

## Infrastructure

Production runs on a Proxmox LXC container (ID 100, Ubuntu 22.04, privileged):

- **Tailscale**: installed on both Proxmox host (`srv`, `100.87.63.1`) and container — secure SSH from anywhere without open ports
- **Cloudflare Tunnel** (`cloudflared`): public HTTPS at `praxis.fitallcoach.ch`, no port forwarding
- **PM2**: runs as `praxis` user (PM2_HOME=/home/praxis/.pm2). Use `sudo -u praxis bash -c "PM2_HOME=/home/praxis/.pm2 pm2 restart praxis"` or `su - praxis` then `pm2 ...`. Boot persistence via `pm2-praxis.service`.
- **ufw**: port 22 open only; 3000 and 5432 blocked externally
- **No Claude Code on server**: Claude Code CLI was removed from the Proxmox host — it did not work reliably in that environment. Use the FleetView web interface instead.

**Password hashing caveat**: when updating `ADMIN_PASSWORD` in `.env` programmatically, use Python or a JS function-replacement (not a string literal) because bcrypt hashes contain `$` which JavaScript's `String.replace()` interprets as capture-group references, silently corrupting the value.

## Project structure

```
src/
  app/
    layout.tsx                        # Root layout — Providers wrapper + no-flash theme script + boot screen
    globals.css                       # Tailwind directives + CSS variables + override system
    page.tsx                          # Redirects → /dashboard
    login/page.tsx
    api/
      auth/[...nextauth]/route.ts
      logo/route.ts                   # GET — serve logo from data/logo.b64 (public, no auth)
      search/route.ts                 # GET ?q= — searches clients + rechnungen + plans
      calcom/status/route.ts          # GET — check Cal.com API key validity
      vertrag/leistungen/route.ts     # GET — read vertrag-leistungen.txt
      pdf/
        anamnese/[id]/route.tsx
        plan/[id]/route.tsx           # Single training plan PDF
        trainingplaene/[clientId]/route.tsx  # All training plans for client in one PDF
        ernaehrung/[planId]/route.tsx # Single nutrition plan PDF
        ernaehrungsplaene/[clientId]/route.tsx  # All nutrition plans in one PDF
        fortschritt/[clientId]/route.tsx
        rechnung/[id]/route.tsx       # Invoice + QR-Einzahlungsschein
        vertrag/[clientId]/route.tsx
      admin/
        cache/route.ts                # POST — revalidate all cache tags
        health/route.ts               # GET — DB ping + uptime
        restart/route.ts              # POST — process.exit (PM2 restarts). Origin-checked.
      export/
        clients/route.ts              # GET — contact info + plan metadata as JSON (no health data)
    actions/
      clients.ts       # CRUD clients, anamnese, notes, status, messungen, ziele
      training.ts      # Plans, presets, exercises
      ernaehrung.ts    # Vorlagen CRUD, Plan CRUD, assignVorlageToClient
      account.ts       # Change email/password (bcrypt), uploadLogo, praxis config, calcom key
      rechnungen.ts    # Rechnung CRUD, status changes (sets bezahltAm on BEZAHLT)
      warteliste.ts    # Waiting list CRUD + transfer to client
    (dashboard)/
      layout.tsx                      # Wraps content in SidebarLayout + MobileNav (no auth check — middleware handles it)
      dashboard/page.tsx
      settings/page.tsx
      clients/
        page.tsx
        new/page.tsx
        import/page.tsx
        [id]/
          page.tsx                    # Client detail — tabs: Übersicht, Anamnesen, Training,
                                      # Ernährung, Rechnungen, Termine, Verlauf
          anamnese/neu/page.tsx       # Shows AnamneseWahl → SchnellEintragWizard or AnamneseWizard
          anamnese/[anamneseId]/bearbeiten/page.tsx
          training/neu/page.tsx
          training/[planId]/bearbeiten/page.tsx
          ernaehrung/neu/page.tsx
          ernaehrung/[planId]/bearbeiten/page.tsx
      plaene/           # Unified plan hub: Vorlagen / Zugewiesen / Übungen
      termine/          # Cal.com: Heute → Kalender → Liste
      kalender/         # Monthly calendar
      rechnungen/       # Invoice list + form
      statistiken/      # Analytics
      aufgaben/         # Task list
    (sitzung)/
      clients/[id]/sitzung/page.tsx   # Focused session view, no sidebar
  components/
    Providers.tsx           # SessionProvider + SettingsProvider
    SettingsProvider.tsx    # Settings context, theme management, localStorage key: praxis_settings
    SidebarLayout.tsx       # GlobalSearch (Cmd+K). useEffect for keyboard listener.
    SidebarNav.tsx          # Fixed left sidebar (72px compact)
    MobileNav.tsx           # Fixed bottom nav (md:hidden), "Mehr" drawer
    GlobalSearch.tsx        # Cmd+K modal
    PdfMenu.tsx             # PDF download dropdown (Fortschrittsbericht, Vertrag, Anamnesebogen,
                            # Trainingspläne, Ernährungspläne — conditional on hasPlaene/hasErnaehrung)
    EmailMenu.tsx           # Email dropdown with icons + auto-PDF for relevant templates
    ClientTabs.tsx          # Desktop: horizontal underline tab bar. Mobile: dropdown selector.
    ClientStatusSelect.tsx  # Segmented status button with useTransition
    ClientActionMenu.tsx    # Delete-only icon button (trash) with confirm() + useTransition
    ClientForm.tsx          # New client form (duplicate name check + override flow)
    CollapsibleSection.tsx  # Accordion card (defaultOpen=false, badge, preview text)
    NotizBlock.tsx          # Session notes with template chips + INITIAL_SITZUNG/INITIAL_TELEFONAT constants
    NotizListe.tsx          # Note list with filter pills
    AnamneseWahl.tsx        # Mode picker: SchnellEintragWizard or AnamneseWizard
    AnamneseWizard.tsx      # 8-step intake form
    SchnellEintragWizard.tsx # 2-step follow-up entry
    AnamneseBearbeitenForm.tsx
    AnamneseKarte.tsx       # Collapsible card with PDF download
    AnamneseVergleich.tsx   # Side-by-side anamnese comparison
    TrainingsPlanBuilder.tsx
    TrainingsPlanKarte.tsx
    PresetBuilder.tsx
    PresetKarte.tsx
    ErnaehrungsBuilder.tsx
    ErnaehrungsVorlageKarte.tsx
    GewichtsChart.tsx       # SVG weight/KF chart
    ZieleBlock.tsx          # Goal list with 8 preset chips
    MessungForm.tsx         # Quick weight entry
    RechnungForm.tsx
    RechnungAktionen.tsx    # ⋮ dropdown for invoices
    ClientTags.tsx
    ClientSearchSelect.tsx
    ClientListBulk.tsx      # Multi-select + bulk actions
    WartelisteForm.tsx
    WartelisteAktionen.tsx
    WartelisteTransferModal.tsx
    SubmitButton.tsx        # useFormStatus auto-disable + spinner
    ErrorBoundary.tsx       # Class component error boundary
    MotivationQuote.tsx     # Random personal quote, right-aligned on desktop
    RevenueGoalProgress.tsx
    SystemControls.tsx
    PraxisKontaktForm.tsx
    BookingClientButton.tsx # Cal.com booking → create client modal (pre-fills name/email; compact prop for list rows)
    SyncButton.tsx          # Cal.com cache bust button
  lib/
    auth.ts          # NextAuth config — bcrypt password verify + IP rate limit check
    rate-limit.ts    # In-memory Map: 5 failed logins → 15-min lockout per IP
    db.ts            # Prisma singleton
    praxis.ts        # All PRAXIS_* env vars — import from here, never process.env directly
    data-paths.ts    # LOGO_FILE + VERTRAG_FILE path constants — import everywhere
    pdf.tsx          # Shared PDF design system: C colors, base StyleSheet, PdfHeader component,
                     # nodeStreamToWeb(), formatDate(). Import in all PDF routes.
    client-utils.ts  # buildGewichtsDaten(anamnesen, messungen) → GewichtsEintrag[]
    form-parse.ts    # toInt / toPositiveInt / toFloat for HTML form strings
    logo.ts          # getLogoData() — reads LOGO_FILE with try/catch (one syscall)
    ical.ts          # fetchCalcomEvents() — Cal.com API v2, cached 5 min
    queries.ts       # unstable_cache wrappers for heavy Prisma queries
    avatar.ts        # avatarColor(name) → Tailwind colour pair
    formatting.ts    # CHF(n), rBrutto(r)
  middleware.ts      # NextAuth middleware — protects all routes except /login, /api/*, /_next/*
```

## Database models

```
Client              — vorname, nachname, email, telefon, beruf, geburtsdatum,
                      geschlecht, status (AKTIV/PAUSIERT/INAKTIV), naechsterTermin,
                      herkunft, tags[]
Messung             — datum, gewicht, koerperfett (quick weight log)
Ziel                — titel, beschreibung, zielwert (Float?), einheit (String?), zieldatum, erreicht, erreichtAm
Anamnese            — 8 sections: Ziele, Körperdaten, Ernährung, Alltag, Schlaf,
                      Stress, Wohlbefinden, Gesundheit (all fields nullable)
Notiz               — datum, inhalt, kategorie, deletedAt (soft-delete), messungId (linked weight)
Rechnung            — nummer, datum, faellig, bezahltAm, status, mwst, positionen[]
Uebung              — name, kategorie, beschreibung, ziele[], isCustom
TrainingsPreset     — name, beschreibung, ziele[], uebungen (PresetUebung[])
TrainingsPlan       — belongs to Client, optional presetId
ErnaehrungsVorlage  — name, beschreibung, reusable template with zeilen[]
ErnaehrungsPlan     — belongs to Client, optional vorlageId, zeilen[]
Aufgabe             — titel, beschreibung, faellig, erledigt, clientId
Warteliste          — vorname, nachname, email, telefon, prioritaet, notizen, datum
```

## Performance

### Database indexes

All FK and sort-column indexes were missing from the initial schema — the database had only primary keys and two `@unique` constraints. Adding indexes is the highest-impact performance change in this codebase. Do not remove them.

Every model now has indexes on its FK column(s) and the columns used in `ORDER BY` / `WHERE` clauses. Key composite indexes:

| Index | Covers |
|---|---|
| `Notiz(clientId, deletedAt, datum)` | `WHERE clientId=? AND deletedAt IS NULL ORDER BY datum DESC` |
| `Anamnese(clientId, datum)` | `WHERE clientId=? ORDER BY datum DESC/ASC` |
| `Messung(clientId, datum)` | `WHERE clientId=? ORDER BY datum ASC` |
| `TrainingsPlan(clientId, datum)` | `WHERE clientId=? ORDER BY datum DESC` |
| `ErnaehrungsPlan(clientId, datum)` | `WHERE clientId=? ORDER BY datum DESC` |
| `PlanUebung(planId, reihenfolge)` | `WHERE planId=? ORDER BY reihenfolge ASC` |
| `PresetUebung(presetId, reihenfolge)` | same |
| `Aufgabe(erledigt, faellig)` | `WHERE erledigt=false ORDER BY faellig ASC` (dashboard) |

Before indexes: every `WHERE clientId=?` was a full table sequential scan — O(N) with N = total rows across all clients.  
After indexes: O(log N) index lookup. Planning time on `Notiz` dropped 69× (28ms → 0.4ms) confirmed by `EXPLAIN ANALYZE`.

**Rule**: when adding a new model with a FK to Client or a field used in WHERE/ORDER BY, always add a `@@index`. The schema is the source of truth; `prisma db push` applies indexes automatically on restart.

### Logo caching

`src/lib/logo.ts` now caches the logo data in a module-level variable. The logo file (`data/logo.b64`, up to 500 KB) is read once at first access, then served from memory on all subsequent requests. It is explicitly invalidated when the user uploads or removes a logo via Settings (calls `invalidateLogoCache()` from `account.ts`).

**Do not** add TTL-based cache expiry — explicit invalidation is cleaner and always up-to-date.

### Revenue attribution

`statistiken/page.tsx` now uses `bezahltAm ?? datum` for all revenue date filtering (consistent with `dashboard/page.tsx`). Revenue is attributed to the date of payment, not invoice date. `rBrutto()` is also pre-computed once per invoice into `bezahltMitBrutto` rather than being recomputed in each filter/reduce pass.

### Known architectural performance concern

`getCachedPlaeneData()` fetches all 6 datasets (presets with exercises and all assigned plans, templates, all clients, all exercises, all training plans, all nutrition plans) as one monolithic cache entry regardless of which tab the user is on. At production scale (100+ clients, 5+ plans each = 500+ plan records), this will become a slow cold-cache load. **Future work**: split into `getCachedVorlagenData()`, `getCachedZugewiesenData()`, and `getCachedUebungenData()`, each tagged independently.

## Authentication & credentials

Single admin user. Credentials stored in `.env`:
```
ADMIN_EMAIL="..."
# ADMIN_PASSWORD is no longer used — authentication reads from the User table in PostgreSQL
```

**Password hashing**: `src/lib/auth.ts` uses `bcrypt.compare` against `user.passwordHash` from the `User` DB table. There is no plaintext fallback — all passwords are bcrypt hashed (cost 12). `actions/account.ts` → `updatePassword` stores a fresh bcrypt hash in the DB and increments `sessionVersion` to invalidate existing sessions.

**Rate limiting**: `src/lib/rate-limit.ts` — in-memory Map keyed by client IP. 5 failed attempts locks the IP for 15 minutes. Cleared on successful login.

**Session**: JWT, 8-hour maxAge. Middleware protects all non-API, non-login routes. The dashboard `layout.tsx` does NOT re-check auth — middleware is authoritative.

**Next.js 15 + Cloudflare Tunnel — middleware URL pitfall**: In Next.js 15, `req.url` and `req.nextUrl` are built from the internal server binding (`http://localhost:3000`), NOT from the `Host` header. Behind Cloudflare Tunnel the public host only arrives via `x-forwarded-host` and `x-forwarded-proto`. Any redirect constructed from `req.url` / `req.nextUrl` will therefore point to `localhost:3000` instead of `praxis.fitallcoach.ch`. Always build redirect URLs explicitly:
```typescript
const host  = req.headers.get('x-forwarded-host') ?? req.headers.get('host') ?? req.nextUrl.host
const proto = req.headers.get('x-forwarded-proto') ?? req.nextUrl.protocol.replace(':', '')
const origin = `${proto}://${host}`
```

Changing credentials via Settings → Zugangsdaten calls `account.ts` which:
1. Verifies current password via bcrypt.compare
2. Writes new value to `.env` (persists across PM2 restarts)
3. Updates `process.env` at runtime (no restart needed for email changes; password hash is immediately active)

## Monitoring & Alerting

A cron job on the **Proxmox host** checks the app health every 5 minutes (06:00–22:55) and sends an email alert on state change (up→down or down→up).

- **Script**: `/usr/local/sbin/praxis-monitor.sh`
- **Mail**: sent via msmtp → Gmail SMTP, config at `/etc/msmtprc` (root-only, chmod 600)
- **Alert address**: kimostrupler2002@gmail.com
- **Log**: `/var/log/praxis-monitor.log`
- **State file**: `/var/lib/praxis-monitor/state` (tracks last known status to avoid duplicate alerts)
- **Health endpoint**: `http://localhost:3000/api/admin/health` (checked from inside the container via lxc-attach)

Alert emails: `[ALERT] praxis.fitallcoach.ch is DOWN` and `[RESOLVED] praxis.fitallcoach.ch is back UP`.

## Database Migrations

**Always use the safe-migrate script** instead of running `prisma migrate deploy` directly:

```bash
# Inside the container as root:
lxc-attach -n 100 -- bash /opt/praxis-app/scripts/safe-migrate.sh
```

The script (`scripts/safe-migrate.sh`) takes a `pg_dump` backup to `/opt/backup/praxis/pre-migrate-TIMESTAMP.sql` before running the migration. If the migration fails, restore with:

```bash
sudo -u postgres psql praxis < /opt/backup/praxis/pre-migrate-TIMESTAMP.sql
```

## NextAuth v4 → v5 (planned)

NextAuth v4 is in maintenance mode. v5 (Auth.js) is the stable successor. This migration is **non-trivial** — defer until there is a clear need (security advisory, feature requirement). Key changes when migrating:
- Config moves from `authOptions` object to `auth.ts` with `NextAuth(config)` export
- Callbacks and session handling have different signatures
- Middleware changes: `export { auth as middleware }` pattern replaces manual JWT check
- `getServerSession(authOptions)` → `auth()` from `@/auth`
- Review the Auth.js v5 migration guide: https://authjs.dev/getting-started/migrating-to-v5

## Security

| Layer | Implementation |
|---|---|
| Route auth | NextAuth middleware — all non-API routes protected |
| Action auth | `getServerSession(authOptions)` at top of every mutation |
| Password | bcryptjs cost 12. All accounts use bcrypt — no plaintext fallback. |
| Brute-force | 5 attempts / 15-min window per IP — `lib/rate-limit.ts` |
| SQL injection | Prisma parameterized queries only |
| XSS | React auto-escaping + CSP header |
| Clickjacking | `X-Frame-Options: DENY` + CSP `frame-ancestors 'none'` |
| CSRF | Privileged endpoints check `Origin` === `Host` |
| Brute-force (SSH) | fail2ban -- 5 attempts / 1h ban on both host and container |
| Security patches | unattended-upgrades active on host and container (security repos only) |
| Headers | nosniff, strict Referrer-Policy, Permissions-Policy, `X-XSS-Protection: 0` |
| Data export | `/api/export/clients` excludes anamnesen + notizen (health data) |
| Logo upload | JPEG/PNG only, 500 KB max, type checked before write |

**Important**: `X-XSS-Protection: 0` is intentional — the legacy IE filter can introduce XSS vectors. Modern browsers rely on CSP instead.

## Settings system

All UI preferences stored in `localStorage` under `praxis_settings`:

```typescript
type Settings = {
  theme:         'system' | 'light' | 'dark'
  praxisName:    string    // fallback display name (not the env var)
  coachName:     string
  trainSaetze:   number
  trainWdh:      number
  trainPause:    number
  clientDefault: 'AKTIV' | 'PAUSIERT' | 'INAKTIV'
  revenueGoal:   number
  accentPreset:  string   // named preset ID ('amber', 'cobalt', etc.) or a 6-digit hex string (#RRGGBB)
}
```

`useSettings()` for reactive reads. `getStoredSettings()` for one-off synchronous reads (e.g. in plan builder when adding an exercise).

## Navigation

**Desktop**: Fixed left sidebar (`SidebarNav.tsx`, 72px compact). Icon + 9px mono label. Active: accent-dim pill + accent glow ring. Cmd+K search via search button at top.

**Mobile**: Fixed bottom nav (`MobileNav.tsx`, `md:hidden`). Primary: Dashboard · Klienten · Termine · Rechnungen · Mehr. "Mehr" drawer: Suchen · Pläne · Statistiken · Einstellungen.

## Data caching

`src/lib/queries.ts` wraps heavy Prisma calls in `unstable_cache`:

| Function | Tags | Used by |
|---|---|---|
| `getCachedClients()` | `clients` | /clients, dashboard |
| `getCachedRecentClients()` | `clients`, `training` | dashboard recent clients |
| `getCachedRechnungen()` | `rechnungen` | /rechnungen, dashboard, /statistiken |
| `getCachedPlaeneData()` | `clients`, `training`, `ernaehrung` | /plaene |
| `getCachedStatistikenAggregates()` | `clients`, `training` | /statistiken |

Every mutation calls `revalidateTag('tag')` to bust the relevant cache.

## Dashboard

Calls `getCachedClients()`, `getCachedRecentClients()`, `getCachedRechnungen()`, `fetchCalcomEvents()` in parallel. Revenue groups by `bezahltAm ?? datum` for correct monthly attribution.

## PDF generation

All PDF routes share:
- Design system from `lib/pdf.tsx`: `C` (colors), `base` (StyleSheet), `PdfHeader` component
- Stream conversion: `nodeStreamToWeb(stream)` from `lib/pdf.tsx`
- Praxis config: named exports from `lib/praxis.ts`
- Logo: `getLogoData()` called in GET handler, passed as `logoData` prop to PDF component

react-pdf layout rules:
- `flex: 1` spacer as direct `<Page>` child → crashes yoga engine
- `flex: 1` inside `position: absolute` without explicit `height` → collapses to 0
- `marginTop: 'auto'` → not supported
- Unicode glyphs (✂, etc.) → silently absent in Helvetica, use SVG instead
- `wrap={false}` on a section → whole section moves to next page if it doesn't fit

### Rechnung PDF — QR bill

`<Page size="A4">` with absolute wrapper `{ position: 'absolute', bottom: 0, height: 298 }` pinning the QR slip to the bottom 105mm. `qr.body` has `flex: 1` inside the wrapper. Swiss cross: 20×20px black square, white arms 4px × 12px.

## Design System

### Visual direction (established 2026-05)

**Style**: Technical & precise — tight grid hierarchy, monospace accents on data, power-user density with deliberate breathing room.

**Color**: Elevated dark theme — deeper warm black (`#080a0c`), amber-gold accent (`#e89a3c`), glass-style translucent borders.

**Components**: Layered glassmorphic — card depth via layered `box-shadow`, real `backdrop-filter` on sidebar and sticky headers, inner border highlights.

**Density**: Slightly more breathing room than the original — wider left padding on nav items (`pl-4`), modest padding increases on key forms.

---

### Typography

**Body font**: Inter (loaded via `next/font/google`). Weights: 400, 500, 600, 700. CSS var: `--font-inter`. Applied to `body` via `font-family` in globals.css. Line-height: `1.5`.

**Monospace font**: JetBrains Mono (loaded via `next/font/google`). Weights: 400, 500, 600. CSS var: `--font-mono`. Applied to `body` via `fontFamily.mono` in tailwind.config. **Automatically applied to all `tabular-nums` elements** — stats, prices, times, IDs — via globals.css global rule. Use `font-mono` class explicitly for other precision-text elements.

**Why Inter**: consistent across all OS/browsers, optimised for screen readability, neutral enough to not compete with content, widely legible at small sizes (10px–14px used extensively in this app).

Do not set `font-family` on individual components — inherit from `body`.

**Type scale used in this app** (Tailwind classes → pixel size):
| Class | Size | Weight | Use |
|---|---|---|---|
| `text-xl font-bold` | 20px 700 | Page titles (`h1`) |
| `text-sm font-semibold` | 14px 600 | Card headers, section labels |
| `text-sm` | 14px 400 | Body content, list items |
| `text-xs font-semibold` | 12px 600 | Section headers (uppercase tracking-wider) |
| `text-xs` | 12px 400 | Secondary content, labels |
| `text-[10px]` | 10px 400/500 | Metadata, timestamps, badges |
| `text-[9px]` | 9px 500 | Mobile nav labels, stat-strip labels |

**Line height**: `1.5` on `body` (set in globals.css). Components do not override this unless deliberately tight (e.g., number displays).

**Section labels** — `text-[10px] font-mono font-semibold text-[#555555] uppercase tracking-widest`. Used on all card headers, section dividers, and data labels throughout the app. Do NOT use the old pattern (`text-xs font-semibold text-[#3a3a3a] uppercase tracking-wider`).

### Color tokens

All colors are CSS custom properties in `globals.css`. **Never hardcode hex values** — always use tokens. Light is default, `.dark` on `<html>` activates dark values.

**Full token reference:**

| CSS var | Tailwind token | Light | Dark | Use |
|---|---|---|---|---|
| `--page` | `bg-surface` | `#eef0f3` | `#080a0c` | Page background |
| `--card` | `bg-card` | `#ffffff` | `#0f1114` | Card / elevated surface |
| `--hover` | `bg-lift` | `#f5f5f7` | `#181b1f` | Hover / active state bg |
| `--border-s` | `border-line-s` | `#e8e8eb` | `rgba(255,255,255,0.07)` | Subtle glass edge |
| `--border` | `border-line` | `#dcdde0` | `rgba(255,255,255,0.12)` | Standard glass border |
| `--border-m` | `border-line-m` | `#c8c9cc` | `rgba(255,255,255,0.20)` | Prominent border |
| `--text` | `text-content` | `#111218` | `#edecea` | Primary text (slightly warm) |
| `--sub` | `text-sub` | `#3a3c45` | `#aaafb8` | Secondary — dates, breadcrumbs |
| `--mid` | `text-mid` | `#555760` | `#8c8f98` | Tertiary — labels, sidebar items |
| `--faint` | `text-faint` | `#6f7076` | `#72757d` | Quaternary — timestamps, hints |
| `--muted` | `text-muted` | `#8e8f94` | `#5a5c62` | Near-invisible — section meta |
| `--accent` | `bg-accent` / `text-accent` | `#e89a3c` | `#e89a3c` | CTA background — **amber-gold in both modes** |
| `--accent-fg` | `text-accent-fg` | `#160c00` | `#160c00` | CTA button text — very dark warm |
| `--accent-hv` | `bg-accent-hv` | `#d4872a` | `#cf8426` | CTA hover background |
| `--input` | `bg-input-bg` | `#f7f7f9` | `#0b0d10` | Form field background |
| `--brand` | `text-brand` / `bg-brand` | `#bba282` | `#c8af8c` | Brand warm taupe |

**Semantic Tailwind tokens** (use in new components — auto-theme):
```tsx
// Surfaces
<div className="bg-surface">        {/* page bg */}
<div className="bg-card">           {/* elevated card */}
<div className="bg-lift">           {/* hover state */}

// Borders
<div className="border border-line">      {/* standard */}
<div className="border border-line-s">   {/* subtle */}
<div className="border border-line-m">   {/* prominent */}

// Text
<p className="text-content">  {/* primary */}
<p className="text-sub">      {/* secondary */}
<p className="text-mid">      {/* tertiary */}
<p className="text-muted">    {/* metadata */}
<p className="text-brand">    {/* brand accent */}
```

**Legacy pattern** (existing code — still works via override map):
```tsx
bg-[#141414]  →  var(--card)
bg-[#1c1c1c]  →  var(--hover)
text-[#efefef] →  var(--text)
border-[#2e2e2e] →  var(--border)
```

### Glass effects (dark mode)

All glass effects are applied via globals.css dark-mode overrides — no component changes needed.

**Dark mode glass:**

| Element | Effect | Applied via |
|---|---|---|
| All cards (`bg-[#141414]`) | Layered box-shadow: edge highlight + depth shadow + inner top glow | `:root:is(.dark) .bg-[#141414]` override |
| Sidebar (`bg-[#0a0a0a].fixed`) | `backdrop-filter: blur(24px) saturate(160%)`, 88% opacity | `:root:is(.dark) .bg-[#0a0a0a].fixed` override |
| Sitzungsansicht header (`bg-[#0a0a0a]/95`) | Same blur, 88% opacity | `:root:is(.dark) .bg-[#0a0a0a]/95` override |
| Active nav items (`bg-white/10`) | Amber tint `rgba(232,154,60,0.14)` | `:root:is(.dark) .bg-white/10` override |

**Light mode glass:**

| Element | Effect | Applied via |
|---|---|---|
| All cards (`bg-[#141414]`) | Layered box-shadow + `inset 0 1px 0 white` (top glass highlight) | `:root:not(.dark) .bg-[#141414]` override |
| Sidebar (`bg-[#0a0a0a].fixed`) | `backdrop-filter: blur(20px) saturate(180%)`, `rgba(241,242,246,0.92)` — frosted glass panel | `:root:not(.dark) .bg-[#0a0a0a].fixed` override |
| Active nav items (`bg-white/10`) | Amber tint `rgba(232,154,60,0.10)` — matches dark-mode pattern | `:root:not(.dark) .bg-white/10` override |

**Important**: `bg-white/[0.05]` (arbitrary notation) and `bg-white/5` (standard notation) are **different Tailwind classes** despite producing the same CSS value. Both must be overridden separately in globals.css. The arbitrary variants (`bg-white/[0.05]`, `hover:bg-white/[0.05]`, `hover:bg-white/[0.04]`) are used in SidebarNav hover/toggle states and map to `color-mix(in srgb, var(--text) N%, transparent)` — producing a dark tint in light mode (visible) and a light tint in dark mode (visible).

**Card shadow recipe** (for reference — not needed in components):
```css
box-shadow:
  0 0 0 1px rgba(255,255,255,0.07),     /* glass edge */
  0 4px 24px rgba(0,0,0,0.55),           /* depth */
  0 1px 4px rgba(0,0,0,0.35),            /* close */
  inset 0 1px 0 rgba(255,255,255,0.045); /* top highlight */
```

### Amber accent system

`--accent: #e89a3c` in dark mode. The CSS variable override maps `bg-white` → `var(--accent)` and `text-black` → `var(--accent-fg)`. This means **every existing `bg-white text-black` button in the entire app automatically renders as amber-gold in dark mode** — no component changes needed.

Amber glow on CTA buttons: add `style={{ boxShadow: '0 4px 16px rgba(232,154,60,0.28)' }}` for floating/featured CTAs (used on login page).

Active sidebar indicator: amber gradient bar on the left edge of active nav items. Defined in `SidebarNav.tsx` as a sibling `<div>` with `background: linear-gradient(180deg, #e89a3c 0%, #cf8426 100%)`.

### Brand color

`--brand: #bba282` — warm taupe. Used in PDF design tokens (`C.orange`), Sitzungsansicht strip, and accent elements. A full Tailwind palette exists (`brand-50` through `brand-950`).

**Do not** use `text-[#bba282]` in new code — use `text-brand`. The override map maps the raw hex to `var(--brand)` for existing code.

### Arbitrary-class override system

`globals.css` maps hardcoded dark-mode hex values to CSS variables using `:root` prefix (specificity `0,2,0`), which beats Tailwind's `(0,1,1)`. This allows the same `bg-[#141414]` class to render as white in light mode and dark gray in dark mode.

**Rule**: when adding a new hex value to a component, add its `:root .bg-\[\#hexvalue\]` override in `globals.css`. Otherwise it will be unthemed in light mode.

**Prefer semantic tokens** (`bg-card`) for new components so no override is needed.

### Buttons

| Variant | Class pattern | Use |
|---|---|---|
| Primary (CTA) | `bg-white hover:bg-[#e8e8e8] text-black font-semibold px-4 py-2 rounded-lg` | Main action |
| Secondary | `text-[#666666] border border-[#2e2e2e] hover:bg-[#1c1c1c] px-3 py-1.5 rounded-lg` | Supplemental |
| Destructive | `text-red-500 border border-red-900/30 hover:bg-red-950/20 px-3 py-1.5 rounded-lg` | Delete/remove |
| Icon only | `w-8 h-8 flex items-center justify-center rounded-lg text-[#555555] hover:text-[#efefef] hover:bg-[#1c1c1c]` | Toolbar icons |

All buttons: `transition-colors disabled:opacity-40`.

**Delete actions** — use `ClientActionMenu.tsx` pattern: a single icon button (trash) with `confirm()` dialog + `useTransition`. No dropdown wrapper needed for single destructive actions.

**Submit buttons** → always use `<SubmitButton>` from `src/components/SubmitButton.tsx`. It uses `useFormStatus` for automatic pending state + spinner.

**Focus ring**: add `focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none` to any button that doesn't already get the global `:focus-visible` ring.

### Form inputs

Standard input class (`ic` constant in most form components):
```ts
const ic = 'w-full px-3 py-2.5 bg-[#0a0a0a] border border-[#2e2e2e] rounded-lg text-sm text-[#efefef] placeholder:text-[#3a3a3a] focus:outline-none focus:border-[#555555] transition-colors'
```

- Height: 40px (`py-2.5` + text-sm line height ≈ `2.5rem`)
- Background: `--page` in light mode (inputs blend into page), `--page` in dark mode
- Border focus: `--mid` color (`#555760` light / `#969696` dark)
- Box-shadow focus ring: `globals.css` adds `0 0 0 3px 18%-opacity-accent` via `:focus-visible`
- Labels: `text-xs font-medium text-[#666666] mb-1.5` (above the input, 6px gap)

**Selects**: same class as inputs, add `appearance-none pr-8` and an absolute-positioned chevron SVG.

**Textarea**: same class, add `resize-y` for vertical-only resize.

**Radio groups**: `accent-white` (themes the radio dot to the accent color).

### Cards

Standard card: `bg-[#141414] border border-[#2e2e2e] rounded-xl`

In light mode, cards automatically get `box-shadow: 0 1px 3px rgb(0 0 0 / 7%), 0 1px 2px -1px rgb(0 0 0 / 5%)` via globals.css.

**CollapsibleSection** is the standard accordion card — use it for all client detail sections. It accepts `title`, `badge`, `preview` (shown when collapsed), and `defaultOpen`.

### Spacing scale

Uses Tailwind's 4px base. Consistent values used throughout:

| Value | px | Used for |
|---|---|---|
| `gap-1.5` / `py-1.5` | 6px | Tight element grouping, small badges |
| `gap-2` / `p-2` | 8px | Icon buttons, compact rows |
| `gap-3` / `p-3` | 12px | Standard row padding, list items |
| `p-4` / `gap-4` | 16px | Card internal padding |
| `p-5` | 20px | Spacious card padding (settings sections) |
| `p-6` | 24px | Page content padding |
| `p-8` | 32px | Large screen page padding |

Page layout: `p-4 md:p-6 lg:p-8 w-full`.

### Focus rings

**Global rule** (globals.css): `:root :focus-visible` shows `2px solid var(--accent), offset 2px`. Inputs/textareas instead get a subtle `box-shadow` ring (3px, 18% accent opacity) to avoid doubling with the border-color focus state.

**For new interactive elements**: the global rule applies automatically. To suppress on a specific element, add `focus:outline-none focus-visible:ring-0` explicitly.

**`SubmitButton`** demonstrates the pattern: uses `focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none` via Tailwind utilities.

### Transitions

Standard: `transition-colors` (150ms ease-out). Tailwind default — used on buttons, links, badges.

Slower: `transition-all duration-200` — used for sidebar width, collapsible grid rows, transforms.

Do not mix `duration-*` values on similar elements in the same view. The sidebar and collapsibles both use 200ms — consistent.

### Animations

| Class | Duration | Use |
|---|---|---|
| `animate-page-enter` | 180ms | Page-level entrance (applied in `template.tsx`) |
| `animate-fade-in` | 150ms | Modal/overlay appearance |
| `animate-scale-in` | 150ms | Dropdown/popover appearance |
| `animate-spin` | Tailwind default | Loading spinner in SubmitButton |

### Status colors

| State | Dark bg class | Dark text | Light bg override | Light text override |
|---|---|---|---|---|
| Success/Active | `bg-emerald-950/40` | `text-emerald-400` | `#ecfdf5` | `#059669` |
| Warning/Pending | `bg-orange-950/40` | `text-orange-400` | `#fff7ed` | `#d97706` |
| Error/Overdue | `bg-red-950/40` | `text-red-400` | `#fef2f2` | `#dc2626` |
| Neutral/Inactive | `bg-[#1c1c1c]` | `text-[#444444]` | (via override) | (via override) |

Light-mode overrides for all of these are in globals.css. When adding a new status shade, always add the `:root:not(.dark)` override.

### Responsive breakpoints

Tailwind defaults: `sm` 640px, `md` 768px, `lg` 1024px.

- Mobile-first: base styles are mobile
- Desktop sidebar appears at `md:` (768px) — `hidden md:flex` on `aside`
- Mobile nav disappears at `md:` — `md:hidden` on bottom nav
- Two-column grids start at `lg:` (1024px)
- Page padding: `p-4 md:p-6 lg:p-8`

### Dark sidebar

The sidebar (`SidebarNav`) uses `bg-[#0a0a0a]` (same as dark page background) with `border-r border-[#1c1c1c]`. In light mode, the override `bg-[#0a0a0a].fixed` → `background: #ffffff` + `box-shadow: 1px 0 0 0 var(--border-s)` converts it to a white bar. Sidebar text/icon colors use the existing text overrides.

## Theming (legacy summary)

See Design System above for the full reference. Quick reference for existing hardcoded values:
`bg-[#141414]` = card · `bg-[#1c1c1c]` = hover · `bg-[#0a0a0a]` = page · `text-[#efefef]` = primary text · `text-[#666666]` = secondary · `border-[#2e2e2e]` = border

---

## AI-generated code anti-patterns — hard rules

This section documents recurring failures from AI-generated code. Every rule here exists because the mistake was made and had to be cleaned up.

### Architecture

**No wrapper modules for single function calls.** `lib/authed.ts` was a 3-line file wrapping `getServerSession(authOptions)`. It was deleted. If removing a file and replacing its import with a direct call changes nothing observable, the file should not exist.

**Config has one owner.** All `PRAXIS_*` env vars live in `lib/praxis.ts`. All filesystem paths in `lib/data-paths.ts`. No other file reads `process.env.PRAXIS_*` directly.

**Middleware handles route auth; layouts do not.** The dashboard layout does NOT call `getServerSession`. Middleware is authoritative. Duplicating auth in layouts adds a useless DB roundtrip.

**Auth in server actions**: `if (!await getServerSession(authOptions)) return { error: '...' }`. No wrapper. No external helper. The call is one line.

### Code quality

**Never create a module that wraps a single function.** `lib/authed.ts` wrapped `getServerSession`. It was deleted.

**Never swallow exceptions in database transactions.** `.catch(() => {})` inside `prisma.$transaction` is forbidden. Only catch specific Prisma error codes; rethrow everything else.

**Batch database writes.** `for...of` with `await` inside a loop is N+1 writes. Use `deleteMany({ in: ids })` + `createMany(flatMap(...))` instead.

**Repeated data mappings belong in a named function.** If a field-mapping lambda appears in 3 Prisma calls, it's `mapZeileInput(z)`. Not 3 copies.

**`useCallback` on setters passed to non-memoized children is noise.** Only add `useCallback` if the child is wrapped in `React.memo`.

**`useLayoutEffect` is only for visual synchronization before paint.** Keyboard listeners, localStorage reads that don't affect initial layout, fetch calls — these all use `useEffect`.

**Static data belongs at module level.** Constants that don't depend on request state (lookup objects, metadata maps) are defined once outside the function. Never recreated per render.

**`resetAll()` references initial-state constants, not hardcoded values.**
```ts
const INITIAL_SITZUNG = { ziel: '', fortschritt: '', anpassungen: '', naechste: '' }
// resetAll uses INITIAL_SITZUNG — never re-hardcodes the fields
```

### Shared utilities

**Form number parsing** → `lib/form-parse.ts`: `toInt`, `toPositiveInt`, `toFloat`. Never redefine inline.

**Weight data merge** → `lib/client-utils.ts`: `buildGewichtsDaten`. Never rewrite the merge-sort inline in a component or route.

**PDF shared infrastructure** → `lib/pdf.tsx`: colors `C`, `base` styles, `PdfHeader`, `nodeStreamToWeb`, `formatDate`. All PDF routes import from here. Never redeclare these in a route file.

### Dependencies

**Every package.json entry must have at least one import in the source tree.** Dead packages (bcryptjs without bcrypt usage, nodemailer without SMTP) are deleted immediately. Check with `grep -r "from 'packagename'" src/`.

**Packages reinstated for a real reason** — `bcryptjs` was removed as dead code, then reinstated when password hashing was properly implemented. This is correct: remove dead code, add things back when they're actually used.

### Security

**Passwords are bcrypt-hashed** on save (cost 12). All user records use bcrypt — there is no plaintext fallback. Never store or compare plaintext passwords.

**Login rate limiting** is in `lib/rate-limit.ts`. Auth guard functions must call `checkRateLimit(ip)` before credential verification.

**Privileged POST endpoints check `Origin === Host`** to prevent CSRF.

**The bulk export endpoint** (`/api/export/clients`) must never include health assessments (`anamnesen`) or session notes (`notizen`). These are sensitive health data under nDSG.

**`X-XSS-Protection` header** must be set to `0`, not `1; mode=block`. The legacy filter introduces XSS vectors. CSP is the modern replacement.

### Content

**Personal/configurable content is not hardcoded in TypeScript.** Motivation quotes, coach name, practice name — anything the operator might want to change without a rebuild lives in settings or the database, not compiled source arrays.

### Recurring failures — found in forensic review

**Never shadow an imported name with a local variable.** A local `const CHF = \`CHF ...\`` string variable shadowed the imported `CHF` function in the same scope. Use the imported function directly. If you need intermediate values, give them distinct names.

**Arrow function inline server actions are forbidden — use `.bind()` for dynamic args.** Arrow functions (`async () => { 'use server'; ... }`) violate the established pattern. For form actions with per-item arguments, use the exported server action with `.bind()`:
```tsx
<form action={myServerAction.bind(null, item.id, clientId)}>
```
This is the correct Next.js pattern for dynamic server action arguments.

**Static lookup objects belong at module scope, never inside `.map()` callbacks.** Objects like status label/style maps that don't depend on request data must be defined once at the top of the file. Defining them inside a `.map()` recreates them per iteration with no benefit.

**Status display maps live in `lib/formatting.ts`.** `CLIENT_STATUS_LABEL`, `CLIENT_STATUS_STYLE`, `RECHNUNG_STATUS_LABEL`, `RECHNUNG_STATUS_STYLE` are exported from there. No page file defines its own version. When the color scheme changes, one file changes.

**`revalidateTag` calls are only valid when a matching `unstable_cache` entry with that tag exists.** Before writing `revalidateTag('x')`, verify the tag appears in `lib/queries.ts`. Dead revalidation calls are noise that misleads future developers into thinking a cache exists.

**Shared utilities must not be reimplemented locally, even with different defaults.** `rechnungen.ts` redefined `toFloat` returning `0` for NaN instead of `undefined`. The divergence was silent and produced inconsistent DB write behavior. Import from `lib/form-parse` and handle the fallback explicitly at the call site: `toFloat(v) ?? 0`.

### Performance anti-patterns

**Every new Prisma model needs `@@index` on its FK and sort columns.** The database initially had zero FK indexes — every `WHERE clientId=?` was an O(N) sequential scan. Any model with a relation to another must have `@@index([foreignKeyField])` and `@@index([foreignKeyField, sortColumn])` if queries order by a second column. This is the highest-impact performance rule in this codebase.

**Revenue date filtering must use `bezahltAm ?? datum`.** Invoice date (`datum`) is when the invoice was issued; payment date (`bezahltAm`) is when money arrived. All revenue aggregations (monthly totals, forecasts, YTD) must attribute revenue to payment date. Using `datum` silently misattributes revenue to incorrect months.

**Do not re-compute derived values inside multi-pass iterations.** `rBrutto(r)` = positionen.reduce() was called once per invoice per filter/reduce pass. With N passes over M invoices with P line items, the complexity was O(N×M×P). Pre-compute once into a derived array and iterate over that.

**`getLogoData()` reads a disk file — do not call it multiple times per request.** It is cached in module scope. Do not change the caching strategy to TTL — the explicit invalidation in `account.ts` is the correct approach.

**PDF routes must use `nodeStreamToWeb()` from `lib/pdf`.** The `rechnung` PDF route previously reimplemented it inline with `@ts-ignore` comments. All PDF routes share the same `renderToStream` → Web ReadableStream conversion and must use the shared function.

**Single destructive actions don't need a dropdown.** When a ⋮ menu contains only one action, replace it with a direct icon button. Dropdowns add friction; one confirm() dialog is sufficient protection for irreversible actions.

**`ClientActionMenu` is now a delete-only button.** Do NOT add non-destructive actions (like PDF links) to it — those belong in `PdfMenu` or `EmailMenu`. The ⋮ pattern was removed.
