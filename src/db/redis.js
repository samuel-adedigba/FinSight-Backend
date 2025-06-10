// // db/redis.js
// import Redis from 'ioredis';
// import config from '../config/index.js';
// export const redis = new Redis(config.redisUrl);

import Redis from 'ioredis';
import config from '../config/index.js';

const redis = new Redis(config.redisUrl, {
  maxRetriesPerRequest: 3,
  connectTimeout: 10000
});

redis.on('connect', () => console.log('✅ Redis connected'));
redis.on('error', (err) => console.error('❌ Redis error:', err));

export default redis;
