const { createClient } = require('redis');

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
const REDIS_COMMAND_TIMEOUT_MS = Number(process.env.REDIS_COMMAND_TIMEOUT_MS || 100);

const redisClient = createClient({
  url: redisUrl,
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 20) {
        return false;
      }
      return Math.min(retries * 200, 3000);
    },
  },
});

redisClient.on('error', (error) => {
  console.error('[redis] error:', error.message);
});

redisClient.on('connect', () => {
  console.log('[redis] connected');
});

redisClient.on('reconnecting', () => {
  console.log('[redis] reconnecting...');
});

async function connectRedis() {
  if (redisClient.isOpen) {
    return;
  }
  await redisClient.connect();
}

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Redis command timeout after ${ms}ms`)), ms);
    }),
  ]);
}

async function safeGet(key) {
  try {
    if (!redisClient.isOpen) return null;
    return await withTimeout(redisClient.get(key), REDIS_COMMAND_TIMEOUT_MS);
  } catch (error) {
    console.warn(`[redis] GET failed for key=${key}:`, error.message);
    return null;
  }
}

async function safeSetEx(key, ttlSeconds, value) {
  try {
    if (!redisClient.isOpen) return;
    await withTimeout(redisClient.setEx(key, ttlSeconds, value), REDIS_COMMAND_TIMEOUT_MS);
  } catch (error) {
    console.warn(`[redis] SETEX failed for key=${key}:`, error.message);
  }
}

async function safeDel(keys) {
  try {
    if (!redisClient.isOpen) return;
    if (!keys || keys.length === 0) return;
    await withTimeout(redisClient.del(keys), REDIS_COMMAND_TIMEOUT_MS);
  } catch (error) {
    console.warn('[redis] DEL failed:', error.message);
  }
}

async function safeKeys(pattern) {
  try {
    if (!redisClient.isOpen) return [];
    return await withTimeout(redisClient.keys(pattern), REDIS_COMMAND_TIMEOUT_MS);
  } catch (error) {
    console.warn(`[redis] KEYS failed for pattern=${pattern}:`, error.message);
    return [];
  }
}

module.exports = {
  redisClient,
  connectRedis,
  safeGet,
  safeSetEx,
  safeDel,
  safeKeys,
};
