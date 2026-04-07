// __tests__/data/loader.test.ts
import {
  getAllWords,
  getWordsByTheme,
  getWordsByType,
  getWordById,
  searchWords,
  getWeakWords,
  getReviewWords,
  getAllThemes,
  getWordCountByTheme,
  getWordCountByType,
} from '../../data/loader';

// The loader module is mocked to use sample data in tests
jest.mock('../../assets/data/vocabulary.json', () =>
  require('../../assets/data/sample_vocabulary.json')
);

describe('loader', () => {
  test('getAllWords returns all entries', () => {
    const words = getAllWords();
    expect(words.length).toBe(10);
    expect(words[0].id).toBe('abfall_001');
  });

  test('getWordsByTheme filters correctly', () => {
    const words = getWordsByTheme('work');
    expect(words.every(w => w.theme === 'work')).toBe(true);
    expect(words.find(w => w.id === 'arbeiten_001')).toBeDefined();
  });

  test('getWordsByType filters correctly', () => {
    const nouns = getWordsByType('noun');
    expect(nouns.every(w => w.wordType === 'noun')).toBe(true);
  });

  test('getWordById returns correct word', () => {
    const word = getWordById('reise_001');
    expect(word).toBeDefined();
    expect(word!.german).toBe('Reise');
  });

  test('getWordById returns undefined for unknown id', () => {
    expect(getWordById('nonexistent')).toBeUndefined();
  });

  test('searchWords matches german field', () => {
    const results = searchWords('haus');
    expect(results.find(w => w.id === 'haus_001')).toBeDefined();
  });

  test('searchWords matches english field', () => {
    const results = searchWords('rubbish');
    expect(results.find(w => w.id === 'abfall_001')).toBeDefined();
  });

  test('searchWords returns empty array for empty query', () => {
    expect(searchWords('')).toEqual([]);
    expect(searchWords('   ')).toEqual([]);
  });

  test('getWeakWords returns only words with matching ids', () => {
    const weak = getWeakWords(['abfall_001', 'haus_001']);
    expect(weak).toHaveLength(2);
    expect(weak.map(w => w.id)).toContain('abfall_001');
  });

  test('getAllThemes returns unique sorted theme list', () => {
    const themes = getAllThemes();
    // sample data has: environment, work, travel, food, health, daily_life, other
    expect(themes.length).toBeGreaterThan(0);
    // should be sorted alphabetically
    const sorted = [...themes].sort();
    expect(themes).toEqual(sorted);
    // should have no duplicates
    expect(new Set(themes).size).toBe(themes.length);
  });

  test('getWordCountByTheme returns correct counts', () => {
    const counts = getWordCountByTheme();
    // sample data has 1 word in 'work' theme (arbeiten_001)
    expect(counts['work']).toBe(1);
    // sample data has 1 word in 'environment' theme (abfall_001)
    expect(counts['environment']).toBe(1);
  });

  test('getWordCountByType returns correct counts', () => {
    const counts = getWordCountByType();
    // sample data has 3 nouns
    expect(counts['noun']).toBe(3);
    // sample data has 2 verbs
    expect(counts['verb']).toBe(2);
  });
});

describe('getReviewWords', () => {
  test('returns words matching given ids', () => {
    const allWords = getAllWords();
    const first = allWords[0];
    const second = allWords[1];
    const result = getReviewWords([first.id, second.id]);
    expect(result).toHaveLength(2);
    expect(result.map(w => w.id)).toContain(first.id);
    expect(result.map(w => w.id)).toContain(second.id);
  });

  test('returns empty array for empty input', () => {
    expect(getReviewWords([])).toEqual([]);
  });

  test('ignores unknown ids', () => {
    expect(getReviewWords(['does-not-exist'])).toEqual([]);
  });
});
