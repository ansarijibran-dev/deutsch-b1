import { useState, useEffect, useCallback } from 'react';
import { Word } from '../data/types';
import { searchWords } from '../data/loader';

export function useSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Word[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => { setResults(searchWords(query)); }, 200);
    return () => clearTimeout(timer);
  }, [query]);

  const clear = useCallback(() => { setQuery(''); setResults([]); }, []);

  return { query, setQuery, results, clear };
}
