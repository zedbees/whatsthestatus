import { Button } from './ui/button';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from './ThemeProvider';
import { themes } from '../themes';

export function ThemeToggle() {
  const { theme, setThemeById } = useTheme();

  // Find the first light and dark theme ids
  const lightTheme = themes.find(t => !t.isDark);
  const darkTheme = themes.find(t => t.isDark);

  const toggleTheme = () => {
    if (theme.isDark && lightTheme) {
      setThemeById(lightTheme.id);
    } else if (!theme.isDark && darkTheme) {
      setThemeById(darkTheme.id);
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="rounded-full"
    >
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
} 