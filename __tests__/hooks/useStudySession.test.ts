// __tests__/hooks/useStudySession.test.ts
import { renderHook, act } from '@testing-library/react-native';
import { useStudySession } from '../../hooks/useStudySession';

jest.mock('../../assets/data/vocabulary.json', () =>
  require('../../assets/data/sample_vocabulary.json')
);

const SAMPLE_IDS = [
  'abfall_001', 'arbeiten_001', 'schnell_001',
  'wegen_001', 'reise_001',
];

describe('useStudySession', () => {
  test('initialises at given start index', () => {
    const { result } = renderHook(() =>
      useStudySession(SAMPLE_IDS, 2)
    );
    expect(result.current.currentIndex).toBe(2);
    expect(result.current.currentWord?.id).toBe('schnell_001');
  });

  test('advance moves to next card', () => {
    const { result } = renderHook(() =>
      useStudySession(SAMPLE_IDS, 0)
    );
    act(() => result.current.advance());
    expect(result.current.currentIndex).toBe(1);
  });

  test('isFinished is true after last card', () => {
    const { result } = renderHook(() =>
      useStudySession(SAMPLE_IDS, 4)
    );
    expect(result.current.isFinished).toBe(false);
    act(() => result.current.advance());
    expect(result.current.isFinished).toBe(true);
  });

  test('score increments when advance called with knew=true', () => {
    const { result } = renderHook(() =>
      useStudySession(SAMPLE_IDS, 0)
    );
    act(() => result.current.advance(true));
    expect(result.current.score).toBe(1);
  });

  test('score does not increment when advance called with knew=false', () => {
    const { result } = renderHook(() =>
      useStudySession(SAMPLE_IDS, 0)
    );
    act(() => result.current.advance(false));
    expect(result.current.score).toBe(0);
  });

  test('currentWord is null when finished', () => {
    const { result } = renderHook(() =>
      useStudySession([], 0)
    );
    expect(result.current.currentWord).toBeNull();
    expect(result.current.isFinished).toBe(true);
  });
});
