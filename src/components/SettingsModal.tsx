import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { useEffect } from 'react';

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  useEffect(() => {
    const stored = localStorage.getItem('theme') || 'system';
    applyTheme(stored);
  }, [open]);

  function applyTheme(mode: string) {
    if (mode === 'light') {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    } else if (mode === 'dark') {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('light', 'dark');
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 mt-4">
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