import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';

export class StudentService {
  async getStudentByUserId(userId: string) {
    const student = await prisma.student.findUnique({ where: { userId } });
    if (!student) throw new AppError('Student profile not found', 404);
    return student;
  }

  async updateStudentProfile(studentId: string, data: {
    dateOfBirth?: Date; gender?: string; nationality?: string;
    address?: string; emergencyContact?: string; educationLevel?: string; occupation?: string;
  }) {
    return prisma.student.update({ where: { id: studentId }, data });
  }
}

export default new StudentService();
