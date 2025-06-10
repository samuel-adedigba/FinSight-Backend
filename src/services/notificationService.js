import { prisma } from '../db/prisma.js';

export async function createNotification(type, payload) {
  // Determine target users
  const userIds = [];
  if (payload.userId)     userIds.push(payload.userId);
  if (payload.fromUserId) userIds.push(payload.fromUserId);
  if (payload.toUserId)   userIds.push(payload.toUserId);

  // Create one notification per user
  const notifications = userIds.map(id => ({ userId: id, type, payload }));
  await prisma.notification.createMany({ data: notifications });
};

export async function getNotificationsForUser(userId) {
  return prisma.notification.findMany({ where: { userId, read: false }, orderBy: { createdAt: 'desc' } });
};

export async function markRead(userId, notificationId) {
  await prisma.notification.updateMany({
    where: { id: notificationId, userId }, data: { read: true }
  });
};