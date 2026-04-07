// hooks/useProgress.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StudyProgress } from '../data/types';

// Key renamed from '@deutsch_b1_progress' in v2 — v1 progress is not migrated.
const STORAGE_KEY = '@velocitrainer_progress';

type ProgressState = StudyProgress;

const DEFAULT_STATE: ProgressState = {
  knownIds: [],
  unknownIds: [],
  reviewIds: [],
  deckPositions: {},
  languageMode: 'de-en',
};

export function useProgress() {
  const [progress, setProgress] = useState<ProgressState>(DEFAULT_STATE);
  const progressRef = useRef(progress);
  progressRef.current = progress;

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(raw => {
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as Partial<ProgressState>;
          const merged: ProgressState = { ...DEFAULT_STATE, ...parsed };
          setProgress(merged);
          progressRef.current = merged;
        } catch {
          // corrupted data — reset
        }
      }
    });
  }, []);

  const persist = useCallback(async (next: ProgressState) => {
    setProgress(next);
    progressRef.current = next;
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const markKnown = useCallback(async (id: string) => {
    const c = progressRef.current;
    await persist({
      ...c,
      knownIds: [...new Set([...c.knownIds, id])],
      unknownIds: c.unknownIds.filter(x => x !== id),
    });
  }, [persist]);

  const markUnknown = useCallback(async (id: string) => {
    const c = progressRef.current;
    await persist({
      ...c,
      unknownIds: [...new Set([...c.unknownIds, id])],
      knownIds: c.knownIds.filter(x => x !== id),
    });
  }, [persist]);

  const addToReview = useCallback(async (id: string) => {
    const c = progressRef.current;
    await persist({ ...c, reviewIds: [...new Set([...c.reviewIds, id])] });
  }, [persist]);

  const removeFromReview = useCallback(async (id: string) => {
    const c = progressRef.current;
    await persist({ ...c, reviewIds: c.reviewIds.filter(x => x !== id) });
  }, [persist]);

  const isInReview = useCallback(
    (id: string) => progressRef.current.reviewIds.includes(id),
    []
  );

  const saveDeckPosition = useCallback(async (deckId: string, index: number) => {
    const c = progressRef.current;
    await persist({ ...c, deckPositions: { ...c.deckPositions, [deckId]: index } });
  }, [persist]);

  const getDeckPosition = useCallback(
    (deckId: string): number => progressRef.current.deckPositions[deckId] ?? 0,
    []
  );

  const setLanguageMode = useCallback(async (mode: 'de-en' | 'en-de') => {
    await persist({ ...progressRef.current, languageMode: mode });
  }, [persist]);

  const totalStudied = new Set([...progress.knownIds, ...progress.unknownIds]).size;

  return {
    knownIds: progress.knownIds,
    unknownIds: progress.unknownIds,
    reviewIds: progress.reviewIds,
    languageMode: progress.languageMode,
    markKnown,
    markUnknown,
    addToReview,
    removeFromReview,
    isInReview,
    saveDeckPosition,
    getDeckPosition,
    setLanguageMode,
    totalStudied,
  };
}
