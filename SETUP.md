# Quick Setup Guide

## Step 1 — Configure Database

Edit `backend/.env` and set your PostgreSQL credentials:

```env
DATABASE_URL="postgresql://YOUR_USER:YOUR_PASSWORD@localhost:5432/integrated_academy"
```

Default credentials in `.env` are: user=`postgres`, password=`password`

## Step 2 — Start Services

### Option A: Docker (recommended)
```bash
docker-compose up -d postgres redis
```

### Option B: Manual
- Start PostgreSQL on port 5432
- Start Redis on port 6379

## Step 3 — Run Database Migration
```powershell
cd backend
npx prisma migrate dev --name init
```

## Step 4 — Seed Demo Data
```powershell
cd backend
npx ts-node prisma/seed.ts
```

## Step 5 — Start Development Servers

### Option A: Use the script
Double-click `start-dev.bat`

### Option B: Manual (two terminals)
```powershell
# Terminal 1
cd backend
npm run dev

# Terminal 2
cd frontend
npm run dev
```

## Access

| | URL |
|--|--|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:5000/api |
| Health Check | http://localhost:5000/api/health |
| Prisma Studio | `cd backend && npx prisma studio` |

## Demo Logins

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@academy.rw | Admin@1234 |
| Finance Officer | finance@academy.rw | Finance@1234 |
| Academy Manager | academy@academy.rw | Academy@1234 |
| Instructor | instructor@academy.rw | Instructor@1234 |
| Student | student@academy.rw | Student@1234 |

## Complete Feature List

### Student Portal
- Dashboard with locked course alerts
- Course application & enrollment
- Learning (video/PDF/text) with access control
- 50% / 100% payment with automatic unlock
- Invoices & payment history
- Grades & assessment results
- Attendance record
- Certificates with verification codes
- Support ticket system
- Announcements

### Admin Portal
- Dashboard with full KPIs
- Application management (confirm / reject with reason)
- User management & roles
- Audit log (complete trail)
- System settings

### Finance Module (Full)
- **Dashboard**: Revenue, Expenses, Net Profit, Cash Balance, Receivables, Payables
- **Income Management**: Record, categorize, filter
- **Expense Management**: Approval workflow (Draft→Approved→Paid)
- **Invoice Management**: Create, track, outstanding balances
- **Payment Management**: Confirm payments, auto-enrollment trigger
- **Accounts**: Cash, Bank, Mobile Money balances
- **Transfers**: Internal (not counted as income/expense)
- **Payroll**: Periods, process, approve, payslips with tax/pension
- **General Ledger**: Chart of accounts, journal entries, ledger view, trial balance
- **Tax Management**: VAT, PAYE, withholding tax records
- **Budgets**: Create with line items, monitor utilization
- **Reconciliation**: Compare system vs bank balances
- **Reports**: Income statement, expense breakdown, P&L, cashbook

### Supplier Management (Full)
- Supplier registration with approval workflow
- Supplier invoices (submit → approve → pay)
- Purchase Orders with line items
- Accounts Payable dashboard
- Supplier aging report
- Supplier evaluations & contracts

### Academy Management
- Course catalogue with configurable payment lock days
- Cohorts with start/end dates and capacity
- Attendance recording (Present/Absent/Late/Excused)
- Attendance reports with percentage
- Assessment creation and grading
- Certificate issuance with verification

### Trainer Dashboard
- Course overview
- Active/upcoming cohorts
- Quick attendance recording
- Assessment grading

### HR Management
- Employee registry with departments
- Leave request workflow (Pending→Approved/Rejected)
- Department management

### Consultancy
- Lead → Client → Proposal → Contract → Project pipeline
- Milestone and task tracking
- Timesheet recording

### Communication
- System announcements (pinned, categorized, with expiry)
- Support ticket system with responses

### Automatic Payment Access Control (V3.0)
- 15-day checkpoint for partial payments
- Auto-lock on unpaid balance
- Day 13/14 reminders
- Instant unlock after payment — no admin needed
- Complete audit trail

---

## Architecture

```
Frontend (React + Vite)
    ↓ REST API
Backend (Node.js + Express)
    ↓
PostgreSQL (Prisma ORM)
    ↓ (optional)
Redis (BullMQ scheduler)
```

## Database: 50+ Tables

Identity, Students, Courses, Modules, Lessons, Cohorts, Enrollments,
Assessments, Attendance, Certificates, Finance (Accounts, Income, Expenses,
Invoices, Payments, Transfers, Budgets, Payroll, Tax, Ledger),
Suppliers (Invoices, POs, Payments, Contracts), Consultancy (Leads, Clients,
Projects, Milestones, Tasks), HR (Employees, Departments, Leave),
Communication (Announcements, Messages, Discussions), Audit Logs
