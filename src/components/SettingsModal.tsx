import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Sun, Moon, Laptop } from 'lucide-react';
import { useTheme } from './ThemeProvider';

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  const { theme, setTheme } = useTheme();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 mt-4">
          <div>
            <div className="font-semibold mb-2">Theme</div>
            <div className="flex gap-2">
              <Button
                variant={theme === 'light' ? 'default' : 'outline'}
                onClick={() => setTheme('light')}
                size="icon"
                aria-label="Light Theme"
              >
                <Sun />
              </Button>
              <Button
                variant={theme === 'dark' ? 'default' : 'outline'}
                onClick={() => setTheme('dark')}
                size="icon"
                aria-label="Dark Theme"
              >
                <Moon />
              </Button>
              <Button
                variant={theme === 'system' ? 'default' : 'outline'}
                onClick={() => setTheme('system')}
                size="icon"
                aria-label="System Theme"
              >
                <Laptop />
              </Button>
            </div>
          </div>
          <div>
            <div className="font-semibold mb-2">Connect Platforms</div>
            <div className="text-muted-foreground text-sm">Coming soon: Integrate with your favorite productivity tools.</div>
          </div>
          <div>
            <div className="font-semibold mb-2">Account</div>
            <div className="text-muted-foreground text-sm">Sign in to sync your board across devices. (Coming soon)</div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 