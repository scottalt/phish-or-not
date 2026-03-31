'use client';

import { useState } from 'react';
import { INTEL_WAGER_OPTIONS } from '@/lib/roguelike';

interface WagerProps {
  intel: number;
  pendingAnswer: 'legit' | 'phishing';
  onWager: (amount: number) => void;
  onSkip: () => void;
}

export function RoguelikeWager({ intel, pendingAnswer, onWager, onSkip }: WagerProps) {
  const [selectedWager, setSelectedWager] = useState<number>(0);

  function handleConfirm() {
    if (selectedWager === 0) {
      onSkip();
    } else {
      onWager(selectedWager);
    }
  }

  return (
    <div className="term-border p-6 space-y-4 text-center">
      <p className="text-xs text-[var(--c-muted)] tracking-widest">CONFIDENCE WAGER</p>
      <p className="text-sm text-[var(--c-secondary)]">
        You answered{' '}
        <span
          className="font-bold tracking-wide"
          style={{ color: pendingAnswer === 'phishing' ? '#ff3333' : 'var(--c-primary)' }}
        >
          {pendingAnswer.toUpperCase()}
        </span>
      </p>

      <div className="flex items-center justify-center gap-2 py-2">
        <span className="text-2xl font-black tabular-nums" style={{ color: '#ffaa00' }}>
          {intel}
        </span>
        <span className="text-xs text-[var(--c-muted)]">INTEL AVAILABLE</span>
      </div>

      <p className="text-xs text-[var(--c-muted)]">How much Intel will you wager?</p>

      <div className="flex gap-2 justify-center flex-wrap">
        {/* Skip (0) option */}
        <button
          onClick={() => setSelectedWager(0)}
          aria-label="Skip wager"
          className={`py-2 px-4 term-border text-sm tracking-widest transition-all active:scale-95 ${
            selectedWager === 0 ? 'bg-[color-mix(in_srgb,var(--c-primary)_12%,transparent)]' : ''
          }`}
          style={{
            color: selectedWager === 0 ? 'var(--c-primary)' : 'var(--c-muted)',
            borderColor: selectedWager === 0 ? 'var(--c-primary)' : undefined,
          }}
        >
          SKIP
        </button>

        {INTEL_WAGER_OPTIONS.map((amount) => (
          <button
            key={amount}
            onClick={() => setSelectedWager(amount)}
            disabled={intel < amount}
            aria-label={`Wager ${amount} Intel`}
            className={`py-2 px-4 term-border text-sm tracking-widest transition-all active:scale-95 ${
              selectedWager === amount ? 'anim-wager-pulse' : ''
            } ${intel < amount ? 'opacity-30 cursor-not-allowed' : ''}`}
            style={{
              color: selectedWager === amount ? '#ffaa00' : 'var(--c-secondary)',
              borderColor: selectedWager === amount ? '#ffaa00' : undefined,
            }}
          >
            {amount}
          </button>
        ))}
      </div>

      <button
        onClick={handleConfirm}
        className="w-full py-3 term-border text-sm tracking-widest text-[var(--c-primary)] hover:bg-[color-mix(in_srgb,var(--c-primary)_8%,transparent)] active:scale-95 transition-all mt-2"
      >
        [ CONFIRM ]
      </button>
    </div>
  );
}
