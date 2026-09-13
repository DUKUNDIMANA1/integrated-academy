import { Router } from 'express';
import * as academyController from '../controllers/academy.controller';
import { authenticate, optionalAuth } from '../middleware/auth';
import { authorize } from '../middleware/rbac';
import { Role } from '@prisma/client';

const router = Router();

const academyRoles = [Role.SUPER_ADMIN, Role.GENERAL_MANAGER, Role.ACADEMY_MANAGER, Role.ELEARNING_MANAGER];
const instructorRoles = [...academyRoles, Role.INSTRUCTOR];

// Public
router.get('/public/courses', optionalAuth, academyController.getPublicCourses);
router.get('/public/courses/:id', optionalAuth, academyController.getCourseById);
router.get('/certificates/verify/:code', academyController.verifyCertificate);

router.use(authenticate);

// Courses
router.get('/courses', academyController.getCourses);
router.get('/courses/:id', academyController.getCourseById);
router.post('/courses', authorize(...academyRoles), academyController.createCourse);
router.put('/courses/:id', authorize(...academyRoles), academyController.updateCourse);
router.delete('/courses/:id', authorize(Role.SUPER_ADMIN, Role.ACADEMY_MANAGER), academyController.deleteCourse);

// Modules
router.post('/courses/:courseId/modules', authorize(...instructorRoles), academyController.createModule);
router.put('/modules/:id', authorize(...instructorRoles), academyController.updateModule);
router.delete('/modules/:id', authorize(...instructorRoles), academyController.deleteModule);

// Lessons
router.post('/modules/:moduleId/lessons', authorize(...instructorRoles), academyController.createLesson);
router.put('/lessons/:id', authorize(...instructorRoles), academyController.updateLesson);
router.delete('/lessons/:id', authorize(...instructorRoles), academyController.deleteLesson);

// Cohorts
router.get('/cohorts', academyController.getCohorts);
router.post('/cohorts', authorize(...academyRoles), academyController.createCohort);
router.put('/cohorts/:id', authorize(...academyRoles), academyController.updateCohort);
router.delete('/cohorts/:id', authorize(...academyRoles), academyController.deleteCohort);

// Class Schedules
router.get('/cohorts/:cohortId/schedules', authorize(...instructorRoles), academyController.getSchedules);
router.post('/cohorts/:cohortId/schedules', authorize(...academyRoles), academyController.createSchedule);
router.put('/schedules/:id', authorize(...academyRoles), academyController.updateSchedule);
router.delete('/schedules/:id', authorize(...academyRoles), academyController.deleteSchedule);

// Attendance
router.get('/attendance', authorize(...instructorRoles), academyController.getAttendance);
router.post('/attendance', authorize(...instructorRoles), academyController.recordAttendance);
router.get('/attendance/report/:cohortId', authorize(...instructorRoles), academyController.getAttendanceReport);

// Assessments
router.get('/modules/:moduleId/assessments', authenticate, academyController.getAssessmentsByModule);
router.post('/modules/:moduleId/assessments', authorize(...instructorRoles), academyController.createAssessment);
router.get('/assessments/:id', authorize(...instructorRoles), academyController.getAssessmentById);
router.put('/assessments/:id', authorize(...instructorRoles), academyController.updateAssessment);
router.delete('/assessments/:id', authorize(...instructorRoles), academyController.deleteAssessment);
router.put('/assessments/:id/publish', authorize(...instructorRoles), academyController.publishAssessment);
router.get('/assessments/:assessmentId/submissions', authorize(...instructorRoles), academyController.getSubmissions);
router.put('/submissions/:id/grade', authorize(...instructorRoles), academyController.gradeSubmission);

// Questions (quiz engine)
router.post('/assessments/:assessmentId/questions', authorize(...instructorRoles), academyController.createQuestion);
router.put('/questions/:id', authorize(...instructorRoles), academyController.updateQuestion);
router.delete('/questions/:id', authorize(...instructorRoles), academyController.deleteQuestion);

// Certificates
router.get('/certificates', authorize(...instructorRoles), academyController.getCertificates);
router.post('/certificates/issue', authorize(...academyRoles), academyController.issueCertificate);
router.put('/certificates/:id/revoke', authorize(...academyRoles), academyController.revokeCertificate);

export default router;
