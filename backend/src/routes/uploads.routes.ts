import { Router } from 'express';
import path from 'path';
import fs from 'fs';
import prisma from '../config/database';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/rbac';
import { sendSuccess, sendBadRequest } from '../utils/response';
import { brandingUpload, avatarUpload, courseUpload, publicFileUrl, deleteStoredFile, ensureUploadSubdir } from '../utils/fileUpload';
import { Role } from '@prisma/client';
import multer from 'multer';
import { env } from '../config/env';

const router = Router();

// ── PUBLIC BRANDING (no login required — used by login page, sidebar, etc.) ──

router.get('/branding', async (req, res) => {
  const rows = await prisma.organizationSettings.findMany({ where: { category: 'branding' } });
  const branding: Record<string, string> = {};
  for (const r of rows) branding[r.key] = r.value;
  sendSuccess(res, branding, 'Branding retrieved');
});

// ── ADMIN: upload a branding image (logo, favicon, login banner …) ──────────
// POST /api/uploads/branding  (multipart field: image, body: key e.g. branding.logo)
router.post(
  '/branding',
  authenticate,
  authorize(Role.SUPER_ADMIN, Role.GENERAL_MANAGER),
  (req: any, res, next) => brandingUpload(req, res, (err: any) => (err ? next(err) : next())),
  async (req: any, res) => {
    const key = (req.body?.key as string) || 'branding.logo';
    if (!/^branding\.[a-z0-9_]+$/i.test(key)) {
      sendBadRequest(res, 'Invalid branding key. Use e.g. branding.logo, branding.favicon, branding.banner');
      return;
    }
    if (!req.file) {
      sendBadRequest(res, 'No image uploaded (field name must be "image")');
      return;
    }
    const url = publicFileUrl('branding', req.file.filename);

    // Remove previous file for this key so uploads/ doesn't fill with orphans
    const prev = await prisma.organizationSettings.findUnique({ where: { key } });
    if (prev?.value && prev.value !== url) deleteStoredFile(prev.value);

    const setting = await prisma.organizationSettings.upsert({
      where: { key },
      update: { value: url, updatedBy: req.user!.userId },
      create: { key, value: url, category: 'branding', description: 'Academy branding image (uploaded)', updatedBy: req.user!.userId },
    });
    sendSuccess(res, { key: setting.key, url }, 'Branding image uploaded');
  }
);

// DELETE /api/uploads/branding/:key  (e.g. branding.logo) — removes file + resets to empty
router.delete(
  '/branding/:key',
  authenticate,
  authorize(Role.SUPER_ADMIN, Role.GENERAL_MANAGER),
  async (req: any, res) => {
    const key = `branding.${req.params.key}`;
    const prev = await prisma.organizationSettings.findUnique({ where: { key } });
    if (prev?.value) deleteStoredFile(prev.value);
    if (prev) await prisma.organizationSettings.update({ where: { key }, data: { value: '', updatedBy: req.user!.userId } });
    sendSuccess(res, null, 'Branding image removed');
  }
);

// ── SELF: upload my avatar ──────────────────────────────────────────────────
// POST /api/uploads/avatar  (multipart field: image)
router.post('/avatar', authenticate, (req: any, res, next) =>
  avatarUpload(req, res, (err: any) => (err ? next(err) : next())),
  async (req: any, res) => {
    if (!req.file) {
      sendBadRequest(res, 'No image uploaded (field name must be "image")');
      return;
    }
    const url = publicFileUrl('avatars', req.file.filename);
    try {
      const me = await (prisma as any).user.findUnique({ where: { id: req.user!.userId }, select: { avatarUrl: true } });
      if (me?.avatarUrl && me.avatarUrl !== url) deleteStoredFile(me.avatarUrl);
    } catch { /* column may not exist yet if migration not run — continue */ }
    let updated: any;
    try {
      updated = await (prisma as any).user.update({
        where: { id: req.user!.userId },
        data: { avatarUrl: url },
        select: { id: true, email: true, phone: true, firstName: true, lastName: true, role: true, avatarUrl: true },
      });
    } catch (e: any) {
      // DB column missing (migration pending): still return the file URL so UI previews work
      if (String(e?.code) === 'P2022' || /avatarUrl/i.test(String(e?.message || ''))) {
        const me = await prisma.user.findUnique({
          where: { id: req.user!.userId },
          select: { id: true, email: true, phone: true, firstName: true, lastName: true, role: true },
        });
        sendSuccess(res, { ...me, avatarUrl: url, _dbPending: true }, 'Profile photo uploaded (DB column pending — run migration to persist)');
        return;
      }
      throw e;
    }
    sendSuccess(res, updated, 'Profile photo updated');
  }
);

// ── COURSES: upload a thumbnail ─────────────────────────────────────────────
// POST /api/uploads/courses/:id/thumbnail  (multipart field: image)
router.post(
  '/courses/:id/thumbnail',
  authenticate,
  authorize(Role.SUPER_ADMIN, Role.GENERAL_MANAGER, Role.ACADEMY_MANAGER, Role.ELEARNING_MANAGER),
  (req: any, res, next) => courseUpload(req, res, (err: any) => (err ? next(err) : next())),
  async (req: any, res) => {
    if (!req.file) {
      sendBadRequest(res, 'No image uploaded (field name must be "image")');
      return;
    }
    const url = publicFileUrl('courses', req.file.filename);
    const prev = await prisma.course.findUnique({ where: { id: req.params.id }, select: { thumbnail: true } });
    if (prev?.thumbnail && prev.thumbnail !== url) deleteStoredFile(prev.thumbnail);
    const course = await prisma.course.update({ where: { id: req.params.id }, data: { thumbnail: url } });
    sendSuccess(res, { id: course.id, thumbnail: course.thumbnail }, 'Course thumbnail uploaded');
  }
);

// ── LESSONS: upload content file (video, PDF, slides, audio) ─────────────────
// POST /api/uploads/lessons/:lessonId/content  (multipart field: file)
// POST /api/uploads/lessons/content            (no lesson yet — returns URL only)

const LESSON_CONTENT_TYPES: Record<string, string[]> = {
  video:  ['video/mp4','video/mpeg','video/quicktime','video/x-msvideo','video/webm'],
  pdf:    ['application/pdf'],
  slides: ['application/vnd.ms-powerpoint','application/vnd.openxmlformats-officedocument.presentationml.presentation','application/vnd.google-apps.presentation'],
  audio:  ['audio/mpeg','audio/ogg','audio/wav','audio/mp4','audio/aac','audio/x-m4a'],
  doc:    ['application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
};
const LESSON_ALLOWED_MIMES = Object.values(LESSON_CONTENT_TYPES).flat();
const LESSON_ALLOWED_EXTS  = /\.(mp4|mov|avi|mkv|webm|pdf|ppt|pptx|mp3|ogg|wav|aac|m4a|doc|docx)$/i;

const lessonContentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    try { cb(null, ensureUploadSubdir('lessons')); }
    catch (e) { cb(e as Error, ''); }
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

const lessonContentFilter = (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const extOk  = LESSON_ALLOWED_EXTS.test(path.extname(file.originalname).toLowerCase());
  const mimeOk = LESSON_ALLOWED_MIMES.includes(file.mimetype);
  if (extOk || mimeOk) cb(null, true);
  else cb(new Error('File type not supported. Allowed: MP4, PDF, PPT/PPTX, MP3, WAV, DOC/DOCX'));
};

const lessonContentUpload = multer({
  storage: lessonContentStorage,
  fileFilter: lessonContentFilter,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500 MB
}).single('file');

const instructorRoles = [Role.SUPER_ADMIN, Role.GENERAL_MANAGER, Role.ACADEMY_MANAGER, Role.ELEARNING_MANAGER, Role.INSTRUCTOR];

// Upload and immediately attach to an existing lesson
router.post(
  '/lessons/:lessonId/content',
  authenticate,
  authorize(...instructorRoles),
  (req: any, res, next) => lessonContentUpload(req, res, (err: any) => (err ? next(err) : next())),
  async (req: any, res) => {
    if (!req.file) { sendBadRequest(res, 'No file uploaded (field name must be "file")'); return; }
    const url = publicFileUrl('lessons', req.file.filename);
    const { field } = req.query as { field?: string }; // 'videoUrl' | 'fileUrl'

    const lesson = await prisma.lesson.findUnique({ where: { id: req.params.lessonId } });
    if (!lesson) { sendBadRequest(res, 'Lesson not found'); return; }

    // Remove old file if replacing
    const oldUrl = field === 'videoUrl' ? lesson.videoUrl : lesson.fileUrl;
    if (oldUrl && oldUrl.startsWith('/uploads/lessons/')) deleteStoredFile(oldUrl);

    const updateData = field === 'videoUrl' ? { videoUrl: url } : { fileUrl: url };
    await prisma.lesson.update({ where: { id: req.params.lessonId }, data: updateData });

    sendSuccess(res, { url, field: field || 'fileUrl', originalName: req.file.originalname, size: req.file.size }, 'File uploaded');
  }
);

// Upload without attaching to a lesson yet (used during lesson creation)
router.post(
  '/lessons/content',
  authenticate,
  authorize(...instructorRoles),
  (req: any, res, next) => lessonContentUpload(req, res, (err: any) => (err ? next(err) : next())),
  async (req: any, res) => {
    if (!req.file) { sendBadRequest(res, 'No file uploaded (field name must be "file")'); return; }
    const url = publicFileUrl('lessons', req.file.filename);
    sendSuccess(res, { url, originalName: req.file.originalname, size: req.file.size }, 'File uploaded');
  }
);

// ── ASSESSMENTS: upload an attachment (assignment brief, exam paper, etc.) ────
// POST /api/uploads/assessments/:assessmentId/attachment  (field: file)
// POST /api/uploads/assessments/attachment               (no assessment yet)

const assessmentFileFilter = (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowed = /\.(pdf|doc|docx|ppt|pptx|xls|xlsx|zip|mp4|mov|webm|mp3|wav)$/i;
  if (allowed.test(path.extname(file.originalname))) cb(null, true);
  else cb(new Error('Unsupported file type. Allowed: PDF, Word, PPT, Excel, ZIP, video, audio'));
};

const assessmentUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      try { cb(null, ensureUploadSubdir('assessments')); } catch (e) { cb(e as Error, ''); }
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
    },
  }),
  fileFilter: assessmentFileFilter,
  limits: { fileSize: 200 * 1024 * 1024 }, // 200 MB
}).single('file');

router.post(
  '/assessments/:assessmentId/attachment',
  authenticate,
  authorize(...instructorRoles),
  (req: any, res, next) => assessmentUpload(req, res, (err: any) => (err ? next(err) : next())),
  async (req: any, res) => {
    if (!req.file) { sendBadRequest(res, 'No file uploaded (field name must be "file")'); return; }
    const url = publicFileUrl('assessments', req.file.filename);
    const assessment = await prisma.assessment.findUnique({ where: { id: req.params.assessmentId } });
    if (!assessment) { sendBadRequest(res, 'Assessment not found'); return; }
    sendSuccess(res, { url, originalName: req.file.originalname, size: req.file.size }, 'Attachment uploaded');
  }
);

// Upload before assessment exists (during creation flow)
router.post(
  '/assessments/attachment',
  authenticate,
  authorize(...instructorRoles),
  (req: any, res, next) => assessmentUpload(req, res, (err: any) => (err ? next(err) : next())),
  async (req: any, res) => {
    if (!req.file) { sendBadRequest(res, 'No file uploaded (field name must be "file")'); return; }
    const url = publicFileUrl('assessments', req.file.filename);
    sendSuccess(res, { url, originalName: req.file.originalname, size: req.file.size }, 'Attachment uploaded');
  }
);

export default router;
