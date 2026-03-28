'use client';

import { useState, useEffect, useRef } from 'react';
import { usePlayer } from '@/lib/usePlayer';
import { useSigint } from '@/lib/SigintContext';
import { ACHIEVEMENTS, RARITY_COLORS, type AchievementRarity } from '@/lib/achievements';

interface AdminMessage {
  id: string;
  lines: string[];
  buttonText: string;
  isGlobal: boolean;
  achievementId: string | null;
  createdAt: string;
}

export function AnnouncementBanner() {
  const { signedIn, profile } = usePlayer();
  const { triggerCustom } = useSigint();
  const [allGlobals, setAllGlobals] = useState<AdminMessage[]>([]);
  const [bannerVisible, setBannerVisible] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const fetchedRef = useRef(false);

  function markSeen(msg: AdminMessage) {
    fetch('/api/player/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messageId: msg.id }),
    }).catch(() => {});
  }

  function substituteVars(line: string): string {
    return line
      .replace(/\{callsign\}/gi, profile?.displayName ?? 'operative')
      .replace(/\{level\}/gi, String(profile?.level ?? 1))
      .replace(/\{xp\}/gi, String(profile?.xp ?? 0));
  }

  useEffect(() => {
    if (!signedIn || fetchedRef.current) return;
    fetchedRef.current = true;

    fetch('/api/player/messages')
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (!data?.messages?.length) return;
        const msgs = data.messages as AdminMessage[];

        // Queue all targeted messages through SigintContext (shares the overlay queue with moments)
        const targeted = msgs.filter((m) => !m.isGlobal);
        for (const msg of targeted) {
          // Look up achievement for reveal card
          const achDef = msg.achievementId ? ACHIEVEMENTS.find((a) => a.id === msg.achievementId) : null;
          const reveal = achDef ? {
            icon: achDef.icon,
            name: achDef.name,
            description: achDef.description,
            rarity: achDef.rarity,
            color: RARITY_COLORS[achDef.rarity as AchievementRarity],
          } : null;

          triggerCustom(
            msg.lines.map(substituteVars),
            msg.buttonText,
            () => {
              markSeen(msg);
              // Grant the achievement on dismiss
              if (msg.achievementId) {
                fetch('/api/player/messages', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ messageId: msg.id, grantAchievement: msg.achievementId }),
                }).catch(() => {});
              }
            },
            reveal,
          );
        }

        // Global messages show as ticker banner
        const globals = msgs.filter((m) => m.isGlobal);
        if (globals.length > 0) {
          setAllGlobals(globals);
          setTimeout(() => setBannerVisible(true), 2000);
          // Auto-dismiss after 3 full scroll passes (20s each = 60s) + 2s entry delay
          setTimeout(() => {
            setBannerDismissed(true);
            for (const g of globals) markSeen(g);
          }, 62000);
        }
      })
      .catch(() => {});
  }, [signedIn]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleBannerDismiss() {
    for (const g of allGlobals) markSeen(g);
    setBannerDismissed(true);
  }

  const tickerText = allGlobals.length > 0
    ? allGlobals.map((g) => `⚡ ${g.lines.join('  ·  ')}`).join('     ///     ')
    : '';

  // Only render the ticker — targeted messages go through SigintContext
  if (!allGlobals.length || bannerDismissed || !bannerVisible) return null;

  return (
    <div className="fixed bottom-16 lg:bottom-0 left-0 right-0 z-50 pointer-events-none">
      <div className="bg-[color-mix(in_srgb,var(--c-bg)_92%,transparent)] border-t border-[color-mix(in_srgb,var(--c-accent)_40%,transparent)] backdrop-blur-sm">
        <div className="flex items-center">
          <div className="flex-1 overflow-hidden py-1.5">
            <div className="ticker-scroll whitespace-nowrap text-[var(--c-accent)] text-xs font-mono tracking-wider">
              <span className="inline-block pr-[50vw]">{tickerText}</span>
              <span className="inline-block pr-[50vw]">{tickerText}</span>
            </div>
          </div>
          <button
            onClick={handleBannerDismiss}
            className="pointer-events-auto px-3 py-1.5 text-[var(--c-muted)] text-[10px] font-mono hover:text-[var(--c-accent)] transition-colors shrink-0 border-l border-[color-mix(in_srgb,var(--c-accent)_20%,transparent)]"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
