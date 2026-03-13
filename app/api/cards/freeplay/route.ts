import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/lib/redis';
import { getShuffledDeck } from '@/data/cards';

export async function GET(req: NextRequest) {
  // Rate limit: 10 requests per IP per minute
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const rlKey = `ratelimit:cards-freeplay:${ip}`;
  const rlCount = await redis.incr(rlKey);
  if (rlCount === 1) await redis.expire(rlKey, 60);
  if (rlCount > 10) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const cards = getShuffledDeck(10);

  return NextResponse.json(cards);
}
