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
      className="border-border"
      aria-label="Settings"
    >
      <Settings className="h-6 w-6" />
    </Button>
  );
} 