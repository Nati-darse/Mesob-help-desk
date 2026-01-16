const createMemoryCache = () => {
  const store = new Map();
  return {
    async get(key) {
      const entry = store.get(key);
      if (!entry) return null;
      const { value, expiresAt } = entry;
      if (expiresAt && Date.now() > expiresAt) {
        store.delete(key);
        return null;
      }
      return value;
    },
    async set(key, value, ttlSeconds) {
      const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : null;
      store.set(key, { value, expiresAt });
    },
    ready: true,
  };
};

let client = null;
let useMemory = false;

try {
  const { createClient } = require('redis');
  client = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  });
  client.on('error', () => {
    useMemory = true;
  });
  client.connect().catch(() => {
    useMemory = true;
  });
} catch (e) {
  useMemory = true;
}

const memory = createMemoryCache();

module.exports = {
  async get(key) {
    if (!useMemory && client) {
      try {
        const val = await client.get(key);
        return val ? JSON.parse(val) : null;
      } catch {
        return memory.get(key);
      }
    }
    return memory.get(key);
  },
  async set(key, value, ttlSeconds = 60) {
    if (!useMemory && client) {
      try {
        const payload = JSON.stringify(value);
        if (ttlSeconds) {
          await client.set(key, payload, { EX: ttlSeconds });
        } else {
          await client.set(key, payload);
        }
        return;
      } catch {
        await memory.set(key, value, ttlSeconds);
        return;
      }
    }
    await memory.set(key, value, ttlSeconds);
  },
  ready: !useMemory || memory.ready,
};
