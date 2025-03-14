import { NextApiRequest } from 'next';
import { kv } from '@vercel/kv';

// Rate limit configuration
const RATE_LIMIT = 100; // requests
const WINDOW_SIZE = 60 * 60; // 1 hour in seconds

export async function rateLimit(req: NextApiRequest): Promise<void> {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  const key = `ratelimit:${ip}`;

  // Get current count
  const current = await kv.get<number>(key) || 0;

  if (current >= RATE_LIMIT) {
    throw new Error('Rate limit exceeded');
  }

  // Increment count and set expiry if it's a new key
  if (current === 0) {
    await kv.set(key, 1, { ex: WINDOW_SIZE });
  } else {
    await kv.incr(key);
  }
} 