// import Redis from 'ioredis';
// import { handleUserEvent } from './handlers/userEventHandler.js';
// import config from '../config/index.js';

// const subscriber = new Redis(config.redisUrl);

// export function initRedisSubscriber() {
//   subscriber.subscribe('user-events', (err, count) => {
//     if (err) {
//       console.error('❌ Failed to subscribe:', err);
//       return;
//     }
//     console.log(`✅ Subscribed to ${count} channel(s).`);
//   });

//   subscriber.on('message', (channel, message) => {
//     const data = JSON.parse(message);
//     console.log(`📩 Message received on ${channel}:`, data);

//     if (channel === 'user-events') {
//       handleUserEvent(data);
//     }
//   });
// }

// import Redis from 'ioredis';
// import config from '../config/index.js';
// import { processWebhookEvent } from '../services/webhookService.js';

// const subscriber = new Redis(config.redisUrl);

// export function initRedisSubscriber(io) {
//   subscriber.subscribe('transfer-events', (err, count) => {
//     if (err) console.error('Subscribe error', err);
//     else console.log(`Subscribed to ${count} channels.`);
//   });

//   subscriber.on('message', async (channel, message) => {
//     if (channel === 'transfer-events') {
//       const event = JSON.parse(message);
//       const result = await processWebhookEvent(event);
//       io.to(`user-${result.userId}`).emit(event.eventType, result);
//     }
//   });
// }

// import Redis from 'ioredis';
// import config from '../config/index.js';
// import { createNotification } from '../services/notificationService.js';
// import { analyzeUserTransactions } from '../services/recurringTransaction.js';
// import cron from 'node-cron';

// const subscriber = new Redis(config.redisUrl);

// export function initRedisSubscriber(io) {
//   subscriber.subscribe('app-events', (err, count) => {
//     if (err) {
//       console.error('❌ Failed to subscribe:', err);
//       return;
//     }
//     console.log(`✅ Subscribed to ${count} channel(s).`);
//   });

//   subscriber.on('message', async (channel, message) => {
//     const { type, payload } = JSON.parse(message);
//     console.log(`📩 Received ${type} event:`, payload);

//     await createNotification(type, payload);
//     handleBackendLogic(type, payload);

//       // Determine rooms: support multiple user rooms if payload includes them
//     // const rooms = [];
//     // if (payload.userId) rooms.push(`user-${payload.userId}`);
//     // if (payload.fromUserId) rooms.push(`user-${payload.fromUserId}`);
//     // if (payload.toUserId) rooms.push(`user-${payload.toUserId}`);

//     //     // Emit to each unique room
//     // Array.from(new Set(rooms)).forEach(room => {
//     //   io.to(room).emit(type, payload);
//     //   console.log(`🚀 Emitted ${type} to room ${room}`);
//     // });

//     // // Emit to specific room for the user
//     // const room = `user-${payload.userId}`;
//     // io.to(room).emit(type, payload);
//     // console.log(`🚀 Emitted ${type} to room ${room}`);

//      if (channel === 'user-login') {
//         const userId = payload.userId;
//         if (!userId) {
//           console.error('❌ user-login payload missing userId');
//           return;
//         }
//         console.log(`🔄 Triggering analysis for user ${userId} on login`);
//         await analyzeUserTransactions(userId);
//         console.log(`✅ Analysis complete for user ${userId}`);
//       }

//     const rooms = new Set();
//     if (payload.userId)      rooms.add(`user-${payload.userId}`);
//     if (payload.fromUserId)  rooms.add(`user-${payload.fromUserId}`);
//     if (payload.toUserId)    rooms.add(`user-${payload.toUserId}`);

//     // Emit to each room
//     rooms.forEach((room) => {
//       io.to(room).emit(type, payload);
//       console.log(`🚀 Emitted ${type} to room ${room}`);
//     });

//   });

// }

// // Subscribe once on startup:
// // subscriber.subscribe('user-login', (err, count) => {
// //   if (err) {
// //     console.error('❌ Failed to subscribe to user-login channel:', err);
// //     return;
// //   }
// //   console.log(`✅ Subscribed to user-login (${count} channel)`);
// // });

// // // On each login event, analyze just that user:
// // subscriber.on('message', async (channel, message) => {
// //   if (channel !== 'user-login') return;
// //   let data;
// //   try {
// //     data = JSON.parse(message);
// //   } catch {
// //     return console.error('❌ Invalid JSON on user-login channel:', message);
// //   }

// //   const { userId } = data;
// //   if (!userId) {
// //     return console.error('❌ user-login message missing userId:', data);
// //   }

// //   console.log(`🔄 Triggering recurring‑txn analysis for user ${userId}`);
// //   try {
// //     await analyzeUserTransactions(userId);
// //     console.log(`✅ Analysis complete for user ${userId}`);
// //   } catch (err) {
// //     console.error(`❌ Analysis failed for user ${userId}:`, err);
// //   }
// // });

// cron.schedule('0 */6 * * *', async () => {
//   console.log('🔄 Starting global recurring-transaction analysis job');
//   const users = await prisma.user.findMany({ select: { id: true } });
//   const batchSize = 50;
//   for (let i = 0; i < users.length; i += batchSize) {
//     const batch = users.slice(i, i + batchSize);
//     await Promise.all(batch.map(u => analyzeUserTransactions(u.id)
//       .catch(err => console.error(`❌ Analysis failed for user ${u.id}:`, err))
//     ));
//     console.log(`✅ Processed batch ${i / batchSize + 1}`);
//   }
//   console.log(`🎉 Completed global analysis for ${users.length} users`);
// });

// function handleBackendLogic(type, payload) {
//   switch (type) {
//     case 'USER_CREATED':
//       console.log(`New user created: ${payload.userId}`);
//       break;
//     case 'TRANSFER_COMPLETED':
//       console.log(`Transfer completed: ${payload.transferId}`);
//       break;
//     case 'USER_LOGIN':
//       console.log(`User logged in: ${payload.userId}`);
//       // Trigger any additional logic needed on user login
//       break;

//     default:
//       console.warn(`⚠️ Unhandled event type: ${type}`);
//   }
// }

//redisSubscriber.js

// import { prisma } from "../db/prisma.js";
// import Redis from "ioredis";
// import config from "../config/index.js";
// import { createNotification } from "../services/notificationService.js";
// import { analyzeUserTransactions } from "../services/recurringTransaction.js";
// import cron from "node-cron";
// import { ingestStatement } from "../middlewares/fileUpload/ingestOrchestrator.js";

// // Initialize Redis client
// const subscriber = new Redis(config.redisUrl);

// /**
//  * Initializes Redis subscriptions and Socket.IO emission.
//  * Handles two channels:
//  *  - 'app-events'    for notifications + socket emission
//  *  - 'user-login'    for on-demand analysis of a single user
//  */
// export async function initRedisSubscriber(io) {
//   // Subscribe to both channels
//   try {
//     await subscriber.subscribe("app‑events", "user‑login", "statement‑imported");
//   console.log("✅ Subscribed to: app‑events, user‑login, statement‑imported");
//   } catch (err) {
//     console.error("❌ Redis subscribe failed:", err);
//     return;
//   }

//   subscriber.on("message", async (channel, message) => {
//     let parsed;
//     try {
//       parsed = JSON.parse(message);
//     } catch (err) {
//       console.error(`❌ Invalid JSON on ${channel}:`, message);
//       return;
//     }
//     const { type, payload } = parsed;
//     console.log(`📩 [${channel}] ${type}:`, payload);

//     handleBackendLogic(type, payload);
//     emitToRooms(io, type, payload);

//     // Handle application events: notifications + socket emit
//     if (channel === "app-events") {
//       try {
//         await createNotification(type, payload);
//       } catch (err) {
//         console.error("❌ Failed to create notification:", err);
//       }
//       // handleBackendLogic(type, payload);
//       // emitToRooms(io, type, payload);
//     }

//     //     if (channel === 't') {
//     // try {
//     //   await createNotification(type, payload);
//     // } catch (err) {
//     //   console.error('❌ Failed to create notification:', err);
//     // }
//     // //  handleBackendLogic(type, payload);
//     // //  emitToRooms(io, type, payload);
//     // }

//     // Handle login events: on-demand user analysis
//     if (channel === "user-login") {
//       const userId = payload.userId;
//       if (!userId) {
//         console.error("❌ user-login payload missing userId");
//         return;
//       }
//       console.log(`🔄 Triggering analysis for user ${userId} on login`);
//       try {
//         await analyzeUserTransactions(userId);
//         console.log(`✅ Analysis complete for user ${userId}`);
//       } catch (err) {
//         console.error(`❌ Analysis failed for user ${userId}:`, err);
//       }
//     }
//   });
// }

// /**
//  * Optional global fallback cron: runs every 6 hours for all users in batches.
//  */
// cron.schedule("0 */6 * * *", async () => {
//   console.log("🔄 Starting global recurring-transaction analysis job");
//   const users = await prisma.user.findMany({ select: { id: true } });
//   const batchSize = 50;
//   for (let i = 0; i < users.length; i += batchSize) {
//     const batch = users.slice(i, i + batchSize);
//     await Promise.all(
//       batch.map((u) =>
//         analyzeUserTransactions(u.id).catch((err) =>
//           console.error(`❌ Analysis failed for user ${u.id}:`, err)
//         )
//       )
//     );
//     console.log(`✅ Processed batch ${i / batchSize + 1}`);
//   }
//   console.log(`🎉 Completed global analysis for ${users.length} users`);
// });

// /**
//  * Emit an event to all relevant Socket.IO rooms
//  */
// function emitToRooms(io, type, payload) {
//   const rooms = new Set();
//   if (payload.userId) rooms.add(`user-${payload.userId}`);
//   if (payload.fromUserId) rooms.add(`user-${payload.fromUserId}`);
//   if (payload.toUserId) rooms.add(`user-${payload.toUserId}`);
//   rooms.forEach((room) => {
//     io.to(room).emit(type, payload);
//     console.log(`🚀 Emitted ${type} to room ${room}`);
//   });
// }

// /**
//  * Basic backend logic handler for different event types
//  */
// async function handleBackendLogic(type, payload) {
//         const userId = payload.userId;
//   switch (type) {
//     case "USER_CREATED":
//       console.log(`New user created: ${payload.userId}`);
//       break;
//     case "TRANSFER_COMPLETED":
//       try {
//         await createNotification(type, payload);
//         console.log(
//           `✅ Notification created for transfer ${payload.transferId}`
//         );
//       } catch (err) {
//         console.error("❌ Failed to create notification:", err);
//       }
//       console.log(`Transfer completed: ${payload.transferId}`);
//       break;
//     case "USER_LOGIN":
//       // const userId = payload.userId;
//       if (!userId) {
//         console.error("❌ user-login payload missing userId");
//         return;
//       }
//       console.log(`User logged in: ${payload.userId}`);
//       console.log(`🔄 Triggering analysis for user ${userId} on login`);
//       try {
//         await analyzeUserTransactions(userId);
//         console.log(`✅ Analysis complete for user ${userId}`);
//       } catch (err) {
//         console.error(`❌ Analysis failed for user ${userId}:`, err);
//       }
//       break;
//       case "STATEMENT_IMPORTED":
//     //  const userId = payload.userId;
//       if (!userId) {
//         console.error("❌ user-login payload missing userId");
//         return;
//       }
//       console.log(`STATEMENT IMPORTED for: ${payload.userId}`);
//       console.log(`🔄 Triggering STATEMENT_IMPORTED for user ${userId} on upload`);
//       try {
//         await ingestStatement(userId);
//         console.log(`✅ STATEMENT_IMPORTED complete for user ${userId}`);
//       } catch (err) {
//         console.error(`❌ STATEMENT_IMPORTED failed for user ${userId}:`, err);
//       }
//       break;
//     default:
//       console.warn(`⚠️ Unhandled event type: ${type}`);
//   }
// }

import Redis from "ioredis";
import { handleEvent } from "./handlers/userEventHandler.js";
import config from "../config/index.js";


const subscriber = new Redis(config.redisUrl);

export async function initRedisSubscriber(io) {
  // 1) Subscribe to exactly these channels:
  await subscriber.subscribe("app-events", "user-login", "statement-imported, 'run-recurring");
  console.log("✅ Subscribed to channels: app-events, user-login, statement-imported", 'run-recurring');

  // 2) Handle incoming messages in one place
  subscriber.on("message", async (channel, raw) => {
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      console.error(`❌ Invalid JSON on ${channel}:`, raw);
      return;
    }

    const { type, payload } = parsed;
    console.log(`📩 [${channel}] ${type}`, payload);

    try {
      // Pass along Socket.IO instance for emits
      await handleEvent(type, payload, io);
    } catch (err) {
      console.error(`❌ Error handling ${type}:`, err);
    }
  });
}
