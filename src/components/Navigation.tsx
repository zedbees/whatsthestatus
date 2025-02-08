import React from 'react';
import { Button } from './ui/button';
import { History, Settings } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

interface NavigationProps {
  onHistoryClick: () => void;
  onSettingsClick: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  onHistoryClick,
  onSettingsClick,
}) => {
  return (
    <div className="fixed bottom-8 right-8 flex gap-2">
      <ThemeToggle />
      <Button
        variant="outline"
        size="icon"
        onClick={onHistoryClick}
        className="rounded-full"
      >
        <History className="h-4 w-4" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        onClick={onSettingsClick}
        className="rounded-full"
      >
        <Settings className="h-4 w-4" />
      </Button>
    </div>
  );
}; 