'use client';

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { getThemeById, type ThemeDef } from './themes';

interface ThemeContextValue {
  theme: ThemeDef;
  setThemeId: (id: string) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: getThemeById('phosphor'),
  setThemeId: () => {},
});

function applyThemeVars(theme: ThemeDef) {
  const root = document.documentElement;
  const c = theme.colors;
  root.style.setProperty('--c-primary', c.primary);
  root.style.setProperty('--c-secondary', c.secondary);
  root.style.setProperty('--c-muted', c.muted);
  root.style.setProperty('--c-dark', c.dark);
  root.style.setProperty('--c-bg', c.bg);
  root.style.setProperty('--c-bg-alt', c.bgAlt);
  root.style.setProperty('--c-accent', c.accent);
  root.style.setProperty('--c-accent-dim', c.accentDim);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeDef>(getThemeById('phosphor'));

  useEffect(() => {
    try {
      const saved = localStorage.getItem('terminal_theme');
      if (saved) {
        const t = getThemeById(saved);
        setTheme(t);
        applyThemeVars(t);
      }
    } catch {}
  }, []);

  const setThemeId = useCallback((id: string) => {
    const t = getThemeById(id);
    setTheme(t);
    applyThemeVars(t);
    try { localStorage.setItem('terminal_theme', id); } catch {}
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setThemeId }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
