# Production Deployment Guide: Krishna Electronics & Order Suppliers
**Target Domain:** `https://krishnaelectronics.com.np`  
**Target Server:** Ubuntu 22.04 / 24.04 LTS  
**Architecture:** Docker + Docker Compose + Caddy / Nginx Reverse Proxy with automated SSL

---

## 1. Domain & DNS Configuration
Before going live, configure the following DNS records with your Nepalese domain registrar (e.g. Mercantile `.np` ccTLD portal `register.com.np`) or your DNS management provider (Cloudflare, Route53, etc.):

| Type  | Host / Name | Target / Value | TTL | Note |
|-------|------------|----------------|-----|------|
| **A** | `@` (or `krishnaelectronics.com.np`) | `<YOUR_SERVER_PUBLIC_IP>` | 300 / Auto | Points root domain to Ubuntu server |
| **A** / **CNAME** | `www` | `krishnaelectronics.com.np` (or `<YOUR_SERVER_PUBLIC_IP>`) | 300 / Auto | Standard www subdomain redirect |
| **CAA** | `@` | `0 issue "letsencrypt.org"` | 3600 | (Optional) Restricts cert issuance to Let's Encrypt |

> [!NOTE]
> DNS propagation for `.com.np` domains can take between 15 minutes and 24 hours depending on TTL and ISP resolvers. Verify propagation using:
> ```bash
> dig +short krishnaelectronics.com.np
> # or:
> nslookup krishnaelectronics.com.np
> ```

---

## 2. Server Preparation (Ubuntu 22.04 / 24.04 LTS)

### Step 2.1: Update Server Packages
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git ufw sqlite3 gzip ca-certificates
```

### Step 2.2: Configure Firewall (UFW)
```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh          # Port 22 (or custom SSH port)
sudo ufw allow http         # Port 80
sudo ufw allow https        # Port 443
sudo ufw enable
```

### Step 2.3: Install Docker & Docker Compose
```bash
# Add Docker's official GPG key & repository
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Allow current user to run docker without sudo
sudo usermod -aG docker $USER
```

---

## 3. Clone Repository & Setup Environment

```bash
# Clone the repository into /opt/krishna-electronics
sudo mkdir -p /opt/krishna-electronics
sudo chown -R $USER:$USER /opt/krishna-electronics
cd /opt/krishna-electronics

git clone <YOUR_GIT_REPO_URL> .

# Create production environment file
cp .env.example .env
nano .env
```

### Configure `.env` for Production:
```env
DATABASE_URL="file:/app/prisma/prod.db"
JWT_SECRET="generate-a-secure-64-character-random-key-here"
NEXT_PUBLIC_APP_URL="https://krishnaelectronics.com.np"
NEXT_PUBLIC_SITE_NAME="Krishna Electronics & Order Suppliers"
NEXT_PUBLIC_DEFAULT_CURRENCY="NPR"
NEXT_PUBLIC_CURRENCY_SYMBOL="रु"
NEXT_PUBLIC_BUSINESS_LOCATION="Birendranagar-6, Buddhapath, Surkhet, Nepal"

# Optional AI Key (Gemini)
GEMINI_API_KEY=""

INITIAL_ADMIN_EMAIL="admin@krishnaelectronics.com.np"
INITIAL_ADMIN_PASSWORD="ChooseStrongPassword2026!"
```

---

## 4. Run with Docker Compose

```bash
# Build and start services in background
docker compose up -d --build

# Verify container statuses
docker compose ps

# Check logs
docker compose logs -f app
```

Caddy will automatically contact Let's Encrypt to provision a trusted SSL/TLS certificate for `krishnaelectronics.com.np`.

---

## 5. Automated Database & Media Backups

We provide a production backup script at `deploy/backup-db.sh`. Set up a daily cron job to run at 2:00 AM:

```bash
# Make script executable
chmod +x /opt/krishna-electronics/deploy/backup-db.sh
chmod +x /opt/krishna-electronics/deploy/restore-db.sh

# Edit crontab
crontab -e
```

Add the following line to `crontab`:
```cron
0 2 * * * /opt/krishna-electronics/deploy/backup-db.sh >> /var/log/krishna_backup.log 2>&1
```

### To Restore from a Backup:
```bash
/opt/krishna-electronics/deploy/restore-db.sh /opt/krishna-electronics/backups/db_YYYYMMDD_HHMMSS.sqlite.gz /opt/krishna-electronics/backups/uploads_YYYYMMDD_HHMMSS.tar.gz
```

---

## 6. Verification Checklist
- [ ] DNS resolves `krishnaelectronics.com.np` to public server IP.
- [ ] HTTPS lock icon verified in browser without certificate warnings.
- [ ] Admin login at `https://krishnaelectronics.com.np/admin/login`.
- [ ] Test submitting a sample inquiry from public `/contact` and verifying it appears in `/admin/inquiries`.
- [ ] Test AI banner generation & approval workflow in `/admin/ai-banner-studio`.
