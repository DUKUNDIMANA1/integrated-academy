import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';

export class ELearningService {
  async getCourseContent(courseId: string, studentId?: string) {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        modules: {
          orderBy: { order: 'asc' },
          include: {
            lessons: { orderBy: { order: 'asc' } },
            assessments: { where: { isPublished: true } },
          },
        },
      },
    });
    if (!course) throw new AppError('Course not found', 404);
    return course;
  }

  async getStudentProgress(enrollmentId: string) {
    return prisma.lessonProgress.findMany({
      where: { enrollmentId },
      include: { lesson: { select: { title: true, moduleId: true } } },
    });
  }

  async updateProgress(enrollmentId: string, lessonId: string, timeSpent = 0) {
    await prisma.lessonProgress.upsert({
      where: { enrollmentId_lessonId: { enrollmentId, lessonId } },
      update: { isCompleted: true, completedAt: new Date(), timeSpent },
      create: { enrollmentId, lessonId, isCompleted: true, completedAt: new Date(), timeSpent },
    });

    // Recalculate and update enrollment progress percentage
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: { course: { include: { modules: { include: { lessons: true } } } } },
    });
    if (enrollment) {
      const totalLessons = enrollment.course.modules.reduce(
        (sum, m) => sum + m.lessons.length, 0
      );
      if (totalLessons > 0) {
        const completed = await prisma.lessonProgress.count({
          where: { enrollmentId, isCompleted: true },
        });
        const percent = Math.min(100, Math.round((completed / totalLessons) * 100));
        await prisma.enrollment.update({
          where: { id: enrollmentId },
          data: { progressPercent: percent },
        });
      }
    }
  }
}

export default new ELearningService();
