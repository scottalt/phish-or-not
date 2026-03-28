/**
 * DEV ONLY: Delete all test users and their data from the dev Supabase instance.
 * Preserves the admin user (ADMIN_USER_ID).
 *
 * Usage: SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... ADMIN_USER_ID=... npx tsx scripts/cleanup-test-users.ts
 *
 * ⚠️  DESTRUCTIVE — only run against dev, never prod.
 */

import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const adminId = process.env.ADMIN_USER_ID;

if (!url || !key) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Safety check: refuse to run against prod
if (url.includes('prod') || url.includes('research.scottaltiparmak')) {
  console.error('REFUSING to run against production. This script is dev-only.');
  process.exit(1);
}

const supabase = createClient(url, key);

async function cleanup() {
  console.log('Fetching all auth users...');

  const { data, error } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (error) { console.error('Failed to list users:', error.message); process.exit(1); }

  const users = data.users;
  const toDelete = users.filter(u => u.id !== adminId);

  console.log(`Found ${users.length} total users, ${toDelete.length} to delete (preserving admin).`);

  if (toDelete.length === 0) {
    console.log('Nothing to delete.');
    return;
  }

  // Delete player data first (cascades handle most, but be explicit)
  const authIds = toDelete.map(u => u.id);

  // Get player IDs for these auth users
  const { data: players } = await supabase
    .from('players')
    .select('id, auth_id')
    .in('auth_id', authIds);

  const playerIds = (players ?? []).map(p => p.id);

  if (playerIds.length > 0) {
    console.log(`Deleting data for ${playerIds.length} players...`);

    // Delete in dependency order
    const tables = [
      'h2h_match_answers',
      'h2h_player_stats',
      'player_achievements',
      'player_streaks',
      'player_seen_moments',
      'player_friends',
      'promo_redemptions',
      'answers',
      'sessions',
      'card_flags',
    ];

    for (const table of tables) {
      const { error: delErr } = await supabase
        .from(table)
        .delete()
        .in('player_id', playerIds);
      if (delErr) {
        // Some tables might not have player_id column — try session_id or skip
        console.log(`  ${table}: ${delErr.message} (skipped)`);
      } else {
        console.log(`  ${table}: cleared`);
      }
    }

    // Delete h2h_matches where either player is being deleted
    for (const pid of playerIds) {
      await supabase.from('h2h_matches').delete().eq('player1_id', pid);
      await supabase.from('h2h_matches').delete().eq('player2_id', pid);
    }
    console.log('  h2h_matches: cleared');

    // Delete players
    const { error: playerErr } = await supabase
      .from('players')
      .delete()
      .in('id', playerIds);
    console.log(`  players: ${playerErr ? playerErr.message : 'cleared'}`);
  }

  // Delete auth users
  console.log(`\nDeleting ${toDelete.length} auth users...`);
  let deleted = 0;
  let failed = 0;
  for (const user of toDelete) {
    const { error: delErr } = await supabase.auth.admin.deleteUser(user.id);
    if (delErr) {
      console.error(`  Failed to delete ${user.email}: ${delErr.message}`);
      failed++;
    } else {
      deleted++;
    }
  }

  console.log(`\nDone. Deleted ${deleted} users, ${failed} failed.`);
  if (adminId) console.log(`Admin user preserved: ${adminId}`);
}

cleanup().catch(console.error);
