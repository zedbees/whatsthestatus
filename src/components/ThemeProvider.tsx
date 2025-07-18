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
  // Default to the first dark theme instead of first theme
  const defaultTheme = themes.find(t => t.isDark) || themes[0];
  const [theme, setTheme] = useState<Theme>(defaultTheme);

  useEffect(() => {
    const loadTheme = async () => {
      const settings = await settingsStore.getSettings();
      const themeId = typeof settings.themeId === 'string' ? settings.themeId : undefined;
      const found = themeId
        ? themes.find((t: Theme) => t.id === themeId)
        : undefined;
      
      // If no theme is saved, check system preference
      if (!found) {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const systemTheme = themes.find(t => t.isDark === prefersDark);
        setTheme(systemTheme || defaultTheme);
      } else {
        setTheme(found);
      }
    };
    loadTheme();
  }, [defaultTheme]);

  useEffect(() => {
    const root = window.document.documentElement;
    
    // Apply the dark class based on theme
    if (theme.isDark) {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }

    // Map custom theme colors to Tailwind CSS variables
    const colorMappings = {
      background: theme.colors.background,
      card: theme.colors.card,
      border: theme.colors.border,
      primary: theme.colors.primary,
      accent: theme.colors.accent,
      text: theme.colors.text,
      muted: theme.colors.muted,
    };

    // Apply custom colors as CSS custom properties
    Object.entries(colorMappings).forEach(([key, value]) => {
      root.style.setProperty(`--${key}`, value);
    });

    // Update settings
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