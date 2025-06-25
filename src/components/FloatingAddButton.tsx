import { Button } from './ui/button';
import { Plus } from 'lucide-react';

interface FloatingAddButtonProps {
  onClick: () => void;
}

export function FloatingAddButton({ onClick }: FloatingAddButtonProps) {
  return (
    <Button
      onClick={onClick}
      className="fixed bottom-8 right-8 z-50 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full shadow-lg w-14 h-14 flex items-center justify-center text-3xl hover:scale-105 transition-transform"
      size="icon"
    >
      <Plus className="h-8 w-8" />
    </Button>
  );
} 