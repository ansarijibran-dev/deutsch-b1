// data/loader.ts
import { Word, WordType, Theme } from './types';
import vocabularyData from '../assets/data/vocabulary.json';

const words: Word[] = vocabularyData as unknown as Word[];

export function getAllWords(): Word[] {
  return words;
}

export function getWordsByTheme(theme: Theme): Word[] {
  return words.filter(w => w.theme === theme);
}

export function getWordsByType(wordType: WordType): Word[] {
  return words.filter(w => w.wordType === wordType);
}

export function getWordById(id: string): Word | undefined {
  return words.find(w => w.id === id);
}

export function searchWords(query: string): Word[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  return words.filter(
    w =>
      w.german.toLowerCase().includes(q) ||
      w.english.toLowerCase().includes(q)
  );
}

export function getWeakWords(unknownIds: string[]): Word[] {
  const idSet = new Set(unknownIds);
  return words.filter(w => idSet.has(w.id));
}

export function getAllThemes(): Theme[] {
  return [...new Set(words.map(w => w.theme))].sort() as Theme[];
}

export function getWordCountByTheme(): Record<string, number> {
  return words.reduce<Record<string, number>>((acc, w) => {
    acc[w.theme] = (acc[w.theme] ?? 0) + 1;
    return acc;
  }, {});
}

export function getWordCountByType(): Record<string, number> {
  return words.reduce<Record<string, number>>((acc, w) => {
    acc[w.wordType] = (acc[w.wordType] ?? 0) + 1;
    return acc;
  }, {});
}

export function getReviewWords(reviewIds: string[]): Word[] {
  const idSet = new Set(reviewIds);
  return words.filter(w => idSet.has(w.id));
}
