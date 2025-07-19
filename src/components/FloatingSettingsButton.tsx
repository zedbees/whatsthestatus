import { Settings } from 'lucide-react';
import { Button } from './ui/button';

interface FloatingSettingsButtonProps {
  onClick: () => void;
}

export function FloatingSettingsButton({ onClick }: FloatingSettingsButtonProps) {
  return (
    <Button
      size="icon"
      variant="ghost"
      onClick={onClick}
      className="fixed top-4 right-16 z-50 w-10 h-10 bg-background/80 backdrop-blur-sm text-muted-foreground hover:text-foreground hover:bg-background/90 transition-all duration-200 shadow-sm hover:shadow-md"
      aria-label="Settings"
    >
      <Settings className="h-4 w-4" />
    </Button>
  );
} 