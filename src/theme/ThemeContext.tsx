import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { loadTheme, saveTheme } from '../storage/preferences';
import { themes, type AppThemeId, type ColorPalette } from './colors';

type ThemeContextValue = {
  theme: AppThemeId;
  colors: ColorPalette;
  setTheme: (theme: AppThemeId) => void;
  ready: boolean;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<AppThemeId>('default');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void loadTheme().then((loaded) => {
      if (!cancelled) {
        setThemeState(loaded);
        setReady(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const setTheme = useCallback((next: AppThemeId) => {
    setThemeState(next);
    void saveTheme(next);
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      colors: themes[theme],
      setTheme,
      ready,
    }),
    [theme, setTheme, ready],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return ctx;
}
