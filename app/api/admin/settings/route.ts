import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { getSupabaseAdminClient } from '@/lib/supabase';

// GET /api/admin/settings — read global feature flags
export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  const admin = getSupabaseAdminClient();
  const { data } = await admin
    .from('app_settings')
    .select('value')
    .eq('key', 'feature_flags')
    .maybeSingle();

  return NextResponse.json({ featureFlags: (data?.value as Record<string, boolean>) ?? {} });
}

// PATCH /api/admin/settings — update global feature flags
export async function PATCH(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const body = await req.json();
  if (!body.featureFlags || typeof body.featureFlags !== 'object') {
    return NextResponse.json({ error: 'featureFlags object required' }, { status: 400 });
  }

  const admin = getSupabaseAdminClient();
  const { data, error } = await admin
    .from('app_settings')
    .upsert(
      { key: 'feature_flags', value: body.featureFlags, updated_at: new Date().toISOString() },
      { onConflict: 'key' }
    )
    .select('value')
    .single();

  if (error) return NextResponse.json({ error: 'Update failed' }, { status: 500 });

  return NextResponse.json({ ok: true, featureFlags: data.value });
}
