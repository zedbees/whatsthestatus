import { Moon, Sun } from 'lucide-react';
import { useTheme } from './ThemeProvider';
import { Button } from './ui/button';
import { themes } from '../themes';

export function ThemeToggleFloatingButton() {
  const { theme, setThemeById } = useTheme();

  const toggleTheme = () => {
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
  };

  return (
    <Button
      size="icon"
      variant="ghost"
      onClick={toggleTheme}
      className="border-border"
      aria-label="Toggle theme"
    >
      {theme.isDark ? (
        <Sun className="h-6 w-6" />
      ) : (
        <Moon className="h-6 w-6" />
      )}
    </Button>
  );
} 