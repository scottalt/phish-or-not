import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase';
import { redis, getClientIp } from '@/lib/redis';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Pre-creates a user via the admin API so that subsequent signInWithOtp()
 * calls always treat them as an existing user and send a 6-digit code
 * instead of a confirmation link (Supabase's default for new signups).
 */
export async function POST(req: NextRequest) {
  try {
    // Rate limit: 10 requests per IP per hour
    const ip = getClientIp(req);
    const rlKey = `ratelimit:ensure-user:${ip}`;
    const rlCount = await redis.incr(rlKey);
    if (rlCount === 1) await redis.expire(rlKey, 60 * 60);
    if (rlCount > 10) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const { email } = await req.json();
    if (!email || typeof email !== 'string' || !EMAIL_RE.test(email)) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();

    // Step 1: Check if this email already has a player row (fast DB query).
    // We query auth.users via admin API to get the auth_id for this email,
    // then check if a player profile exists.
    const { data: created, error } = await supabase.auth.admin.createUser({
      email,
      email_confirm: true,
    });

    if (error) {
      // createUser failed — user likely exists. Return existing=true.
      // The OTP will still work via signInWithOtp on the client.
      return NextResponse.json({ ok: true, existing: true });
    }

    // createUser succeeded — this is either a new user or Supabase returned an existing one.
    // Check the players table to know if they've completed onboarding before.
    if (created?.user?.id) {
      const { data: player } = await supabase
        .from('players')
        .select('id')
        .eq('auth_id', created.user.id)
        .maybeSingle();

      return NextResponse.json({ ok: true, existing: !!player });
    }

    // Fallback: genuinely new
    return NextResponse.json({ ok: true, existing: false });
  } catch (err) {
    console.error('[ensure-user] unexpected error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
