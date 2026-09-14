import prisma from '../config/database';
import { generateCertificateNumber, generateVerificationCode } from '../utils/generators';
import { generateCertificatePDF } from '../utils/pdfGenerator';
import path from 'path';
import fs from 'fs';
import { ensureUploadSubdir } from '../utils/fileUpload';
import { env } from '../config/env';

export class CertificateService {
  async issueCertificateAfterFinalExam(studentId: string, assessmentId: string, issuedBy?: string) {
    const assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId },
      include: { module: { select: { courseId: true } } },
    });
    if (!assessment || assessment.type !== 'EXAM') return null;

    const submission = await prisma.assessmentSubmission.findFirst({
      where: { assessmentId, studentId, status: 'GRADED' },
      orderBy: [{ score: 'desc' }, { gradedAt: 'desc' }],
      select: { score: true },
    });
    if (!submission?.score || Number(submission.score) < assessment.passMark) return null;

    const enrollment = await prisma.enrollment.findFirst({
      where: { studentId, courseId: assessment.module.courseId, accessStatus: { not: 'CANCELLED' } },
    });
    if (!enrollment) return null;

    return this.issueCertificate(studentId, assessment.module.courseId, enrollment.id, issuedBy);
  }

  async issueCertificate(studentId: string, courseId: string, enrollmentId: string, issuedBy?: string) {
    const existing = await prisma.certificate.findFirst({ where: { enrollmentId } });
    if (existing) return existing;

    const certificate = await prisma.certificate.create({
      data: {
        certificateNumber: generateCertificateNumber(),
        studentId,
        courseId,
        enrollmentId,
        verificationCode: generateVerificationCode(),
        issuedBy,
      },
    });

    const [student, course, branding, supervisorSetting, managerSetting, supervisorTitleSetting, managerTitleSetting] = await Promise.all([
      prisma.student.findUnique({ where: { id: studentId }, include: { user: { select: { firstName: true, lastName: true } } } }),
      prisma.course.findUnique({ where: { id: courseId }, select: { title: true } }),
      prisma.organizationSettings.findUnique({ where: { key: 'branding.logo' }, select: { value: true } }),
      prisma.organizationSettings.findUnique({ where: { key: 'certificate.supervisorName' }, select: { value: true } }),
      prisma.organizationSettings.findUnique({ where: { key: 'certificate.managerName' }, select: { value: true } }),
      prisma.organizationSettings.findUnique({ where: { key: 'certificate.supervisorTitle' }, select: { value: true } }),
      prisma.organizationSettings.findUnique({ where: { key: 'certificate.managerTitle' }, select: { value: true } }),
    ]);
    if (!student || !course) return certificate;

    const logoPath = branding?.value?.startsWith('/uploads/')
      ? path.join(process.cwd(), branding.value.replace(/^\/+/, ''))
      : undefined;
    const pdf = await generateCertificatePDF({
      certificateNumber: certificate.certificateNumber,
      studentName: `${student.user.firstName} ${student.user.lastName}`,
      courseName: course.title,
      issuedAt: certificate.issuedAt,
      verificationCode: certificate.verificationCode,
      verificationUrl: `${env.FRONTEND_URL}/verify/${certificate.verificationCode}`,
      logoPath,
      providerName: 'TrusterLabs Academy',
      programName: 'TrusterLabs Academy',
      supervisorName: supervisorSetting?.value || 'Academy Director',
      supervisorTitle: supervisorTitleSetting?.value || 'Supervisor',
      managerName: managerSetting?.value || 'Program Manager',
      managerTitle: managerTitleSetting?.value || 'Manager',
    });
    const directory = ensureUploadSubdir('certificates');
    const filename = `${certificate.certificateNumber}.pdf`;
    fs.writeFileSync(path.join(directory, filename), pdf);
    return prisma.certificate.update({
      where: { id: certificate.id },
      data: { fileUrl: `/uploads/certificates/${filename}` },
    });
  }

  async verifyCertificate(code: string) {
    return prisma.certificate.findFirst({
      where: { verificationCode: code },
      include: {
        student: { include: { user: { select: { firstName: true, lastName: true } } } },
      },
    });
  }

  async getStudentCertificates(studentId: string) {
    return prisma.certificate.findMany({
      where: { studentId },
      orderBy: { issuedAt: 'desc' },
    });
  }

  async revokeCertificate(id: string, reason: string) {
    return prisma.certificate.update({
      where: { id },
      data: { status: 'REVOKED', revokedAt: new Date(), revokeReason: reason },
    });
  }
}

export default new CertificateService();
