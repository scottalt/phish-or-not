import { NextResponse } from 'next/server';
import { getSupabaseAdminClient, fetchAllRows } from '@/lib/supabase';
import { requireAdmin } from '@/lib/adminAuth';

const TECHNIQUES = ['urgency', 'authority-impersonation', 'credential-harvest', 'hyper-personalization', 'pretexting', 'fluent-prose'];

export async function GET() {
  try {
    const denied = await requireAdmin();
    if (denied) return denied;

    const supabase = getSupabaseAdminClient();

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const [answers, todayResult, players] = await Promise.all([
      fetchAllRows(({ from, to }) =>
        supabase.from('answers').select('correct, technique, is_phishing, confidence, player_id, session_id').eq('game_mode', 'research').range(from, to),
      ),
      supabase.from('answers').select('id', { count: 'exact', head: true }).eq('game_mode', 'research').gte('created_at', today.toISOString()),
      fetchAllRows(({ from, to }) =>
        supabase.from('players').select('research_sessions_completed, research_graduated').gte('research_sessions_completed', 1).range(from, to),
      ),
    ]);
    const total = answers.length;
    const correct = answers.filter(a => a.correct).length;
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
    const sessions = new Set(answers.map(a => a.session_id)).size;
    const graduatedCount = players.filter(p => p.research_graduated).length;

    // Per-technique breakdown (no minimum threshold — show all data)
    const byTechnique = TECHNIQUES.map(technique => {
      const subset = answers.filter(a => a.technique === technique && a.is_phishing);
      const techCorrect = subset.filter(a => a.correct).length;
      return {
        technique,
        total: subset.length,
        correct: techCorrect,
        accuracy: subset.length > 0 ? Math.round((techCorrect / subset.length) * 100) : null,
      };
    });

    return NextResponse.json({
      totalAnswers: total,
      answersToday: todayResult.count ?? 0,
      distinctSessions: sessions,
      overallAccuracy: accuracy,
      playerCount: players.length,
      graduatedCount,
      byTechnique,
    });
  } catch (err) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
