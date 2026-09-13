import { ApplicationStatus } from '@prisma/client';

export interface CreateApplicationDto {
  courseId: string;
  cohortId?: string;
  educationBackground?: string;
  workExperience?: string;
  motivation?: string;
  documents?: Record<string, string>;
}

export interface UpdateStudentProfileDto {
  dateOfBirth?: string;
  gender?: string;
  nationality?: string;
  address?: string;
  emergencyContact?: string;
  educationLevel?: string;
  occupation?: string;
}

export interface ReviewApplicationDto {
  status: ApplicationStatus;
  rejectionReason?: string;
}

export interface CreateSupportTicketDto {
  category: string;
  priority?: string;
  subject: string;
  description: string;
  attachments?: string[];
}

export interface TicketResponseDto {
  message: string;
  isInternal?: boolean;
  attachments?: string[];
}
