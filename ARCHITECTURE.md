# Platform & Business Layer Architectural Separation

This document specifies the decoupled two-layer architecture separating **Krishna Electronics & Order Suppliers** from the **underlying reusable web platform and CMS engine**.

```
┌────────────────────────────────────────────────────────────────────────┐
│                   LAYER 2: BUSINESS & TENANT CONTENT                   │
│                                                                        │
│   src/business/krishna-electronics/                                    │
│   ├── manifest.ts         <- Complete declarative business profile     │
│   ├── data.json           <- Canonical dataset (NPR, Surkhet, Products)│
│   └── (Assets/Media)      <- Product & service media                   │
│                                                                        │
│   src/business/templates/                                              │
│   └── white-label-template.ts <- Template for other shops/clients       │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ (Injected via Tenant Contract)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│               LAYER 1: REUSABLE WEB PLATFORM & CMS ENGINE              │
│                                                                        │
│   src/platform/                                                        │
│   ├── config/tenant-contract.ts  <- Multi-tenant data contract         │
│   └── engine/tenant-loader.ts    <- Merges DB settings with manifest   │
│                                                                        │
│   Generic Platform Subsystems:                                         │
│   ├── Admin Panel (/admin)       <- Reusable CMS dashboard & inventory │
│   ├── Publishing Workflow        <- Draft -> Preview -> Publish state  │
│   ├── AI Banner Studio           <- Prompt-to-concept generation engine│
│   ├── Analytics Engine           <- Real views, orders, stock alerts   │
│   ├── Security & RBAC            <- Roles: Super-Admin, Admin, Editor  │
│   ├── Audit Logging              <- Immutable event trail              │
│   └── Infrastructure             <- Docker, Caddy/Nginx, Let's Encrypt │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 1. Layer 1: Reusable Website Platform Engine (`src/platform/`)

The platform engine is completely agnostic of any specific business brand or domain. It contains:

### A. Tenant Contract (`src/platform/config/tenant-contract.ts`)
Defines the strict TypeScript interfaces that any business tenant must fulfill:
- `BusinessIdentity` (Name, tagline, location, contact channels, default currency)
- `BusinessBrandingTheme` (Primary, secondary, accent colors, surface palettes, fonts)
- `BusinessCategorySeed` & `BusinessBrandSeed` (Catalog taxonomy)
- `BusinessServiceSeed` (Service divisions, pricing guide, inclusions)
- `BusinessProductSeed` (SKUs, specifications, pricing, inventory)
- `BusinessBannerSeed` & `BusinessFAQSeed`

### B. Tenant Loader & Settings Merger (`src/platform/engine/tenant-loader.ts`)
- Dynamically resolves the active business manifest (via `TENANT_ID`).
- Merges database-persisted administrative changes (e.g., when the store owner updates their phone number or business hours in `/admin/settings`) on top of the base declarative manifest without corrupting code.

### C. Generic Admin CMS (`/admin`)
- Dynamic branding: the Admin sidebar and topbar adjust to the active store's identity.
- Full inventory and stock alert thresholds.
- Dynamic specifications builder (allows arbitrary key-value technical specs).
- Immutable audit logging for compliance and accountability.

### D. Content Approval & Publishing Engine
Enforces the mandatory 6-step lifecycle:
$$\text{Create} \longrightarrow \text{Save Draft} \longrightarrow \text{Restricted Preview} \longrightarrow \text{Validation} \longrightarrow \text{Approve} \longrightarrow \text{Publish}$$
- Live storefront queries only fetch `status: 'PUBLISHED'` and `isApproved: true`.

### E. AI-Assisted Promotional Banner Studio
- Accepts high-level creative briefs and target aspect ratios.
- Generates 3 candidate concepts matching the active tenant's color palette.
- Renders live desktop and mobile mockups in website context.
- Isolates AI content as draft until explicitly approved by an administrator.

---

## 2. Layer 2: Krishna Electronics Business Layer (`src/business/krishna-electronics/`)

This directory contains the actual business configuration, identity, and content for Krishna Electronics:

- **Identity**:
  - Name: `Krishna Electronics & Order Suppliers`
  - Location: `Birendranagar-6, Buddhapath, Surkhet, Nepal`
  - Default Currency: `NPR` (`रु`)
  - Target URL: `https://krishnaelectronics.com.np`
- **Branding Tokens**:
  - Primary Electric Blue: `#0066FF`
  - Dark Navy Surface: `#0B132B`
  - Electric Cyan Accent: `#00F0FF`
- **Product Catalog**:
  - TP-Link Wi-Fi 6 routers, MikroTik gigabit routers, Hikvision ColorVu surveillance cameras, Dell Vostro business laptops, Sonoff IoT smart power relays.
- **7 Technical Service Divisions**:
  1. Computer & Laptop Chip-Level Motherboard Repair
  2. Networking Installation & Structured Cabling
  3. Router, Switch & High-Speed Wi-Fi Solutions
  4. CCTV & Security Surveillance Installation
  5. IoT & Smart Home/Office Solutions
  6. Electronics Repair & Troubleshooting Lab
  7. Annual Maintenance Contracts (AMC) & Technical Support

---

## 3. Commercialization Guide: Selling the Platform to Other Businesses

To deploy this platform for a new client or organization (e.g. an electronics store in Pokhara or a medical hardware supplier in Kathmandu):

### Step 1: Create a New Tenant Manifest
Duplicate `src/business/templates/white-label-template.ts` into `src/business/<new-tenant-id>/data.json`. Update the name, address, currency, categories, and services.

### Step 2: Set the Tenant Environment Variable
In `.env`:
```env
TENANT_ID="new-tenant-id"
NEXT_PUBLIC_APP_URL="https://newclient.com.np"
NEXT_PUBLIC_SITE_NAME="New Client Name"
```

### Step 3: Run Database Seed & Deploy
```bash
node prisma/seed.js
docker compose up -d --build
```

The entire platform (storefront, service showcase, marketplace, admin CMS, AI studio, analytics, and authentication) will immediately boot with the new business's branding and catalog without altering any core platform code!
