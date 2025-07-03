import { Sun, Moon } from 'lucide-react';
import { useEffect, useState } from 'react';

export function ThemeToggleFloatingButton() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    // On first load, use system preference
    const stored = localStorage.getItem('theme');
    if (stored === 'light' || stored === 'dark') {
      setTheme(stored);
      applyTheme(stored);
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const initial = prefersDark ? 'dark' : 'light';
      setTheme(initial);
      applyTheme(initial);
      localStorage.setItem('theme', initial);
    }
  }, []);

  function applyTheme(mode: 'light' | 'dark') {
    if (mode === 'light') {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
    }
  }

  function toggleTheme() {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    localStorage.setItem('theme', next);
    applyTheme(next);
  }

  function getThemeIcon() {
    if (theme === 'light') return <Sun className="h-6 w-6" />;
    return <Moon className="h-6 w-6" />;
  }

  function getThemeLabel() {
    return theme === 'light' ? 'Light mode' : 'Dark mode';
  }

  return (
    <button
      className="fixed bottom-24 left-8 z-50 bg-card text-foreground rounded-full shadow-lg w-12 h-12 flex items-center justify-center hover:bg-muted transition-colors"
      onClick={toggleTheme}
      aria-label={getThemeLabel()}
      title={getThemeLabel()}
      style={{ boxShadow: '0 4px 24px 0 rgb(0 0 0 / 0.08)' }}
    >
      {getThemeIcon()}
    </button>
  );
} 