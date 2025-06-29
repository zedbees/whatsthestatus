import React, { createContext, useContext, useEffect, useState } from 'react';
import { settingsStore } from '../stores/settings';
import type { Theme } from '../themes';
import { themes } from '../themes';

interface ThemeProviderProps {
  children: React.ReactNode;
}

interface ThemeContextType {
  theme: Theme;
  setThemeById: (id: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(themes[0]);

  useEffect(() => {
    const loadTheme = async () => {
      const settings = await settingsStore.getSettings();
      const themeId = typeof settings.themeId === 'string' ? settings.themeId : undefined;
      const found = themeId
        ? themes.find((t: Theme) => t.id === themeId)
        : undefined;
      setTheme(found || themes[0]);
    };
    loadTheme();
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--${key}`, value);
    });
    settingsStore.updateSettings({ themeId: theme.id });
  }, [theme]);

  const setThemeById = (id: string) => {
    const found = themes.find((t: Theme) => t.id === id);
    if (found) setTheme(found);
  };

  return (
    <ThemeContext.Provider value={{ theme, setThemeById }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}; 