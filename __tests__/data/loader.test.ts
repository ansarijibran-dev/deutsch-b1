// __tests__/data/loader.test.ts
import {
  getAllWords,
  getWordsByTheme,
  getWordsByType,
  getWordById,
  searchWords,
  getWeakWords,
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
});
