import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase';

export const revalidate = 300; // cache for 5 minutes

export async function GET() {
  try {
    const supabase = getSupabaseAdminClient();

    const { data: answers } = await supabase
      .from('answers')
      .select('correct, technique, is_genai_suspected, genai_confidence, prose_fluency, grammar_quality, confidence, time_from_render_ms, difficulty, type, card_source')
      .eq('game_mode', 'research');

    if (!answers || answers.length === 0) {
      return NextResponse.json({ totalAnswers: 0, insufficient: true });
    }

    const total = answers.length;
    const correct = answers.filter((a) => a.correct).length;
    const overallBypassRate = Math.round(((total - correct) / total) * 100);

    // Bypass rate by technique
    const techniqueMap: Record<string, { total: number; bypassed: number }> = {};
    for (const a of answers) {
      if (!a.technique) continue;
      if (!techniqueMap[a.technique]) techniqueMap[a.technique] = { total: 0, bypassed: 0 };
      techniqueMap[a.technique].total++;
      if (!a.correct) techniqueMap[a.technique].bypassed++;
    }
    const byTechnique = Object.entries(techniqueMap)
      .filter(([, v]) => v.total >= 10)
      .map(([technique, v]) => ({
        technique,
        total: v.total,
        bypassRate: Math.round((v.bypassed / v.total) * 100),
      }))
      .sort((a, b) => b.bypassRate - a.bypassRate);

    // High fluency (4-5) vs low fluency (0-2) bypass rate
    const highFluency = answers.filter((a) => a.prose_fluency !== null && a.prose_fluency >= 4);
    const lowFluency = answers.filter((a) => a.prose_fluency !== null && a.prose_fluency <= 2);
    const highFluencyBypassRate = highFluency.length
      ? Math.round((highFluency.filter((a) => !a.correct).length / highFluency.length) * 100) : null;
    const lowFluencyBypassRate = lowFluency.length
      ? Math.round((lowFluency.filter((a) => !a.correct).length / lowFluency.length) * 100) : null;

    // GenAI suspected (medium/high confidence) bypass rate
    const genaiAnswers = answers.filter((a) => a.is_genai_suspected && ['medium', 'high'].includes(a.genai_confidence ?? ''));
    const nonGenaiAnswers = answers.filter((a) => a.is_genai_suspected === false);
    const genaiBypassRate = genaiAnswers.length
      ? Math.round((genaiAnswers.filter((a) => !a.correct).length / genaiAnswers.length) * 100) : null;
    const traditionalBypassRate = nonGenaiAnswers.length
      ? Math.round((nonGenaiAnswers.filter((a) => !a.correct).length / nonGenaiAnswers.length) * 100) : null;

    // Confidence calibration
    const byConfidence = (['guessing', 'likely', 'certain'] as const).map((conf) => {
      const subset = answers.filter((a) => a.confidence === conf);
      return {
        confidence: conf,
        total: subset.length,
        accuracyRate: subset.length ? Math.round((subset.filter((a) => a.correct).length / subset.length) * 100) : 0,
      };
    });

    return NextResponse.json({
      totalAnswers: total,
      overallBypassRate,
      byTechnique,
      fluency: { highFluencyBypassRate, lowFluencyBypassRate, highFluencySample: highFluency.length, lowFluencySample: lowFluency.length },
      genai: { genaiBypassRate, traditionalBypassRate, genaiSample: genaiAnswers.length, traditionalSample: nonGenaiAnswers.length },
      byConfidence,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
