'use client';

import { useEffect, useState } from 'react';
import { motion, useMotionValue, useTransform, useAnimation } from 'framer-motion';
import type { Card, Answer, Confidence } from '@/lib/types';

const SWIPE_THRESHOLD = 80;

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

function analystFace(streak: number): string {
  if (streak >= 6) return '[^_^]';
  if (streak >= 3) return '[o_o]';
  return '[·_·]';
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
  const controls = useAnimation();
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-250, 250], [-8, 8]);
  const phishingOpacity = useTransform(x, [-SWIPE_THRESHOLD, -20], [1, 0]);
  const legitOpacity = useTransform(x, [20, SWIPE_THRESHOLD], [0, 1]);

  const [confidence, setConfidence] = useState<Confidence | null>(null);

  useEffect(() => {
    x.set(0);
    setConfidence(null);
    controls.set({ opacity: 0, scale: 0.9, y: 16 });
    controls.start({
      opacity: 1,
      scale: 1,
      y: 0,
      transition: { type: 'spring', stiffness: 300, damping: 24 },
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [card.id]);

  async function flyOff(direction: 'left' | 'right') {
    const targetX = direction === 'left' ? -600 : 600;
    await controls.start({
      x: targetX,
      opacity: 0,
      rotate: direction === 'left' ? -12 : 12,
      transition: { duration: 0.2, ease: [0.36, 0.66, 0.04, 1] },
    });
  }

  async function handleDragEnd(_: unknown, info: { offset: { x: number }; velocity: { x: number } }) {
    if (!confidence) return;
    const { offset, velocity } = info;
    if (offset.x < -SWIPE_THRESHOLD || velocity.x < -500) {
      await flyOff('left');
      onAnswer('phishing', confidence);
    } else if (offset.x > SWIPE_THRESHOLD || velocity.x > 500) {
      await flyOff('right');
      onAnswer('legit', confidence);
    } else {
      controls.start({
        x: 0,
        rotate: 0,
        transition: { type: 'spring', stiffness: 350, damping: 28 },
      });
    }
  }

  async function handleButton(answer: Answer) {
    if (!confidence) return;
    await flyOff(answer === 'phishing' ? 'left' : 'right');
    onAnswer(answer, confidence);
  }

  const progress = ((questionNumber - 1) / total) * 100;
  const streakAtBonus = streak > 0 && streak % 3 === 0;

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-sm px-4">
      {/* HUD bar */}
      <div className="w-full flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-3">
          <span className="text-[#00aa28]">
            Q<span className="text-[#00ff41] glow">{questionNumber}</span>/{total}
          </span>
          <span
            className={`text-xs px-2 py-0.5 border font-mono ${
              card.difficulty === 'easy'
                ? 'text-[#00ff41] border-[rgba(0,255,65,0.4)]'
                : card.difficulty === 'medium'
                ? 'text-[#ffaa00] border-[rgba(255,170,0,0.4)]'
                : 'text-[#ff3333] border-[rgba(255,51,51,0.4)]'
            }`}
          >
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

      {/* Swipe hints — only shown after confidence selected */}
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
            <motion.div
              style={{ opacity: phishingOpacity }}
              className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center"
            >
              <div className="border-2 border-[#ff3333] px-3 py-1 -rotate-12 bg-[rgba(255,51,51,0.08)]">
                <span className="text-[#ff3333] text-lg font-black tracking-widest glow-red">PHISHING</span>
              </div>
            </motion.div>
            <motion.div
              style={{ opacity: legitOpacity }}
              className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center"
            >
              <div className="border-2 border-[#00ff41] px-3 py-1 rotate-12 bg-[rgba(0,255,65,0.08)]">
                <span className="text-[#00ff41] text-lg font-black tracking-widest glow">LEGIT</span>
              </div>
            </motion.div>
          </>
        )}

        <motion.div
          drag={confidence ? 'x' : false}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.12}
          style={{ x, rotate }}
          animate={controls}
          onDragEnd={handleDragEnd}
          className={confidence ? 'cursor-grab active:cursor-grabbing' : ''}
        >
          {card.type === 'email' ? (
            <EmailDisplay card={card} />
          ) : (
            <SMSDisplay card={card} />
          )}
        </motion.div>
      </div>

      {/* Confidence selector */}
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
            {' '}·{' '}
            {confidence === 'certain' ? '3x' : confidence === 'likely' ? '2x' : '1x'} PTS
            <button
              onClick={() => setConfidence(null)}
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
