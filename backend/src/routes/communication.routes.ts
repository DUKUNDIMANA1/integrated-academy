import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/rbac';
import { sendSuccess, sendCreated } from '../utils/response';
import prisma from '../config/database';
import { Role } from '@prisma/client';

const router = Router();
router.use(authenticate);

// ── ANNOUNCEMENTS ─────────────────────────────────────────────────────────────

router.get('/announcements', async (req: any, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const skip = (page - 1) * limit;
  const now = new Date();
  const [announcements, total] = await Promise.all([
    prisma.announcement.findMany({
      where: { isPublished: true, OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
      skip, take: limit, orderBy: [{ isPinned: 'desc' }, { publishedAt: 'desc' }],
    }),
    prisma.announcement.count({ where: { isPublished: true } }),
  ]);
  sendSuccess(res, announcements, 'Announcements retrieved', 200, { total });
});

router.post('/announcements', authorize(Role.SUPER_ADMIN, Role.GENERAL_MANAGER, Role.ACADEMY_MANAGER), async (req: any, res) => {
  const announcement = await prisma.announcement.create({ data: { ...req.body, authorId: req.user!.userId } });
  sendCreated(res, announcement, 'Announcement created');
});

router.put('/announcements/:id', authorize(Role.SUPER_ADMIN, Role.GENERAL_MANAGER, Role.ACADEMY_MANAGER), async (req: any, res) => {
  const announcement = await prisma.announcement.update({ where: { id: req.params.id }, data: req.body });
  sendSuccess(res, announcement, 'Announcement updated');
});

router.delete('/announcements/:id', authorize(Role.SUPER_ADMIN, Role.GENERAL_MANAGER), async (req: any, res) => {
  await prisma.announcement.delete({ where: { id: req.params.id } });
  sendSuccess(res, null, 'Announcement deleted');
});

// ── MESSAGES ──────────────────────────────────────────────────────────────────

router.get('/messages', async (req: any, res) => {
  const userId = req.user!.userId;
  const messages = await prisma.message.findMany({
    where: { OR: [{ senderId: userId }, { recipientId: userId }], parentId: null },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  sendSuccess(res, messages);
});

router.post('/messages', async (req: any, res) => {
  const message = await prisma.message.create({
    data: { senderId: req.user!.userId, ...req.body },
  });
  sendCreated(res, message, 'Message sent');
});

router.put('/messages/:id/read', async (req: any, res) => {
  await prisma.message.update({ where: { id: req.params.id }, data: { isRead: true, readAt: new Date() } });
  sendSuccess(res, null, 'Message marked as read');
});

// ── DISCUSSIONS ───────────────────────────────────────────────────────────────

router.get('/discussions', async (req: any, res) => {
  const courseId = req.query.courseId as string | undefined;
  const where: Record<string, unknown> = {};
  if (courseId) where.courseId = courseId;
  const threads = await prisma.discussionThread.findMany({
    where, orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
    include: { _count: { select: { replies: true } } }, take: 50,
  });
  sendSuccess(res, threads);
});

router.post('/discussions', async (req: any, res) => {
  const thread = await prisma.discussionThread.create({ data: { ...req.body, authorId: req.user!.userId } });
  sendCreated(res, thread, 'Discussion created');
});

router.get('/discussions/:id/replies', async (req: any, res) => {
  const replies = await prisma.discussionReply.findMany({
    where: { threadId: req.params.id }, orderBy: { createdAt: 'asc' },
  });
  sendSuccess(res, replies);
});

router.post('/discussions/:id/replies', async (req: any, res) => {
  const reply = await prisma.discussionReply.create({
    data: { threadId: req.params.id, authorId: req.user!.userId, content: req.body.content },
  });
  sendCreated(res, reply, 'Reply added');
});

// ── FEEDBACK ──────────────────────────────────────────────────────────────────

router.post('/feedback', async (req: any, res) => {
  const student = await prisma.student.findUnique({ where: { userId: req.user!.userId } });
  if (!student) { res.status(404).json({ success: false, message: 'Student not found' }); return; }
  const feedback = await prisma.courseFeedback.upsert({
    where: { studentId_courseId: { studentId: student.id, courseId: req.body.courseId } },
    update: req.body,
    create: { studentId: student.id, ...req.body },
  });
  sendSuccess(res, feedback, 'Feedback submitted');
});

// ── ORGANIZATION SETTINGS ─────────────────────────────────────────────────────

router.get('/settings', authorize(Role.SUPER_ADMIN, Role.GENERAL_MANAGER), async (req: any, res) => {
  const settings = await prisma.organizationSettings.findMany({ orderBy: { category: 'asc' } });
  sendSuccess(res, settings);
});

router.post('/settings', authorize(Role.SUPER_ADMIN), async (req: any, res) => {
  const { key, value, category, description } = req.body;
  const setting = await prisma.organizationSettings.upsert({
    where: { key },
    update: { value, updatedBy: req.user!.userId },
    create: { key, value, category, description, updatedBy: req.user!.userId },
  });
  sendSuccess(res, setting, 'Setting saved');
});

export default router;
