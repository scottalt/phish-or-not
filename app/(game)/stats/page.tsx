'use client';

import { useState, useEffect } from 'react';
import { usePlayer } from '@/lib/usePlayer';
import { getRankFromPoints, H2H_DAILY_RATED_CAP } from '@/lib/h2h';

interface Stats {
  totalAnswers: number;
  totalCorrect: number;
  overallAccuracy: number;
  phishingCatchRate: number | null;
  legitAccuracy: number | null;
  byDifficulty: Record<string, { total: number; correct: number }>;
  byConfidence: Record<string, { total: number; correct: number }>;
  avgTimeMs: number | null;
  headersRate: number;
  urlRate: number;
  byMode: Record<string, { total: number; correct: number }>;
  activity: Record<string, number>;
}

const DIFFICULTY_ORDER = ['easy', 'medium', 'hard', 'extreme'];
const CONFIDENCE_ORDER = ['guessing', 'likely', 'certain'];
const MODE_LABELS: Record<string, string> = { freeplay: 'FREEPLAY', daily: 'DAILY', expert: 'EXPERT' };

function AccuracyBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="w-full h-1.5 bg-[#0a140a] mt-1">
      <div className="h-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
    </div>
  );
}

export default function StatsPage() {
  const { profile, loading, signedIn } = usePlayer();
  const [statsTab, setStatsTab] = useState<'solo' | 'h2h'>('solo');
  const [stats, setStats] = useState<Stats | null>(null);
  const [empty, setEmpty] = useState(false);
  const [error, setError] = useState('');
  const [h2hMatchStats, setH2HMatchStats] = useState<{
    rankLabel: string; rankIcon: string; rankPoints: number; rankColor: string;
    wins: number; losses: number; winStreak: number; bestWinStreak: number;
    peakRankPoints: number; ratedMatchesToday: number;
  } | null>(null);

  useEffect(() => {
    if (!signedIn) return;
    fetch('/api/player/stats')
      .then(r => {
        if (r.status === 403) { setError('LOCKED'); return null; }
        if (!r.ok) { setError('FAILED'); return null; }
        return r.json();
      })
      .then(data => {
        if (!data) return;
        if (data.empty) { setEmpty(true); return; }
        setStats(data);
      })
      .catch(() => setError('FAILED'));

    fetch('/api/h2h/stats')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data && !data.error) setH2HMatchStats(data); })
      .catch(() => {});
  }, [signedIn]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[var(--c-bg-alt)] flex items-center justify-center px-4 lg:pt-16 pb-20 lg:pb-8">
        <span className="text-[var(--c-secondary)] text-sm font-mono">LOADING...</span>
      </main>
    );
  }

  if (!signedIn || !profile) {
    return (
      <main className="min-h-screen bg-[var(--c-bg-alt)] flex items-center justify-center px-4 lg:pt-16 pb-20 lg:pb-8">
        <div className="w-full max-w-sm term-border bg-[var(--c-bg)] px-4 py-6 text-center space-y-3">
          <div className="text-[var(--c-secondary)] text-sm font-mono tracking-widest">NOT_AUTHENTICATED</div>
        </div>
      </main>
    );
  }

  if (error === 'LOCKED') {
    return (
      <main className="min-h-screen bg-[var(--c-bg-alt)] flex items-center justify-center px-4 lg:pt-16 pb-20 lg:pb-8">
        <div className="w-full max-w-sm term-border bg-[var(--c-bg)] px-4 py-6 text-center space-y-3">
          <div className="text-[var(--c-accent)] text-sm font-mono tracking-widest">STATS_LOCKED</div>
          <div className="text-[var(--c-muted)] text-sm font-mono">Complete 30 research answers to unlock your personal stats.</div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-[var(--c-bg-alt)] flex items-center justify-center px-4 lg:pt-16 pb-20 lg:pb-8">
        <div className="w-full max-w-sm term-border bg-[var(--c-bg)] px-4 py-6 text-center space-y-3">
          <div className="text-[#ff3333] text-sm font-mono">LOAD_FAILED</div>
        </div>
      </main>
    );
  }

  if (empty) {
    return (
      <main className="min-h-screen bg-[var(--c-bg-alt)] flex items-center justify-center px-4 lg:pt-16 pb-20 lg:pb-8">
        <div className="w-full max-w-sm term-border bg-[var(--c-bg)] px-4 py-6 text-center space-y-3">
          <div className="text-[var(--c-secondary)] text-sm font-mono tracking-widest">NO_DATA</div>
          <div className="text-[var(--c-muted)] text-sm font-mono">Play some rounds in Freeplay, Daily, or Expert to see your stats.</div>
        </div>
      </main>
    );
  }

  if (!stats) {
    return (
      <main className="min-h-screen bg-[var(--c-bg-alt)] flex items-center justify-center px-4 lg:pt-16 pb-20 lg:pb-8">
        <span className="text-[var(--c-secondary)] text-sm font-mono">LOADING...</span>
      </main>
    );
  }

  const avgTimeSec = stats.avgTimeMs ? (stats.avgTimeMs / 1000).toFixed(1) : null;

  // Activity chart - max value for scaling
  const activityValues = Object.values(stats.activity);
  const maxActivity = Math.max(...activityValues, 1);

  return (
    <main className="min-h-screen bg-[var(--c-bg-alt)] flex items-start justify-center px-4 py-8 lg:pt-16 pb-20 lg:pb-8">
      <div className="w-full max-w-sm lg:max-w-4xl space-y-4 lg:space-y-6">
        {/* Header */}
        <div className="term-border bg-[var(--c-bg)]">
          <div className="border-b border-[color-mix(in_srgb,var(--c-primary)_35%,transparent)] px-3 py-1.5">
            <span className="text-[var(--c-secondary)] text-sm lg:text-base tracking-widest">OPERATOR_STATS</span>
          </div>
        </div>

        {/* Tab bar */}
        <div className="term-border bg-[var(--c-bg)] flex">
          <button
            onClick={() => setStatsTab('solo')}
            className={`flex-1 py-2 text-sm font-mono tracking-widest transition-colors ${
              statsTab === 'solo'
                ? 'text-[var(--c-primary)] bg-[color-mix(in_srgb,var(--c-primary)_6%,transparent)] border-b-2 border-[var(--c-primary)]'
                : 'text-[var(--c-secondary)] hover:text-[var(--c-primary)] border-b-2 border-transparent'
            }`}
          >
            SOLO
          </button>
          <button
            onClick={() => setStatsTab('h2h')}
            className={`flex-1 py-2 text-sm font-mono tracking-widest transition-colors ${
              statsTab === 'h2h'
                ? 'text-[#ff0080] bg-[rgba(255,0,128,0.06)] border-b-2 border-[#ff0080]'
                : 'text-[var(--c-secondary)] hover:text-[#ff0080] border-b-2 border-transparent'
            }`}
          >
            HEAD 2 HEAD
          </button>
        </div>

        {statsTab === 'solo' && (
          <>
            {/* Core stats */}
            <div className="term-border bg-[var(--c-bg)]">
              <div className="grid grid-cols-3 divide-x divide-[color-mix(in_srgb,var(--c-primary)_10%,transparent)]">
                <div className="px-3 py-4 text-center">
                  <div className="text-2xl font-black font-mono text-[var(--c-primary)]">{stats.overallAccuracy}%</div>
                  <div className="text-sm font-mono text-[var(--c-muted)] mt-1">ACCURACY</div>
                </div>
                <div className="px-3 py-4 text-center">
                  <div className="text-2xl font-black font-mono text-[var(--c-primary)]">{stats.totalAnswers}</div>
                  <div className="text-sm font-mono text-[var(--c-muted)] mt-1">ANALYZED</div>
                </div>
                <div className="px-3 py-4 text-center">
                  <div className="text-2xl font-black font-mono text-[var(--c-primary)]">{avgTimeSec ?? '—'}s</div>
                  <div className="text-sm font-mono text-[var(--c-muted)] mt-1">AVG TIME</div>
                </div>
              </div>
            </div>

            {/* Detection split */}
            <div className="grid grid-cols-2 gap-3">
              <div className="term-border bg-[var(--c-bg)] border-[rgba(255,51,51,0.3)] text-center px-3 py-3">
                <div className="text-[#ff3333] text-2xl font-black font-mono">{stats.phishingCatchRate ?? '—'}%</div>
                <div className="text-sm font-mono text-[var(--c-secondary)] mt-1 tracking-wider">THREATS CAUGHT</div>
              </div>
              <div className="term-border bg-[var(--c-bg)] border-[color-mix(in_srgb,var(--c-primary)_30%,transparent)] text-center px-3 py-3">
                <div className="text-[var(--c-primary)] text-2xl font-black font-mono">{stats.legitAccuracy ?? '—'}%</div>
                <div className="text-sm font-mono text-[var(--c-secondary)] mt-1 tracking-wider">LEGIT CLEARED</div>
              </div>
            </div>

            {/* Two-column layout on desktop */}
            <div className="lg:grid lg:grid-cols-2 lg:gap-4 space-y-4 lg:space-y-0">
              {/* Left column */}
              <div className="space-y-4">
                {/* By game mode */}
                <div className="term-border bg-[var(--c-bg)]">
                  <div className="border-b border-[color-mix(in_srgb,var(--c-primary)_35%,transparent)] px-3 py-1.5">
                    <span className="text-[var(--c-secondary)] text-sm lg:text-base tracking-widest">BY_GAME_MODE</span>
                  </div>
                  <div className="divide-y divide-[color-mix(in_srgb,var(--c-primary)_8%,transparent)]">
                    {Object.entries(stats.byMode).map(([mode, data]) => {
                      const pct = Math.round((data.correct / data.total) * 100);
                      const color = pct >= 80 ? 'var(--c-primary)' : pct >= 60 ? '#ffaa00' : '#ff3333';
                      return (
                        <div key={mode} className="px-3 py-2.5 lg:py-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[var(--c-secondary)] text-sm lg:text-base font-mono tracking-wider">{MODE_LABELS[mode] ?? mode.toUpperCase()}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-[var(--c-muted)] text-sm lg:text-base font-mono">{data.total} answers</span>
                              <span className="text-sm lg:text-base font-mono font-bold" style={{ color }}>{pct}%</span>
                            </div>
                          </div>
                          <AccuracyBar pct={pct} color={color} />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Tool usage */}
                <div className="term-border bg-[var(--c-bg)]">
                  <div className="border-b border-[color-mix(in_srgb,var(--c-primary)_35%,transparent)] px-3 py-1.5">
                    <span className="text-[var(--c-secondary)] text-sm lg:text-base tracking-widest">TOOL_USAGE</span>
                  </div>
                  <div className="divide-y divide-[color-mix(in_srgb,var(--c-primary)_8%,transparent)]">
                    <div className="px-3 py-2.5 lg:py-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[var(--c-secondary)] text-sm lg:text-base font-mono tracking-wider">HEADERS CHECKED</span>
                        <span className="text-sm lg:text-base font-mono font-bold text-[var(--c-primary)]">{stats.headersRate}%</span>
                      </div>
                      <AccuracyBar pct={stats.headersRate} color="var(--c-secondary)" />
                    </div>
                    <div className="px-3 py-2.5 lg:py-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[var(--c-secondary)] text-sm lg:text-base font-mono tracking-wider">URLS INSPECTED</span>
                        <span className="text-sm lg:text-base font-mono font-bold text-[var(--c-primary)]">{stats.urlRate}%</span>
                      </div>
                      <AccuracyBar pct={stats.urlRate} color="var(--c-secondary)" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Right column */}
              <div className="space-y-4">
                {/* By difficulty */}
                <div className="term-border bg-[var(--c-bg)]">
                  <div className="border-b border-[color-mix(in_srgb,var(--c-primary)_35%,transparent)] px-3 py-1.5">
                    <span className="text-[var(--c-secondary)] text-sm lg:text-base tracking-widest">ACCURACY_BY_DIFFICULTY</span>
                  </div>
                  <div className="divide-y divide-[color-mix(in_srgb,var(--c-primary)_8%,transparent)]">
                    {DIFFICULTY_ORDER.map(d => {
                      const data = stats.byDifficulty[d];
                      if (!data || data.total < 3) return null;
                      const pct = Math.round((data.correct / data.total) * 100);
                      const color = pct >= 80 ? 'var(--c-primary)' : pct >= 60 ? '#ffaa00' : '#ff3333';
                      return (
                        <div key={d} className="px-3 py-2.5 lg:py-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[var(--c-secondary)] text-sm lg:text-base font-mono tracking-wider">{d.toUpperCase()}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-[var(--c-muted)] text-sm lg:text-base font-mono">{data.correct}/{data.total}</span>
                              <span className="text-sm lg:text-base font-mono font-bold" style={{ color }}>{pct}%</span>
                            </div>
                          </div>
                          <AccuracyBar pct={pct} color={color} />
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Confidence calibration */}
                <div className="term-border bg-[var(--c-bg)]">
                  <div className="border-b border-[color-mix(in_srgb,var(--c-primary)_35%,transparent)] px-3 py-1.5">
                    <span className="text-[var(--c-secondary)] text-sm lg:text-base tracking-widest">CONFIDENCE_CALIBRATION</span>
                  </div>
                  <div className="divide-y divide-[color-mix(in_srgb,var(--c-primary)_8%,transparent)]">
                    {CONFIDENCE_ORDER.map(c => {
                      const data = stats.byConfidence[c];
                      if (!data || data.total < 3) return null;
                      const pct = Math.round((data.correct / data.total) * 100);
                      const color = c === 'certain' ? (pct >= 90 ? 'var(--c-primary)' : '#ff3333')
                        : c === 'likely' ? (pct >= 70 ? 'var(--c-primary)' : '#ffaa00')
                        : 'var(--c-secondary)';
                      return (
                        <div key={c} className="px-3 py-2.5 lg:py-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[var(--c-secondary)] text-sm lg:text-base font-mono tracking-wider">{c.toUpperCase()}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-[var(--c-muted)] text-sm lg:text-base font-mono">{data.correct}/{data.total}</span>
                              <span className="text-sm lg:text-base font-mono font-bold" style={{ color }}>{pct}%</span>
                            </div>
                          </div>
                          <AccuracyBar pct={pct} color={color} />
                        </div>
                      );
                    })}
                  </div>
                  <div className="px-3 py-2 text-sm lg:text-base font-mono text-[var(--c-muted)]">
                    CERTAIN should be 90%+. If not, recalibrate.
                  </div>
                </div>
              </div>
            </div>

            {/* Activity heatmap */}
            <div className="term-border bg-[var(--c-bg)]">
              <div className="border-b border-[color-mix(in_srgb,var(--c-primary)_35%,transparent)] px-3 py-1.5">
                <span className="text-[var(--c-secondary)] text-sm lg:text-base tracking-widest">ACTIVITY_14D</span>
              </div>
              <div className="px-3 py-3">
                <div className="flex gap-1 items-end h-12 lg:h-16">
                  {Object.entries(stats.activity).map(([date, count]) => {
                    const height = count > 0 ? Math.max(15, (count / maxActivity) * 100) : 4;
                    const opacity = count > 0 ? 0.3 + (count / maxActivity) * 0.7 : 0.08;
                    return (
                      <div
                        key={date}
                        className="flex-1 rounded-sm"
                        style={{
                          height: `${height}%`,
                          backgroundColor: 'var(--c-primary)',
                          opacity,
                        }}
                        title={`${date}: ${count} answers`}
                      />
                    );
                  })}
                </div>
                <div className="flex justify-between mt-1.5">
                  <span className="text-[var(--c-muted)] text-xs font-mono">{Object.keys(stats.activity)[0]?.slice(5)}</span>
                  <span className="text-[var(--c-muted)] text-xs font-mono">TODAY</span>
                </div>
              </div>
            </div>
          </>
        )}

        {statsTab === 'h2h' && (
          <>
            {!h2hMatchStats || (h2hMatchStats.wins === 0 && h2hMatchStats.losses === 0) ? (
              <div className="term-border bg-[var(--c-bg)] px-4 py-6 text-center space-y-2">
                <div className="text-[var(--c-secondary)] text-sm font-mono tracking-widest">NO_H2H_DATA</div>
                <div className="text-[var(--c-muted)] text-sm font-mono">No H2H matches played yet.</div>
              </div>
            ) : (
              <>
                {/* Rank card */}
                <div className="term-border bg-[var(--c-bg)]" style={{ borderColor: `${h2hMatchStats.rankColor}50` }}>
                  <div className="border-b px-3 py-1.5" style={{ borderColor: `${h2hMatchStats.rankColor}50` }}>
                    <span className="text-sm lg:text-base tracking-widest" style={{ color: h2hMatchStats.rankColor }}>CURRENT_RANK</span>
                  </div>
                  <div className="px-4 py-5 text-center space-y-1">
                    <div className="text-3xl font-mono" style={{ color: h2hMatchStats.rankColor }}>{h2hMatchStats.rankIcon}</div>
                    <div className="text-xl font-black font-mono tracking-widest" style={{ color: h2hMatchStats.rankColor }}>{h2hMatchStats.rankLabel}</div>
                    <div className="text-sm font-mono text-[var(--c-muted)]">{h2hMatchStats.rankPoints} RP</div>
                  </div>
                </div>

                {/* Record */}
                {(() => {
                  const totalMatches = h2hMatchStats.wins + h2hMatchStats.losses;
                  const winrate = totalMatches > 0 ? Math.round((h2hMatchStats.wins / totalMatches) * 100) : 0;
                  return (
                    <div className="term-border bg-[var(--c-bg)]">
                      <div className="border-b border-[rgba(255,0,128,0.3)] px-3 py-1.5">
                        <span className="text-[#ff0080] text-sm lg:text-base tracking-widest">MATCH_RECORD</span>
                      </div>
                      <div className="grid grid-cols-3 divide-x divide-[rgba(255,0,128,0.1)]">
                        <div className="px-3 py-4 text-center">
                          <div className="text-2xl font-black font-mono text-[var(--c-primary)]">{h2hMatchStats.wins}</div>
                          <div className="text-sm font-mono text-[var(--c-muted)] mt-1">WINS</div>
                        </div>
                        <div className="px-3 py-4 text-center">
                          <div className="text-2xl font-black font-mono text-[#ff3333]">{h2hMatchStats.losses}</div>
                          <div className="text-sm font-mono text-[var(--c-muted)] mt-1">LOSSES</div>
                        </div>
                        <div className="px-3 py-4 text-center">
                          <div className="text-2xl font-black font-mono text-[#ff0080]">{winrate}%</div>
                          <div className="text-sm font-mono text-[var(--c-muted)] mt-1">WINRATE</div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Streaks & Peak */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="term-border bg-[var(--c-bg)] border-[rgba(255,0,128,0.3)]">
                    <div className="border-b border-[rgba(255,0,128,0.3)] px-3 py-1.5">
                      <span className="text-[#ff0080] text-sm tracking-widest">STREAKS</span>
                    </div>
                    <div className="divide-y divide-[rgba(255,0,128,0.08)]">
                      <div className="px-3 py-2.5 flex items-center justify-between">
                        <span className="text-[var(--c-secondary)] text-sm font-mono tracking-wider">CURRENT</span>
                        <span className="text-sm font-mono font-bold text-[#ff0080]">{h2hMatchStats.winStreak}</span>
                      </div>
                      <div className="px-3 py-2.5 flex items-center justify-between">
                        <span className="text-[var(--c-secondary)] text-sm font-mono tracking-wider">BEST</span>
                        <span className="text-sm font-mono font-bold text-[#ff0080]">{h2hMatchStats.bestWinStreak}</span>
                      </div>
                    </div>
                  </div>

                  <div className="term-border bg-[var(--c-bg)] border-[rgba(255,0,128,0.3)]">
                    <div className="border-b border-[rgba(255,0,128,0.3)] px-3 py-1.5">
                      <span className="text-[#ff0080] text-sm tracking-widest">MILESTONES</span>
                    </div>
                    <div className="divide-y divide-[rgba(255,0,128,0.08)]">
                      <div className="px-3 py-2.5 flex items-center justify-between">
                        <span className="text-[var(--c-secondary)] text-sm font-mono tracking-wider">PEAK RP</span>
                        <span className="text-sm font-mono font-bold" style={{ color: getRankFromPoints(h2hMatchStats.peakRankPoints).color }}>{h2hMatchStats.peakRankPoints}</span>
                      </div>
                      <div className="px-3 py-2.5 flex items-center justify-between">
                        <span className="text-[var(--c-secondary)] text-sm font-mono tracking-wider">PEAK RANK</span>
                        <span className="text-sm font-mono font-bold" style={{ color: getRankFromPoints(h2hMatchStats.peakRankPoints).color }}>{getRankFromPoints(h2hMatchStats.peakRankPoints).label}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Matches today */}
                <div className="term-border bg-[var(--c-bg)] border-[rgba(255,0,128,0.3)]">
                  <div className="px-3 py-3 flex items-center justify-between">
                    <span className="text-[var(--c-secondary)] text-sm font-mono tracking-wider">RATED_TODAY</span>
                    <span className="text-sm font-mono font-bold text-[#ff0080]">{h2hMatchStats.ratedMatchesToday} / {H2H_DAILY_RATED_CAP}</span>
                  </div>
                  <div className="px-3 pb-3">
                    <div className="w-full h-1.5 bg-[#0a140a]">
                      <div className="h-full transition-all duration-500 bg-[#ff0080]" style={{ width: `${Math.min(100, (h2hMatchStats.ratedMatchesToday / H2H_DAILY_RATED_CAP) * 100)}%` }} />
                    </div>
                  </div>
                </div>
              </>
            )}
          </>
        )}

      </div>
    </main>
  );
}
