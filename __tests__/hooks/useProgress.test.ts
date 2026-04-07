// __tests__/hooks/useProgress.test.ts
import { renderHook, act } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useProgress } from '../../hooks/useProgress';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
}));

describe('useProgress', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    (AsyncStorage.setItem as jest.Mock).mockResolvedValue(undefined);
  });

  test('starts with empty progress', async () => {
    const { result } = renderHook(() => useProgress());
    await act(async () => {});
    expect(result.current.knownIds).toEqual([]);
    expect(result.current.unknownIds).toEqual([]);
  });

  test('markKnown adds id to knownIds', async () => {
    const { result } = renderHook(() => useProgress());
    await act(async () => {});
    await act(async () => {
      await result.current.markKnown('abfall_001');
    });
    expect(result.current.knownIds).toContain('abfall_001');
    expect(result.current.unknownIds).not.toContain('abfall_001');
  });

  test('markUnknown adds id to unknownIds', async () => {
    const { result } = renderHook(() => useProgress());
    await act(async () => {});
    await act(async () => {
      await result.current.markUnknown('abfall_001');
    });
    expect(result.current.unknownIds).toContain('abfall_001');
    expect(result.current.knownIds).not.toContain('abfall_001');
  });

  test('marking known removes from unknownIds', async () => {
    const { result } = renderHook(() => useProgress());
    await act(async () => {});
    await act(async () => {
      await result.current.markUnknown('abfall_001');
    });
    await act(async () => {
      await result.current.markKnown('abfall_001');
    });
    expect(result.current.knownIds).toContain('abfall_001');
    expect(result.current.unknownIds).not.toContain('abfall_001');
  });

  test('saveDeckPosition persists position', async () => {
    const { result } = renderHook(() => useProgress());
    await act(async () => {});
    await act(async () => {
      await result.current.saveDeckPosition('theme:travel', 5);
    });
    expect(result.current.getDeckPosition('theme:travel')).toBe(5);
  });

  test('totalStudied counts known + unknown', async () => {
    const { result } = renderHook(() => useProgress());
    await act(async () => {});
    await act(async () => {
      await result.current.markKnown('abfall_001');
    });
    await act(async () => {
      await result.current.markUnknown('haus_001');
    });
    expect(result.current.totalStudied).toBe(2);
  });

  test('starts with empty reviewIds', async () => {
    const { result } = renderHook(() => useProgress());
    await act(async () => {});
    expect(result.current.reviewIds).toEqual([]);
  });

  test('addToReview adds id to reviewIds', async () => {
    const { result } = renderHook(() => useProgress());
    await act(async () => {});
    await act(async () => { await result.current.addToReview('hund_001'); });
    expect(result.current.reviewIds).toContain('hund_001');
  });

  test('removeFromReview removes id from reviewIds', async () => {
    const { result } = renderHook(() => useProgress());
    await act(async () => {});
    await act(async () => { await result.current.addToReview('hund_001'); });
    await act(async () => { await result.current.removeFromReview('hund_001'); });
    expect(result.current.reviewIds).not.toContain('hund_001');
  });

  test('isInReview returns true when id is in reviewIds', async () => {
    const { result } = renderHook(() => useProgress());
    await act(async () => {});
    await act(async () => { await result.current.addToReview('hund_001'); });
    expect(result.current.isInReview('hund_001')).toBe(true);
    expect(result.current.isInReview('other_id')).toBe(false);
  });

  test('starts with de-en language mode', async () => {
    const { result } = renderHook(() => useProgress());
    await act(async () => {});
    expect(result.current.languageMode).toBe('de-en');
  });

  test('setLanguageMode updates language mode', async () => {
    const { result } = renderHook(() => useProgress());
    await act(async () => {});
    await act(async () => { await result.current.setLanguageMode('en-de'); });
    expect(result.current.languageMode).toBe('en-de');
  });
});
