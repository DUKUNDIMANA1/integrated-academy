/**
 * TrusterLabs Academy — Course Seed
 * Integrates actual course catalogue from trusterlabsacademy.com
 */
import { PrismaClient, CourseType, CourseStatus } from '@prisma/client';
const prisma = new PrismaClient();

async function seedCourses() {
  console.log('🛡️  Seeding TrusterLabs Academy courses...');

  // ── Get instructor user ──────────────────────────────────────────────────
  const instructor = await prisma.user.findFirst({ where: { role: 'INSTRUCTOR' } });

  // ── Course catalogue ─────────────────────────────────────────────────────
  const courses = [
    // CYBERSECURITY
    {
      code: 'CS-APT-101',
      title: 'Advanced Penetration Testing',
      description: 'Master offensive security techniques including network pen testing, web application attacks, privilege escalation, and professional report writing. Hands-on labs using real-world environments.',
      category: 'Cybersecurity',
      type: CourseType.HYBRID,
      durationDays: 90,
      partialPaymentLockDays: 45,
      fee: 650000,
      currency: 'RWF',
      capacity: 20,
      status: CourseStatus.PUBLISHED,
    },
    {
      code: 'CS-SOC-201',
      title: 'Security Operations Center (SOC) Analyst',
      description: 'Build skills to monitor, detect, and respond to cyber threats. Covers SIEM tools, threat intelligence, log analysis, incident triage, and SOC workflows used by top enterprises.',
      category: 'Cybersecurity',
      type: CourseType.HYBRID,
      durationDays: 60,
      partialPaymentLockDays: 30,
      fee: 500000,
      currency: 'RWF',
      capacity: 25,
      status: CourseStatus.PUBLISHED,
    },
    {
      code: 'CS-IR-301',
      title: 'Incident Response & Threat Hunting',
      description: 'Learn to identify, contain, and remediate security incidents. Covers digital forensics, malware analysis, threat hunting methodologies, and incident response playbooks.',
      category: 'Cybersecurity',
      type: CourseType.HYBRID,
      durationDays: 45,
      partialPaymentLockDays: 22,
      fee: 450000,
      currency: 'RWF',
      capacity: 20,
      status: CourseStatus.PUBLISHED,
    },
    {
      code: 'CS-EH-401',
      title: 'Ethical Hacking Fundamentals',
      description: 'Introduction to ethical hacking concepts, tools and methodologies. Covers reconnaissance, scanning, enumeration, exploitation, and post-exploitation for beginners.',
      category: 'Cybersecurity',
      type: CourseType.ONLINE,
      durationDays: 30,
      partialPaymentLockDays: 15,
      fee: 250000,
      currency: 'RWF',
      capacity: 50,
      status: CourseStatus.PUBLISHED,
    },
    {
      code: 'CS-WEB-501',
      title: 'Web Application Security',
      description: 'Deep dive into OWASP Top 10, SQL injection, XSS, CSRF, authentication flaws, API security, and modern web app pentesting techniques with hands-on labs.',
      category: 'Cybersecurity',
      type: CourseType.ONLINE,
      durationDays: 45,
      partialPaymentLockDays: 22,
      fee: 350000,
      currency: 'RWF',
      capacity: 30,
      status: CourseStatus.PUBLISHED,
    },
    // NETWORKING
    {
      code: 'NET-CCNA-101',
      title: 'Cisco CCNA — Network Fundamentals',
      description: 'Comprehensive Cisco CCNA preparation covering network fundamentals, IP addressing, routing protocols, switching, VLANs, WAN technologies, and network security basics.',
      category: 'Networking',
      type: CourseType.HYBRID,
      durationDays: 60,
      partialPaymentLockDays: 30,
      fee: 400000,
      currency: 'RWF',
      capacity: 25,
      status: CourseStatus.PUBLISHED,
    },
    {
      code: 'NET-ADV-201',
      title: 'Advanced Network Security',
      description: 'Firewalls, IDS/IPS, VPNs, network segmentation, zero-trust architecture, and enterprise network defense strategies. Cisco and vendor-neutral content.',
      category: 'Networking',
      type: CourseType.HYBRID,
      durationDays: 45,
      partialPaymentLockDays: 22,
      fee: 380000,
      currency: 'RWF',
      capacity: 20,
      status: CourseStatus.PUBLISHED,
    },
    // PROGRAMMING
    {
      code: 'PRG-PY-101',
      title: 'Python for Security Professionals',
      description: 'Learn Python programming specifically for cybersecurity: scripting, automation, writing tools, parsing logs, network programming, and building security scripts.',
      category: 'Programming',
      type: CourseType.ONLINE,
      durationDays: 30,
      partialPaymentLockDays: 15,
      fee: 200000,
      currency: 'RWF',
      capacity: 40,
      status: CourseStatus.PUBLISHED,
    },
    {
      code: 'PRG-WD-201',
      title: 'Secure Web Development',
      description: 'Build secure applications from day one. Covers HTML, CSS, JavaScript, Node.js with security best practices, input validation, authentication, and OWASP secure coding guidelines.',
      category: 'Programming',
      type: CourseType.ONLINE,
      durationDays: 60,
      partialPaymentLockDays: 30,
      fee: 300000,
      currency: 'RWF',
      capacity: 35,
      status: CourseStatus.PUBLISHED,
    },
    // CLOUD COMPUTING
    {
      code: 'CLD-AWS-101',
      title: 'Cloud Security — AWS Fundamentals',
      description: 'Securing AWS cloud environments: IAM policies, S3 security, VPC configurations, CloudTrail, GuardDuty, and AWS security best practices for the African cloud market.',
      category: 'Cloud Computing',
      type: CourseType.ONLINE,
      durationDays: 30,
      partialPaymentLockDays: 15,
      fee: 280000,
      currency: 'RWF',
      capacity: 30,
      status: CourseStatus.PUBLISHED,
    },
    {
      code: 'CLD-DEVOPS-201',
      title: 'DevSecOps & Cloud Security',
      description: 'Integrate security into CI/CD pipelines, container security (Docker, Kubernetes), infrastructure-as-code security, and cloud-native security monitoring.',
      category: 'Cloud Computing',
      type: CourseType.ONLINE,
      durationDays: 45,
      partialPaymentLockDays: 22,
      fee: 350000,
      currency: 'RWF',
      capacity: 25,
      status: CourseStatus.PUBLISHED,
    },
    // AI & DATA SCIENCE
    {
      code: 'AI-ML-101',
      title: 'AI & Machine Learning for Cybersecurity',
      description: 'Apply machine learning to cybersecurity: anomaly detection, malware classification, threat prediction, NLP for log analysis, and building AI-powered security tools.',
      category: 'AI & Data Science',
      type: CourseType.ONLINE,
      durationDays: 45,
      partialPaymentLockDays: 22,
      fee: 380000,
      currency: 'RWF',
      capacity: 25,
      status: CourseStatus.PUBLISHED,
    },
    // CORPORATE TRAINING
    {
      code: 'CORP-SEC-101',
      title: 'Corporate Cybersecurity Awareness',
      description: 'Organization-wide security awareness training covering phishing, social engineering, data protection, password hygiene, and incident reporting for all staff levels.',
      category: 'Corporate Training',
      type: CourseType.CLASSROOM,
      durationDays: 5,
      partialPaymentLockDays: 3,
      fee: 150000,
      currency: 'RWF',
      capacity: 50,
      status: CourseStatus.PUBLISHED,
    },
    {
      code: 'CORP-CISO-201',
      title: 'CISO & Security Leadership',
      description: 'For security managers and executives: security governance, risk management frameworks, compliance (ISO 27001, GDPR), security strategy, and building security culture.',
      category: 'Corporate Training',
      type: CourseType.HYBRID,
      durationDays: 14,
      partialPaymentLockDays: 7,
      fee: 500000,
      currency: 'RWF',
      capacity: 15,
      status: CourseStatus.PUBLISHED,
    },
    // INTERNSHIP
    {
      code: 'INT-SEC-101',
      title: 'Cybersecurity Internship Program',
      description: '3-month hands-on internship at TrusterLabs. Work on real client projects under mentorship, gain SOC experience, and build your professional portfolio.',
      category: 'Internship Programs',
      type: CourseType.CLASSROOM,
      durationDays: 90,
      partialPaymentLockDays: 45,
      fee: 200000,
      currency: 'RWF',
      capacity: 10,
      status: CourseStatus.PUBLISHED,
    },
  ];

  let created = 0;
  let skipped = 0;

  for (const course of courses) {
    const existing = await prisma.course.findUnique({ where: { code: course.code } });
    if (existing) { skipped++; continue; }
    const created_course = await prisma.course.create({ data: course });

    // Add intro module to each course
    const module = await prisma.courseModule.create({
      data: {
        courseId: created_course.id,
        title: `Introduction to ${course.title}`,
        description: 'Course overview, learning objectives, and prerequisites.',
        order: 1,
      },
    });

    // Add intro lesson
    await prisma.lesson.create({
      data: {
        moduleId: module.id,
        title: 'Course Overview & Objectives',
        content: `Welcome to ${course.title}! In this lesson we cover what you will learn, tools needed, and how to make the most of this course.`,
        type: 'TEXT',
        order: 1,
        isProtected: false,
      },
    });

    // Create upcoming cohort for classroom/hybrid courses
    if (course.type !== CourseType.ONLINE) {
      await prisma.cohort.create({
        data: {
          courseId: created_course.id,
          name: `${course.title} — Cohort Oct 2026`,
          startDate: new Date('2026-10-01'),
          endDate: new Date(Date.now() + course.durationDays * 24 * 60 * 60 * 1000 + 30 * 24 * 60 * 60 * 1000),
          capacity: course.capacity,
          instructorId: instructor?.id,
          status: 'UPCOMING',
        },
      });
    }

    created++;
  }

  console.log(`✅ Courses: ${created} created, ${skipped} already existed`);

  // ── Update org settings with TrusterLabs branding ────────────────────────
  const orgSettings = [
    { key: 'org.name',     value: 'TrusterLabs Academy' },
    { key: 'org.email',    value: 'academic@trusterlabsacademy.com' },
    { key: 'org.phone',    value: '+250791756343' },
    { key: 'org.website',  value: 'https://trusterlabsacademy.com' },
    { key: 'org.tagline',  value: 'Cybersecurity Excellence | Built for Africa' },
    { key: 'org.currency', value: 'RWF' },
    { key: 'org.country',  value: 'Rwanda' },
  ];

  for (const s of orgSettings) {
    await prisma.organizationSettings.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: { key: s.key, value: s.value, category: 'general' },
    });
  }
  console.log('✅ Organization settings updated for TrusterLabs');

  // ── Add departments matching TrusterLabs structure ───────────────────────
  const departments = [
    { name: 'Cybersecurity Training',  description: 'Penetration testing and offensive security training' },
    { name: 'SOC Operations',          description: 'Security Operations Center team' },
    { name: 'Incident Response',       description: 'IR and threat hunting specialists' },
    { name: 'Cloud Security',          description: 'Cloud and DevSecOps training' },
    { name: 'Research & Development',  description: 'Threat intelligence and research publications' },
    { name: 'Corporate Training',      description: 'Enterprise and corporate training delivery' },
    { name: 'Academic Operations',     description: 'Admissions, enrollment, student affairs' },
    { name: 'Finance & Admin',         description: 'Finance, billing, administration' },
  ];

  for (const dept of departments) {
    await prisma.department.upsert({
      where: { name: dept.name },
      update: {},
      create: dept,
    });
  }
  console.log('✅ TrusterLabs departments created');

  console.log('\n🎉 TrusterLabs Academy integration complete!');
  console.log(`   Total courses seeded: ${created}`);
}

seedCourses()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
