// hooks/useStudySession.ts
import { useState, useCallback } from 'react';
import { getWordById } from '../data/loader';
import { Word } from '../data/types';

interface HistoryEntry { index: number; knew: boolean }

export function useStudySession(wordIds: string[], startIndex: number = 0) {
  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const [score, setScore] = useState(0);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  const isFinished = currentIndex >= wordIds.length;

  const currentWord: Word | null =
    !isFinished ? (getWordById(wordIds[currentIndex]) ?? null) : null;

  const advance = useCallback((knew: boolean = false) => {
    setHistory(h => [...h, { index: currentIndex, knew }]);
    if (knew) setScore(s => s + 1);
    setCurrentIndex(i => i + 1);
  }, [currentIndex]);

  const goBack = useCallback(() => {
    setHistory(h => {
      if (h.length === 0) return h;
      const prev = h[h.length - 1];
      if (prev.knew) setScore(s => s - 1);
      setCurrentIndex(prev.index);
      return h.slice(0, -1);
    });
  }, []);

  const canGoBack = history.length > 0;

  const progressFraction =
    wordIds.length === 0 ? 1 : currentIndex / wordIds.length;

  return {
    currentIndex,
    currentWord,
    isFinished,
    score,
    total: wordIds.length,
    progressFraction,
    advance,
    goBack,
    canGoBack,
  };
}
