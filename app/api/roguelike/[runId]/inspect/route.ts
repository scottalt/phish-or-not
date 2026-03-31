import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getSupabaseAdminClient } from '@/lib/supabase';
import { redis } from '@/lib/redis';
import {
  type RoguelikeRunState,
  ROGUELIKE_SESSION_TTL,
  INVESTIGATION_INSPECT_COST,
} from '@/lib/roguelike';
import type { Card } from '@/lib/types';

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

// POST /api/roguelike/[runId]/inspect — Inspect a card field (server-side Intel deduction)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ runId: string }> },
) {
  const { runId } = await params;

  try {
    // ── Auth ──
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

    const playerId = await getPlayerId(user.id);
    if (!playerId) return NextResponse.json({ error: 'Player not found' }, { status: 404 });

    // ── Parse body ──
    const body = await req.json().catch(() => null);
    if (!body?.field || !['from', 'subject'].includes(body.field)) {
      return NextResponse.json({ error: 'Invalid field. Must be "from" or "subject".' }, { status: 400 });
    }
    const field: string = body.field;

    // ── Load state ──
    const state = await loadState(runId);
    if (!state) return NextResponse.json({ error: 'Run expired. Sessions last 1 hour.' }, { status: 404 });
    if (state.playerId !== playerId) return NextResponse.json({ error: 'Not your run' }, { status: 403 });
    if (state.status !== 'active') return NextResponse.json({ error: 'Run is not active' }, { status: 409 });

    // ── Determine cost (free inspection or Intel) ──
    let newFreeInspections = state.freeInspections ?? 0;
    let newIntel = state.intel;

    if (newFreeInspections > 0) {
      newFreeInspections -= 1;
    } else if (newIntel >= INVESTIGATION_INSPECT_COST) {
      newIntel -= INVESTIGATION_INSPECT_COST;
    } else {
      return NextResponse.json({ error: 'Not enough Intel' }, { status: 400 });
    }

    // ── Load the current card from Redis ──
    const currentCardId = state.currentFloorCardIds[state.currentCardIndex];
    if (!currentCardId) {
      return NextResponse.json({ error: 'No current card' }, { status: 400 });
    }

    const cardsJson = await redis.get<string>(`roguelike:cards:${runId}:${state.currentFloor}`);
    if (!cardsJson) {
      return NextResponse.json({ error: 'Floor cards not found' }, { status: 404 });
    }
    const floorCards: Card[] = typeof cardsJson === 'string' ? JSON.parse(cardsJson) : cardsJson;
    const card = floorCards.find((c) => c.id === currentCardId);
    if (!card) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 });
    }

    // ── Update state ──
    const updatedState: RoguelikeRunState = {
      ...state,
      intel: newIntel,
      freeInspections: newFreeInspections > 0 ? newFreeInspections : undefined,
    };
    await redis.set(`roguelike:run:${runId}`, JSON.stringify(updatedState), {
      ex: ROGUELIKE_SESSION_TTL,
    });

    return NextResponse.json({
      authStatus: card.authStatus ?? 'verified',
      intel: newIntel,
      freeInspections: newFreeInspections,
    });
  } catch (err) {
    console.error(`[roguelike/${runId}/inspect] Unhandled error:`, err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
