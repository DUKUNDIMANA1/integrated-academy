import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/rbac';
import { sendSuccess, sendError } from '../utils/response';
import { Role } from '@prisma/client';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { env } from '../config/env';
import prisma from '../config/database';

const router = Router();

// Storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(process.cwd(), env.UPLOAD_DIR, 'org');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const name = (req.params.key || 'file').replace(/[^a-z0-9]/gi, '_');
    cb(null, `${name}${ext}`);
  },
});

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowed = /jpeg|jpg|png|gif|svg|webp|ico/;
  if (allowed.test(path.extname(file.originalname).toLowerCase()) && allowed.test(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpg, png, gif, svg, webp)'));
  }
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB

// ── Upload org image (logo, favicon, banner, etc.) ────────────────────────────
router.post(
  '/org/:key',
  authenticate,
  authorize(Role.SUPER_ADMIN, Role.GENERAL_MANAGER),
  upload.single('image'),
  async (req: any, res: Response): Promise<void> => {
    if (!req.file) { sendError(res, 'No file uploaded', 400); return; }

    const key = `org.${req.params.key}`;           // e.g. org.logo, org.favicon, org.banner
    const fileUrl = `/uploads/org/${req.file.filename}`;

    // Save to org settings
    await prisma.organizationSettings.upsert({
      where: { key },
      update: { value: fileUrl, updatedBy: req.user!.userId },
      create: { key, value: fileUrl, category: 'branding', updatedBy: req.user!.userId },
    });

    sendSuccess(res, { url: fileUrl, key }, 'Image uploaded successfully');
  }
);

// ── Upload user profile photo ─────────────────────────────────────────────────
const profileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(process.cwd(), env.UPLOAD_DIR, 'profiles');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req: any, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${req.user!.userId}${ext}`);
  },
});

const profileUpload = multer({ storage: profileStorage, fileFilter, limits: { fileSize: 3 * 1024 * 1024 } });

router.post(
  '/profile-photo',
  authenticate,
  profileUpload.single('photo'),
  async (req: any, res: Response): Promise<void> => {
    if (!req.file) { sendError(res, 'No file uploaded', 400); return; }

    const fileUrl = `/uploads/profiles/${req.file.filename}`;

    // Update student profile photo if student
    const student = await prisma.student.findUnique({ where: { userId: req.user!.userId } });
    if (student) {
      await prisma.student.update({ where: { userId: req.user!.userId }, data: { profilePhoto: fileUrl } });
    }

    sendSuccess(res, { url: fileUrl }, 'Profile photo uploaded');
  }
);

// ── Upload course thumbnail ────────────────────────────────────────────────────
const courseStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(process.cwd(), env.UPLOAD_DIR, 'courses');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${req.params.courseId}${ext}`);
  },
});

const courseUpload = multer({ storage: courseStorage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

router.post(
  '/course-thumbnail/:courseId',
  authenticate,
  authorize(Role.SUPER_ADMIN, Role.GENERAL_MANAGER, Role.ACADEMY_MANAGER),
  courseUpload.single('thumbnail'),
  async (req: any, res: Response): Promise<void> => {
    if (!req.file) { sendError(res, 'No file uploaded', 400); return; }

    const fileUrl = `/uploads/courses/${req.file.filename}`;
    await prisma.course.update({
      where: { id: req.params.courseId },
      data: { thumbnail: fileUrl },
    });

    sendSuccess(res, { url: fileUrl }, 'Thumbnail uploaded');
  }
);

// ── Get all org settings (including images) ───────────────────────────────────
router.get('/org-settings', async (req: Request, res: Response): Promise<void> => {
  const settings = await prisma.organizationSettings.findMany({ orderBy: { category: 'asc' } });
  const map: Record<string, string> = {};
  settings.forEach(s => { map[s.key] = s.value; });
  sendSuccess(res, map);
});

export default router;
