'use client';

import { ACHIEVEMENT_MAP, RARITY_COLORS } from '@/lib/achievements';

interface Props {
  achievementIds: string[];
}

export function AchievementToast({ achievementIds }: Props) {
  if (achievementIds.length === 0) return null;

  return (
    <div className="space-y-2">
      {achievementIds.map((id) => {
        const def = ACHIEVEMENT_MAP.get(id);
        if (!def) return null;
        const color = RARITY_COLORS[def.rarity];

        return (
          <div
            key={id}
            className="term-border bg-[#060c06] anim-fade-in-up overflow-hidden"
            style={{ borderColor: `${color}44` }}
          >
            <div
              className="border-b px-3 py-1.5 flex items-center gap-2"
              style={{ borderColor: `${color}33` }}
            >
              <span style={{ color }} className="text-sm font-mono">★</span>
              <span style={{ color }} className="text-sm font-mono tracking-widest font-bold">
                ACHIEVEMENT UNLOCKED
              </span>
            </div>
            <div className="px-3 py-3 flex items-center gap-3">
              <span
                className="text-2xl font-mono anim-rank-pulse"
                style={{ color }}
              >
                {def.icon}
              </span>
              <div className="flex-1 min-w-0">
                <div
                  className="text-sm font-mono font-bold tracking-wider"
                  style={{ color }}
                >
                  {def.name}
                </div>
                <div className="text-[#00aa28] text-sm font-mono mt-0.5">
                  {def.description}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
