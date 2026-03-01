'use client';

import { useState, useRef } from 'react';
import type { Card, Answer, Confidence } from '@/lib/types';

const SWIPE_THRESHOLD = 80;
const FLY_DISTANCE = 650;

interface Props {
  card: Card;
  onAnswer: (answer: Answer, confidence: Confidence) => void;
  questionNumber: number;
  total: number;
  streak: number;
  totalScore: number;
}

const CONFIDENCE_OPTIONS: { value: Confidence; label: string; multiplier: string; color: string }[] = [
  { value: 'guessing', label: 'GUESSING', multiplier: '1x', color: 'text-[#00aa28] border-[rgba(0,255,65,0.25)]' },
  { value: 'likely',   label: 'LIKELY',   multiplier: '2x', color: 'text-[#ffaa00] border-[rgba(255,170,0,0.5)]' },
  { value: 'certain',  label: 'CERTAIN',  multiplier: '3x', color: 'text-[#00ff41] border-[rgba(0,255,65,0.8)]'  },
];

function clamp(val: number, min: number, max: number) {
  return Math.min(max, Math.max(min, val));
}

function analystFace(streak: number): string {
  if (streak >= 6) return '[^_^]';
  if (streak >= 3) return '[o_o]';
  return '[._.]';
}

function EmailDisplay({ card }: { card: Card }) {
  return (
    <div className="term-border bg-[#060c06] select-none">
      <div className="border-b border-[rgba(0,255,65,0.35)] px-3 py-2 flex items-center justify-between">
        <span className="text-[#00aa28] text-xs tracking-widest">INCOMING_EMAIL</span>
        <span className="text-[#003a0e] text-xs">■ □ □</span>
      </div>
      <div className="px-3 py-2 border-b border-[rgba(0,255,65,0.2)] space-y-1">
        <div className="flex gap-2 text-xs">
          <span className="text-[#00aa28] w-10 shrink-0">FROM:</span>
          <span className="text-[#00ff41] font-mono break-all">{card.from}</span>
        </div>
        {card.subject && (
          <div className="flex gap-2 text-xs">
            <span className="text-[#00aa28] w-10 shrink-0">SUBJ:</span>
            <span className="text-[#00ff41] font-mono">{card.subject}</span>
          </div>
        )}
      </div>
      <div className="px-3 py-3 text-xs text-[#00aa28] leading-relaxed whitespace-pre-wrap max-h-52 overflow-y-auto font-mono">
        {card.body}
      </div>
    </div>
  );
}

function SMSDisplay({ card }: { card: Card }) {
  return (
    <div className="term-border bg-[#060c06] select-none">
      <div className="border-b border-[rgba(0,255,65,0.35)] px-3 py-2 flex items-center justify-between">
        <span className="text-[#00aa28] text-xs tracking-widest">INCOMING_SMS</span>
        <span className="text-[#003a0e] text-xs">■ □ □</span>
      </div>
      <div className="px-3 py-2 border-b border-[rgba(0,255,65,0.2)]">
        <div className="flex gap-2 text-xs">
          <span className="text-[#00aa28] w-10 shrink-0">FROM:</span>
          <span className="text-[#00ff41] font-mono">{card.from}</span>
        </div>
      </div>
      <div className="px-3 py-3 text-xs text-[#00aa28] leading-relaxed whitespace-pre-wrap max-h-52 overflow-y-auto font-mono">
        {card.body}
      </div>
    </div>
  );
}

export function GameCard({ card, onAnswer, questionNumber, total, streak, totalScore }: Props) {
  const [confidence, setConfidence] = useState<Confidence | null>(null);
  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [flying, setFlying] = useState(false);

  const answered = useRef(false);
  const startX = useRef(0);
  const lastX = useRef(0);
  const lastTime = useRef(0);
  const velocity = useRef(0);

  function fly(direction: 'left' | 'right', conf: Confidence) {
    if (answered.current) return;
    answered.current = true;
    setFlying(true);
    setDragX(direction === 'left' ? -FLY_DISTANCE : FLY_DISTANCE);
    setTimeout(() => {
      onAnswer(direction === 'left' ? 'phishing' : 'legit', conf);
    }, 230);
  }

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (!confidence || answered.current) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    startX.current = e.clientX;
    lastX.current = e.clientX;
    lastTime.current = Date.now();
    velocity.current = 0;
    setDragging(true);
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragging || !confidence || answered.current) return;
    const now = Date.now();
    const dt = now - lastTime.current;
    if (dt > 0) {
      velocity.current = (e.clientX - lastX.current) / dt;
    }
    lastX.current = e.clientX;
    lastTime.current = now;
    setDragX(e.clientX - startX.current);
  }

  function handlePointerUp() {
    if (!dragging || !confidence || answered.current) return;
    setDragging(false);
    const dx = dragX;
    const vx = velocity.current;
    if (Math.abs(dx) > SWIPE_THRESHOLD || Math.abs(vx) > 0.5) {
      fly(dx > 0 || vx > 0 ? 'right' : 'left', confidence);
    } else {
      setDragX(0);
    }
    velocity.current = 0;
  }

  function handleButton(answer: Answer) {
    if (!confidence || answered.current) return;
    fly(answer === 'phishing' ? 'left' : 'right', confidence);
  }

  const rotate = dragX / 22;
  const phishingOpacity = clamp(-dragX / SWIPE_THRESHOLD, 0, 1);
  const legitOpacity = clamp(dragX / SWIPE_THRESHOLD, 0, 1);
  const progress = ((questionNumber - 1) / total) * 100;
  const streakAtBonus = streak > 0 && streak % 3 === 0;

  const cardTransition = flying
    ? 'transform 0.23s ease-in, opacity 0.23s ease-in'
    : dragging
    ? 'none'
    : 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)';

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-sm px-4">
      {/* HUD */}
      <div className="w-full flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-3">
          <span className="text-[#00aa28]">
            Q<span className="text-[#00ff41] glow">{questionNumber}</span>/{total}
          </span>
          <span className={`text-xs px-2 py-0.5 border font-mono ${
            card.difficulty === 'easy'
              ? 'text-[#00ff41] border-[rgba(0,255,65,0.4)]'
              : card.difficulty === 'medium'
              ? 'text-[#ffaa00] border-[rgba(255,170,0,0.4)]'
              : 'text-[#ff3333] border-[rgba(255,51,51,0.4)]'
          }`}>
            {card.difficulty.toUpperCase()}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-[#00aa28] ${streakAtBonus ? 'glow text-[#00ff41]' : ''}`}>
            STREAK:<span className="text-[#00ff41]">{streak}</span>
          </span>
          <span className="text-[#00aa28]">
            PTS:<span className="text-[#00ff41] glow">{totalScore}</span>
          </span>
          <span className="text-[#003a0e] font-mono text-sm">{analystFace(streak)}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-px bg-[#003a0e] relative overflow-hidden">
        <div
          className="absolute left-0 top-0 h-full bg-[#00ff41] transition-all duration-300"
          style={{ width: `${progress}%`, boxShadow: '0 0 6px rgba(0,255,65,0.8)' }}
        />
      </div>

      {confidence && (
        <div className="flex justify-between w-full text-xs text-[#003a0e] font-mono tracking-wider">
          <span>← PHISHING</span>
          <span>LEGIT →</span>
        </div>
      )}

      {/* Card */}
      <div className="relative w-full">
        {confidence && (
          <>
            <div
              className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center"
              style={{ opacity: phishingOpacity }}
            >
              <div className="border-2 border-[#ff3333] px-3 py-1 -rotate-12 bg-[rgba(255,51,51,0.08)]">
                <span className="text-[#ff3333] text-lg font-black tracking-widest glow-red">PHISHING</span>
              </div>
            </div>
            <div
              className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center"
              style={{ opacity: legitOpacity }}
            >
              <div className="border-2 border-[#00ff41] px-3 py-1 rotate-12 bg-[rgba(0,255,65,0.08)]">
                <span className="text-[#00ff41] text-lg font-black tracking-widest glow">LEGIT</span>
              </div>
            </div>
          </>
        )}

        <div
          onPointerDown={confidence ? handlePointerDown : undefined}
          onPointerMove={confidence ? handlePointerMove : undefined}
          onPointerUp={confidence ? handlePointerUp : undefined}
          onPointerCancel={confidence ? handlePointerUp : undefined}
          className={`anim-card-entry touch-none ${confidence ? 'cursor-grab active:cursor-grabbing' : ''}`}
          style={{
            transform: `translateX(${dragX}px) rotate(${rotate}deg)`,
            opacity: flying ? 0 : 1,
            transition: cardTransition,
            willChange: 'transform',
          }}
        >
          {card.type === 'email' ? <EmailDisplay card={card} /> : <SMSDisplay card={card} />}
        </div>
      </div>

      {/* Controls */}
      {!confidence ? (
        <div className="w-full space-y-2">
          <div className="text-xs text-[#00aa28] font-mono text-center tracking-widest">
            — SET CONFIDENCE BEFORE ANSWERING —
          </div>
          <div className="flex gap-2">
            {CONFIDENCE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setConfidence(opt.value)}
                className={`flex-1 py-3 term-border font-mono text-xs tracking-wider transition-all active:scale-95 hover:bg-[rgba(0,255,65,0.06)] flex flex-col items-center gap-0.5 ${opt.color}`}
              >
                <span>{opt.label}</span>
                <span className="text-[10px] opacity-60">{opt.multiplier} PTS</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="w-full space-y-2">
          <div className="text-xs text-[#00aa28] font-mono text-center tracking-widest">
            CONFIDENCE: <span className="text-[#00ff41] glow">{confidence.toUpperCase()}</span>
            {' · '}
            {confidence === 'certain' ? '3x' : confidence === 'likely' ? '2x' : '1x'} PTS
            <button
              onClick={() => { if (!answered.current) setConfidence(null); }}
              className="ml-3 text-[#003a0e] hover:text-[#00aa28] transition-colors"
            >
              [change]
            </button>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => handleButton('phishing')}
              className="flex-1 py-4 border border-[rgba(255,51,51,0.5)] text-[#ff3333] font-mono font-bold tracking-widest text-sm hover:bg-[rgba(255,51,51,0.1)] active:scale-95 transition-all glow-red"
            >
              PHISHING
            </button>
            <button
              onClick={() => handleButton('legit')}
              className="flex-1 py-4 border border-[rgba(0,255,65,0.5)] text-[#00ff41] font-mono font-bold tracking-widest text-sm hover:bg-[rgba(0,255,65,0.1)] active:scale-95 transition-all glow"
            >
              LEGIT
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
