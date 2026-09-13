import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { env } from '../config/env';

const ROOT_DIR = path.join(process.cwd(), env.UPLOAD_DIR);

// Ensure a subfolder exists under the upload root (branding, avatars, courses, ...)
export const ensureUploadSubdir = (subdir: string): string => {
  const full = path.join(ROOT_DIR, subdir);
  fs.mkdirSync(full, { recursive: true });
  return full;
};

// Make sure root exists at boot
try {
  fs.mkdirSync(ROOT_DIR, { recursive: true });
} catch {
  /* ignore */
}

const diskStorageFor = (subdir: string): multer.StorageEngine =>
  multer.diskStorage({
    destination: (req, file, cb) => {
      try {
        cb(null, ensureUploadSubdir(subdir));
      } catch (e) {
        cb(e as Error, ROOT_DIR);
      }
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const safe = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
      cb(null, safe);
    },
  });

const IMAGE_RE = /jpeg|jpg|png|gif|webp|svg|ico/;
const DOC_RE = /jpeg|jpg|png|gif|webp|svg|ico|pdf|doc|docx|xls|xlsx|ppt|pptx|mp4|mov|avi/;

const imageOnlyFilter = (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const extOk = IMAGE_RE.test(path.extname(file.originalname).toLowerCase());
  const mimeOk = /image\//.test(file.mimetype) || IMAGE_RE.test(file.mimetype);
  if (extOk && mimeOk) cb(null, true);
  else cb(new Error('Only image files (jpg, png, gif, webp, svg, ico) are allowed'));
};

const generalFilter = (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const extname = DOC_RE.test(path.extname(file.originalname).toLowerCase());
  const mimetype = DOC_RE.test(file.mimetype);
  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('File type not allowed'));
  }
};

/** Legacy general uploader (kept for backwards compatibility). */
export const upload = multer({
  storage: diskStorageFor('general'),
  limits: { fileSize: env.MAX_FILE_SIZE },
  fileFilter: generalFilter,
});

export const uploadSingle = (fieldName: string) => upload.single(fieldName);
export const uploadMultiple = (fieldName: string, maxCount = 5) => upload.array(fieldName, maxCount);

// ── Image uploaders (branding / avatars / course thumbnails) ────────────────

const imageUpload = (subdir: string, maxMb = 5) =>
  multer({
    storage: diskStorageFor(subdir),
    limits: { fileSize: maxMb * 1024 * 1024 },
    fileFilter: imageOnlyFilter,
  });

/** Academy branding images → uploads/branding/* (logo, favicon, banner …) */
export const brandingUpload = imageUpload('branding', 5).single('image');
/** User avatars → uploads/avatars/* */
export const avatarUpload = imageUpload('avatars', 3).single('image');
/** Course thumbnails → uploads/courses/* */
export const courseUpload = imageUpload('courses', 5).single('image');

/** Public URL path stored in DB, e.g. `/uploads/branding/123.png` */
export const publicFileUrl = (subdir: string, filename: string) => `/uploads/${subdir}/${filename}`;

/** Delete a previously stored file given its stored `/uploads/...` URL. Never throws. */
export const deleteStoredFile = (storedUrl?: string | null) => {
  if (!storedUrl || !storedUrl.startsWith('/uploads/')) return;
  try {
    const abs = path.join(process.cwd(), storedUrl.replace(/^\/+/, ''));
    if (fs.existsSync(abs)) fs.unlinkSync(abs);
  } catch {
    /* ignore */
  }
};

