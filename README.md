# FinPulse — Enterprise B2B Fintech SaaS

FinPulse is an enterprise-grade financial intelligence and forecasting platform built for revenue-generating organizations. It enables executive teams, finance leaders, and board members to track, visualize, reconcile, and forecast monthly financial metrics (Revenue, Payroll, Procurement/Goods, CapEx Investments, and Overhead).

---

## Architecture & Technology Stack

- **UI / Frontend**:
  - **Framework**: Angular 19+ (Standalone Components, Signals reactive state architecture)
  - **Styling**: Tailored Google Stitch Design System via Tailwind CSS (Dark Slate `#1E293B`, Deep Slate `#0F172A`, 1px borders `#334155`, Inter typography, monospace alignment)
  - **Data Visualization**: Chart.js 4.4+ with custom gradient area fills, glow curves, and interactive tooltips
  - **Multi-Currency Engine**: Full support with dedicated **Indian Rupee (INR - ₹)** as the default reporting currency, alongside USD ($), EUR (€), and GBP (£)
  - **Global Command Palette**: Instant navigation modal triggered via `⌘K` / `Ctrl+K`
- **Backend & API**:
  - **Runtime**: Node.js + TypeScript + Express.js
  - **Design Pattern**: Controller-Service-Repository architecture with centralized error handling
  - **Security**: JWT authentication, RBAC middleware (`ADMIN` vs `VIEWER`), Helmet headers, rate limiting
  - **Reporting Engine**: Streaming PDFKit generator and streaming RFC-4180 CSV export
- **Database**:
  - **Engine**: MySQL 8.0 isolated community daemon on dedicated port `3308`
  - **ORM**: Prisma Client v5.22.0 (`provider = "mysql"`)

---

## Quick Start (One-Click)

From the project root `C:\Users\User\Documents\AntiGravity\FinPulse`:

```powershell
# Start all 3 tiers (MySQL 8.0, Express API, Angular App)
.\start.ps1

# Stop all services
.\stop.ps1
```

### Direct URLs
- **Web Application**: [http://localhost:4200](http://localhost:4200)
- **API Server & Discovery**: [http://localhost:5000/api/v1](http://localhost:5000/api/v1)
- **Health Check**: [http://localhost:5000/api/health](http://localhost:5000/api/health)
- **Executive PDF Export**: [http://localhost:5000/api/v1/reports/pdf](http://localhost:5000/api/v1/reports/pdf)
- **Statement CSV Export**: [http://localhost:5000/api/v1/reports/csv](http://localhost:5000/api/v1/reports/csv)

---

## Seed Accounts & RBAC

| Role | Email | Password | Access Level |
|---|---|---|---|
| **Admin** | `admin@finpulse.io` | `FinPulse2026!` | Full read, write, edit, delete, reconcile, and system settings |
| **Viewer** | `viewer@finpulse.io` | `FinPulse2026!` | Read-only dashboards, reporting, and ledger views |

---

## Design System Tokens (Google Stitch)

| Token | Hex Code | Purpose |
|---|---|---|
| **Canvas Background** | `#0F172A` | Deep Slate base background |
| **Surface Cards** | `#1E293B` | Dark Slate elevated containers |
| **Borders** | `#334155` | 1px clean slate dividers |
| **Primary / Health** | `#10B981` | Emerald Green positive indicators and cash flow |
| **Warning / Expense** | `#EF4444` | Crimson Red burn and spend alerts |
| **Payroll Accent** | `#6366F1` | Indigo wage metrics |
| **Procurement Accent** | `#14B8A6` | Teal inventory / supply metrics |
| **CapEx Accent** | `#F59E0B` | Amber infrastructure investments |
| **Overhead Accent** | `#64748B` | Slate Gray SG&A operations |
