// hooks/useProgress.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@deutsch_b1_progress';

interface ProgressState {
  knownIds: string[];
  unknownIds: string[];
  deckPositions: Record<string, number>;
}

const DEFAULT_STATE: ProgressState = {
  knownIds: [],
  unknownIds: [],
  deckPositions: {},
};

export function useProgress() {
  const [progress, setProgress] = useState<ProgressState>(DEFAULT_STATE);
  const progressRef = useRef(progress);
  progressRef.current = progress;

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(raw => {
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as ProgressState;
          setProgress(parsed);
          progressRef.current = parsed;
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
    const current = progressRef.current;
    const next: ProgressState = {
      ...current,
      knownIds: [...new Set([...current.knownIds, id])],
      unknownIds: current.unknownIds.filter(x => x !== id),
    };
    await persist(next);
  }, [persist]);

  const markUnknown = useCallback(async (id: string) => {
    const current = progressRef.current;
    const next: ProgressState = {
      ...current,
      unknownIds: [...new Set([...current.unknownIds, id])],
      knownIds: current.knownIds.filter(x => x !== id),
    };
    await persist(next);
  }, [persist]);

  const saveDeckPosition = useCallback(async (deckId: string, index: number) => {
    const current = progressRef.current;
    const next: ProgressState = {
      ...current,
      deckPositions: { ...current.deckPositions, [deckId]: index },
    };
    await persist(next);
  }, [persist]);

  const getDeckPosition = useCallback(
    (deckId: string): number => progressRef.current.deckPositions[deckId] ?? 0,
    []
  );

  const totalStudied =
    new Set([...progress.knownIds, ...progress.unknownIds]).size;

  return {
    knownIds: progress.knownIds,
    unknownIds: progress.unknownIds,
    markKnown,
    markUnknown,
    saveDeckPosition,
    getDeckPosition,
    totalStudied,
  };
}
