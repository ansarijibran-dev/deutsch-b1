// hooks/useProgress.ts
import { useState, useEffect, useCallback } from 'react';
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

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(raw => {
      if (raw) {
        try {
          setProgress(JSON.parse(raw));
        } catch {
          // corrupted data — reset
        }
      }
    });
  }, []);

  const save = useCallback(async (next: ProgressState) => {
    setProgress(next);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const markKnown = useCallback(
    async (id: string) => {
      const next: ProgressState = {
        ...progress,
        knownIds: [...new Set([...progress.knownIds, id])],
        unknownIds: progress.unknownIds.filter(x => x !== id),
      };
      await save(next);
    },
    [progress, save]
  );

  const markUnknown = useCallback(
    async (id: string) => {
      const next: ProgressState = {
        ...progress,
        unknownIds: [...new Set([...progress.unknownIds, id])],
        knownIds: progress.knownIds.filter(x => x !== id),
      };
      await save(next);
    },
    [progress, save]
  );

  const saveDeckPosition = useCallback(
    async (deckId: string, index: number) => {
      const next: ProgressState = {
        ...progress,
        deckPositions: { ...progress.deckPositions, [deckId]: index },
      };
      await save(next);
    },
    [progress, save]
  );

  const getDeckPosition = useCallback(
    (deckId: string): number => progress.deckPositions[deckId] ?? 0,
    [progress]
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
