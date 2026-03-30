import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase';
import { redis } from '@/lib/redis';
import { THEMES } from '@/lib/themes';

interface RunMeta {
  runId: string;
  playerId: string;
  displayName: string;
  operationName: string;
  score: number;
  floorsCleared: number;
  totalFloors: number;
  deaths: number;
  bestStreak: number;
  clearance: number;
  completedAt: string;
}

// GET /api/roguelike/leaderboard — Top 20 roguelike runs
export async function GET() {
  // ── Read top 20 from Redis sorted set (highest score first) ──
  // zrange with rev:true and LIMIT returns members scored highest to lowest
  const entries = await redis.zrange('leaderboard:roguelike', 0, 19, {
    rev: true,
    withScores: true,
  });

  if (!entries || entries.length === 0) {
    return NextResponse.json({ leaderboard: [] });
  }

  // entries is an array of alternating [member, score] pairs from Upstash
  // When withScores:true, Upstash returns [{member, score}, ...] objects
  type ZEntry = { member: string; score: number };
  const ranked = entries as unknown as ZEntry[];

  const playerIds = ranked.map((e) => e.member);

  // ── Look up player info from Supabase ──
  const admin = getSupabaseAdminClient();
  const { data: players } = await admin
    .from('players')
    .select('id, display_name, level, theme_id')
    .in('id', playerIds);

  const playerMap = new Map(
    (players ?? []).map((p) => [p.id, p]),
  );

  // ── Look up run metadata from Redis ──
  const metaKeys = playerIds.map((id) => `roguelike:meta:${id}`);
  const metaValues = metaKeys.length > 0
    ? await redis.mget<string[]>(...metaKeys)
    : [];

  const metaMap = new Map<string, RunMeta>();
  for (let i = 0; i < playerIds.length; i++) {
    const raw = metaValues[i];
    if (raw) {
      try {
        const meta: RunMeta = typeof raw === 'string' ? JSON.parse(raw) : raw;
        metaMap.set(playerIds[i]!, meta);
      } catch {
        // skip malformed entries
      }
    }
  }

  // ── Build enriched leaderboard entries ──
  const leaderboard = ranked.map((entry, index) => {
    const player = playerMap.get(entry.member);
    const meta = metaMap.get(entry.member);
    const theme = THEMES.find((t) => t.id === (player?.theme_id ?? 'phosphor'));

    return {
      position: index + 1,
      playerId: entry.member,
      displayName: player?.display_name ?? meta?.displayName ?? 'Unknown Agent',
      level: player?.level ?? 1,
      score: entry.score,
      operationName: meta?.operationName ?? null,
      floorsCleared: meta?.floorsCleared ?? null,
      totalFloors: meta?.totalFloors ?? null,
      deaths: meta?.deaths ?? null,
      bestStreak: meta?.bestStreak ?? null,
      clearance: meta?.clearance ?? null,
      completedAt: meta?.completedAt ?? null,
      themeColor: theme?.colors.primary ?? '#00ff41',
      nameEffect: theme?.nameEffect ?? null,
    };
  });

  return NextResponse.json({ leaderboard });
}
