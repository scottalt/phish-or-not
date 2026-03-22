import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/lib/redis';
import { getSupabaseAdminClient } from '@/lib/supabase';
import { toSafeCard } from '@/lib/card-utils';
import { H2H_CARDS_PER_MATCH, H2H_MATCH_TTL } from '@/lib/h2h';
import type { Card } from '@/lib/types';

// ── POST /api/h2h/cards — Deal cards for an H2H match ──

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const matchId: string | undefined = body?.matchId;

  if (!matchId || !/^[0-9a-f-]{36}$/.test(matchId)) {
    return NextResponse.json({ error: 'Invalid matchId' }, { status: 400 });
  }

  const redisKey = `match-cards:${matchId}`;

  // If cards already dealt for this match, return existing cardIds
  const existing = await redis.get<string>(redisKey);
  if (existing) {
    const existingCards: Card[] = typeof existing === 'string' ? JSON.parse(existing) : existing;
    return NextResponse.json({ cardIds: existingCards.map((c) => c.id) });
  }

  // Fetch freeplay + expert cards from DB
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from('cards_generated')
    .select('*')
    .in('pool', ['freeplay', 'expert'])
    .limit(500);

  if (error || !data || data.length === 0) {
    return NextResponse.json({ error: 'No cards available' }, { status: 500 });
  }

  // Fisher-Yates shuffle
  for (let i = data.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [data[i], data[j]] = [data[j], data[i]];
  }
  const deck = data.slice(0, H2H_CARDS_PER_MATCH);

  const cards: Card[] = deck.map((row) => ({
    id: row.card_id,
    type: row.type,
    isPhishing: row.is_phishing,
    difficulty: row.difficulty,
    from: row.from_address,
    subject: row.subject ?? undefined,
    body: row.body,
    clues: row.clues ?? [],
    explanation: row.explanation ?? '',
    highlights: row.highlights ?? [],
    technique: row.technique ?? null,
    authStatus: (row.auth_status ?? 'unverified') as 'verified' | 'unverified' | 'fail',
    replyTo: row.reply_to ?? undefined,
    attachmentName: row.attachment_name ?? undefined,
    sentAt: row.sent_at ?? undefined,
  }));

  // Store full cards server-side keyed by match
  await redis.set(redisKey, JSON.stringify(cards), { ex: H2H_MATCH_TTL });

  return NextResponse.json({ cardIds: cards.map((c) => c.id) });
}

// ── GET /api/h2h/cards?matchId=xxx — Get safe (stripped) cards for a match ──

export async function GET(req: NextRequest) {
  const matchId = req.nextUrl.searchParams.get('matchId');

  if (!matchId || !/^[0-9a-f-]{36}$/.test(matchId)) {
    return NextResponse.json({ error: 'Invalid matchId' }, { status: 400 });
  }

  const redisKey = `match-cards:${matchId}`;
  const stored = await redis.get<string>(redisKey);

  if (!stored) {
    return NextResponse.json({ error: 'Match not found' }, { status: 404 });
  }

  const cards: Card[] = typeof stored === 'string' ? JSON.parse(stored) : stored;

  return NextResponse.json(cards.map(toSafeCard));
}
