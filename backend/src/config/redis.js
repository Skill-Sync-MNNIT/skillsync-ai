import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL;

/**
 * Exponential backoff: doubles delay each attempt, capped at 30s.
 * After 10 failed attempts, stops retrying to avoid log flooding.
 */
const retryStrategy = (times) => {
  if (times > 10) {
    console.error(`[Redis] Giving up after ${times} reconnect attempts. Redis is unavailable.`);
    return null; // stop retrying
  }
  const delay = Math.min(1000 * 2 ** times, 30_000); // 2s, 4s, 8s … 30s
  console.warn(`[Redis] Reconnecting in ${delay}ms (attempt ${times})…`);
  return delay;
};

const redisOptions = {
  maxRetriesPerRequest: null, // required by BullMQ
  enableReadyCheck: false, // don't block BullMQ startup on ready check
  lazyConnect: true, // don't auto-connect on import; connect on first command
  retryStrategy,
};

const redis = redisUrl
  ? new Redis(redisUrl, redisOptions)
  : new Redis({ host: '127.0.0.1', port: 6379, ...redisOptions });

redis.on('connect', () => console.log('[Redis] Connected'));
redis.on('ready', () => console.log('[Redis] Ready'));
redis.on('error', (err) => console.error('[Redis] Error:', err.message));
redis.on('close', () => console.warn('[Redis] Connection closed'));
redis.on('end', () => console.warn('[Redis] Connection ended (no more retries)'));

export default redis;
