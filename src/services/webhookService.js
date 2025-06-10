// // services/webhookService.js
// import { prisma } from '../db/prisma.js';

// export async function processWebhookEvent(event) {
//   const { eventType, data } = event;
//   const update = {};
//   if (eventType === 'transfer.completed') {
//     update.status = 'completed';
//     update.completedAt = new Date();
//   } else if (eventType === 'transfer.failed') {
//     update.status = 'failed';
//     update.completedAt = new Date();
//   }
//   const transfer = await prisma.transfer.update({
//     where: { id: data.transferId },
//     data: update
//   });
//   return { ...transfer, eventType, userId: data.userId };
// }