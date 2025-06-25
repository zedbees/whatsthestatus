import { Button } from './ui/button';
import { Settings } from 'lucide-react';

interface FloatingSettingsButtonProps {
  onClick: () => void;
}

export function FloatingSettingsButton({ onClick }: FloatingSettingsButtonProps) {
  return (
    <Button
      onClick={onClick}
      className="fixed bottom-8 left-8 z-50 bg-background/80 border border-purple-700/40 text-purple-300 rounded-full shadow w-12 h-12 flex items-center justify-center hover:bg-background/90 hover:text-pink-400 transition-colors"
      size="icon"
      aria-label="Open Settings"
    >
      <Settings className="h-6 w-6" />
    </Button>
  );
} 