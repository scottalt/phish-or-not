'use client';

import { useState } from 'react';
import { getShuffledDeck } from '@/data/cards';
import { GameCard } from './GameCard';
import { FeedbackCard } from './FeedbackCard';
import { RoundSummary } from './RoundSummary';
import { StartScreen } from './StartScreen';
import type { Card, Answer, Confidence, RoundResult } from '@/lib/types';

const ROUND_SIZE = 10;
const BASE_POINTS = 100;
const CONFIDENCE_MULTIPLIER: Record<Confidence, number> = {
  guessing: 1,
  likely: 2,
  certain: 3,
};
const STREAK_BONUS = 50;

type GamePhase = 'start' | 'playing' | 'feedback' | 'summary';

export function Game() {
  const [phase, setPhase] = useState<GamePhase>('start');
  const [deck, setDeck] = useState<Card[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<RoundResult[]>([]);
  const [lastResult, setLastResult] = useState<RoundResult | null>(null);
  const [streak, setStreak] = useState(0);
  const [totalScore, setTotalScore] = useState(0);

  function startRound() {
    setDeck(getShuffledDeck(ROUND_SIZE));
    setCurrentIndex(0);
    setResults([]);
    setLastResult(null);
    setStreak(0);
    setTotalScore(0);
    setPhase('playing');
  }

  function handleAnswer(answer: Answer, confidence: Confidence) {
    const card = deck[currentIndex];
    const correct = (answer === 'phishing') === card.isPhishing;

    const newStreak = correct ? streak + 1 : 0;
    const streakBonus = correct && newStreak > 0 && newStreak % 3 === 0 ? STREAK_BONUS : 0;
    const pointsEarned = correct
      ? BASE_POINTS * CONFIDENCE_MULTIPLIER[confidence] + streakBonus
      : 0;

    const result: RoundResult = { card, userAnswer: answer, correct, confidence, pointsEarned };
    setLastResult(result);
    setResults((prev) => [...prev, result]);
    setStreak(newStreak);
    setTotalScore((prev) => prev + pointsEarned);
    setPhase('feedback');
  }

  function handleNext() {
    const nextIndex = currentIndex + 1;
    if (nextIndex >= ROUND_SIZE) {
      setPhase('summary');
    } else {
      setCurrentIndex(nextIndex);
      setPhase('playing');
    }
  }

  if (phase === 'start') {
    return <StartScreen onStart={startRound} />;
  }

  if (phase === 'summary') {
    return (
      <RoundSummary
        score={results.filter((r) => r.correct).length}
        total={ROUND_SIZE}
        totalScore={totalScore}
        results={results}
        onPlayAgain={startRound}
      />
    );
  }

  if (phase === 'feedback' && lastResult) {
    return (
      <FeedbackCard
        result={lastResult}
        streak={streak}
        totalScore={totalScore}
        onNext={handleNext}
        questionNumber={currentIndex + 1}
        total={ROUND_SIZE}
      />
    );
  }

  const currentCard = deck[currentIndex];
  if (phase === 'playing' && currentCard) {
    return (
      <GameCard
        key={currentCard.id}
        card={currentCard}
        onAnswer={handleAnswer}
        questionNumber={currentIndex + 1}
        total={ROUND_SIZE}
        streak={streak}
        totalScore={totalScore}
      />
    );
  }

  return null;
}
