import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { sendSuccess, sendCreated, sendNotFound } from '../utils/response';
import academyService from '../services/academy.service';

// ── COURSES ───────────────────────────────────────────────────────────────────

export const getCourses = async (req: AuthRequest, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const result = await academyService.getCourses(page, limit, {
    status: req.query.status as any,
    type: req.query.type as any,
    search: req.query.search as string,
  });
  sendSuccess(res, result.courses, 'Courses retrieved', 200, { total: result.total, page, limit });
};

export const getPublicCourses = async (req: AuthRequest, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const result = await academyService.getCourses(page, limit, {
    status: 'PUBLISHED',
    type: req.query.type as any,
    search: req.query.search as string,
  });
  sendSuccess(res, result.courses, 'Courses retrieved', 200, { total: result.total, page, limit });
};

export const getCourseById = async (req: AuthRequest, res: Response): Promise<void> => {
  const course = await academyService.getCourseById(req.params.id);
  sendSuccess(res, course);
};

export const createCourse = async (req: AuthRequest, res: Response): Promise<void> => {
  const course = await academyService.createCourse(req.body);
  sendCreated(res, course, 'Course created');
};

export const updateCourse = async (req: AuthRequest, res: Response): Promise<void> => {
  const course = await academyService.updateCourse(req.params.id, req.body);
  sendSuccess(res, course, 'Course updated');
};

export const deleteCourse = async (req: AuthRequest, res: Response): Promise<void> => {
  await academyService.deleteCourse(req.params.id);
  sendSuccess(res, null, 'Course deleted');
};

// ── MODULES ───────────────────────────────────────────────────────────────────

export const createModule = async (req: AuthRequest, res: Response): Promise<void> => {
  const mod = await academyService.createModule(req.params.courseId, req.body);
  sendCreated(res, mod, 'Module created');
};

export const updateModule = async (req: AuthRequest, res: Response): Promise<void> => {
  const mod = await academyService.updateModule(req.params.id, req.body);
  sendSuccess(res, mod, 'Module updated');
};

export const deleteModule = async (req: AuthRequest, res: Response): Promise<void> => {
  await academyService.deleteModule(req.params.id);
  sendSuccess(res, null, 'Module deleted');
};

// ── LESSONS ───────────────────────────────────────────────────────────────────

export const createLesson = async (req: AuthRequest, res: Response): Promise<void> => {
  const lesson = await academyService.createLesson(req.params.moduleId, req.body);
  sendCreated(res, lesson, 'Lesson created');
};

export const updateLesson = async (req: AuthRequest, res: Response): Promise<void> => {
  const lesson = await academyService.updateLesson(req.params.id, req.body);
  sendSuccess(res, lesson, 'Lesson updated');
};

export const deleteLesson = async (req: AuthRequest, res: Response): Promise<void> => {
  await academyService.deleteLesson(req.params.id);
  sendSuccess(res, null, 'Lesson deleted');
};

// ── COHORTS ───────────────────────────────────────────────────────────────────

export const getCohorts = async (req: AuthRequest, res: Response): Promise<void> => {
  const cohorts = await academyService.getCohorts(req.query.courseId as string);
  sendSuccess(res, cohorts);
};

export const createCohort = async (req: AuthRequest, res: Response): Promise<void> => {
  const cohort = await academyService.createCohort(req.body);
  sendCreated(res, cohort, 'Cohort created');
};

export const updateCohort = async (req: AuthRequest, res: Response): Promise<void> => {
  const cohort = await academyService.updateCohort(req.params.id, req.body);
  sendSuccess(res, cohort, 'Cohort updated');
};

// ── ATTENDANCE ────────────────────────────────────────────────────────────────

export const getAttendance = async (req: AuthRequest, res: Response): Promise<void> => {
  const date = req.query.date ? new Date(req.query.date as string) : undefined;
  const attendance = await academyService.getAttendance(
    req.query.cohortId as string,
    req.query.enrollmentId as string,
    date
  );
  sendSuccess(res, attendance);
};

export const recordAttendance = async (req: AuthRequest, res: Response): Promise<void> => {
  const records = Array.isArray(req.body) ? req.body : [req.body];
  const result = await academyService.recordAttendance(
    records.map((r: any) => ({ ...r, recordedBy: req.user!.userId }))
  );
  sendSuccess(res, result, 'Attendance recorded');
};

export const getAttendanceReport = async (req: AuthRequest, res: Response): Promise<void> => {
  const report = await academyService.getAttendanceReport(req.params.cohortId);
  sendSuccess(res, report);
};

// ── ASSESSMENTS ───────────────────────────────────────────────────────────────

export const getAssessmentsByModule = async (req: AuthRequest, res: Response): Promise<void> => {
  const list = await academyService.getAssessmentsByModule(req.params.moduleId);
  sendSuccess(res, list);
};

export const getAssessmentById = async (req: AuthRequest, res: Response): Promise<void> => {
  const item = await academyService.getAssessmentById(req.params.id, true);
  sendSuccess(res, item);
};

export const createAssessment = async (req: AuthRequest, res: Response): Promise<void> => {
  const assessment = await academyService.createAssessment(req.params.moduleId, req.body);
  sendCreated(res, assessment, 'Assessment created');
};

export const updateAssessment = async (req: AuthRequest, res: Response): Promise<void> => {
  const item = await academyService.updateAssessment(req.params.id, req.body);
  sendSuccess(res, item, 'Assessment updated');
};

export const deleteAssessment = async (req: AuthRequest, res: Response): Promise<void> => {
  await academyService.deleteAssessment(req.params.id);
  sendSuccess(res, null, 'Assessment deleted');
};

export const publishAssessment = async (req: AuthRequest, res: Response): Promise<void> => {
  const { isPublished } = req.body;
  const item = await academyService.publishAssessment(req.params.id, isPublished !== false);
  sendSuccess(res, item, isPublished !== false ? 'Assessment published' : 'Assessment unpublished');
};

// ── QUESTIONS ─────────────────────────────────────────────────────────────────

export const createQuestion = async (req: AuthRequest, res: Response): Promise<void> => {
  const q = await academyService.createQuestion(req.params.assessmentId, req.body);
  sendCreated(res, q, 'Question added');
};

export const updateQuestion = async (req: AuthRequest, res: Response): Promise<void> => {
  const q = await academyService.updateQuestion(req.params.id, req.body);
  sendSuccess(res, q, 'Question updated');
};

export const deleteQuestion = async (req: AuthRequest, res: Response): Promise<void> => {
  await academyService.deleteQuestion(req.params.id);
  sendSuccess(res, null, 'Question deleted');
};

export const getSubmissions = async (req: AuthRequest, res: Response): Promise<void> => {
  const submissions = await academyService.getAssessmentSubmissions(req.params.assessmentId);
  sendSuccess(res, submissions);
};

export const gradeSubmission = async (req: AuthRequest, res: Response): Promise<void> => {
  const { score, feedback } = req.body;
  const submission = await academyService.gradeSubmission(req.params.id, score, feedback, req.user!.userId);
  sendSuccess(res, submission, 'Submission graded');
};

export const deleteCohort = async (req: AuthRequest, res: Response): Promise<void> => {
  await academyService.deleteCohort(req.params.id);
  sendSuccess(res, null, 'Cohort deleted');
};

// ── CLASS SCHEDULES ───────────────────────────────────────────────────────────

export const getSchedules = async (req: AuthRequest, res: Response): Promise<void> => {
  const schedules = await academyService.getSchedules(req.params.cohortId);
  sendSuccess(res, schedules);
};

export const createSchedule = async (req: AuthRequest, res: Response): Promise<void> => {
  const schedule = await academyService.createSchedule(req.params.cohortId, req.body);
  sendCreated(res, schedule, 'Schedule created');
};

export const updateSchedule = async (req: AuthRequest, res: Response): Promise<void> => {
  const schedule = await academyService.updateSchedule(req.params.id, req.body);
  sendSuccess(res, schedule, 'Schedule updated');
};

export const deleteSchedule = async (req: AuthRequest, res: Response): Promise<void> => {
  await academyService.deleteSchedule(req.params.id);
  sendSuccess(res, null, 'Schedule deleted');
};

// ── CERTIFICATES (management) ──────────────────────────────────────────────────

export const getCertificates = async (req: AuthRequest, res: Response): Promise<void> => {
  const certs = await academyService.getCertificates({
    studentId: req.query.studentId as string,
    courseId:  req.query.courseId  as string,
    status:    req.query.status    as string,
  });
  sendSuccess(res, certs);
};

export const revokeCertificate = async (req: AuthRequest, res: Response): Promise<void> => {
  const { reason } = req.body;
  const cert = await academyService.revokeCertificate(req.params.id, reason, req.user!.userId);
  sendSuccess(res, cert, 'Certificate revoked');
};

// ── CERTIFICATES ──────────────────────────────────────────────────────────────

export const issueCertificate = async (req: AuthRequest, res: Response): Promise<void> => {
  const { studentId, courseId, enrollmentId } = req.body;
  const cert = await academyService.issueCertificate(studentId, courseId, enrollmentId, req.user!.userId);
  sendCreated(res, cert, 'Certificate issued');
};

export const verifyCertificate = async (req: AuthRequest, res: Response): Promise<void> => {
  const cert = await academyService.verifyCertificate(req.params.code);
  if (!cert) { sendNotFound(res, 'Certificate not found or invalid'); return; }
  sendSuccess(res, cert);
};
