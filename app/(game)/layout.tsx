'use client';

import { useEffect, useRef } from 'react';
import { TerminalSounds } from '@/components/TerminalSounds';
import { PlayerProvider } from '@/lib/PlayerContext';
import { usePlayer } from '@/lib/usePlayer';
import { NavVisibilityProvider } from '@/lib/NavVisibilityContext';
import { ThemeProvider, useTheme } from '@/lib/ThemeContext';
import { NavBar } from '@/components/NavBar';
import { DataStream } from '@/components/DataStream';
import { useSoundEnabled } from '@/lib/useSoundEnabled';
import Link from 'next/link';

/** Floating SFX toggle — visible on mobile (top-right), hidden on desktop (desktop has it in nav) */
function SfxToggle() {
  const { signedIn } = usePlayer();
  const { soundEnabled, toggleSound } = useSoundEnabled();
  if (!signedIn) return null;
  return (
    <button
      onClick={toggleSound}
      aria-label={soundEnabled ? 'Mute sound effects' : 'Enable sound effects'}
      className="lg:hidden fixed top-2 right-2 z-40 px-2 py-1 text-[10px] font-mono tracking-widest transition-colors bg-[var(--c-bg)] border border-[color-mix(in_srgb,var(--c-primary)_20%,transparent)] rounded opacity-60 hover:opacity-100"
    >
      SFX {soundEnabled
        ? <span className="text-[var(--c-primary)]">[ON]</span>
        : <span className="text-[var(--c-muted)]">[OFF]</span>
      }
    </button>
  );
}

/** One-time achievement backfill — fires once per deploy version */
function BackfillTrigger() {
  const triggered = useRef(false);
  useEffect(() => {
    if (triggered.current) return;
    triggered.current = true;
    fetch('/api/cron/backfill-achievements').catch(() => {});
  }, []);
  return null;
}

/** Syncs server-stored theme to ThemeContext when profile loads */
function ThemeSync() {
  const { profile } = usePlayer();
  const { loadFromServer } = useTheme();
  const synced = useRef(false);

  useEffect(() => {
    if (profile?.themeId && !synced.current) {
      loadFromServer(profile.themeId);
      synced.current = true;
    }
  }, [profile?.themeId, loadFromServer]);

  return null;
}

export default function GameLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="crt-active">
      <TerminalSounds />
      <div className="scanline-sweep" aria-hidden="true" />
      <DataStream />
      <PlayerProvider>
        <ThemeProvider>
          <ThemeSync />
          <BackfillTrigger />
          <NavVisibilityProvider>
            <NavBar />
            <SfxToggle />
            {children}
            <footer className="py-6 pb-24 lg:pb-6 text-center">
              <div className="flex items-center justify-center gap-3 text-[var(--c-muted)] text-xs font-mono opacity-60">
                <Link href="/privacy" className="hover:opacity-100 transition-opacity">Privacy</Link>
                <span>·</span>
                <Link href="/terms" className="hover:opacity-100 transition-opacity">Terms</Link>
                <span>·</span>
                <Link href="/methodology" className="hover:opacity-100 transition-opacity">Methodology</Link>
              </div>
            </footer>
          </NavVisibilityProvider>
        </ThemeProvider>
      </PlayerProvider>
    </div>
  );
}
