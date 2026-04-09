# RentFlow | Advanced Property & Financial Management System

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Build](https://img.shields.io/badge/build-passing-brightgreen.svg)

RentFlow is a production-grade, full-stack ERP solution designed for modern real estate management. It combines intuitive property management with a robust, double-entry financial backend, allowing property managers to track everything from lease installments to complex trial balances in one unified platform.

---

## 1. Project Overview

RentFlow solves the fragmentation issue in real estate management by bridging the gap between operations (tenants, units, leases) and finance (accounting, reporting, taxation). It ensures every operational event—like a lease signing or a maintenance payment—generates the correct accounting entries automatically.

**Key Value Propositions:**
- **Financial Integrity:** Full double-entry accounting system with automated journal entries.
- **Operational Efficiency:** Automated lease installment engine and receipt generation.
- **Data-Driven Insights:** Real-time financial reports including Income Statements and Balance Sheets.

---

## 2. Key Features

### 🔐 Authentication & Security
- Role-Based Access Control (RBAC): Admin, Accountant, Owner, and Maintenance roles.
- Secure JWT-based authentication with Passport.js.
- Protected API routes and encrypted password hashing.

### 🏢 Property & Asset Management
- Hierarchical structure: Properties → Blocks → Floors → Units.
- Real-time occupancy tracking and unit status management.
- Dynamic asset attribute mapping.

### 📜 Lease & Tenant Lifecycle
- Automated installment generation based on lease terms (Monthly, Quarterly, Annually).
- Tenant portal ready (Backend support for tenant profiles and balances).
- Contract management with automated status updates.

### 💰 Double-Entry Finance
- **Chart of Accounts (COA):** Customizable multi-level account hierarchy.
- **Journal Entries:** Manual and automated journals with multi-currency support.
- **Fiscal Periods:** Support for opening/closing fiscal years and periods.
- **Taxation:** Configurable tax rates (VAT) integrated into billing.

### 📊 Financial Reporting
- **Trial Balance:** Real-time account balance verification.
- **Income Statement (P&L):** Revenue vs. Expense tracking with prior period comparison.
- **Balance Sheet:** Snapshots of Assets, Liabilities, and Equity.
- **AR/AP Aging:** Tracking of outstanding tenant receivables and vendor payables.

---

## 3. System Architecture

RentFlow follows a **Modular Monolith** architecture to ensure scalability while maintaining simplicity for deployment.

```mermaid
graph TD
    User((User)) -->|Next.js| Frontend[Frontend - Next.js 14]
    Frontend -->|REST API| Backend[Backend - NestJS]
    Backend -->|Prisma ORM| DB[(PostgreSQL)]
    Backend -->|S3 Protocol| Storage[MinIO / Cloud Storage]
    Backend -->|JWT| Auth[Passport Auth Service]
```

- **Frontend:** A responsive SPA using Next.js, optimized for server-side rendering where needed.
- **Backend:** A NestJS framework providing dependency injection, modularity, and strict TypeScript patterns.
- **Database:** Prisma ORM acts as the type-safe bridge to PostgreSQL, ensuring schema consistency.

---

## 4. Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | Next.js 14 (App Router), Tailwind CSS, Radix UI, Lucide Icons |
| **Backend** | NestJS (Node.js), TypeScript, EventEmitter2 (Async events) |
| **ORM/DB** | Prisma v5+, PostgreSQL |
| **Validation** | Zod (Frontend), Class Validator & Transformer (Backend) |
| **Authentication** | Passport.js, JWT Strategy |
| **DevOps** | Docker, MinIO (Object Storage), GitHub Actions |

---

## 5. Project Structure

```text
/
├── backend/               # NestJS Source Code
│   ├── src/
│   │   ├── modules/       # Domain-driven modules (Auth, Financials, Properties)
│   │   ├── prisma/        # Database service and client
│   │   └── common/        # Global guards, filters, and decorators
│   ├── prisma/            # Schema definition and seed scripts
│   └── .env.example       # Backend environment template
├── frontend/              # Next.js Source Code
│   ├── src/
│   │   ├── app/           # App Router (Pages & Layouts)
│   │   ├── components/    # Reusable UI & Business components
│   │   ├── lib/           # API clients and utilities
│   │   └── hooks/         # Custom React hooks
│   └── .env.local         # Frontend environment template
└── run.bat                # Unified launcher script (Windows)
```

---

## 6. Installation & Setup

### Prerequisites
- **Node.js:** v18.x or higher
- **PostgreSQL:** v14+
- **MinIO:** (Optional, defaults to local dev settings)

### Step-by-Step Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-repo/rentflow.git
   cd rentflow
   ```

2. **Backend Configuration:**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   ```
   *Edit `.env` with your database credentials.*

3. **Frontend Configuration:**
   ```bash
   cd ../frontend
   npm install
   cp .env.local.example .env.local
   ```

4. **Initialize Database:**
   ```bash
   cd ../backend
   npx prisma db push
   npx prisma db seed
   ```

---

## 7. Configuration (.env)

### Backend `.env`
```ini
PORT=4000
DATABASE_URL="postgresql://user:password@localhost:5432/rentflow"
JWT_SECRET="your_ultra_secure_secret"
MINIO_ENDPOINT="localhost"
MINIO_ACCESS_KEY="minio-root"
MINIO_SECRET_KEY="minio-password"
```

### Frontend `.env.local`
```ini
NEXT_PUBLIC_API_URL="http://localhost:4000/api"
```

---

## 8. API Documentation

The API automatically generates **Swagger** documentation.
- **Local link:** `http://localhost:4000/docs`

### Example Endpoint: Create Journal Entry
**`POST /api/journal-entries`**

**Request Body:**
```json
{
  "date": "2026-04-10",
  "description": "Office Rent Payment",
  "lines": [
    { "accountId": "uuid-1", "debit": 1500, "credit": 0 },
    { "accountId": "uuid-2", "debit": 0, "credit": 1500 }
  ]
}
```

---

## 9. Database & Migrations

RentFlow uses **Prisma** for schema management.
- **Sync Schema:** `npx prisma db push` (Development)
- **Generate Client:** `npx prisma generate`
- **Reset Data:** `npx prisma migrate reset` (Caution: data loss)

The `seed.ts` script initializes:
- Default `Admin` user (`admin@rentflow.com` / `Admin@123`).
- Chart of Accounts (COA) template.
- Global settings and tax rates.

---

## 10. Troubleshooting

| Issue | Cause | Fix |
| :--- | :--- | :--- |
| `EADDRINUSE: 4000` | Process stuck on port 4000 | Run `taskkill /F /IM node.exe /T` or use `run.bat` |
| `Table 'User' not found` | Schema not synced | Run `npx prisma db push` in the backend |
| `401 Unauthorized` | Invalid/Expired token | Clear browser local storage and re-login |
| `404 on /ap/vendors` | Controller path mismatch| Ensure backend controllers use `@Controller('ap/...')` prefix |

---

## 11. Roadmap
- [ ] Mobile App for Tenants (iOS/Android).
- [ ] Automated Bank Reconciliation (OFX/CSV import).
- [ ] Advanced AI-driven occupancy forecasting.
- [ ] WhatsApp integration for payment reminders.

---

## 12. License

Distributed under the **MIT License**. See `LICENSE` for more information.

---
**Maintained by the Advanced Agentic Coding Team.**
