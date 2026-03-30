'use client';

import { useEffect, useRef, useState } from 'react';
import { RoguelikeHUD } from './RoguelikeHUD';
import { RoguelikePerkShop } from './RoguelikePerkShop';
import { RoguelikeResult } from './RoguelikeResult';
import { useSigint } from '@/lib/SigintContext';
import { useSoundEnabled } from '@/lib/useSoundEnabled';
import { playCorrect, playWrong, playFloorClear, playLifeLost } from '@/lib/sounds';
import type { GimmickId, PerkId, CardModifier } from '@/lib/roguelike';

// ── Types ─────────────────────────────────────────────────────────────────────

interface SafeCard {
  _idx: number;
  type: string;
  from: string;
  subject?: string;
  body: string;
  authStatus: string;
}

interface RoguelikeCardAssignment {
  cardId: string;
  modifiers: CardModifier[];
}

interface FeedbackData {
  correct: boolean;
  isPhishing: boolean;
  explanation: string;
  technique: string;
  cardScore: number;
  lives: number;
  intel: number;
  score: number;
  streak: number;
  status: 'active' | 'dead' | 'completed';
  floorCleared: boolean;
  floorsCleared: number;
  modifiers: CardModifier[];
}

interface ResultData {
  finalScore: number;
  clearanceEarned: number;
  floorsCleared: number;
  deaths: number;
  bestStreak: number;
  cardsAnswered: number;
  cardsCorrect: number;
  operationName: string;
}

type Phase = 'loading' | 'floor' | 'feedback' | 'shop' | 'result';

interface Props {
  onBack: () => void;
  onPlayAgain: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function RoguelikeRun({ onBack, onPlayAgain }: Props) {
  const { triggerSigint } = useSigint();
  const { soundEnabled } = useSoundEnabled();

  // ── Phase & run identity ──
  const [phase, setPhase] = useState<Phase>('loading');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [runId, setRunId] = useState<string | null>(null);
  const [operationName, setOperationName] = useState('');

  // ── Run state ──
  const [floor, setFloor] = useState(0);
  const [totalFloors, setTotalFloors] = useState(3);
  const [gimmick, setGimmick] = useState<GimmickId | null>(null);
  const [gimmicks, setGimmicks] = useState<(GimmickId | null)[]>([]);
  const [lives, setLives] = useState(3);
  const [livesMax, setLivesMax] = useState(3);
  const [intel, setIntel] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [deaths, setDeaths] = useState(0);
  const [perks, setPerks] = useState<PerkId[]>([]);

  // ── Floor card state ──
  const [cards, setCards] = useState<SafeCard[]>([]);
  const [assignments, setAssignments] = useState<RoguelikeCardAssignment[]>([]);
  const [cardIndex, setCardIndex] = useState(0);

  // ── Shop state ──
  const [shopPerks, setShopPerks] = useState<PerkId[]>([]);
  const [nextGimmick, setNextGimmick] = useState<GimmickId | null>(null);

  // ── Result / feedback ──
  const [resultData, setResultData] = useState<ResultData | null>(null);
  const [feedbackData, setFeedbackData] = useState<FeedbackData | null>(null);

  // ── Refs ──
  const renderTimestamp = useRef(Date.now());
  const sigintFired = useRef(false);
  const answering = useRef(false);

  // ── SIGINT on mount ──
  useEffect(() => {
    if (sigintFired.current) return;
    sigintFired.current = true;
    triggerSigint('first_roguelike');
  }, [triggerSigint]);

  // ── Start the run ──
  useEffect(() => {
    let cancelled = false;

    async function startRun() {
      try {
        const res = await fetch('/api/roguelike/start', { method: 'POST' });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? `HTTP ${res.status}`);
        }
        const data = await res.json();
        if (cancelled) return;

        setRunId(data.runId);
        setOperationName(data.operationName);
        setFloor(data.currentFloor);
        setTotalFloors(data.totalFloors);
        setLives(data.lives);
        setLivesMax(data.maxLives);
        setIntel(data.intel);
        setScore(data.score);
        setGimmick(data.gimmick ?? null);
        // Build gimmicks array from floorGimmicks + current
        const floorGimmicksArr: (GimmickId | null)[] = data.floorGimmicks ?? [];
        setGimmicks(floorGimmicksArr);
        setCards(data.cards ?? []);
        setAssignments(data.assignments ?? []);
        setCardIndex(0);
        renderTimestamp.current = Date.now();
        setPhase('floor');
      } catch (err) {
        if (cancelled) return;
        setLoadError(err instanceof Error ? err.message : 'Failed to start run');
      }
    }

    startRun();
    return () => { cancelled = true; };
  }, []);

  // ── Reset renderTimestamp each time cardIndex changes ──
  useEffect(() => {
    renderTimestamp.current = Date.now();
  }, [cardIndex]);

  // ── Derived: current card & modifiers ──
  const currentCard = cards[cardIndex] ?? null;
  const currentAssignment = assignments[cardIndex] ?? null;
  const currentModifiers: CardModifier[] = currentAssignment?.modifiers ?? [];

  // ── Finalize run (PATCH) ──
  async function finalizeRun(id: string): Promise<ResultData | null> {
    try {
      const res = await fetch(`/api/roguelike/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        console.error(`[RoguelikeRun] Finalize failed: HTTP ${res.status}`, body);
        return null;
      }
      return await res.json();
    } catch (err) {
      console.error('[RoguelikeRun] Finalize failed:', err);
      return null;
    }
  }

  // ── Handle answer ──
  async function handleAnswer(userAnswer: 'legit' | 'phishing') {
    if (!runId || !currentCard || answering.current) return;
    answering.current = true;

    const timeFromRenderMs = Date.now() - renderTimestamp.current;

    try {
      const res = await fetch(`/api/roguelike/${runId}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cardIndex,
          userAnswer,
          timeFromRenderMs,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        console.error(`[RoguelikeRun] Answer failed: HTTP ${res.status}`, body);
        answering.current = false;
        return;
      }

      const data: FeedbackData = await res.json();

      // Update tracked state
      setLives(data.lives);
      setIntel(data.intel);
      setScore(data.score);
      setStreak(data.streak);

      // Track deaths
      if (!data.correct) {
        const liveLost = data.lives < lives;
        if (liveLost) setDeaths((d) => d + 1);
      }

      // Sounds
      if (soundEnabled) {
        if (data.correct) {
          playCorrect();
          if (data.floorCleared) playFloorClear();
        } else {
          playWrong();
          if (data.lives < lives) playLifeLost();
        }
      }

      setFeedbackData(data);
      setPhase('feedback');

      // Auto-advance after 1.5s
      setTimeout(async () => {
        setFeedbackData(null);
        answering.current = false;

        if (data.status === 'dead') {
          // Finalize and show result
          const result = await finalizeRun(runId);
          setResultData(result);
          setPhase('result');
          return;
        }

        if (data.floorCleared) {
          // Fetch shop offerings
          await loadShop(runId);
          return;
        }

        // Next card
        setCardIndex((i) => i + 1);
        setPhase('floor');
      }, 1500);

    } catch (err) {
      console.error('[RoguelikeRun] Answer failed:', err);
      answering.current = false;
    }
  }

  // ── Load shop ──
  async function loadShop(id: string) {
    try {
      const res = await fetch(`/api/roguelike/${id}/shop`);
      if (!res.ok) {
        // Skip shop, go to next floor
        await advanceToNextFloor(id);
        return;
      }
      const data = await res.json();
      setShopPerks(data.offerings ?? []);
      setIntel(data.intel);
      setLives(data.lives);
      setPhase('shop');
    } catch (err) {
      console.error('[RoguelikeRun] Shop load failed:', err);
      await advanceToNextFloor(id);
    }
  }

  // ── Buy perk ──
  async function handleBuyPerk(perkId: PerkId) {
    if (!runId) return;
    const res = await fetch(`/api/roguelike/${runId}/shop`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ perkId }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      console.error(`[RoguelikeRun] Buy perk failed: HTTP ${res.status}`, body);
      return;
    }
    const data = await res.json();
    setIntel(data.intel);
    setLives(data.lives);
    setPerks(data.perks ?? []);
  }

  // ── Skip shop / advance to next floor ──
  async function handleSkipShop() {
    if (!runId) return;
    await advanceToNextFloor(runId);
  }

  // ── POST next-floor and either start next floor or finalize ──
  async function advanceToNextFloor(id: string) {
    try {
      const res = await fetch(`/api/roguelike/${id}/next-floor`, { method: 'POST' });
      if (!res.ok) {
        // Fallback: finalize
        const result = await finalizeRun(id);
        setResultData(result);
        setPhase('result');
        return;
      }

      const data = await res.json();

      if (data.runComplete) {
        const result = await finalizeRun(id);
        setResultData(result);
        setPhase('result');
        return;
      }

      // Load next floor data
      setFloor(data.currentFloor);
      setGimmick(data.gimmick ?? null);
      setGimmicks((prev) => {
        const updated = [...prev];
        // patch in the newly revealed gimmick at its floor index
        if (data.currentFloor !== undefined && data.gimmick !== undefined) {
          updated[data.currentFloor] = data.gimmick ?? null;
        }
        return updated;
      });
      setCards(data.cards ?? []);
      setAssignments(data.assignments ?? []);
      setCardIndex(0);
      if (data.lives !== undefined) setLives(data.lives);
      if (data.intel !== undefined) setIntel(data.intel);
      if (data.score !== undefined) setScore(data.score);

      // Preview the NEXT floor's gimmick for the shop (store for next shop visit)
      setNextGimmick(null);
      setPhase('floor');
    } catch (err) {
      console.error('[RoguelikeRun] Next floor failed:', err);
      const result = await finalizeRun(id);
      setResultData(result);
      setPhase('result');
    }
  }

  // ── Render: loading ──
  if (phase === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-8 font-mono anim-fade-in-up">
        {loadError ? (
          <>
            <p className="text-sm text-[#ff3333] tracking-wide">{loadError}</p>
            <button
              onClick={() => { setLoadError(null); setPhase('loading'); window.location.reload(); }}
              className="py-2 px-6 term-border text-sm tracking-widest text-[var(--c-primary)] active:scale-95 transition-all"
            >
              [ RETRY ]
            </button>
            <button
              onClick={onBack}
              className="text-xs text-[var(--c-muted)] hover:text-[var(--c-secondary)] tracking-widest"
            >
              [ BACK ]
            </button>
          </>
        ) : (
          <>
            <p className="text-sm text-[var(--c-muted)] tracking-widest animate-pulse">
              INITIALIZING OPERATION...
            </p>
          </>
        )}
      </div>
    );
  }

  // ── Render: result ──
  if (phase === 'result' && resultData) {
    const won = (resultData.floorsCleared ?? 0) >= totalFloors;
    return (
      <RoguelikeResult
        operationName={resultData.operationName || operationName}
        finalScore={resultData.finalScore}
        clearanceEarned={resultData.clearanceEarned}
        floorsCleared={resultData.floorsCleared}
        deaths={resultData.deaths}
        bestStreak={resultData.bestStreak}
        cardsAnswered={resultData.cardsAnswered}
        cardsCorrect={resultData.cardsCorrect}
        gimmicks={gimmicks}
        won={won}
        onPlayAgain={onPlayAgain}
        onBack={onBack}
      />
    );
  }

  // ── Render: shop ──
  if (phase === 'shop') {
    return (
      <RoguelikePerkShop
        perks={shopPerks}
        intel={intel}
        lives={lives}
        floor={floor}
        nextGimmick={nextGimmick}
        onBuy={handleBuyPerk}
        onSkip={handleSkipShop}
      />
    );
  }

  // ── Render: floor / feedback ──
  if (!currentCard || !gimmick) {
    return (
      <div className="flex items-center justify-center p-8 font-mono">
        <p className="text-sm text-[var(--c-muted)] tracking-widest animate-pulse">LOADING FLOOR...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 w-full max-w-md mx-auto p-4 font-mono anim-fade-in-up">
      {/* HUD */}
      <RoguelikeHUD
        floor={floor}
        gimmick={gimmick}
        lives={lives}
        livesMax={livesMax}
        intel={intel}
        streak={streak}
        cardIndex={cardIndex}
        totalCards={cards.length}
        modifiers={currentModifiers}
      />

      {/* Feedback overlay */}
      {phase === 'feedback' && feedbackData && (
        <div
          className="term-border p-4 space-y-2 anim-fade-in-up"
          style={{
            borderColor: feedbackData.correct ? '#00ff41' : '#ff3333',
            background: feedbackData.correct ? '#00ff4110' : '#ff333310',
          }}
        >
          <p
            className="text-lg font-black tracking-widest text-center"
            style={{ color: feedbackData.correct ? '#00ff41' : '#ff3333' }}
          >
            {feedbackData.correct ? '[ CORRECT ]' : '[ WRONG ]'}
          </p>
          {feedbackData.explanation && (
            <p className="text-xs text-[var(--c-secondary)] leading-relaxed">
              {feedbackData.explanation}
            </p>
          )}
          {feedbackData.technique && (
            <p className="text-xs text-[var(--c-muted)] tracking-wide">
              TECHNIQUE: {feedbackData.technique}
            </p>
          )}
          <p
            className="text-xs font-bold tabular-nums text-right"
            style={{ color: feedbackData.correct ? '#ffaa00' : '#ff3333' }}
          >
            {feedbackData.cardScore > 0 ? '+' : ''}{feedbackData.cardScore} pts
          </p>
        </div>
      )}

      {/* Card display */}
      {phase === 'floor' && (
        <>
          <div className="term-border p-4 space-y-3">
            {/* FROM */}
            {!currentModifiers.includes('REDACTED_SENDER') && (
              <div className="text-sm">
                <span className="text-[var(--c-muted)]">FROM: </span>
                <span className="text-[var(--c-secondary)]">{currentCard.from}</span>
              </div>
            )}
            {/* SUBJECT */}
            {currentCard.subject && (
              <div className="text-sm">
                <span className="text-[var(--c-muted)]">SUBJ: </span>
                <span className="text-[var(--c-secondary)]">{currentCard.subject}</span>
              </div>
            )}
            {/* BODY */}
            <div className="text-sm text-[var(--c-secondary)] leading-relaxed whitespace-pre-wrap">
              {currentCard.body}
            </div>
          </div>

          {/* Answer buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => handleAnswer('legit')}
              className="flex-1 py-3 term-border text-sm tracking-widest text-[var(--c-primary)] hover:bg-[color-mix(in_srgb,var(--c-primary)_8%,transparent)] active:scale-95 transition-all"
            >
              [ LEGIT ]
            </button>
            <button
              onClick={() => handleAnswer('phishing')}
              className="flex-1 py-3 term-border text-sm tracking-widest hover:bg-[color-mix(in_srgb,#ff3333_8%,transparent)] active:scale-95 transition-all"
              style={{ color: '#ff3333' }}
            >
              [ PHISHING ]
            </button>
          </div>

          {/* Back link */}
          <button
            onClick={onBack}
            className="text-xs text-[var(--c-muted)] hover:text-[var(--c-secondary)] tracking-widest text-center pt-1 transition-colors"
          >
            [ ABORT MISSION ]
          </button>
        </>
      )}
    </div>
  );
}
