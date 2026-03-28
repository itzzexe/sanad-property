# 🏢 RentFlow – Advanced Rent Management System

A production-grade SaaS web application for managing property rentals, payments, installments, and receipt generation.

![RentFlow](https://img.shields.io/badge/RentFlow-v1.0-blue?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-14-000?style=flat-square&logo=next.js)
![NestJS](https://img.shields.io/badge/NestJS-10-ea2845?style=flat-square&logo=nestjs)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169e1?style=flat-square&logo=postgresql)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ed?style=flat-square&logo=docker)

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Quick Start](#-quick-start)
- [Environment Variables](#-environment-variables)
- [API Documentation](#-api-documentation)
- [Demo Credentials](#-demo-credentials)
- [Deployment](#-deployment)

---

## ✨ Features

### Core Modules
- **🔐 Authentication & Authorization** – JWT access/refresh tokens, RBAC (Admin, Owner, Accountant)
- **🏠 Property Management** – CRUD properties with search, filtering, pagination
- **🚪 Unit Management** – Apartments, shops, offices with status tracking
- **👥 Tenant Management** – Profiles, ID documents, contact details
- **📄 Lease Contracts** – Link tenants to units with rent, duration, frequency
- **💳 Payment System** – Full/partial payments, multiple methods (cash, transfer, wallet)
- **📅 Installment Engine** – Auto-generated schedules, overdue tracking, late fees
- **🧾 Receipt System** – PDF generation with QR codes, download & email
- **🔔 Notifications** – Email/SMS alerts for payments and lease events
- **📊 Dashboard** – KPIs, revenue charts, occupancy rates, analytics

### Advanced Features
- ⚡ Late fee auto-calculation
- 🌐 Multi-currency support (USD, EUR, GBP, AED, SAR, etc.)
- 📁 File upload system (MinIO/S3-compatible)
- 🔍 Search & filtering across all entities
- 📋 Audit logging for all critical actions
- 🛡️ Rate limiting, CSRF/XSS protection, input validation

---

## 🧱 Tech Stack

| Layer          | Technology                          |
|----------------|-------------------------------------|
| Frontend       | Next.js 14, TypeScript, Tailwind CSS, ShadCN UI, Recharts |
| Backend        | NestJS 10, TypeScript, Prisma ORM   |
| Database       | PostgreSQL 16                       |
| Storage        | MinIO (S3-compatible)               |
| Auth           | JWT + Refresh Tokens, bcrypt, RBAC  |
| Infrastructure | Docker, Docker Compose, Nginx       |
| Docs           | Swagger/OpenAPI                     |

---

## 📁 Project Structure

```
sanad-property/
├── backend/                    # NestJS API
│   ├── prisma/
│   │   ├── schema.prisma       # Database schema
│   │   └── seed.ts             # Seed data
│   ├── src/
│   │   ├── main.ts             # Entry point
│   │   ├── app.module.ts       # Root module
│   │   ├── prisma/             # Database service
│   │   └── modules/
│   │       ├── auth/           # Authentication & RBAC
│   │       ├── property/       # Property CRUD
│   │       ├── unit/           # Unit CRUD
│   │       ├── tenant/         # Tenant CRUD
│   │       ├── lease/          # Lease/contract management
│   │       ├── payment/        # Payment tracking
│   │       ├── installment/    # Installment engine
│   │       ├── receipt/        # PDF receipt generation
│   │       ├── notification/   # Notifications
│   │       ├── dashboard/      # Analytics & KPIs
│   │       ├── upload/         # File uploads (MinIO)
│   │       └── audit/          # Audit logging
│   ├── Dockerfile
│   └── package.json
├── frontend/                   # Next.js App
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx      # Root layout
│   │   │   ├── page.tsx        # Landing redirect
│   │   │   ├── login/          # Login page
│   │   │   └── dashboard/      # Dashboard pages
│   │   │       ├── layout.tsx  # Sidebar layout
│   │   │       ├── page.tsx    # Dashboard KPIs
│   │   │       ├── properties/ # Properties
│   │   │       ├── units/      # Units
│   │   │       ├── tenants/    # Tenants
│   │   │       ├── contracts/  # Contracts
│   │   │       ├── payments/   # Payments
│   │   │       └── receipts/   # Receipts
│   │   ├── components/ui/      # ShadCN components
│   │   └── lib/                # Utils & API client
│   ├── Dockerfile
│   └── package.json
├── nginx/
│   └── nginx.conf              # Reverse proxy config
├── docker-compose.yml          # All services
├── .env.example                # Environment template
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** >= 18
- **Docker** & **Docker Compose** (for full stack)
- **PostgreSQL** 16 (or use Docker)

### Option 1: Docker (Recommended)

```bash
# 1. Clone and navigate
cd sanad-property

# 2. Copy environment file
cp .env.example .env

# 3. Start all services
docker-compose up -d

# 4. Run database migrations & seed
docker exec rentflow-backend npx prisma migrate deploy
docker exec rentflow-backend npx prisma db seed

# 5. Open the app
# Frontend: http://localhost:3000
# Backend API: http://localhost:4000/api
# Swagger Docs: http://localhost:4000/docs
# Nginx Proxy: http://localhost:80
```

### Option 2: Local Development

```bash
# 1. Start PostgreSQL (via Docker or local install)
docker run -d --name rentflow-db \
  -e POSTGRES_USER=rentflow \
  -e POSTGRES_PASSWORD=rentflow_secret \
  -e POSTGRES_DB=rentflow \
  -p 5432:5432 \
  postgres:16-alpine

# 2. Backend setup
cd backend
npm install
cp ../.env.example .env
# Add DATABASE_URL=postgresql://rentflow:rentflow_secret@localhost:5432/rentflow to .env
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed
npm run start:dev

# 3. Frontend setup (new terminal)
cd frontend
npm install
npm run dev

# 4. Open
# Frontend: http://localhost:3000
# Backend: http://localhost:4000
# Swagger: http://localhost:4000/docs
```

---

## 🔧 Environment Variables

| Variable              | Description                    | Default                     |
|-----------------------|--------------------------------|-----------------------------|
| `POSTGRES_USER`       | Database username              | `rentflow`                  |
| `POSTGRES_PASSWORD`   | Database password              | `rentflow_secret`           |
| `POSTGRES_DB`         | Database name                  | `rentflow`                  |
| `DATABASE_URL`        | Full PostgreSQL connection URL | (auto-composed in Docker)   |
| `JWT_SECRET`          | JWT signing secret             | (change in production!)     |
| `JWT_REFRESH_SECRET`  | Refresh token signing secret   | (change in production!)     |
| `JWT_EXPIRATION`      | Access token expiry            | `15m`                       |
| `JWT_REFRESH_EXPIRATION` | Refresh token expiry        | `7d`                        |
| `MINIO_ACCESS_KEY`    | MinIO access key               | `minioadmin`                |
| `MINIO_SECRET_KEY`    | MinIO secret key               | `minioadmin123`             |
| `MINIO_BUCKET`        | Storage bucket name            | `rentflow`                  |
| `NEXT_PUBLIC_API_URL` | Frontend API base URL          | `http://localhost:4000/api` |

---

## 📚 API Documentation

Swagger documentation is auto-generated at:
- **Local**: http://localhost:4000/docs
- **Docker**: http://localhost/docs (via Nginx)

### Key Endpoints

| Method | Endpoint                      | Description              |
|--------|-------------------------------|--------------------------|
| POST   | `/api/auth/register`          | Register new user        |
| POST   | `/api/auth/login`             | Login                    |
| POST   | `/api/auth/refresh`           | Refresh tokens           |
| GET    | `/api/properties`             | List properties          |
| POST   | `/api/properties`             | Create property          |
| GET    | `/api/units`                  | List units               |
| GET    | `/api/tenants`                | List tenants             |
| POST   | `/api/leases`                 | Create lease contract    |
| POST   | `/api/payments`               | Record payment           |
| GET    | `/api/installments`           | List installments        |
| GET    | `/api/installments/overdue`   | Get overdue installments |
| POST   | `/api/receipts/generate/:id`  | Generate receipt         |
| GET    | `/api/receipts/:id/pdf`       | Download receipt PDF     |
| GET    | `/api/dashboard/stats`        | Dashboard KPIs           |
| GET    | `/api/dashboard/revenue-chart`| Revenue chart data       |
| GET    | `/api/notifications`          | User notifications       |

---

## 🔑 Demo Credentials

| Role       | Email                     | Password      |
|------------|---------------------------|---------------|
| Admin      | `admin@rentflow.com`      | `Admin@123`   |
| Owner      | `owner@rentflow.com`      | `Owner@123`   |
| Accountant | `accountant@rentflow.com` | `Account@123` |

---

## 🚢 Deployment

### Production Checklist
1. Change all secrets in `.env` (JWT_SECRET, JWT_REFRESH_SECRET, passwords)
2. Enable HTTPS via Nginx SSL termination
3. Set `NODE_ENV=production`
4. Configure proper CORS origins
5. Set up database backups
6. Configure monitoring & logging

### Docker Production

```bash
docker-compose -f docker-compose.yml up -d --build
```

---

## 🧪 Testing

```bash
# Backend unit tests
cd backend
npm test

# Backend e2e tests
npm run test:e2e
```

---

## 📄 License

This project is proprietary software. All rights reserved.
