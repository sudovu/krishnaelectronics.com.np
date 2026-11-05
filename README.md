# Krishna Electronics Order & Suppliers — Platform & Admin CMS

[![CI Build & Verification](https://github.com/sudovu/krishnaelectronics.com.np/actions/workflows/ci.yml/badge.svg)](https://github.com/sudovu/krishnaelectronics.com.np)
[![Node.js Version](https://img.shields.io/badge/node-v20%2B-blue)](https://nodejs.org)
[![Framework](https://img.shields.io/badge/framework-Next.js%2014-black)](https://nextjs.org)
[![Currency](https://img.shields.io/badge/currency-NPR%20(%E0%A4%B0%E0%A5%81)-emerald)](https://krishnaelectronics.com.np)
[![Location](https://img.shields.io/badge/location-Surkhet%2C%20Nepal-navy)](https://krishnaelectronics.com.np)

A high-performance, enterprise-grade electronics retail marketplace, specialized technical service booking hub, and live publishing CMS built specifically for **Krishna Electronics Order & Suppliers**, located at **Birendranagar-12, Surkhet, Nepal**.

- **Production Website:** [https://krishnaelectronics.com.np](https://krishnaelectronics.com.np)
- **Staff & Admin Portal:** [https://krishnaelectronics.com.np/admin](https://krishnaelectronics.com.np/admin)

---

## 📑 Table of Contents

1. [Architectural Principles: Changeable, Scalable & Migratable](#1-architectural-principles-changeable-scalable--migratable)
2. [How to Access the Admin Portal](#2-how-to-access-the-admin-portal)
3. [How to Make Changes on the Website (100% Changeable)](#3-how-to-make-changes-on-the-website-100-changeable)
   - [A. Website Settings, Visual Design, Colors & Fonts](#a-website-settings-visual-design-colors--fonts)
   - [B. Products, Pricing, Discounts & Specifications](#b-products-pricing-discounts--specifications)
   - [C. Categories, Subcategories & Brands](#c-categories-subcategories--brands)
   - [D. Technical Services & Chip-Level Repair Lab](#d-technical-services--chip-level-repair-lab)
   - [E. Promotional Campaigns, Banners & Entrance Pop-Ups](#e-promotional-campaigns-banners--entrance-pop-ups)
   - [F. AI Banner Studio](#f-ai-banner-studio)
   - [G. Customer Inquiries & Order Requests](#g-customer-inquiries--order-requests)
   - [H. FAQs & Policy Content](#h-faqs--policy-content)
   - [I. Staff & Team Roles Management](#i-staff--team-roles-management)
4. [How to Test Changes Before Publishing (Safe Preview)](#4-how-to-test-changes-before-publishing-safe-preview)
5. [How to Publish Changes Live to the Website](#5-how-to-publish-changes-live-to-the-website)
6. [Scalability & Database Migration Guide](#6-scalability--database-migration-guide)
   - [One-Command Database Export / Backup](#one-command-database-export--backup)
   - [One-Command Database Import / Restore](#one-command-database-import--restore)
   - [Switching Between SQLite and PostgreSQL (Neon / Supabase)](#switching-between-sqlite-and-postgresql-neon--supabase)
   - [White-Labeling & Multi-Tenant Scaling](#white-labeling--multi-tenant-scaling)
7. [Developer & Deployment Reference](#7-developer--deployment-reference)

---

## 1. Architectural Principles: Changeable, Scalable & Migratable

The platform is designed around three core principles:

1. **100% Changeable:** Every single public element — business name, logo, contact numbers, address, brand colors, Google fonts, prices, discounts, specifications, technical services, banners, and promotional pop-ups — can be edited directly from the browser inside the Admin CMS without editing code.
2. **100% Scalable:** Powered by Next.js 14 App Router, Vercel Edge CDN with Incremental Static Regeneration (ISR), concurrent database querying, and headless separation between the business layer and core platform engine.
3. **100% Migratable:** Zero vendor lock-in. Built-in migration CLI utilities (`npm run db:export` and `npm run db:import`) allow instantaneous data backup and 1-command migration between development SQLite, serverless Neon PostgreSQL, Supabase, self-hosted Docker containers, or any cloud provider.

---

## 2. How to Access the Admin Portal

1. Navigate to `/admin` or click the **Portal** lock icon in the top header of [krishnaelectronics.com.np](https://krishnaelectronics.com.np).
2. Enter your authorized administrative **Username or Email** and **Password**.
3. Click **Sign In**.

> [!NOTE]
> For security, the login portal is protected by brute-force rate limiting (5 attempts / 15-minute lock), constant-time password hashing (`bcryptjs`), and server-side Edge JWT cookie verification. All login attempts are recorded in the immutable audit log.

---

## 3. How to Make Changes on the Website (100% Changeable)

### A. Website Settings, Visual Design, Colors & Fonts
**Location:** Admin Panel → **Website Settings** (`/admin/settings`)

Here you can customize the entire appearance and operational rules of the platform:

- **Visual Design & Colors:**
  - Select one of the 6 pre-built theme presets (*Electric Blue, Emerald Tech, Royal Indigo, Crimson Tech, Amber Gold, Cyber Midnight*).
  - Or manually pick custom hex colors for **Primary Brand Color**, **Secondary Color**, **Accent Color**, **Dark Surface (Header/Footer)**, and **Light Surface (Background)**.
- **Global Google Typography:**
  - Choose any font from the curated Google Fonts dropdown (*Inter, Poppins, Outfit, Plus Jakarta Sans, Roboto, Montserrat, Open Sans*). The chosen font automatically applies sitewide.
- **Store Identity:**
  - Change the **Store Name** (e.g. `Krishna Electronics Order & Suppliers`).
  - Update the **Official Logo URL** (defaults to `/images/logo.jpg`).
  - Edit the **Site Tagline** and **Store Description**.
- **Physical Location & Hours:**
  - Update the **Physical Address** (e.g. `Birendranagar-12, Surkhet, Nepal`).
  - Update **Business Hours** (e.g. `Sunday – Friday: 9:30 AM – 6:30 PM`).
  - Paste your **Google Maps Embed URL** for the interactive map on the contact page.
- **Contact & Communication Channels:**
  - Update **Contact Phone Number** (renders clickable tel links sitewide).
  - Update **WhatsApp Business Number** (powers direct 1-click WhatsApp quote requests).
  - Update **Official Support Email**.
- **Social Media Links:**
  - Add or update URLs for Facebook, Instagram, LinkedIn, and YouTube.
- **Logistics & Business Policies:**
  - Edit **Delivery Policy** note (Valley dispatch and Karnali courier coverage).
  - Edit **Payment Methods** (Cash on Delivery, Fonepay QR, eSewa, Khalti, Bank Transfer).
  - Adjust **Currency Code** (`NPR`), **Currency Symbol** (`रु`), and **Tax Rate %** (`13%`).
  - Toggle **Maintenance Mode** if temporary site maintenance is needed.
- **SEO & Search Engines:**
  - Set default **Meta Title**, **Meta Description**, and **Social OpenGraph Image URL**.

*Remember to click **Save Settings** at the bottom of the page.*

---

### B. Products, Pricing, Discounts & Specifications
**Location:** Admin Panel → **Products & Inventory** (`/admin/products`)

- **Add a New Product:**
  1. Click **+ Add New Product** (`/admin/products/new`).
  2. Enter Product Title, Unique SKU, Category, and Brand.
  3. Enter **Regular Price** in NPR (e.g. `17500`).
  4. Optionally enter **Offer Price** (e.g. `15800`) or **Discount %** (e.g. `10%`).
  5. Set **Stock Quantity** and **Stock Status** (*In Stock, Low Stock, Out of Stock*).
  6. Add **Short Description** and detailed **Full Description**.
  7. Add **Technical Specifications** (e.g. Processor, RAM, Ports, Wi-Fi Standard, Resolution) using the dynamic attribute builder.
  8. Specify **Official Warranty Coverage** (e.g. `1 Year Official Brand Warranty`).
  9. Add **Primary Image URL** and additional gallery images.
  10. Set Badges: Toggle *Featured, Popular, New Arrival, or Hot Deal*.
  11. Choose Status: `DRAFT` (to review safely first) or `PUBLISHED`.
- **Edit or Delete Existing Products:**
  - From the products list, click the **Edit** (pencil) icon next to any product to change prices, stock counts, descriptions, or images.
  - Click **Delete** (trash icon) to permanently remove a product.

---

### C. Categories, Subcategories & Brands
**Location:** Admin Panel → **Categories & Brands** (`/admin/categories`)

- **Manage Categories:**
  - Click **+ Add Category**.
  - Enter Name, Slug, Description, Display Order, and select an icon (*Laptop, Wifi, ShieldAlert, Cpu, Wrench, Printer*).
  - Add or remove Subcategories attached to each main category.
- **Manage Brands:**
  - Add authorized brands (*TP-Link, MikroTik, Hikvision, Dahua, Dell, HP, Lenovo, Acer, Asus, Brother, Canon, Ruijie, D-Link*).
  - Set official logo URL, brand website, and toggle *Popular Brand* showcase on the homepage.

---

### D. Technical Services & Chip-Level Repair Lab
**Location:** Admin Panel → **Technical Services** (`/admin/services`)

- Showcase the specialized engineering capabilities in Surkhet:
  1. Edit service title, icon, and summary.
  2. Set **Starting Diagnostic Price** in NPR (or `0` for free diagnosis).
  3. Specify **Turnaround Time** (e.g. `Same Day / 24-48 Hours`).
  4. Specify **Warranty Coverage** (e.g. `90 Days Lab Warranty`).
  5. List bulleted technical features included in the service.
  6. Toggle Active / Featured status.

---

### E. Promotional Campaigns, Banners & Entrance Pop-Ups
**Location:** Admin Panel → **Banners & Promotions** (`/admin/banners`)

- **Create a New Promotional Campaign:**
  1. Click **+ Create Campaign Banner**.
  2. Set **Placement Slot**:
     - `Homepage Hero Slider`: Main full-width animated slider at the top of the homepage.
     - `Entrance Pop-up Modal`: Immediate eye-catching modal that greets visitors when they open the site.
     - `Promo Grid`: Secondary marketing cards below categories.
     - `Offer Banner`: Dedicated seasonal specials page banner.
  3. Enter **Banner Headline** and **Subtitle Description**.
  4. Use the **Formatting Toolbar**:
     - **Bold:** Highlight text and click **B** (adds `**bold text**`).
     - *Italic:* Highlight text and click *I* (adds `*italic text*`).
     - <u>Underline:</u> Highlight text and click <u>U</u> (adds `<u>underlined text</u>`).
  5. Customize Badge Pill text, Button CTA Label, and CTA Destination Link (e.g. `/products?category=networking`).
  6. Optionally set **Discount %** and **Coupon Code**.
  7. Schedule active window with Start Date and End Date.
  8. Save as `DRAFT` or click **🚀 Run Campaign Live** to publish immediately.
- **Edit Existing Campaigns:**
  - Click **Edit** to modify any active banner, pause a campaign, or delete expired promotions.

---

### F. AI Banner Studio
**Location:** Admin Panel → **AI Banner Studio** (`/admin/ai-banner-studio`)

- Prompt-driven creative campaign generation:
  1. Enter a brief visual prompt (e.g. *"High-speed Wi-Fi 6 routers for businesses in Surkhet"*).
  2. Choose a visual design style (*Cyber Clean, Neo Gradient, Dark Tech, High-Tech Minimal*).
  3. Click **Generate Creative Options**.
  4. Review generated copy, badge pills, and photography concepts.
  5. Format typography directly using Bold, Italic, or Underline buttons.
  6. Preview in real-time on desktop and mobile mockups.
  7. Click **🚀 Run Campaign Live** to deploy the campaign instantly to the storefront.

---

### G. Customer Inquiries & Order Requests
**Location:** Admin Panel → **Inquiries & Orders** (`/admin/inquiries`)

- View live requests submitted by customers through product inquiry and repair booking forms.
- View customer phone numbers, email addresses, and detailed inquiries.
- Click **WhatsApp Customer** to initiate a direct conversation on WhatsApp with one click.
- Update ticket status (*NEW, CONTACTED, IN_PROGRESS, RESOLVED, CANCELLED*) and save internal technician notes.

---

### H. FAQs & Policy Content
**Location:** Admin Panel → **FAQs & Content** (`/admin/faqs`)

- Add, edit, or reorder frequently asked questions grouped by categories (*Warranties, Repairs, Delivery, Payments*).
- Official policies (*Privacy Policy, Terms of Service, Warranty & Returns*) dynamically read your business name and address from Settings.

---

### I. Staff & Team Roles Management
**Location:** Admin Panel → **User Management** (`/admin/users`) *(Super Admin Only)*

- Add new staff accounts with granular role-based access:
  - `SUPER_ADMIN`: Full administrative power, user management, and platform configuration.
  - `INVENTORY_MANAGER`: Create, update, and manage products, stock counts, and categories.
  - `CONTENT_EDITOR`: Manage banners, AI studio, blog, and website settings.
  - `SUPPORT_AGENT`: View and respond to customer inquiries and service bookings.

---

## 4. How to Test Changes Before Publishing (Safe Preview)

Before publishing changes to the public website, you can verify how everything looks using the built-in multi-device preview:

1. In the Admin Panel, look at the top navigation bar.
2. Click **👁️ Test Changes (Preview)**.
3. A safe staging window will slide open rendering the actual storefront:
   - 🖥️ **Desktop Mode:** Full wide-screen display.
   - 💻 **Tablet Mode:** 768px tablet layout.
   - 📱 **Mobile Phone Mode:** 375px mobile responsive view.
4. Navigate through pages, inspect custom colors, test responsive typography, and verify your new banners and products.
5. Click **Close Preview** when satisfied.

---

## 5. How to Publish Changes Live to the Website

Once your drafts, banners, products, or settings are ready:

1. Click the prominent blue **🚀 Publish to Website** button in the top navigation bar of the Admin Panel.
2. Confirm the prompt: *"Are you ready to publish all approved changes to the live website?"*.
3. **What happens automatically:**
   - All approved `DRAFT` banners and products are updated to `PUBLISHED`.
   - In-memory database caches are purged.
   - Next.js on-demand cache revalidation (`revalidatePath`) purges the homepage, catalog, services, about, contact, and FAQ routes.
   - Vercel's global CDN distributes the updated pre-rendered HTML worldwide within seconds.
4. A green toast notification will display the exact timestamp and the number of active products, services, and banners published live.

---

## 6. Scalability & Database Migration Guide

### One-Command Database Export / Backup
To export all database tables (settings, users, categories, subcategories, brands, products, services, banners, FAQs, inquiries, and audit logs) into a structured JSON backup:

```bash
npm run db:export
```
This generates:
- A timestamped archive: `backup/data-backup-YYYY-MM-DDTHH-mm-ss-msZ.json`
- A pointer to the latest backup: `backup/latest.json`

### One-Command Database Import / Restore
To restore a backup into a new database (whether SQLite, PostgreSQL on Neon, Supabase, or a self-hosted server):

```bash
# Restore latest backup
npm run db:import

# Or restore a specific historical backup
node scripts/import-data.js backup/data-backup-2026-11-05.json
```
The importer automatically upserts records without primary key conflicts, preserving user changes while restoring full catalog integrity.

---

### Switching Between SQLite and PostgreSQL (Neon / Supabase)

The platform includes dynamic database abstraction:

1. **Local Development / Offline Testing:** Uses SQLite (`prisma/dev.db`). No database server setup required.
2. **Cloud Production (Vercel + Neon / Supabase):**
   - Provide your PostgreSQL connection string in environment variables:
     ```env
     DATABASE_URL="postgres://username:password@ep-sample-pooler.neon.tech/neondb?sslmode=require"
     POSTGRES_PRISMA_URL="postgres://username:password@ep-sample-pooler.neon.tech/neondb?sslmode=require"
     ```
   - When building on Vercel or running `npm run build`, `scripts/prepare-db.js` automatically detects PostgreSQL and configures Prisma schema provider to `postgresql`.
   - Run `npx prisma db push` to push the schema to PostgreSQL.
   - Run `npm run db:import` to migrate all data into PostgreSQL in seconds.

---

### White-Labeling & Multi-Tenant Scaling

The business identity is decoupled from the platform core engine:
- Tenant definitions live under `src/business/<tenant-id>/`
- The platform tenant contract is defined in `src/platform/config/tenant-contract.ts`
- To spin up a new store instance for another business:
  1. Duplicate `src/business/krishna-electronics/` to `src/business/<new-tenant>/`.
  2. Set `TENANT_ID="<new-tenant>"` in `.env`.
  3. The platform boots up with the new business identity while retaining the identical high-performance CMS engine.

---

## 7. Developer & Deployment Reference

### Local Setup
```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env

# 3. Initialize database
npm run prisma:push
npm run prisma:seed

# 4. Run automated QA verification suite (29 tests)
npm test

# 5. Start development server
npm run dev
```

### Production Build Verification
```bash
# Run full clean build pipeline
npm run build

# Start production server daemon
npm start
```

### Environment Variables Reference
| Variable | Description | Default |
| :--- | :--- | :--- |
| `DATABASE_URL` | Prisma database connection string | `file:./dev.db` (SQLite) or Postgres URI |
| `POSTGRES_PRISMA_URL` | Neon / Vercel PostgreSQL connection URI | Optional (for cloud Postgres) |
| `JWT_SECRET` | Secret key for signing admin authentication tokens | 64+ char random string |
| `INITIAL_ADMIN_EMAIL` | Default administrator username or email | Configured at deployment |
| `INITIAL_ADMIN_PASSWORD` | Default administrator secure password | Configured at deployment |
| `TENANT_ID` | Business manifest identifier | `krishna-electronics` |
| `NEXT_PUBLIC_SITE_URL` | Canonical public website URL | `https://krishnaelectronics.com.np` |

---

## 8. License & Commercial Rights
Platform Architecture © 2026 Krishna Electronics Order & Suppliers, Birendranagar-12, Surkhet, Nepal.  
All rights reserved. Designed for enterprise scalability and commercial reusability.
