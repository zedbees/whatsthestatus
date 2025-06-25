import { Button } from './ui/button';
import { Settings } from 'lucide-react';

interface FloatingSettingsButtonProps {
  onClick: () => void;
}

export function FloatingSettingsButton({ onClick }: FloatingSettingsButtonProps) {
  return (
    <Button
      onClick={onClick}
      className="fixed bottom-8 left-8 z-50 bg-primary text-primary-foreground rounded-full shadow-lg w-12 h-12 flex items-center justify-center hover:bg-primary/90 transition-colors"
      size="icon"
      aria-label="Open Settings"
    >
      <Settings className="h-6 w-6" />
    </Button>
  );
} 