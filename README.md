# Krishna Electronics & Order Suppliers — Platform & CMS

[![CI Build & Verification](https://github.com/bikram/krishna-electronics/actions/workflows/ci.yml/badge.svg)](https://github.com/bikram/krishna-electronics/actions/workflows/ci.yml)
[![Node.js Version](https://img.shields.io/badge/node-v20%2B-blue)](https://nodejs.org)
[![Framework](https://img.shields.io/badge/framework-Next.js%2014-black)](https://nextjs.org)
[![Currency](https://img.shields.io/badge/currency-NPR%20(%E0%A4%B0%E0%A5%81)-emerald)](https://krishnaelectronics.com.np)
[![Location](https://img.shields.io/badge/location-Surkhet%2C%20Nepal-navy)](https://krishnaelectronics.com.np)

A high-performance, enterprise-grade electronics retail, technical service, and CMS web platform built specifically for **Krishna Electronics & Order Suppliers**, located at **Birendranagar-6, Buddhapath, Surkhet, Nepal**.

Official Website: [https://krishnaelectronics.com.np](https://krishnaelectronics.com.np)

---

## 1. Key Business Features

### 🛒 Public Storefront & Product Marketplace
- **NPR (रु) Currency by Default**: Authentic Nepalese numbering format (`रु 1,50,000`).
- **Product Catalog**: Advanced search, multi-facet filtering (categories, brands, stock status, price ranges, deals).
- **Comprehensive Product Details**: Dynamic image gallery, rich markdown specifications table, warranty coverage indicators, and live stock statuses.
- **Inquiry & Direct Ordering**: One-click WhatsApp ordering, telephone inquiries, and digital quotation requests with automatic customer contact routing.

### 🛠️ 7 Specialized Technical Services Showcase
Dedicated landing pages and booking forms for:
1. **Computer & Laptop Chip-Level Repair**: Motherboard repair, display replacement, BIOS programming, liquid damage recovery.
2. **Networking Installation & Structured Cabling**: Cat6/Fiber optic infrastructure for offices and institutions.
3. **Router, Switch & Wi-Fi Solutions**: Dual-band Wi-Fi 6 mesh, MikroTik bandwidth throttling, captive portals, and point-to-point wireless bridges.
4. **CCTV & Security Surveillance Installation**: Hikvision ColorVu night vision, Dahua IP cameras, NVRs, and mobile live-streaming setup.
5. **IoT & Smart-Device Solutions**: Smartphone-controlled home/office automation, automated overhead water tank controllers, and smart power meters.
6. **Electronics Repair & Troubleshooting Lab**: Inverter/UPS servicing, SMPS power supplies, and circuit board component rework.
7. **Annual Maintenance Contracts (AMC)**: Corporate SLAs with guaranteed 2–4 hour response time in Surkhet Valley, preventative maintenance, and priority technician dispatch.

### 🔐 Full Admin CMS (`/admin`)
- **Dashboard & Analytics**: Real-time database metrics (total products, active listings, real views, inquiry volume, stock alerts). Transparently distinguishes authentic internal data from unconfigured external analytics tags.
- **Product Management**: Full CRUD, draft vs published state, image upload, SKU uniqueness validation, dynamic specifications builder.
- **Content Publishing Workflow**: **Create → Save Draft → Restricted Preview (Desktop & Mobile) → Validation Checks → Approve → Publish**.
- **AI-Assisted Promotional Banner Studio**: Generates creative promotional visual concepts from natural language prompts, keeps copy/pricing editable as code, renders live hero banner mockups, and strictly requires explicit owner approval prior to publication.
- **Inquiries & Order Requests**: Live stream of quotes and repair inquiries with status management (`NEW`, `CONTACTED`, `IN_PROGRESS`, `RESOLVED`), internal technician notes, and one-click WhatsApp response buttons.
- **Website Settings**: Editable business address, business hours, contact numbers, social media links, Google Maps embed URL, delivery coverage, and maintenance mode toggle.
- **User & Permission Management**: Granular RBAC (`SUPER_ADMIN`, `ADMIN`, `EDITOR`, `PRODUCT_MANAGER`, `CONTENT_MANAGER`).
- **Security Audit Logs**: Immutable audit log of every creation, deletion, approval, and publishing action.

---

## 2. Technology Stack & Architecture

- **Frontend & App Router**: Next.js 14, React 18, TypeScript, Tailwind CSS, Lucide Icons
- **Backend & APIs**: Next.js Server Components, API Route Handlers, Zod Validation
- **Database & ORM**: Prisma ORM with SQLite (development/local) and PostgreSQL support (production)
- **Authentication**: JWT session cookies (`HttpOnly`, `SameSite=Lax`, 7-day expiration), `bcryptjs` password hashing
- **Deployment**: Ubuntu Server 22.04/24.04 LTS, Docker & Docker Compose, Caddy / Nginx Reverse Proxy with automated Let's Encrypt SSL
- **Testing**: Automated end-to-end integration and verification suite (`scripts/run-tests.js`)

---

## 3. Quick Start (Local Development)

### Prerequisites
- Node.js 20+ LTS
- npm or yarn

### Installation
```bash
# 1. Clone repository
git clone https://github.com/bikram/krishna-electronics.git
cd krishna-electronics

# 2. Install dependencies
npm install

# 3. Setup environment variables
cp .env.example .env

# 4. Generate database schema & seed initial data
npx prisma generate
npx prisma db push
node prisma/seed.js

# 5. Run automated test suite
npm test

# 6. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the public website.  
Open [http://localhost:3000/admin/login](http://localhost:3000/admin/login) to access the Admin Panel.

**Default Initial Admin Credentials:**
- **Email:** `admin@krishnaelectronics.com.np`
- **Password:** `AdminSecurePassword123!`

*(Make sure to change the admin password upon first login)*

---

## 4. Automated Testing
Run the comprehensive test suite verifying database models, authentication, security controls, and formatting:
```bash
npm test
```

---

## 5. Production Deployment (Ubuntu Server + Docker)

Detailed step-by-step instructions, including DNS record setup for `krishnaelectronics.com.np`, automated Let's Encrypt SSL, and daily backup cron jobs, are available in [DEPLOYMENT.md](file:///c:/Users/AD/Documents/bikram/krishna%20electronics/DEPLOYMENT.md).

```bash
# Build and run containers
docker compose up -d --build
```

---

## 6. Architecture & Commercialization Readiness
The platform is designed with clear domain boundaries separating:
1. Business identity & settings (`Setting` model)
2. Product & service taxonomy (`Category`, `Subcategory`, `Brand`, `Service`)
3. Media assets & AI generation configurations
4. Content publishing & access control

This guarantees seamless future commercialization into a multi-tenant solution or white-label CMS for electronics retailers across Nepal without modifying core application code.

---

## 7. License & Credits
Developed for **Krishna Electronics & Order Suppliers**, Birendranagar-6, Buddhapath, Surkhet, Nepal. All rights reserved.
