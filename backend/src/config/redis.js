import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL;

const redis = redisUrl
  ? new Redis(redisUrl, {
      maxRetriesPerRequest: null, // ✅ FIX
    })
  : new Redis({
      host: '127.0.0.1',
      port: 6379,
      maxRetriesPerRequest: null, // ✅ FIX
    });

redis.on('connect', () => {
  console.log('Redis connected');
});

redis.on('error', (err) => {
  console.error('Redis error:', err);
});

export default redis;
