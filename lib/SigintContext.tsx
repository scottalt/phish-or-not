'use client';

import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from 'react';
import { Handler, type AchievementReveal } from '@/components/Handler';
import { ALL_DIALOGUES } from '@/lib/sigint-personality';
import { usePlayer } from '@/lib/usePlayer';
import { playerGet, playerSet } from '@/lib/player-storage';

interface SigintContextValue {
  /** Trigger a SIGINT dialogue by moment ID. Only shows once per player (tracked in DB). */
  triggerSigint: (momentId: string) => void;
  /** Trigger a custom dialogue with raw lines (not tracked as a moment). onDismiss called after. */
  triggerCustom: (lines: string[], buttonText: string, onDismiss?: () => void, achievement?: AchievementReveal | null) => void;
  /** Whether SIGINT is currently showing */
  isShowing: boolean;
}

const SigintContext = createContext<SigintContextValue>({
  triggerSigint: () => {},
  triggerCustom: () => {},
  isShowing: false,
});

export function useSigint() {
  return useContext(SigintContext);
}

type QueueItem =
  | { type: 'moment'; id: string }
  | { type: 'custom'; lines: string[]; buttonText: string; onDismiss?: () => void; achievement?: AchievementReveal | null };

export function SigintProvider({ children }: { children: ReactNode }) {
  const { profile, refreshProfile } = usePlayer();
  const [activeMoment, setActiveMoment] = useState<string | null>(null);
  const [lines, setLines] = useState<string[]>([]);
  const [buttonText, setButtonText] = useState('CONTINUE');
  const queueRef = useRef<QueueItem[]>([]);
  const activeRef = useRef<string | null>(null);
  const customDismissRef = useRef<(() => void) | null>(null);
  const [achievementReveal, setAchievementReveal] = useState<AchievementReveal | null>(null);

  function showItem(item: QueueItem) {
    if (item.type === 'moment') {
      const dialogue = ALL_DIALOGUES[item.id];
      if (!dialogue) return false;
      activeRef.current = item.id;
      customDismissRef.current = null;
      setLines(dialogue.lines);
      setButtonText(dialogue.buttonText ?? 'CONTINUE');
      setAchievementReveal(null);
      setActiveMoment(item.id);
      return true;
    } else {
      activeRef.current = '__custom__';
      customDismissRef.current = item.onDismiss ?? null;
      setLines(item.lines);
      setButtonText(item.buttonText);
      setAchievementReveal(item.achievement ?? null);
      setActiveMoment('__custom__');
      return true;
    }
  }

  const triggerSigint = useCallback((momentId: string) => {
    if (profile?.seenMoments?.includes(momentId)) return;
    try {
      const cached = JSON.parse(playerGet('handler_moments_seen') ?? '[]');
      if (cached.includes(momentId)) return;
    } catch {}
    if (activeRef.current === momentId) return;
    if (queueRef.current.some((q) => q.type === 'moment' && q.id === momentId)) return;

    const item: QueueItem = { type: 'moment', id: momentId };

    if (activeRef.current !== null) {
      queueRef.current.push(item);
      return;
    }

    showItem(item);
  }, [profile?.seenMoments]);

  const triggerCustom = useCallback((customLines: string[], customButtonText: string, onDismiss?: () => void, achievement?: AchievementReveal | null) => {
    const item: QueueItem = { type: 'custom', lines: customLines, buttonText: customButtonText, onDismiss, achievement };

    if (activeRef.current !== null) {
      queueRef.current.push(item);
      return;
    }

    showItem(item);
  }, []);

  const showNext = useCallback(() => {
    while (queueRef.current.length > 0) {
      const next = queueRef.current.shift()!;
      if (showItem(next)) return;
    }
  }, []);

  const handleDismiss = useCallback(() => {
    const wasCustom = activeRef.current === '__custom__';
    const dismissCb = customDismissRef.current;

    if (!wasCustom && activeRef.current) {
      // Moment — persist as seen
      try {
        const cached = JSON.parse(playerGet('handler_moments_seen') ?? '[]');
        if (!cached.includes(activeRef.current)) {
          cached.push(activeRef.current);
          playerSet('handler_moments_seen', JSON.stringify(cached));
        }
      } catch {}
      fetch('/api/player/moments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ momentId: activeRef.current }),
      }).then(() => refreshProfile()).catch(() => {});
    }

    activeRef.current = null;
    customDismissRef.current = null;
    setActiveMoment(null);
    setLines([]);
    setAchievementReveal(null);

    // Fire custom dismiss callback (e.g., mark admin message as seen)
    if (wasCustom && dismissCb) dismissCb();

    setTimeout(showNext, 300);
  }, [refreshProfile, showNext]);

  return (
    <SigintContext.Provider value={{ triggerSigint, triggerCustom, isShowing: activeRef.current !== null }}>
      {children}
      {activeMoment && lines.length > 0 && (
        <Handler
          lines={lines}
          buttonText={buttonText}
          onDismiss={handleDismiss}
          achievementReveal={achievementReveal}
        />
      )}
    </SigintContext.Provider>
  );
}
