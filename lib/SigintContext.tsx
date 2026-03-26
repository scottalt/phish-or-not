'use client';

import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from 'react';
import { Handler } from '@/components/Handler';
import { ALL_DIALOGUES } from '@/lib/sigint-personality';
import { usePlayer } from '@/lib/usePlayer';

interface SigintContextValue {
  /** Trigger a SIGINT dialogue by moment ID. Only shows once per player (tracked in DB). */
  triggerSigint: (momentId: string) => void;
  /** Whether SIGINT is currently showing */
  isShowing: boolean;
}

const SigintContext = createContext<SigintContextValue>({
  triggerSigint: () => {},
  isShowing: false,
});

export function useSigint() {
  return useContext(SigintContext);
}

export function SigintProvider({ children }: { children: ReactNode }) {
  const { profile, refreshProfile } = usePlayer();
  const [activeMoment, setActiveMoment] = useState<string | null>(null);
  const [lines, setLines] = useState<string[]>([]);
  const [buttonText, setButtonText] = useState('CONTINUE');
  const queueRef = useRef<string[]>([]);

  const triggerSigint = useCallback((momentId: string) => {
    // Check DB-backed seen list from profile
    if (profile?.seenMoments?.includes(momentId)) return;
    // Also check if already queued or active to prevent duplicates
    if (queueRef.current.includes(momentId)) return;

    const dialogue = ALL_DIALOGUES[momentId];
    if (!dialogue) return;

    // If another dialogue is already showing, queue this one
    if (activeMoment !== null) {
      queueRef.current.push(momentId);
      return;
    }

    setLines(dialogue.lines);
    setButtonText(dialogue.buttonText ?? 'CONTINUE');
    setActiveMoment(momentId);
  }, [profile?.seenMoments, activeMoment]);

  const showNext = useCallback(() => {
    const next = queueRef.current.shift();
    if (!next) return;

    const dialogue = ALL_DIALOGUES[next];
    if (!dialogue) {
      // Skip invalid, try next
      showNext();
      return;
    }

    setLines(dialogue.lines);
    setButtonText(dialogue.buttonText ?? 'CONTINUE');
    setActiveMoment(next);
  }, []);

  const handleDismiss = useCallback(() => {
    if (activeMoment) {
      // Persist to DB (fire and forget)
      fetch('/api/player/moments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ momentId: activeMoment }),
      }).then(() => refreshProfile()).catch(() => {});
    }
    setActiveMoment(null);
    setLines([]);

    // Show next queued dialogue after a brief pause
    setTimeout(showNext, 300);
  }, [activeMoment, refreshProfile, showNext]);

  return (
    <SigintContext.Provider value={{ triggerSigint, isShowing: activeMoment !== null }}>
      {children}
      {activeMoment && lines.length > 0 && (
        <Handler
          lines={lines}
          buttonText={buttonText}
          onDismiss={handleDismiss}
        />
      )}
    </SigintContext.Provider>
  );
}
