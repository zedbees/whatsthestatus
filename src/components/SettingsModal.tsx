import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  // Theme is now handled by the custom ThemeProvider

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
            <div className="font-semibold mb-2">Import Board</div>
            <div className="text-muted-foreground text-sm">Import from Jira, Trello, Azure, and more. <span className='italic'>Coming soon</span>.</div>
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