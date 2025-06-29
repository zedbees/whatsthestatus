import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { useState } from 'react';
import { ThemeSwitcherModal } from './ThemeSwitcherModal';

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  const [themeModalOpen, setThemeModalOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 mt-4">
          <div>
            <div className="font-semibold mb-2">Theme</div>
            <Button
              variant="outline"
              onClick={() => setThemeModalOpen(true)}
              className="w-full"
              aria-label="Change Theme"
            >
              Change Theme
            </Button>
            <ThemeSwitcherModal open={themeModalOpen} onClose={() => setThemeModalOpen(false)} />
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