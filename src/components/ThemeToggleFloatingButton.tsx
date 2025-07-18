import { Sun, Moon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTheme } from './ThemeProvider';
import { themes } from '../themes';

export function ThemeToggleFloatingButton() {
  const { theme, setThemeById } = useTheme();
  const [isDark, setIsDark] = useState(theme.isDark);

  useEffect(() => {
    setIsDark(theme.isDark);
  }, [theme]);

  function toggleTheme() {
    // Find the opposite theme (light vs dark) of the same color family
    const currentThemeIndex = themes.findIndex(t => t.id === theme.id);
    const isCurrentDark = themes[currentThemeIndex].isDark;
    
    // Find the opposite theme in the same family
    const oppositeTheme = themes.find(t => 
      t.isDark !== isCurrentDark && 
      (t.id.includes('purple') || t.id.includes('blue'))
    );
    
    if (oppositeTheme) {
      setThemeById(oppositeTheme.id);
    } else {
      // Fallback: toggle between first light and first dark theme
      const lightTheme = themes.find(t => !t.isDark);
      const darkTheme = themes.find(t => t.isDark);
      
      if (isCurrentDark && lightTheme) {
        setThemeById(lightTheme.id);
      } else if (!isCurrentDark && darkTheme) {
        setThemeById(darkTheme.id);
      }
    }
  }

  function getThemeIcon() {
    return isDark ? <Sun className="h-6 w-6" /> : <Moon className="h-6 w-6" />;
  }

  function getThemeLabel() {
    return isDark ? 'Switch to light mode' : 'Switch to dark mode';
  }

  return (
    <button
      className="fixed bottom-24 left-8 z-50 bg-background text-primary border border-border rounded-full shadow-lg w-12 h-12 flex items-center justify-center hover:bg-muted hover:text-primary transition-colors dark:bg-primary dark:text-primary-foreground dark:border-none dark:shadow hover:dark:bg-primary/90"
      onClick={toggleTheme}
      aria-label={getThemeLabel()}
      title={getThemeLabel()}
      style={{ boxShadow: '0 4px 24px 0 rgb(0 0 0 / 0.08)' }}
    >
      {getThemeIcon()}
    </button>
  );
} 