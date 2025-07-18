import { Button } from './ui/button';
import { Settings } from 'lucide-react';

interface FloatingSettingsButtonProps {
  onClick: () => void;
}

export function FloatingSettingsButton({ onClick }: FloatingSettingsButtonProps) {
  return (
    <Button
      onClick={onClick}
      className="fixed bottom-8 left-8 z-50 bg-background text-primary border border-border rounded-full shadow-lg w-12 h-12 flex items-center justify-center hover:bg-muted hover:text-primary transition-colors dark:bg-primary dark:text-primary-foreground dark:border-none dark:shadow hover:dark:bg-primary/90"
      size="icon"
      aria-label="Open Settings"
    >
      <Settings className="h-6 w-6" />
    </Button>
  );
} 