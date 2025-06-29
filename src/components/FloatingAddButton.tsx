import { Button } from './ui/button';
import { Plus } from 'lucide-react';

interface FloatingAddButtonProps {
  onClick: () => void;
}

export function FloatingAddButton({ onClick }: FloatingAddButtonProps) {
  return (
    <Button
      onClick={onClick}
      className="fixed bottom-8 right-8 z-50 bg-primary text-foreground rounded-full shadow-lg w-14 h-14 flex items-center justify-center text-3xl hover:bg-primary/90 transition-colors"
      size="icon"
      aria-label="Add Task"
    >
      <Plus className="h-8 w-8 text-foreground" />
    </Button>
  );
} 