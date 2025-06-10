import redis from '../db/redis.js';

export async function publishEvent(eventType, payload) {
  const event = { type: eventType, payload };
  await redis.publish('app-events', JSON.stringify(event));
  console.log(`📣 Published ${eventType} event`);
}