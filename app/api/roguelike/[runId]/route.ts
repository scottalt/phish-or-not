import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getSupabaseAdminClient } from '@/lib/supabase';
import { redis } from '@/lib/redis';
import {
  type RoguelikeRunState,
  ROGUELIKE_SESSION_TTL,
  calculateRunClearance,
  calculateFinalScore,
} from '@/lib/roguelike';

async function getPlayerId(userId: string): Promise<string | null> {
  const admin = getSupabaseAdminClient();
  const { data } = await admin.from('players').select('id').eq('auth_id', userId).single();
  return data?.id ?? null;
}

async function loadState(runId: string): Promise<RoguelikeRunState | null> {
  const stored = await redis.get<string>(`roguelike:run:${runId}`);
  if (!stored) return null;
  return typeof stored === 'string' ? JSON.parse(stored) : stored;
}

async function authAndLoad(
  userId: string,
  runId: string,
): Promise<{ playerId: string; state: RoguelikeRunState } | NextResponse> {
  const playerId = await getPlayerId(userId);
  if (!playerId) return NextResponse.json({ error: 'Player not found' }, { status: 404 });

  const state = await loadState(runId);
  if (!state) return NextResponse.json({ error: 'Run not found or expired' }, { status: 404 });
  if (state.playerId !== playerId) return NextResponse.json({ error: 'Not your run' }, { status: 403 });

  return { playerId, state };
}

// GET /api/roguelike/[runId] — Get current run state
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ runId: string }> },
) {
  const { runId } = await params;

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const result = await authAndLoad(user.id, runId);
  if (result instanceof NextResponse) return result;
  const { state } = result;

  return NextResponse.json({
    runId: state.runId,
    operationName: state.operationName,
    currentFloor: state.currentFloor,
    totalFloors: state.totalFloors,
    lives: state.lives,
    maxLives: state.maxLives,
    intel: state.intel,
    score: state.score,
    streak: state.streak,
    bestStreak: state.bestStreak,
    deaths: state.deaths,
    perks: state.perks,
    floorsCleared: state.floorsCleared,
    currentCardIndex: state.currentCardIndex,
    currentGimmick: state.currentGimmick,
    floorGimmicks: state.floorGimmicks,
    startedAt: state.startedAt,
    completedAt: state.completedAt,
    status: state.status,
  });
}

// PATCH /api/roguelike/[runId] — Finalize run, calculate score, award clearance
export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ runId: string }> },
) {
  const { runId } = await params;

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const result = await authAndLoad(user.id, runId);
  if (result instanceof NextResponse) return result;
  const { playerId, state } = result;

  // Only finalize if in a terminal state
  if (state.status === 'active') {
    return NextResponse.json({ error: 'Run is still active' }, { status: 409 });
  }

  // ── Calculate final score and clearance ──
  const finalScore = calculateFinalScore(
    state.score,
    state.floorsCleared,
    state.deaths,
    state.bestStreak,
    state.totalFloors,
  );
  const clearance = calculateRunClearance(state.floorsCleared, state.deaths, state.totalFloors);
  const completedAt = state.completedAt ?? new Date().toISOString();

  const admin = getSupabaseAdminClient();

  // ── Update DB record ──
  const dbStatus = state.status === 'completed' ? 'complete' : 'abandoned';
  await admin
    .from('roguelike_runs')
    .update({
      score: finalScore,
      floor_reached: state.currentFloor,
      floors_cleared: state.floorsCleared,
      lives_remaining: state.lives,
      intel_earned: state.intel,
      clearance_earned: clearance,
      perks_purchased: state.perks,
      best_streak: state.bestStreak,
      deaths: state.deaths,
      status: dbStatus,
      ended_at: completedAt,
    })
    .eq('id', runId);

  // ── Award clearance to player (read-then-increment) ──
  const { data: playerClearance } = await admin
    .from('players')
    .select('roguelike_clearance')
    .eq('id', playerId)
    .single();
  if (playerClearance) {
    await admin
      .from('players')
      .update({ roguelike_clearance: (playerClearance.roguelike_clearance ?? 0) + clearance })
      .eq('id', playerId);
  }

  // ── Update Redis leaderboard (sorted set) ──
  const { data: playerRow } = await admin
    .from('players')
    .select('display_name')
    .eq('id', playerId)
    .single();

  const displayName = playerRow?.display_name ?? playerId;

  // Use zadd with the final score; member is playerId so each player has one entry (best score wins via nx+gt)
  await redis.zadd('leaderboard:roguelike', { score: finalScore, member: playerId });

  // ── Store run metadata in Redis for leaderboard display ──
  const runMeta = {
    runId,
    playerId,
    displayName,
    operationName: state.operationName,
    score: finalScore,
    floorsCleared: state.floorsCleared,
    totalFloors: state.totalFloors,
    deaths: state.deaths,
    bestStreak: state.bestStreak,
    clearance,
    completedAt,
  };
  await redis.set(`roguelike:meta:${playerId}`, JSON.stringify(runMeta), {
    ex: ROGUELIKE_SESSION_TTL * 24 * 7, // keep for 7 days
  });

  // ── Clean up active run key ──
  await redis.del(`roguelike:active:${playerId}`);

  return NextResponse.json({
    finalScore,
    clearance,
    floorsCleared: state.floorsCleared,
    totalFloors: state.totalFloors,
    deaths: state.deaths,
    bestStreak: state.bestStreak,
    status: state.status,
    completedAt,
  });
}
