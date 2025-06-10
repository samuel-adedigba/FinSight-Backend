// // messaging/initKafka.js
// import { producer } from './redisPublisher.js';
// import { consumer } from './redisSubscriber.js';

// export async function initKafka() {
//   await producer.connect();
//   console.log('✅ Kafka producer connected');
//   await consumer.connect();
//   await consumer.subscribe({ topic: 'user-events', fromBeginning: true });
//   await consumer.run({
//     eachMessage: async ({ message }) => {
//       console.log('Received:', message.value.toString());
//       // handle incoming events
//     }
//   });
//   console.log('✅ Kafka consumer connected');
// }
