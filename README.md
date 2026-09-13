# Integrated Academy, E-Learning & Consultancy Management System

A full-stack, production-ready platform for managing academic training, online learning, consultancy services, finance, HR, and more.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite + Tailwind CSS |
| Backend | Node.js + Express + TypeScript |
| Database | PostgreSQL + Prisma ORM |
| Cache / Queue | Redis + BullMQ |
| Auth | JWT (access + refresh tokens) |
| Charts | Recharts |

---

## Prerequisites

- **Node.js** v18+ — https://nodejs.org
- **PostgreSQL** v14+ — https://postgresql.org (or use Docker)
- **Redis** v7+ — https://redis.io (or use Docker)

---

## Quick Start (with Docker for DB + Redis)

### 1. Start PostgreSQL and Redis

```bash
docker-compose up -d postgres redis
```

### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

### 3. Configure Environment

The `.env` file is already created with defaults. Edit if needed:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/integrated_academy"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="change-this-in-production"
```

### 4. Run Database Migrations

```bash
cd backend
npx prisma migrate dev --name init
```

### 5. Seed the Database

```bash
cd backend
npx ts-node prisma/seed.ts
```

### 6. Start Backend

```bash
cd backend
npm run dev
```

Backend runs at: **http://localhost:5000**

### 7. Install Frontend Dependencies

```bash
cd frontend
npm install
```

### 8. Start Frontend

```bash
cd frontend
npm run dev
```

Frontend runs at: **http://localhost:3000**

---

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@academy.rw | Admin@1234 |
| Finance Officer | finance@academy.rw | Finance@1234 |
| Academy Manager | academy@academy.rw | Academy@1234 |
| Instructor | instructor@academy.rw | Instructor@1234 |
| Student | student@academy.rw | Student@1234 |

---

## Key Features

### Student Workflow
1. Register → Application → Admin Review
2. Confirm → Auto-generate Invoice
3. Pay 50% or 100% → Auto-enroll → Start Learning
4. 15-day checkpoint: if balance unpaid → Course LOCKED automatically
5. Pay remaining → Course UNLOCKED instantly (no admin needed)

### Finance
- Income, Expenses, Accounts (Cash/Bank/MobileMoney)
- Invoices, Payments, Receipts
- Internal Transfers (not counted as income/expense)
- Reconciliation, Budgets
- Reports: Income Statement, Cashbook, Outstanding Balances

### Academy
- Course catalogue with configurable duration & payment lock days
- Cohorts, Class Schedules, Attendance
- E-Learning: Modules, Lessons, Video/PDF/Text
- Assessments, Grading, Certificates

### Consultancy
- Leads → Clients → Proposals → Contracts → Projects
- Milestones, Tasks, Timesheets

### HR
- Employees, Departments, Leave Requests

### System
- Role-based access (13 roles)
- Complete Audit Log
- Automated daily checkpoint job (BullMQ)
- Notifications (in-app, email-ready)
- Support Tickets

---

## Project Structure

```
integrated-academy/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       # Full DB schema
│   │   └── seed.ts             # Demo data
│   └── src/
│       ├── config/             # DB, Redis, env
│       ├── controllers/        # Route handlers
│       ├── middleware/         # Auth, RBAC, errors
│       ├── routes/             # Express routers
│       ├── services/           # Business logic
│       ├── jobs/               # Scheduled tasks
│       └── utils/              # Helpers
└── frontend/
    └── src/
        ├── api/                # Axios API calls
        ├── components/         # Shared UI
        ├── pages/              # All page components
        ├── router/             # React Router
        ├── store/              # Redux store
        └── types/              # TypeScript types
```

---

## API Base URL

```
http://localhost:5000/api
```

### Key Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | /auth/register | Create account |
| POST | /auth/login | Login |
| GET | /student/dashboard | Student dashboard |
| POST | /student/applications | Submit application |
| POST | /student/payments | Make payment |
| POST | /student/invoices/:id/pay-balance | Pay remaining balance |
| GET | /student/enrollments/:id/payment-status | Access + payment status |
| POST | /admin/applications/:id/confirm | Confirm application |
| POST | /admin/applications/:id/reject | Reject with reason |
| GET | /finance/dashboard | Finance summary |
| GET | /finance/reports/summary | P&L report |
| POST | /finance/payments/webhook | Payment gateway webhook |

---

## Automatic Payment Access Control (V3.0)

The system enforces the partial-payment policy automatically:

1. Student pays **50%** → enrolled immediately, course **ACTIVE**
2. Daily scheduled job checks checkpoint (default Day 15 for 30-day course)
3. If balance unpaid at checkpoint → course **LOCKED** automatically
4. Reminders sent on Day 13 and Day 14 before lock
5. Student pays remaining → invoice **FULLY_PAID** → course **ACTIVE** instantly
6. All events logged in `PaymentAccessEvent` table with full audit trail

---

## Production Deployment

1. Set `NODE_ENV=production` in backend `.env`
2. Run `npm run build` in both backend and frontend
3. Serve frontend build with nginx
4. Use PM2 or Docker for backend process management
5. Configure SSL/TLS termination at nginx
6. Use managed PostgreSQL and Redis (e.g., AWS RDS + ElastiCache)
