import React, { createContext, useContext, useState } from 'react';
import { useColorScheme } from 'react-native';

type Scheme = 'light' | 'dark';

interface ThemeCtxValue {
  scheme: Scheme;
  isDark: boolean;
  toggle: () => void;
}

const ThemeCtx = createContext<ThemeCtxValue>({
  scheme: 'light',
  isDark: false,
  toggle: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme();
  const [override, setOverride] = useState<Scheme | null>(null);
  const scheme: Scheme = override ?? (system === 'dark' ? 'dark' : 'light');

  const toggle = () => {
    setOverride(prev => {
      const current = prev ?? (system === 'dark' ? 'dark' : 'light');
      return current === 'dark' ? 'light' : 'dark';
    });
  };

  return (
    <ThemeCtx.Provider value={{ scheme, isDark: scheme === 'dark', toggle }}>
      {children}
    </ThemeCtx.Provider>
  );
}

export function useThemeScheme(): ThemeCtxValue {
  return useContext(ThemeCtx);
}
