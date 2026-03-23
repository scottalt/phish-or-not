'use client';

import { TerminalSounds } from '@/components/TerminalSounds';
import { PlayerProvider } from '@/lib/PlayerContext';
import { NavVisibilityProvider } from '@/lib/NavVisibilityContext';
import { ThemeProvider } from '@/lib/ThemeContext';
import { NavBar } from '@/components/NavBar';
import Link from 'next/link';

export default function GameLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="crt-active">
      <TerminalSounds />
      <div className="scanline-sweep" aria-hidden="true" />
      <PlayerProvider>
        <ThemeProvider>
          <NavVisibilityProvider>
            <NavBar />
            {children}
            <footer className="py-6 pb-24 lg:pb-6 text-center">
              <div className="flex items-center justify-center gap-3 text-[var(--c-muted)] text-xs font-mono opacity-40">
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
