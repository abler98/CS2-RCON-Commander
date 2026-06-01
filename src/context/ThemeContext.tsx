/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { Theme } from '../types/themes';
import { THEMES } from '../constants/themes';

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const savedThemeId = localStorage.getItem('theme');
    return THEMES.find(t => t.id === savedThemeId) ?? THEMES[0];
  });

  useEffect(() => {
    localStorage.setItem('theme', theme.id);
    // Apply theme to body and root for global consistency
    const applyTheme = () => {
      THEMES.forEach(t => {
        if (t.class) {
          document.body.classList.remove(t.class);
          document.documentElement.classList.remove(t.class);
        }
      });
      if (theme.class) {
        document.body.classList.add(theme.class);
        document.documentElement.classList.add(theme.class);
      }
    };
    applyTheme();
  }, [theme]);

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx;
}
