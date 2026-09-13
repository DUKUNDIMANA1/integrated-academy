import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { CourseType, CourseStatus, CohortStatus, AttendanceStatus, LessonType } from '@prisma/client';
import certificateService from './certificate.service';

export class AcademyService {
  // ── COURSES ──────────────────────────────────────────────────────────────────

  async getCourses(page = 1, limit = 20, filters: { status?: CourseStatus; type?: CourseType; search?: string } = {}) {
    const skip = (page - 1) * limit;
    const where: Record<string, unknown> = {};
    if (filters.status) where.status = filters.status;
    if (filters.type) where.type = filters.type;
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { code: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        where, skip, take: limit, orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { enrollments: true, applications: true, cohorts: true } },
        },
      }),
      prisma.course.count({ where }),
    ]);
    return { courses, total };
  }

  async getCourseById(id: string) {
    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        modules: { include: { lessons: true, assessments: true }, orderBy: { order: 'asc' } },
        cohorts: true,
        _count: { select: { enrollments: true } },
      },
    });
    if (!course) throw new AppError('Course not found', 404);
    return course;
  }

  async createCourse(data: {
    code: string; title: string; description?: string; category?: string;
    type?: CourseType; durationDays?: number; partialPaymentLockDays?: number;
    fee: number; currency?: string; capacity?: number; prerequisites?: string;
    startDate?: Date; endDate?: Date;
  }) {
    return prisma.course.create({ data });
  }

  async updateCourse(id: string, data: Partial<{
    title: string; description: string; category: string; type: CourseType;
    durationDays: number; partialPaymentLockDays: number; fee: number; capacity: number;
    prerequisites: string; startDate: Date; endDate: Date; status: CourseStatus;
  }>) {
    const course = await prisma.course.findUnique({ where: { id } });
    if (!course) throw new AppError('Course not found', 404);
    return prisma.course.update({ where: { id }, data });
  }

  async deleteCourse(id: string) {
    const enrollments = await prisma.enrollment.count({ where: { courseId: id } });
    if (enrollments > 0) throw new AppError('Cannot delete course with active enrollments', 400);
    return prisma.course.delete({ where: { id } });
  }

  // ── MODULES & LESSONS ────────────────────────────────────────────────────────

  async createModule(courseId: string, data: { title: string; description?: string; order: number }) {
    return prisma.courseModule.create({ data: { courseId, ...data } });
  }

  async updateModule(id: string, data: { title?: string; description?: string; order?: number }) {
    return prisma.courseModule.update({ where: { id }, data });
  }

  async deleteModule(id: string) {
    return prisma.courseModule.delete({ where: { id } });
  }

  async createLesson(moduleId: string, data: {
    title: string; content?: string; type?: string; fileUrl?: string;
    videoUrl?: string; duration?: number; order: number; isProtected?: boolean;
  }) {
    return prisma.lesson.create({
      data: {
        moduleId,
        title: data.title,
        content: data.content,
        type: (data.type as any) || 'TEXT',
        fileUrl: data.fileUrl,
        videoUrl: data.videoUrl,
        duration: data.duration,
        order: data.order,
        isProtected: data.isProtected ?? true,
      },
    });
  }

  async updateLesson(id: string, data: Partial<{ title: string; content: string; type: LessonType; fileUrl: string; videoUrl: string; duration: number; order: number; isProtected: boolean }>) {
    return prisma.lesson.update({ where: { id }, data });
  }

  async deleteLesson(id: string) {
    return prisma.lesson.delete({ where: { id } });
  }

  // ── COHORTS ───────────────────────────────────────────────────────────────────

  async getCohorts(courseId?: string) {
    const where: Record<string, unknown> = {};
    if (courseId) where.courseId = courseId;
    return prisma.cohort.findMany({
      where, orderBy: { startDate: 'asc' },
      include: {
        course: { select: { title: true, code: true } },
        _count: { select: { enrollments: true } },
      },
    });
  }

  async createCohort(data: {
    courseId: string; name: string; startDate: Date; endDate: Date;
    capacity?: number; instructorId?: string;
  }) {
    return prisma.cohort.create({ data });
  }

  async updateCohort(id: string, data: Partial<{
    name: string; startDate: Date; endDate: Date; capacity: number;
    instructorId: string; status: CohortStatus;
  }>) {
    return prisma.cohort.update({ where: { id }, data });
  }

  async deleteCohort(id: string) {
    const enrollments = await prisma.enrollment.count({ where: { cohortId: id } });
    if (enrollments > 0) throw new AppError('Cannot delete cohort with active enrollments', 400);
    return prisma.cohort.delete({ where: { id } });
  }

  // ── CLASS SCHEDULES ───────────────────────────────────────────────────────────

  async getSchedules(cohortId: string) {
    return prisma.classSchedule.findMany({
      where: { cohortId },
      orderBy: { dayOfWeek: 'asc' },
    });
  }

  async createSchedule(cohortId: string, data: {
    dayOfWeek: number; startTime: string; endTime: string; classroom?: string;
  }) {
    return prisma.classSchedule.create({ data: { cohortId, ...data } });
  }

  async updateSchedule(id: string, data: Partial<{
    dayOfWeek: number; startTime: string; endTime: string; classroom: string;
  }>) {
    return prisma.classSchedule.update({ where: { id }, data });
  }

  async deleteSchedule(id: string) {
    return prisma.classSchedule.delete({ where: { id } });
  }

  // ── CERTIFICATES (management) ─────────────────────────────────────────────────

  async getCertificates(filters: { studentId?: string; courseId?: string; status?: string } = {}) {
    return prisma.certificate.findMany({
      where: {
        ...(filters.studentId && { studentId: filters.studentId }),
        ...(filters.courseId  && { courseId:  filters.courseId  }),
        ...(filters.status    && { status: filters.status as any }),
      },
      include: {
        student: { include: { user: { select: { firstName: true, lastName: true, email: true } } } },
      },
      orderBy: { issuedAt: 'desc' },
    });
  }

  async revokeCertificate(id: string, reason: string, revokedBy: string) {
    const cert = await prisma.certificate.findUnique({ where: { id } });
    if (!cert) throw new AppError('Certificate not found', 404);
    return prisma.certificate.update({
      where: { id },
      data: { status: 'REVOKED', revokedAt: new Date(), revokeReason: reason },
    });
  }

  // ── ATTENDANCE ────────────────────────────────────────────────────────────────

  async getAttendance(cohortId?: string, enrollmentId?: string, date?: Date) {
    const where: Record<string, unknown> = {};
    if (cohortId) where.cohortId = cohortId;
    if (enrollmentId) where.enrollmentId = enrollmentId;
    if (date) {
      const start = new Date(date); start.setHours(0, 0, 0, 0);
      const end = new Date(date); end.setHours(23, 59, 59, 999);
      where.date = { gte: start, lte: end };
    }
    return prisma.attendance.findMany({
      where, orderBy: { date: 'desc' },
      include: {
        student: { include: { user: { select: { firstName: true, lastName: true } } } },
        cohort: { select: { name: true } },
      },
    });
  }

  async recordAttendance(data: Array<{
    enrollmentId: string; studentId: string; cohortId?: string;
    date: Date; status: AttendanceStatus; notes?: string; recordedBy?: string;
  }>) {
    // For each record, find an existing attendance for the same enrollment+date
    // and update it, or create a new one. Prisma has no unique constraint on this
    // combination so we do it manually to avoid duplicate records.
    const results = await Promise.all(
      data.map(async (record) => {
        const dateStart = new Date(record.date); dateStart.setHours(0, 0, 0, 0);
        const dateEnd   = new Date(record.date); dateEnd.setHours(23, 59, 59, 999);
        const existing = await prisma.attendance.findFirst({
          where: {
            enrollmentId: record.enrollmentId,
            date: { gte: dateStart, lte: dateEnd },
          },
        });
        if (existing) {
          return prisma.attendance.update({
            where: { id: existing.id },
            data: { status: record.status, notes: record.notes, recordedBy: record.recordedBy },
          });
        }
        return prisma.attendance.create({ data: record });
      })
    );
    return results;
  }

  async getAttendanceReport(cohortId: string) {
    const attendances = await prisma.attendance.findMany({
      where: { cohortId },
      include: { student: { include: { user: { select: { firstName: true, lastName: true } } } } },
    });

    const stats: Record<string, { present: number; absent: number; late: number; excused: number; total: number }> = {};
    for (const a of attendances) {
      if (!stats[a.studentId]) stats[a.studentId] = { present: 0, absent: 0, late: 0, excused: 0, total: 0 };
      stats[a.studentId].total++;
      stats[a.studentId][a.status.toLowerCase() as 'present' | 'absent' | 'late' | 'excused']++;
    }

    return Object.entries(stats).map(([studentId, counts]) => ({
      studentId,
      ...counts,
      attendanceRate: Math.round((counts.present / counts.total) * 100),
    }));
  }

  // ── ASSESSMENTS ───────────────────────────────────────────────────────────────

  async createAssessment(moduleId: string, data: {
    title: string; type: 'QUIZ' | 'ASSIGNMENT' | 'EXAM' | 'PROJECT';
    description?: string; totalMarks?: number; passMark?: number; duration?: number;
    attempts?: number; dueDate?: Date; isPublished?: boolean; attachmentUrl?: string;
  }) {
    return prisma.assessment.create({ data: { moduleId, ...data } });
  }

  async getAssessmentsByModule(moduleId: string) {
    return prisma.assessment.findMany({
      where: { moduleId },
      include: { _count: { select: { questions: true, submissions: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getAssessmentById(id: string, includeAnswers = true) {
    const assessment = await prisma.assessment.findUnique({
      where: { id },
      include: {
        questions: { orderBy: { order: 'asc' } },
        module: { include: { course: { select: { id: true, title: true, code: true } } } },
        _count: { select: { submissions: true } },
      },
    });
    if (!assessment) throw new AppError('Assessment not found', 404);
    if (!includeAnswers) {
      // Hide correct answers when serving to students
      return {
        ...assessment,
        questions: assessment.questions.map((q) => ({ ...q, correctAnswer: null })),
      };
    }
    return assessment;
  }

  async updateAssessment(id: string, data: Partial<{
    title: string; type: 'QUIZ' | 'ASSIGNMENT' | 'EXAM' | 'PROJECT';
    description: string; totalMarks: number; passMark: number; duration: number;
    attempts: number; dueDate: Date; isPublished: boolean; attachmentUrl: string;
  }>) {
    const existing = await prisma.assessment.findUnique({ where: { id } });
    if (!existing) throw new AppError('Assessment not found', 404);
    return prisma.assessment.update({ where: { id }, data });
  }

  async deleteAssessment(id: string) {
    const existing = await prisma.assessment.findUnique({ where: { id } });
    if (!existing) throw new AppError('Assessment not found', 404);
    return prisma.assessment.delete({ where: { id } });
  }

  async publishAssessment(id: string, isPublished: boolean) {
    return prisma.assessment.update({ where: { id }, data: { isPublished } });
  }

  // ── QUESTIONS ────────────────────────────────────────────────────────────────

  async createQuestion(assessmentId: string, data: {
    text: string; type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER' | 'ESSAY' | 'FILE_UPLOAD';
    options?: unknown; correctAnswer?: string; marks?: number; order?: number;
  }) {
    const count = await prisma.question.count({ where: { assessmentId } });
    const { order, options, ...rest } = data;
    return prisma.question.create({
      data: { assessmentId, ...rest, options: options as any ?? null, order: order ?? count + 1 },
    });
  }

  async updateQuestion(id: string, data: Partial<{
    text: string; type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER' | 'ESSAY' | 'FILE_UPLOAD';
    options: unknown; correctAnswer: string; marks: number; order: number;
  }>) {
    const { options, ...rest } = data;
    return prisma.question.update({ where: { id }, data: { ...rest, ...(options !== undefined && { options: options as any }) } });
  }

  async deleteQuestion(id: string) {
    return prisma.question.delete({ where: { id } });
  }

  // ── SUBMISSIONS + AUTO-GRADING ───────────────────────────────────────────────

  /**
   * Auto-grade objective question types (MULTIPLE_CHOICE, TRUE_FALSE).
   * Returns { score, needsManualGrading }.
   * answers format: { [questionId]: string } or { [questionId]: { value: string } }
   */
  async submitAssessmentWithGrading(assessmentId: string, studentId: string, rawAnswers: Record<string, unknown>, fileUrl?: string) {
    const assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId },
      include: { questions: true },
    });
    if (!assessment) throw new AppError('Assessment not found', 404);

    const attemptsUsed = await prisma.assessmentSubmission.count({ where: { assessmentId, studentId } });
    if (attemptsUsed >= assessment.attempts) throw new AppError('Maximum attempts exceeded', 400);

    let autoScore = 0;
    let needsManual = false;

    for (const q of assessment.questions) {
      const raw = rawAnswers[q.id];
      const given = typeof raw === 'object' && raw !== null && 'value' in (raw as object)
        ? String((raw as { value: unknown }).value ?? '').trim()
        : String(raw ?? '').trim();
      if (q.type === 'MULTIPLE_CHOICE' || q.type === 'TRUE_FALSE') {
        if (given && q.correctAnswer && given.toLowerCase() === q.correctAnswer.trim().toLowerCase()) {
          autoScore += q.marks;
        }
      } else {
        // SHORT_ANSWER: award marks only on exact (case-insensitive) match if a key exists,
        // otherwise require manual grading.
        if (q.correctAnswer && given && given.toLowerCase() === q.correctAnswer.trim().toLowerCase()) {
          autoScore += q.marks;
        } else if (given) {
          needsManual = true;
        }
        if (q.type === 'ESSAY' || q.type === 'FILE_UPLOAD') needsManual = true;
      }
    }

    if (assessment.questions.length === 0) needsManual = true;

    const isFullyAuto = !needsManual;
    const submission = await prisma.assessmentSubmission.create({
      data: {
        assessmentId,
        studentId,
        answers: rawAnswers as object,
        fileUrl,
        attemptNumber: attemptsUsed + 1,
        score: isFullyAuto ? autoScore : null,
        status: isFullyAuto ? 'GRADED' : 'SUBMITTED',
        gradedAt: isFullyAuto ? new Date() : null,
      },
    });
    return { submission, autoScore, needsManualGrading: needsManual };
  }

  async getAssessmentSubmissions(assessmentId: string) {
    return prisma.assessmentSubmission.findMany({
      where: { assessmentId },
      include: { assessment: { select: { title: true, totalMarks: true } } },
    });
  }

  async gradeSubmission(submissionId: string, score: number, feedback: string, gradedBy: string) {
    const submission = await prisma.assessmentSubmission.update({
      where: { id: submissionId },
      data: { score, feedback, status: 'GRADED', gradedBy, gradedAt: new Date() },
    });
    const certificate = await certificateService.issueCertificateAfterFinalExam(
      submission.studentId,
      submission.assessmentId,
      gradedBy,
    );
    return { submission, certificate };
  }

  // ── CERTIFICATES ──────────────────────────────────────────────────────────────

  async issueCertificate(studentId: string, courseId: string, enrollmentId: string, issuedBy?: string) {
    const { generateCertificateNumber, generateVerificationCode } = await import('../utils/generators');
    return prisma.certificate.create({
      data: {
        certificateNumber: generateCertificateNumber(),
        studentId,
        courseId,
        enrollmentId,
        verificationCode: generateVerificationCode(),
        verificationUrl: `/verify/`,
        issuedBy,
      },
    });
  }

  async verifyCertificate(code: string) {
    const certificate = await prisma.certificate.findFirst({
      where: { verificationCode: code },
      include: {
        student: { include: { user: { select: { firstName: true, lastName: true } } } },
      },
    });
    if (!certificate) return null;
    const course = await prisma.course.findUnique({
      where: { id: certificate.courseId },
      select: { id: true, code: true, title: true, description: true, type: true, status: true },
    });
    return { ...certificate, course };
  }
}

export default new AcademyService();
