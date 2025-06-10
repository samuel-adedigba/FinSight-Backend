import { getNotificationsForUser, markRead } from '../services/notificationService.js';

export async function getNotifications(req, res) {
  const userId = req.user.id;
  const list = await getNotificationsForUser(userId);
  res.json({ message:"Your notifications" ,notifications: list });
};

export async function markNotificationRead(req, res) {
  const userId = req.user.id;
  const notificationId = Number(req.params.id);
  await markRead(userId, notificationId);
  res.sendStatus(204);
};
