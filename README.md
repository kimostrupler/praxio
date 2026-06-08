# FitAllCoach – Praxis App

Private client management web app for **FitAllCoach by Joelle** — a health and nutrition coaching practice in Switzerland. Single-user, German-language UI.

→ [Full deployment guide](SETUP.md)

---

## Features

| Area | What it does |
|---|---|
| **Dashboard** | KPI strip, today's sessions, upcoming bookings, recent clients, birthdays, revenue goal progress |
| **Klienten** | Full client profiles — contact info, tags, status, referral source, Warteliste with transfer-to-client flow |
| **Anamnesebogen** | 8-step intake wizard (Ziele, Körperdaten, Ernährung, Alltag, Schlaf, Stress, Wohlbefinden, Gesundheit) |
| **Gewichtsverlauf** | Weight & body fat log with SVG chart — merges Anamnese + Messung entries |
| **Trainingsplan** | Plan builder with preset templates and exercise catalog (50 seeded + custom) |
| **Ernährungsplan** | Macro-based meal plan builder with reusable Vorlagen |
| **Notizen** | Structured session notes — Freitext · Sitzung · Telefonat · Hausaufgaben. Soft-delete with recovery. |
| **Sitzungsansicht** | Focused session view — sticky note input, reference data, PDF + E-Mail dropdown |
| **Ziele** | Goal tracking with 8 preset chips |
| **Aufgaben** | Task list per client + global `/aufgaben` page |
| **Rechnungen** | Invoices with Swiss QR-Einzahlungsschein, overdue tracking, CHF |
| **PDF Export** | Anamnesebogen, Trainingspläne, Ernährungspläne, Fortschrittsbericht, Rechnung (QR bill), Vertrag |
| **Termine** | Cal.com API v2 — Heute · Kalender · Liste. Unknown attendees show email + "Als Klient anlegen" button. |
| **Statistiken** | Revenue forecast, churn risk, health averages, goal frequency, referral sources |
| **Import** | CSV client import with preview and progress counter |
| **Einstellungen** | Logo, theme, Cal.com key, billing defaults, credentials, revenue goal, system controls |

---

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v3 |
| ORM | Prisma v5 + PostgreSQL 16 |
| Auth | NextAuth v4 — JWT sessions, credentials provider, bcrypt (cost 12) |
| PDF | `@react-pdf/renderer` v4 (requires React 19) |
| Runtime (production) | Node 22 LTS + PM2 on Ubuntu 22.04 LXC |
| Runtime (local dev) | Node 22 Alpine via Docker Compose |

---

## Infrastructure (production)

Running on a **Proxmox LXC container** (Ubuntu 22.04, privileged) on a home server.

| Component | Role |
|---|---|
| **Tailscale** | Secure SSH access from anywhere — installed on the **Proxmox host only** (`srv`, `100.87.63.1`). No open inbound ports needed. |
| **Cloudflare Tunnel** | Public HTTPS at `https://praxis.fitallcoach.ch` — no port forwarding required |
| **PM2** | Process manager — auto-restarts on crash, starts on boot |
| **ufw** | Firewall: only port 22 open; 3000 and 5432 blocked externally |
| **fail2ban** | SSH brute-force protection on both host and container (5 attempts / 1h ban) |
| **unattended-upgrades** | Automatic security patches on both host and container |

---

## Quick local dev setup

```bash
git clone git@github.com:kimostrupler/praxis-app.git
cd praxis-app
cp .env.example .env   # edit with your values
docker compose up -d   # first start ~2 min
```

Open `http://localhost:3000`.

---

## Updating the production app

SSH into the server (via Tailscale: `ssh root@100.87.63.1`) then inside the container:

```bash
pct enter 100
cd /opt/praxis-app
git pull
npm install
npm run build
pm2 restart praxis
```

---

## Backup

All data is in PostgreSQL. Back up regularly:

```bash
sudo -u postgres pg_dump praxis > backup_$(date +%Y%m%d).sql
```

Automated daily backup runs at **22:30** (before the 23:00 shutdown) on the **Proxmox host**:

```
30 22 * * * root /opt/backup/praxis-backup.sh >> /var/log/praxis-backup.log 2>&1
```

---

## Cal.com integration

1. `app.cal.com` → Settings → Developer → API Keys → create a key
2. In the app: Einstellungen → Cal.com → paste the key
3. Bookings appear on Dashboard, Termine page, and each client's Termine tab (matched by email)
4. Unknown attendees show email + "Als Klient anlegen" button to register them as clients
5. Events cached 5 min — Sync button forces immediate refresh

---

## Security

Full audit completed May 2026. Summary:

| Layer | Status |
|---|---|
| Route auth (middleware) | ✅ All pages protected |
| Server actions (49 total) | ✅ Every action checks session |
| API routes | ✅ All protected except `/api/logo` (intentionally public — practice logo) |
| Password storage | ✅ bcrypt cost 12 |
| Brute-force protection | ✅ 5 attempts / 15-min lockout per IP (in-memory — resets on PM2 restart) |
| SQL injection | ✅ Prisma parameterized queries throughout |
| XSS | ✅ React auto-escaping + CSP header |
| Clickjacking | ✅ `X-Frame-Options: DENY` + CSP `frame-ancestors 'none'` |
| CSRF | ✅ Admin endpoints check `Origin === Host` |
| Ports | ✅ ufw blocks 3000 and 5432 externally |
| Next.js binding | ✅ Binds to 127.0.0.1 only (not 0.0.0.0) |
| SSH brute-force | ✅ fail2ban — 5 attempts / 1h ban on host and container |
| App process | ✅ PM2 runs as unprivileged `praxis` user, not root |
| Security patches | ✅ unattended-upgrades applies security updates automatically |
| PostgreSQL | ✅ Loopback-only (127.0.0.1) |
| Remote access | ✅ Tailscale — encrypted mesh, no open inbound SSH required |
| Public access | ✅ Cloudflare Tunnel — no exposed ports, DDoS protection included |
| Caddy | ✅ Removed — redundant with Cloudflare Tunnel; was never in the traffic path |

**Known limitation:** login rate-limit is in-memory (file-backed since May 2026, survives restarts). PM2 crash-restarts no longer reset the counter. Behind Cloudflare Tunnel this is acceptable (Cloudflare applies its own rate limiting at the edge).

---

*Built with Claude Code · © 2026 FitAllCoach*

---

## Server schedule (power)

The Proxmox host shuts down nightly and wakes via BIOS RTC alarm:

| Time (CEST) | Action |
|---|---|
| **22:30** | Cron runs `/opt/backup/praxis-backup.sh` — PostgreSQL dump + app data, 14-day retention |
| **23:00** | Cron runs `/usr/local/sbin/praxis-shutdown.sh` — sets BIOS RTC alarm for 06:00 next morning, then powers off |
| **06:00** | BIOS fires RTC alarm — server powers on, Proxmox boots, LXC 100 auto-starts, PM2 launches the app |

The shutdown script lives on the **Proxmox host** at `/usr/local/sbin/praxis-shutdown.sh`:

```bash
#!/bin/bash
echo 0 > /sys/class/rtc/rtc0/wakealarm
rtcwake -m off -t $(date -d "tomorrow 06:00" +%s)
```

Cron entry (root crontab on Proxmox host):
```
0 23 * * * /usr/local/sbin/praxis-shutdown.sh
```

> **Requires** BIOS/UEFI setting "Wake on RTC Alarm" (or "Resume By RTC Alarm") to be **enabled**.
> If the server doesn't wake automatically after the first scheduled shutdown, enter the BIOS and enable this option.
