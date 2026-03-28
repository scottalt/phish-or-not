'use client';

import { useState, useEffect, useRef } from 'react';
import { usePlayer } from '@/lib/usePlayer';
import { Handler } from './Handler';

interface AdminMessage {
  id: string;
  lines: string[];
  buttonText: string;
  isGlobal: boolean;
  createdAt: string;
}

export function AnnouncementBanner() {
  const { signedIn, profile } = usePlayer();
  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [globalBanner, setGlobalBanner] = useState<AdminMessage | null>(null);
  const [allGlobals, setAllGlobals] = useState<AdminMessage[]>([]);
  const [sigintMessage, setSigintMessage] = useState<AdminMessage | null>(null);
  const [bannerVisible, setBannerVisible] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (!signedIn || fetchedRef.current) return;
    fetchedRef.current = true;

    fetch('/api/player/messages')
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (!data?.messages?.length) return;
        const msgs = data.messages as AdminMessage[];
        setMessages(msgs);

        const targeted = msgs.find((m) => !m.isGlobal);
        if (targeted) setSigintMessage(targeted);

        const globals = msgs.filter((m) => m.isGlobal);
        if (globals.length > 0) {
          setGlobalBanner(globals[0]); // store first for dismiss tracking
          setAllGlobals(globals);
          setTimeout(() => setBannerVisible(true), 2000);
          // Auto-dismiss after 3 full scroll passes (20s each = 60s) + 2s entry delay
          setTimeout(() => {
            setBannerDismissed(true);
            // Mark all globals as seen
            for (const g of globals) {
              fetch('/api/player/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messageId: g.id }),
              }).catch(() => {});
            }
          }, 62000);
        }
      })
      .catch(() => {});
  }, [signedIn]);

  async function dismissMessage(msg: AdminMessage) {
    await fetch('/api/player/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messageId: msg.id }),
    }).catch(() => {});
  }

  function handleSigintDismiss() {
    if (sigintMessage) {
      dismissMessage(sigintMessage);
      setSigintMessage(null);
      const remaining = messages.filter((m) => !m.isGlobal && m.id !== sigintMessage.id);
      if (remaining.length > 0) {
        setTimeout(() => setSigintMessage(remaining[0]), 500);
      }
    }
  }

  function handleBannerDismiss() {
    for (const g of allGlobals) dismissMessage(g);
    setBannerDismissed(true);
  }

  // Concatenate all global messages into one ticker string
  const tickerText = allGlobals.length > 0
    ? allGlobals.map((g) => `⚡ ${g.lines.join('  ·  ')}`).join('     ///     ')
    : '';

  return (
    <>
      {/* Global announcement — scrolling ticker */}
      {globalBanner && !bannerDismissed && bannerVisible && (
        <div className="fixed bottom-16 lg:bottom-0 left-0 right-0 z-50 pointer-events-none">
          <div className="bg-[color-mix(in_srgb,var(--c-bg)_92%,transparent)] border-t border-[color-mix(in_srgb,var(--c-accent)_40%,transparent)] backdrop-blur-sm">
            <div className="flex items-center">
              {/* Scrolling ticker */}
              <div className="flex-1 overflow-hidden py-1.5">
                <div className="ticker-scroll whitespace-nowrap text-[var(--c-accent)] text-xs font-mono tracking-wider">
                  <span className="inline-block pr-[50vw]">{tickerText}</span>
                  <span className="inline-block pr-[50vw]">{tickerText}</span>
                </div>
              </div>
              {/* Dismiss button */}
              <button
                onClick={handleBannerDismiss}
                className="pointer-events-auto px-3 py-1.5 text-[var(--c-muted)] text-[10px] font-mono hover:text-[var(--c-accent)] transition-colors shrink-0 border-l border-[color-mix(in_srgb,var(--c-accent)_20%,transparent)]"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Targeted SIGINT message — full Handler overlay */}
      {sigintMessage && (
        <Handler
          lines={sigintMessage.lines.map((l) =>
            l.replace(/\{callsign\}/gi, profile?.displayName ?? 'operative')
             .replace(/\{level\}/gi, String(profile?.level ?? 1))
             .replace(/\{xp\}/gi, String(profile?.xp ?? 0))
          )}
          buttonText={sigintMessage.buttonText}
          onDismiss={handleSigintDismiss}
        />
      )}
    </>
  );
}
