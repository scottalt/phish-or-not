import { xpToNextLevel, MAX_LEVEL } from '@/lib/xp';

interface LevelMeterProps {
  xp: number;
  level: number;
  compact?: boolean; // true = 1 line for HUD use
}

export function LevelMeter({ xp, level, compact }: LevelMeterProps) {
  const { current, needed } = xpToNextLevel(xp);
  const pct = needed === 0 ? 100 : Math.round((current / needed) * 100);
  const isMax = level >= MAX_LEVEL;

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-sm font-mono">
        <span className="text-[var(--c-secondary)]">LVL {level}</span>
        <div className="w-16 h-0.5 bg-[var(--c-dark)]">
          <div className="h-full bg-[var(--c-secondary)]" style={{ width: `${pct}%` }} />
        </div>
        {!isMax && <span className="text-[var(--c-dark)]">{current}/{needed} XP</span>}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm font-mono">
        <span className="text-[var(--c-secondary)]">LEVEL {level}</span>
        <span className="text-[var(--c-dark)]">{isMax ? 'MAX' : `${current} / ${needed} XP`}</span>
      </div>
      <div className="h-1 bg-[var(--c-dark)] w-full">
        <div className="h-full bg-[var(--c-primary)] transition-all duration-700" style={{ width: `${pct}%`, boxShadow: '0 0 6px var(--c-primary), 0 0 12px color-mix(in srgb, var(--c-primary) 40%, transparent)' }} />
      </div>
      <div className="text-right text-sm font-mono text-[var(--c-dark)]">{xp.toLocaleString()} XP total</div>
    </div>
  );
}
