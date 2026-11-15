# Krishna Electronics & Order Suppliers — Website Handover & Operations Guide

**Platform Version:** 1.0.0 (Final Handover Release)  
**Target Domain:** `https://krishnaelectronics.com.np`  
**Client Organization:** Krishna Electronics Order & Suppliers, Birendranagar, Surkhet, Nepal  
**Repository:** `https://github.com/sudovu/krishnaelectronics.com.np`  

---

## 1. Project Overview

Krishna Electronics & Order Suppliers is an enterprise e-commerce storefront, IT engineering services booking system, and institutional hardware catalog engineered specifically for the Karnali Province market.

The platform provides:
- A high-performance public catalog for consumer electronics, laptops, routers, printers, and CCTV surveillance systems.
- Direct-to-technician inquiry flows with automated WhatsApp link generation and email dispatch.
- A role-based administrative portal for catalog publishing, inquiry tracking, site configuration, and audit compliance.
- Branded, user-friendly 404 (Page Not Found) and error boundary pages matching Krishna Electronics visual identity.
- Dual-deployment capability: Cloud serverless deployment on **Vercel** and full-featured persistent container deployment via **Docker Compose**.

---

## 2. Technology Stack

- **Framework:** Next.js 14 (App Router, React 18, TypeScript)
- **Styling:** Tailwind CSS, Lucide React Icons
- **Database & ORM:** SQLite 3 (WAL mode) with Prisma ORM 5.21 (cloud-compatible with PostgreSQL)
- **Authentication:** Custom JWT authentication with Web Crypto HMAC-SHA256, bcrypt password hashing, and HttpOnly session cookies
- **Containerization & Deployment:** Docker multi-stage build, Docker Compose, Caddy 2 reverse proxy with automated TLS
- **Tooling & Backup:** POSIX Bash deployment automation, streaming gzip compression, standalone tar archive security validator

---

## 3. Website Features & Capabilities

### Public Storefront
1. **Dynamic Homepage:**
   - Promotional hero slider synchronized with active database banners.
   - Live category cards with real-time product inventory counts.
   - Featured products and "New Arrivals" carousels.
   - Karnali Province technical services showcase (laptop repairs, CCTV installation, AMC contracts).
   - Google Maps location embed for Birendranagar, Surkhet store.
2. **Product Catalog & Search:**
   - Multi-token fuzzy search with automatic synonyms (e.g., `wifi` ↔ `wi-fi`, `toner` ↔ `cartridge`, `cctv` ↔ `surveillance`).
   - Filtering by category, brand, stock availability, and featured status.
   - Price sorting (Low to High, High to Low, Newest).
   - Strict privacy boundary: Draft and Archived products are strictly hidden from public visitors.
3. **Product Detail Pages:**
   - Structured hardware specifications tables.
   - Dynamic price display formatted in Nepalese Rupees (`रु`).
   - Official brand warranty indicators.
   - One-click "Inquire on WhatsApp" action pre-filling product title, SKU, and price.
   - Automated SEO metadata and OpenGraph social preview tags.
4. **Contact & Technical Service Inquiries:**
   - General contact form and service booking wizard.
   - Asynchronous dual-channel notifications: generates instant WhatsApp click-to-chat links while sending email alerts.
   - Server-side rate limiting and spam protection.
5. **Branded 404 & Error Handling:**
   - Branded 404 page at `/not-found` with catalog search, quick links, and store telephone/WhatsApp shortcuts.
   - Branded error boundary at `/error` providing safe error recovery ("Try Again" button) without leaking sensitive stack traces or internal database paths.

---

## 4. Administrative Functionality

The admin portal is accessible at `/admin` (login at `/admin/login`).

1. **Role-Based Access Control (RBAC):**
   - `SUPER_ADMIN`: Unrestricted platform access, user account management, settings configuration.
   - `ADMIN`: Catalog, inquiry, banner, and service management.
   - `EDITOR`: Product creation, updating, and publication.
   - `PRODUCT_MANAGER`: Product drafting and stock inventory updates.
   - `CONTENT_MANAGER`: Inquiries and informational content management.
2. **Dashboard & Analytics:**
   - Real-time KPI summary (total products, published items, low stock warnings, new inquiries).
   - Quick navigation shortcuts.
3. **Product & Catalog Management:**
   - Product creation with automated slug generation, image gallery, warranty, and structured specifications.
   - Automated SEO generator (meta titles, descriptions, search keywords).
   - Category and subcategory taxonomy management with custom icon mappings.
4. **Inquiry Management:**
   - Interactive inquiry dashboard filtering by status (`NEW`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`).
   - Internal technician notes and customer follow-up tracking.
5. **Site Settings & Customization:**
   - Store name, contact numbers, email, WhatsApp, and physical address.
   - Homepage element toggles (notification bar, promotional badges, contact buttons).
   - Immediate cache revalidation across all edge and server routes.
6. **Security & Audit Logs:**
   - Comprehensive audit logging for all administrative actions (logins, creates, updates, deletes).
   - Fail-closed brute-force login protection with persistent database rate limiting.

---

## 5. Deployment Options: Vercel Cloud vs. Self-Hosted Docker

The application supports two distinct operational modes:

| Feature | Vercel Cloud Deployment | Self-Hosted Linux / Docker Deployment |
| :--- | :--- | :--- |
| **Execution Model** | Serverless Edge & Lambdas | Long-running container (`node server.js`) |
| **Filesystem State** | Ephemeral & Read-Only (`EROFS`) | Persistent Volumes (`krishna_db_data`, `krishna_uploads_data`) |
| **Database Engine** | Bundled read-only SQLite / Cloud Postgres (Neon/Supabase) | WAL-mode SQLite on persistent volume |
| **Media Uploads** | Static assets from git / Cloudinary / S3 | Local persistent directory (`public/uploads`) |
| **SSL / TLS** | Automatic via Vercel Edge | Automatic via Caddy reverse proxy |
| **Backup Automation** | Cloud DB snapshots | Nightly POSIX bash scripts (`backup-db.sh`, `restore-db.sh`) |
| **Ideal Use Case** | Instant zero-maintenance global CDN web hosting | High-control on-premises / home-server deployment |

---

## 6. Vercel Redeployment Guide (Live Production)

Because the site is already connected to Vercel, redeployment is straightforward:

### Step 1: Automatic Git Deployment
1. Pushing the release commit to GitHub `main` branch automatically triggers a new Vercel deployment.
2. Monitor build progress in your **Vercel Dashboard → Project → Deployments**.

### Step 2: Environment Variables in Vercel
Ensure the following variables are configured under **Vercel Project Settings → Environment Variables**:
- `NODE_ENV`: `production`
- `JWT_SECRET`: A 64-character random string (e.g., generated with `openssl rand -hex 32`).
- `NEXT_PUBLIC_APP_URL`: `https://krishnaelectronics.com.np`
- `NEXT_PUBLIC_SITE_NAME`: `Krishna Electronics & Order Suppliers`
- `NEXT_PUBLIC_DEFAULT_CURRENCY`: `NPR`
- `NEXT_PUBLIC_CURRENCY_SYMBOL`: `रु`
- `NEXT_PUBLIC_BUSINESS_LOCATION`: `Birendranagar-6, Buddhapath, Surkhet, Nepal`
- `NOTIFICATION_RECIPIENT_EMAILS`: `krishnaelectronics2077@gmail.com`
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`: (Optional, for email dispatch)
- `GEMINI_API_KEY`: (Optional, for AI banner studio)

### Step 3: Database & Storage on Vercel
- **Read Operations:** The bundled catalog in `prisma/dev.db` is built and deployed directly with the site, delivering fast sub-second read performance across the Vercel Edge Network.
- **Write Operations:** Vercel serverless functions have a read-only filesystem. If you want full online customer write persistence (e.g., storing inquiries in a central cloud DB rather than email/WhatsApp, or uploading product images directly on Vercel), connect a cloud PostgreSQL database (such as Neon or Supabase) by setting `DATABASE_URL` in Vercel.

---

## 7. Self-Hosted Home-Server Docker Deployment Guide

The platform is designed to run self-hosted on any standard x86_64 or ARM64 Linux system (Ubuntu 22.04 / 24.04 LTS recommended).

### Prerequisites
- Docker Engine 24+ and Docker Compose v2+
- `git`, `bash`, `gzip`, and `sqlite3` CLI tools installed on host
- Inbound ports `80` and `443` (for Caddy reverse proxy) or `3000` (for direct access)

### Deployment Architecture
```
Host Server
 ├── Caddy Reverse Proxy (Ports 80/443) -> Automatic TLS / Let's Encrypt
 └── Next.js Web Container (Port 3000) [nextjs:nodejs, UID 1001]
      ├── Persistent Volume: krishna_db_data -> /app/prisma/prod.db
      └── Persistent Volume: krishna_uploads_data -> /app/public/uploads/
```

### Step 1: Clone Repository
```bash
git clone https://github.com/sudovu/krishnaelectronics.com.np.git /opt/krishna-electronics
cd /opt/krishna-electronics
git checkout main
```

### Step 2: Configure Environment Variables
Create `/opt/krishna-electronics/.env` based on `.env.example`:
```bash
cp .env.example .env
chmod 600 .env
```
Populate the required values:
```ini
NODE_ENV="production"
DATABASE_URL="file:/app/prisma/prod.db"

# Generate a cryptographically secure 64-character secret:
# openssl rand -hex 32
JWT_SECRET="replace-with-a-64-character-cryptographic-random-secret"

# Initial Super Admin Bootstrapping (Used only for first-time database creation)
INITIAL_ADMIN_EMAIL="adminbikram@krishnaelectronics.com.np"
INITIAL_ADMIN_PASSWORD="replace-with-a-very-strong-initial-password"

# Public Store URLs & Identity
NEXT_PUBLIC_APP_URL="https://krishnaelectronics.com.np"
NEXT_PUBLIC_SITE_NAME="Krishna Electronics & Order Suppliers"
NEXT_PUBLIC_DEFAULT_CURRENCY="NPR"
NEXT_PUBLIC_CURRENCY_SYMBOL="रु"
NEXT_PUBLIC_BUSINESS_LOCATION="Birendranagar-6, Buddhapath, Surkhet, Nepal"

# Optional Email Notification Dispatch (Nodemailer / SMTP)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-store-email@gmail.com"
SMTP_PASS="your-app-password"
NOTIFICATION_RECIPIENT_EMAILS="krishnaelectronics2077@gmail.com"

# Optional Gemini AI Banner Studio API Key
GEMINI_API_KEY=""
```

### Step 3: Build & Launch Containers
```bash
docker compose build --no-cache
docker compose up -d
```

### Step 4: Initial Database Bootstrapping
When deploying to a fresh volume with no existing database:
```bash
# Verify container is running
docker compose ps

# Deploy schema and seed initial business catalog:
docker compose exec app node -e "
const { execSync } = require('child_process');
execSync('npx prisma db push --skip-generate', { stdio: 'inherit' });
execSync('node prisma/seed.js', { stdio: 'inherit' });
"
```
*Note: Existing administrator credentials and existing site settings will never be overwritten if already present.*

---

## 8. Backup & Disaster Recovery (Docker Deployment)

The repository includes enterprise-grade, WAL-consistent backup and restore automation.

### Automated Nightly Backups
To schedule automatic daily backups at 2:00 AM, add a root cron entry:
```bash
sudo crontab -e
```
Add the line:
```cron
0 2 * * * cd /opt/krishna-electronics && ./deploy/backup-db.sh >> /var/log/krishna-backup.log 2>&1
```

### Manual Backup
```bash
sudo ./deploy/backup-db.sh
```
- Creates a WAL-checkpointed SQLite backup in `./backups/db_YYYYMMDD_HHMMSS.sqlite.gz`.
- Creates a verified media uploads archive in `./backups/uploads_YYYYMMDD_HHMMSS.tar.gz`.
- Sets strict file permissions (`chmod 700` directory, `chmod 600` archives).
- Automatically prunes archives older than 30 days.

### Database & Media Restoration
Restoration is strictly protected:
- Verifies the application container is stopped before modifying files.
- Creates an automatic, verified pre-restore safety snapshot (`pre_restore_*.sqlite.gz`).
- Performs real UID 1001 privilege-dropping checks to ensure the application user can create SQLite WAL/SHM locks.
- Replaces the database atomically via filesystem rename (`mv -f`).

**Dry-Run Mode (Simulation without changes):**
```bash
sudo ./deploy/restore-db.sh --dry-run ./backups/db_20261115_020000.sqlite.gz
```

**Confirmed Restoration:**
```bash
sudo ./deploy/restore-db.sh --confirm ./backups/db_20261115_020000.sqlite.gz ./backups/uploads_20261115_020000.tar.gz
```

---

## 9. Administrative Account & Password Management

### Default Administrator Account
- **Initial Username:** `adminbikram@krishnaelectronics.com.np`
- **Initial Password:** Configured via `INITIAL_ADMIN_PASSWORD` in `.env` during bootstrapping.

### Managing Users
1. Log in to `/admin` as a Super Admin.
2. Navigate to **Admin Management** (`/admin/users`).
3. Super Admins can add new team members, assign roles (`ADMIN`, `EDITOR`, `PRODUCT_MANAGER`, etc.), or deactivate accounts (`isActive: false`).
4. Deactivated accounts are revoked immediately across the platform.

### Emergency Password Reset
If administrative access is lost, a password can be securely updated via container subshell:
```bash
docker compose exec app node -e "
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();
async function reset() {
  const hash = await bcrypt.hash('NEW_STRONG_PASSWORD_HERE', 12);
  await prisma.user.update({
    where: { email: 'adminbikram@krishnaelectronics.com.np' },
    data: { passwordHash: hash, isActive: true }
  });
  console.log('Password reset successfully.');
}
reset().finally(() => prisma.\$disconnect());
"
```

---

## 10. Security Disclosures & Historical Risks

> [!WARNING]
> **Historical Git Backup Exposure & Required Credential Rotation**
> In commit `cbd58646dbb5ac3751b7963e1db9ce41d8e1d8fe` (Nov 5, 2026), raw JSON database exports were committed to GitHub containing bcrypt password hashes for `adminbikram@krishnaelectronics.com.np` and internal audit logs.
>
> **Mandatory Client Actions:**
> 1. Do **NOT** reuse historical passwords. Set a brand new, unique password for `adminbikram@krishnaelectronics.com.np` upon first production deployment.
> 2. Ensure `JWT_SECRET` in `.env` (or Vercel settings) is a newly generated 64-character random string.
> 3. If the GitHub repository is public or shared with third parties, execute a repository history scrub using `git-filter-repo` to permanently purge historical backup blobs.

---

## 11. Known Limitations

1. **Payment Gateway Integration:**
   - The current storefront is designed for catalog discovery, quotation requests, and direct customer communication via phone and WhatsApp. Online payment gateways (eSewa, Khalti, Fonepay) are not currently integrated.
2. **Outbound WhatsApp API:**
   - The platform generates pre-filled `https://wa.me/` URLs allowing customers to initiate WhatsApp conversations with technicians. Fully automated outbound server-to-WhatsApp messaging requires an external WhatsApp Cloud API webhook provider.
3. **Vercel Serverless File Uploads:**
   - On Vercel, uploaded images cannot be written to the local disk due to serverless read-only restrictions. To upload new media on Vercel, attach a cloud blob storage provider (e.g. Cloudinary, AWS S3, or Vercel Blob).

---

## 12. Client Responsibilities

To maintain website security and operational continuity, the store owner/administrator is responsible for:
1. **Server Maintenance:** Applying regular OS security updates to the hosting machine (if using Docker).
2. **Credential Confidentiality:** Protecting the `.env` file and avoiding sharing Super Admin credentials.
3. **Backup Off-Siting:** Periodically copying archives from `/opt/krishna-electronics/backups/` to a separate off-site drive or secure cloud storage.
4. **Product Accuracy:** Keeping prices, warranty terms, and stock statuses up to date in `/admin/products`.

---

## 13. Post-Deployment Verification Checklist

Execute this verification checklist immediately after deploying to your server or Vercel:

- [ ] **Deployment Status:** Verify deployment completes without errors in Vercel or `docker compose ps` shows `Up`.
- [ ] **Homepage Availability:** Visit `https://krishnaelectronics.com.np` (or deployment URL); verify banners, categories, and products render cleanly.
- [ ] **SSL / TLS Certificate:** Verify HTTPS locks green with valid certificate in browser.
- [ ] **Product Search:** Search for `"router"` and `"laptop"`; verify search variants and results display correctly.
- [ ] **Custom 404 Page:** Visit `https://krishnaelectronics.com.np/nonexistent-test-page`; verify branded 404 page renders with search bar and navigation links.
- [ ] **Customer Inquiry Submission:** Submit a test message on `/contact`; verify:
  - Form reports success message.
  - "Open WhatsApp" button links to WhatsApp with pre-filled message text.
- [ ] **Admin Authentication:**
  - Navigate to `/admin/login`.
  - Verify invalid password triggers rate-limited rejection.
  - Log in with valid credentials; verify redirection to `/admin`.
- [ ] **Product Catalog:** Review products and verify specifications and pricing display properly.
