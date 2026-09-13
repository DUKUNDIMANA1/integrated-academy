import { PrismaClient, Role, CourseType, CourseStatus, AccountType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ── Users ──────────────────────────────────────────────────────────────────

  const adminPw = await bcrypt.hash('Admin@1234', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@academy.rw' },
    update: {},
    create: { email: 'admin@academy.rw', firstName: 'System', lastName: 'Administrator', passwordHash: adminPw, role: Role.SUPER_ADMIN, isEmailVerified: true },
  });
  console.log('✅ Super Admin:', admin.email);

  const financePw = await bcrypt.hash('Finance@1234', 12);
  const financeUser = await prisma.user.upsert({
    where: { email: 'finance@academy.rw' },
    update: {},
    create: { email: 'finance@academy.rw', firstName: 'Finance', lastName: 'Officer', passwordHash: financePw, role: Role.FINANCE_OFFICER, isEmailVerified: true },
  });
  console.log('✅ Finance Officer:', financeUser.email);

  const academyPw = await bcrypt.hash('Academy@1234', 12);
  const academyManager = await prisma.user.upsert({
    where: { email: 'academy@academy.rw' },
    update: {},
    create: { email: 'academy@academy.rw', firstName: 'Academy', lastName: 'Manager', passwordHash: academyPw, role: Role.ACADEMY_MANAGER, isEmailVerified: true },
  });
  console.log('✅ Academy Manager:', academyManager.email);

  const instructorPw = await bcrypt.hash('Instructor@1234', 12);
  const instructor = await prisma.user.upsert({
    where: { email: 'instructor@academy.rw' },
    update: {},
    create: { email: 'instructor@academy.rw', firstName: 'John', lastName: 'Trainer', passwordHash: instructorPw, role: Role.INSTRUCTOR, isEmailVerified: true },
  });
  console.log('✅ Instructor:', instructor.email);

  const studentPw = await bcrypt.hash('Student@1234', 12);
  const studentUser = await prisma.user.upsert({
    where: { email: 'student@academy.rw' },
    update: {},
    create: { email: 'student@academy.rw', firstName: 'Alice', lastName: 'Uwimana', phone: '+250788000001', passwordHash: studentPw, role: Role.STUDENT, isEmailVerified: true },
  });
  await prisma.student.upsert({
    where: { userId: studentUser.id },
    update: {},
    create: { userId: studentUser.id, studentCode: 'STD-2026-0001', nationality: 'Rwandan', educationLevel: "Bachelor's Degree" },
  });
  console.log('✅ Demo Student:', studentUser.email);

  // ── Financial Accounts ─────────────────────────────────────────────────────

  await prisma.account.upsert({
    where: { id: 'acc-cash-001' },
    update: {},
    create: { id: 'acc-cash-001', name: 'Office Cash', type: AccountType.CASH, currency: 'RWF', openingBalance: 500000, currentBalance: 500000 },
  });
  await prisma.account.upsert({
    where: { id: 'acc-bank-001' },
    update: {},
    create: { id: 'acc-bank-001', name: 'Bank of Kigali - Main', type: AccountType.BANK, currency: 'RWF', openingBalance: 5000000, currentBalance: 5000000, accountNumber: '000-1234567-89', bankName: 'Bank of Kigali' },
  });
  await prisma.account.upsert({
    where: { id: 'acc-mm-001' },
    update: {},
    create: { id: 'acc-mm-001', name: 'MTN Mobile Money', type: AccountType.MOBILE_MONEY, currency: 'RWF', openingBalance: 1000000, currentBalance: 1000000 },
  });
  console.log('✅ Financial accounts created');

  // ── Courses ────────────────────────────────────────────────────────────────

  const webDevCourse = await prisma.course.upsert({
    where: { code: 'WD-101' },
    update: {},
    create: { code: 'WD-101', title: 'Full Stack Web Development', description: 'Comprehensive training in modern web development.', category: 'Technology', type: CourseType.HYBRID, durationDays: 90, partialPaymentLockDays: 45, fee: 450000, currency: 'RWF', capacity: 30, status: CourseStatus.PUBLISHED },
  });
  await prisma.course.upsert({
    where: { code: 'DS-201' },
    update: {},
    create: { code: 'DS-201', title: 'Data Science & Analytics', description: 'Learn data analysis, machine learning and BI.', category: 'Technology', type: CourseType.ONLINE, durationDays: 60, partialPaymentLockDays: 30, fee: 350000, currency: 'RWF', capacity: 25, status: CourseStatus.PUBLISHED },
  });
  await prisma.course.upsert({
    where: { code: 'BM-301' },
    update: {},
    create: { code: 'BM-301', title: 'Business Management & Leadership', description: 'Essential business management skills.', category: 'Business', type: CourseType.CLASSROOM, durationDays: 30, partialPaymentLockDays: 15, fee: 200000, currency: 'RWF', capacity: 20, status: CourseStatus.PUBLISHED },
  });
  console.log('✅ Courses created');

  // ── Modules & Lessons ──────────────────────────────────────────────────────

  const mod1 = await prisma.courseModule.upsert({
    where: { id: 'mod-wd-001' },
    update: {},
    create: { id: 'mod-wd-001', courseId: webDevCourse.id, title: 'Introduction to Web Technologies', description: 'Fundamentals of HTML, CSS and the web.', order: 1 },
  });
  await prisma.lesson.upsert({
    where: { id: 'les-wd-001' },
    update: {},
    create: { id: 'les-wd-001', moduleId: mod1.id, title: 'What is the Web?', content: 'Introduction to how the web works, browsers, and servers.', type: 'TEXT', order: 1, isProtected: false },
  });
  await prisma.lesson.upsert({
    where: { id: 'les-wd-002' },
    update: {},
    create: { id: 'les-wd-002', moduleId: mod1.id, title: 'HTML Fundamentals', content: 'Learn the building blocks of every webpage.', type: 'VIDEO', videoUrl: 'https://example.com/html-intro.mp4', order: 2, isProtected: true },
  });

  // ── Cohort ─────────────────────────────────────────────────────────────────

  await prisma.cohort.upsert({
    where: { id: 'coh-wd-2026-01' },
    update: {},
    create: { id: 'coh-wd-2026-01', courseId: webDevCourse.id, name: 'Web Dev - Cohort 1 (2026)', startDate: new Date('2026-10-01'), endDate: new Date('2026-12-31'), capacity: 30, instructorId: instructor.id, status: 'UPCOMING' },
  });

  // ── Departments ────────────────────────────────────────────────────────────

  for (const dept of ['Technology', 'Finance', 'Training', 'Consultancy', 'Administration']) {
    await prisma.department.upsert({
      where: { name: dept },
      update: {},
      create: { name: dept },
    });
  }
  console.log('✅ Departments created');

  // ── Chart of Accounts ──────────────────────────────────────────────────────

  const coaEntries = [
    { code: '1000', name: 'Cash and Cash Equivalents', type: 'ASSET',     category: 'Current Asset' },
    { code: '1100', name: 'Bank Account',               type: 'ASSET',     category: 'Current Asset' },
    { code: '1200', name: 'Mobile Money',               type: 'ASSET',     category: 'Current Asset' },
    { code: '1300', name: 'Accounts Receivable',        type: 'ASSET',     category: 'Current Asset' },
    { code: '1400', name: 'Student Receivables',        type: 'ASSET',     category: 'Current Asset' },
    { code: '1500', name: 'Equipment',                  type: 'ASSET',     category: 'Fixed Asset' },
    { code: '1600', name: 'Computers & IT',             type: 'ASSET',     category: 'Fixed Asset' },
    { code: '2000', name: 'Accounts Payable',           type: 'LIABILITY', category: 'Current Liability' },
    { code: '2100', name: 'Supplier Payables',          type: 'LIABILITY', category: 'Current Liability' },
    { code: '2200', name: 'Tax Payable',                type: 'LIABILITY', category: 'Current Liability' },
    { code: '2300', name: 'Salaries Payable',           type: 'LIABILITY', category: 'Current Liability' },
    { code: '3000', name: 'Retained Earnings',          type: 'EQUITY',    category: 'Equity' },
    { code: '3100', name: 'Organization Capital',       type: 'EQUITY',    category: 'Equity' },
    { code: '4000', name: 'Course Fees Revenue',        type: 'REVENUE',   category: 'Operating Revenue' },
    { code: '4100', name: 'Consultancy Revenue',        type: 'REVENUE',   category: 'Operating Revenue' },
    { code: '4200', name: 'E-Learning Revenue',         type: 'REVENUE',   category: 'Operating Revenue' },
    { code: '4300', name: 'Certification Fees',         type: 'REVENUE',   category: 'Operating Revenue' },
    { code: '4900', name: 'Other Income',               type: 'REVENUE',   category: 'Other Revenue' },
    { code: '5000', name: 'Salaries & Wages',           type: 'EXPENSE',   category: 'Personnel' },
    { code: '5100', name: 'Rent Expense',               type: 'EXPENSE',   category: 'Operating' },
    { code: '5200', name: 'Electricity',                type: 'EXPENSE',   category: 'Utilities' },
    { code: '5300', name: 'Internet',                   type: 'EXPENSE',   category: 'Utilities' },
    { code: '5400', name: 'Office Supplies',            type: 'EXPENSE',   category: 'Operating' },
    { code: '5500', name: 'Equipment Expense',          type: 'EXPENSE',   category: 'Operating' },
    { code: '5600', name: 'Marketing',                  type: 'EXPENSE',   category: 'Operating' },
    { code: '5700', name: 'Training Expense',           type: 'EXPENSE',   category: 'Operating' },
    { code: '5800', name: 'Bank Charges',               type: 'EXPENSE',   category: 'Financial' },
    { code: '5900', name: 'Tax Expense',                type: 'EXPENSE',   category: 'Financial' },
    { code: '5999', name: 'Miscellaneous Expense',      type: 'EXPENSE',   category: 'Operating' },
  ];

  for (const entry of coaEntries) {
    await prisma.chartOfAccount.upsert({
      where: { code: entry.code },
      update: {},
      create: { code: entry.code, name: entry.name, type: entry.type as any, category: entry.category },
    });
  }
  console.log('✅ Chart of accounts created');

  // ── Organization Settings ──────────────────────────────────────────────────

  const settings = [
    { key: 'org.name',                          value: 'Integrated Academy',  category: 'general' },
    { key: 'org.currency',                       value: 'RWF',                 category: 'finance' },
    { key: 'org.timezone',                       value: 'Africa/Kigali',       category: 'general' },
    { key: 'finance.paye_rate',                  value: '0.30',                category: 'finance',  description: 'PAYE tax rate (30%)' },
    { key: 'finance.pension_rate',               value: '0.03',                category: 'finance',  description: 'Pension contribution (3%)' },
    { key: 'finance.invoice_prefix',             value: 'INV',                 category: 'finance' },
    { key: 'finance.receipt_prefix',             value: 'RCP',                 category: 'finance' },
    { key: 'academy.partial_payment_lock_days',  value: '15',                  category: 'academy' },
    { key: 'academy.attendance_min_percent',     value: '70',                  category: 'academy',  description: 'Min attendance for certificate' },
    { key: 'academy.pass_mark',                  value: '50',                  category: 'academy' },
  ];

  for (const s of settings) {
    await prisma.organizationSettings.upsert({
      where: { key: s.key },
      update: {},
      create: s,
    });
  }
  console.log('✅ Organization settings created');

  // ── Done ───────────────────────────────────────────────────────────────────

  console.log('\n🎉 Database seeded successfully!');
  console.log('\n📋 Demo Credentials:');
  console.log('   Super Admin  : admin@academy.rw       / Admin@1234');
  console.log('   Finance      : finance@academy.rw     / Finance@1234');
  console.log('   Academy Mgr  : academy@academy.rw     / Academy@1234');
  console.log('   Instructor   : instructor@academy.rw  / Instructor@1234');
  console.log('   Student      : student@academy.rw     / Student@1234');
}

main()
  .catch((e) => { console.error('Seed error:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
