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
    // Rate limit: 50 requests per IP per hour
    const ip = getClientIp(req);
    const rlKey = `ratelimit:ensure-user:${ip}`;
    const rlCount = await redis.incr(rlKey);
    if (rlCount === 1) await redis.expire(rlKey, 60 * 60);
    if (rlCount > 50) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const { email } = await req.json();
    if (!email || typeof email !== 'string' || !EMAIL_RE.test(email)) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();

    // Try to create the user (needed so signInWithOtp sends a code, not a link).
    const { data: created, error } = await supabase.auth.admin.createUser({
      email,
      email_confirm: true,
    });

    // Log everything so we can see what's happening
    console.log(`[ensure-user] email=${email}, error=${error?.message ?? 'none'}, userId=${created?.user?.id ?? 'none'}, created_at=${created?.user?.created_at ?? 'none'}`);

    if (error) {
      // Any createUser error = user likely exists already
      return NextResponse.json({ ok: true, existing: true });
    }

    // createUser succeeded — check if player profile exists
    const userId = created?.user?.id;
    if (userId) {
      const { data: player } = await supabase
        .from('players')
        .select('id')
        .eq('auth_id', userId)
        .maybeSingle();

      console.log(`[ensure-user] player lookup: userId=${userId}, found=${!!player}`);
      return NextResponse.json({ ok: true, existing: !!player });
    }

    console.log(`[ensure-user] no user returned, defaulting to existing=false`);
    return NextResponse.json({ ok: true, existing: false });
  } catch (err) {
    console.error('[ensure-user] unexpected error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
