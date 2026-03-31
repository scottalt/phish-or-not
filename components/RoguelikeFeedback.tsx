'use client';

interface FeedbackProps {
  feedbackData: {
    correct: boolean;
    isPhishing: boolean;
    explanation?: string;
    technique?: string;
    cardScore: number;
    floorCleared: boolean;
    status: string;
  };
  wagerResult: { won: boolean; amount: number } | null;
  isDead: boolean;
  onContinue: () => void;
}

export function RoguelikeFeedback({ feedbackData, wagerResult, isDead, onContinue }: FeedbackProps) {
  return (
    <div
      className={`term-border p-4 space-y-2 anim-fade-in-up ${isDead ? 'p-6' : ''}`}
      style={{
        borderColor: feedbackData.correct ? '#00ff41' : '#ff3333',
        background: feedbackData.correct ? '#00ff4110' : '#ff333310',
      }}
    >
      <p
        className={`font-black tracking-widest text-center ${isDead ? 'text-2xl' : 'text-lg'}`}
        style={{ color: feedbackData.correct ? '#00ff41' : '#ff3333' }}
      >
        {isDead ? '[ MISSION FAILED ]' : feedbackData.correct ? '[ CORRECT ]' : '[ WRONG ]'}
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
      {/* Wager result */}
      {wagerResult && (
        <p
          className="text-sm font-bold tabular-nums text-center"
          style={{ color: wagerResult.won ? '#00ff41' : '#ff3333' }}
        >
          {wagerResult.won ? '+' : '-'}{wagerResult.amount} INTEL (WAGER)
        </p>
      )}
      <p
        className="text-xs font-bold tabular-nums text-right"
        style={{ color: feedbackData.correct ? '#ffaa00' : '#ff3333' }}
      >
        {feedbackData.cardScore > 0 ? '+' : ''}{feedbackData.cardScore} pts
      </p>
      <button
        onClick={onContinue}
        aria-label={isDead ? 'View results' : feedbackData.floorCleared ? 'Continue to next floor' : 'Continue to next card'}
        className="w-full mt-3 py-3 term-border-bright text-[var(--c-primary)] font-mono font-bold tracking-widest text-sm hover:bg-[color-mix(in_srgb,var(--c-primary)_8%,transparent)] active:scale-95 transition-all"
      >
        {isDead ? '[ VIEW RESULTS ]' : feedbackData.floorCleared ? '[ CONTINUE ]' : '[ NEXT CARD ]'}
      </button>
    </div>
  );
}
