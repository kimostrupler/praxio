# Deployment Guide — Proxmox LXC Setup

Complete setup from scratch. Takes about 20–30 minutes. This documents the exact production configuration.

---

## Step 1 — Create the LXC container

In the Proxmox web UI (`https://your-proxmox-ip:8006`):

1. **Download template** (first time only):
   Datacenter → local (storage) → CT Templates → Templates → search `ubuntu-22.04-standard` → Download

2. Click **Create CT** and fill in:

   | Setting | Value |
   |---|---|
   | Hostname | `praxis` |
   | Password | strong root password — save it |
   | **Unprivileged container** | **uncheck** ← required |
   | Template | ubuntu-22.04-standard |
   | Disk | 20 GB |
   | CPU | 2 cores |
   | Memory | 2048 MB, swap 512 MB |
   | Network | Bridge `vmbr0`, DHCP or static IP |

3. Select the container → Options → **Start at boot → Yes**. Start it and open its Console.

---

## Step 2 — Install dependencies

```bash
apt update && apt upgrade -y
apt install -y curl git ufw

# Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# PostgreSQL 16
curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc | gpg --dearmor -o /usr/share/keyrings/postgresql.gpg
echo "deb [signed-by=/usr/share/keyrings/postgresql.gpg] https://apt.postgresql.org/pub/repos/apt jammy-pgdg main" > /etc/apt/sources.list.d/postgresql.list
apt update && apt install -y postgresql-16

# PM2
npm install -g pm2

systemctl enable postgresql
```

Verify: `node --version` → v20.x.x · `psql --version` → 16.x

---

## Step 3 — Create the database

```bash
sudo -u postgres psql -c "CREATE USER praxis WITH PASSWORD 'praxis_secret';"
sudo -u postgres psql -c "CREATE DATABASE praxis OWNER praxis;"
```

---

## Step 4 — SSH key for GitHub

```bash
ssh-keygen -t ed25519 -C "praxis-server" -f ~/.ssh/id_ed25519 -N ""
cat ~/.ssh/id_ed25519.pub
```

Copy the output. GitHub: **Settings → SSH and GPG keys → New SSH key** → paste → Save.

Test: `ssh -T git@github.com` → `Hi kimostrupler! You've successfully authenticated...`

---

## Step 5 — Clone the repo

```bash
cd /opt
git clone git@github.com:kimostrupler/praxis-app.git
cd praxis-app
```

---

## Step 6 — Configure `.env`

```bash
cp .env.example .env
nano .env
```

```env
DATABASE_URL="postgresql://praxis:praxis_secret@localhost:5432/praxis"
NEXTAUTH_URL="https://praxis.fitallcoach.ch"
NEXTAUTH_SECRET="paste output of: openssl rand -base64 32"
ADMIN_EMAIL="info@fitallcoach.ch"
ADMIN_PASSWORD="choose a strong password"
```

Generate secret: `openssl rand -base64 32`

---

## Step 7 — Build and start the app

```bash
cd /opt/praxis-app
npm install
npx prisma db push
node prisma/seed.js
npm run build
pm2 start npm --name praxis -- run start
```

Build takes 1–2 minutes. Check: `pm2 logs praxis`

---

## Step 8 — PM2 auto-start on reboot

```bash
pm2 startup
# copy and run the command it prints, then:
pm2 save
```

---

## Step 9 — Firewall

```bash
ufw allow 22
ufw deny 3000
ufw deny 5432
ufw enable
```

This blocks direct access to the app port and PostgreSQL. All public traffic goes through the Cloudflare Tunnel (outbound connection — no open inbound ports needed).

---

## Step 10 — Tailscale (secure remote access)

Tailscale is already running on the **Proxmox host** (`srv`, `100.87.63.1`). Install it in the container too for direct container access:

```bash
curl -fsSL https://tailscale.com/install.sh | sh
tailscale up
```

Open the URL it prints, log in with the same Tailscale account, and authorise.

```bash
systemctl enable tailscaled
tailscale ip -4    # note this — your permanent container address
```

SSH from anywhere: `ssh root@<tailscale-ip>`

---

## Step 11 — Cloudflare Tunnel (public HTTPS, no port forwarding)

Cloudflare Tunnel connects the app to Cloudflare's network without opening any inbound ports. `fitallcoach.ch` is already on Cloudflare so this takes ~5 minutes.

```bash
curl -L https://pkg.cloudflare.com/cloudflare-main.gpg | tee /usr/share/keyrings/cloudflare-main.gpg >/dev/null
echo 'deb [signed-by=/usr/share/keyrings/cloudflare-main.gpg] https://pkg.cloudflare.com/cloudflared any main' | \
  tee /etc/apt/sources.list.d/cloudflared.list
apt update && apt install cloudflared -y

cloudflared tunnel login        # browser link — authenticate with Cloudflare account
cloudflared tunnel create praxis
```

Note the tunnel ID printed.

```bash
mkdir -p ~/.cloudflared
nano ~/.cloudflared/config.yml
```

```yaml
tunnel: praxis
credentials-file: /root/.cloudflared/<your-tunnel-id>.json

ingress:
  - hostname: praxis.fitallcoach.ch
    service: http://localhost:3000
  - service: http_status:404
```

```bash
cloudflared tunnel route dns praxis praxis.fitallcoach.ch
cloudflared service install
systemctl enable cloudflared
systemctl start cloudflared
```

The app is now live at `https://praxis.fitallcoach.ch`.

---

## Step 12 — Set up the deploy command

After pushing code to GitHub, run `deploy` on the container to pull, rebuild, and restart (~2 min). Only acts when there are actual changes.

```bash
cat > /usr/local/bin/deploy << 'EOF'
#!/bin/bash
set -e
cd /opt/praxis-app
git fetch
LOCAL=$(git rev-parse @)
REMOTE=$(git rev-parse @{u})
if [ "$LOCAL" = "$REMOTE" ]; then
  echo "Already up to date."
  exit 0
fi
echo "Updates found, deploying..."
git pull
npm install
npm run build
pm2 restart praxis
echo "Deployed at $(date)"
EOF
chmod +x /usr/local/bin/deploy
```

**Optional — auto-deploy every 5 minutes:**

```bash
echo "*/5 * * * * root /usr/local/bin/deploy >> /var/log/praxis-deploy.log 2>&1" > /etc/cron.d/praxis-deploy
```

---

## Backup

```bash
mkdir -p /opt/backups

# Manual
sudo -u postgres pg_dump praxis > /opt/backups/praxis_$(date +%Y%m%d).sql

# Automated daily at 3am — add to /etc/cron.d/praxis-backup:
# 0 3 * * * postgres pg_dump praxis > /opt/backups/praxis_$(date +\%Y\%m\%d).sql
```

---

## Migrating to a new machine

1. Export: `sudo -u postgres pg_dump praxis > praxis_backup.sql`
2. Copy `praxis_backup.sql` + `.env` to new machine
3. Follow Steps 1–8 on new machine, then:
   ```bash
   sudo -u postgres psql praxis < praxis_backup.sql
   pm2 restart praxis
   ```

---

## Day-to-day operations

```bash
pm2 status              # check app status
pm2 logs praxis         # follow logs
pm2 restart praxis      # restart after .env changes
npm run build && pm2 restart praxis   # rebuild + restart after code changes
```

**Updating the password** (if locked out — use Python to avoid JS `$` regex issue):

```bash
cd /opt/praxis-app
node -e "const b=require('./node_modules/bcryptjs'),fs=require('fs');b.hash('newpassword',12).then(h=>{let e=fs.readFileSync('.env','utf8');e=e.replace(/ADMIN_PASSWORD=.*/,()=>'ADMIN_PASSWORD=\"'+h+'\"');fs.writeFileSync('.env',e);console.log('done')})"
pm2 restart praxis --update-env
```

Or use Python (safer — no `$` special handling in string replacement):

```bash
python3 /tmp/hash_password.py   # see hash_password.py script in repo root
pm2 restart praxis --update-env
```
