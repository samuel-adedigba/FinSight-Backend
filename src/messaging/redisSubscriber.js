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

import Redis from 'ioredis';
import config from '../config/index.js';
import { createNotification } from '../services/notificationService.js';

const subscriber = new Redis(config.redisUrl);

export function initRedisSubscriber(io) {
  subscriber.subscribe('app-events', (err, count) => {
    if (err) {
      console.error('❌ Failed to subscribe:', err);
      return;
    }
    console.log(`✅ Subscribed to ${count} channel(s).`);
  });

  subscriber.on('message', async (channel, message) => {
    const { type, payload } = JSON.parse(message);
    console.log(`📩 Received ${type} event:`, payload);

    await createNotification(type, payload);
    handleBackendLogic(type, payload);

      // Determine rooms: support multiple user rooms if payload includes them
    // const rooms = [];
    // if (payload.userId) rooms.push(`user-${payload.userId}`);
    // if (payload.fromUserId) rooms.push(`user-${payload.fromUserId}`);
    // if (payload.toUserId) rooms.push(`user-${payload.toUserId}`);

    //     // Emit to each unique room
    // Array.from(new Set(rooms)).forEach(room => {
    //   io.to(room).emit(type, payload);
    //   console.log(`🚀 Emitted ${type} to room ${room}`);
    // });

    // // Emit to specific room for the user
    // const room = `user-${payload.userId}`;
    // io.to(room).emit(type, payload);
    // console.log(`🚀 Emitted ${type} to room ${room}`);


    const rooms = new Set();
    if (payload.userId)      rooms.add(`user-${payload.userId}`);
    if (payload.fromUserId)  rooms.add(`user-${payload.fromUserId}`);
    if (payload.toUserId)    rooms.add(`user-${payload.toUserId}`);

    // Emit to each room
    rooms.forEach((room) => {
      io.to(room).emit(type, payload);
      console.log(`🚀 Emitted ${type} to room ${room}`);
    });

  });   

}

function handleBackendLogic(type, payload) {
  switch (type) {
    case 'USER_CREATED':
      console.log(`New user created: ${payload.userId}`);
      break;
    case 'TRANSFER_COMPLETED':
      console.log(`Transfer completed: ${payload.transferId}`);
      break;
  
    default:
      console.warn(`⚠️ Unhandled event type: ${type}`);
  }
}
