// hooks/useStudySession.ts
import { useState, useCallback } from 'react';
import { getWordById } from '../data/loader';
import { Word } from '../data/types';

export function useStudySession(wordIds: string[], startIndex: number = 0) {
  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const [score, setScore] = useState(0);

  const isFinished = currentIndex >= wordIds.length;

  const currentWord: Word | null =
    !isFinished ? (getWordById(wordIds[currentIndex]) ?? null) : null;

  const advance = useCallback(
    (knew: boolean = false) => {
      if (knew) setScore(s => s + 1);
      setCurrentIndex(i => i + 1);
    },
    []
  );

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
  };
}
