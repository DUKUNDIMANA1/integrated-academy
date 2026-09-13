import prisma from '../config/database';
import { NotificationType } from '@prisma/client';

interface CreateNotificationParams {
  userId: string;
  senderId?: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
}

export const createNotification = async (params: CreateNotificationParams) => {
  return prisma.notification.create({
    data: {
      userId: params.userId,
      senderId: params.senderId,
      type: params.type,
      title: params.title,
      message: params.message,
      data: params.data ? JSON.parse(JSON.stringify(params.data)) : undefined,
    },
  });
};

export const createBulkNotifications = async (notifications: CreateNotificationParams[]) => {
  return prisma.notification.createMany({
    data: notifications.map((n) => ({
      userId: n.userId,
      senderId: n.senderId,
      type: n.type,
      title: n.title,
      message: n.message,
      data: n.data ? JSON.parse(JSON.stringify(n.data)) : undefined,
    })),
  });
};
