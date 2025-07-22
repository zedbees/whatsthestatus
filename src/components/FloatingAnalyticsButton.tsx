import { BarChart2 } from 'lucide-react';
import { Button } from './ui/button';

interface FloatingAnalyticsButtonProps {
  onClick: () => void;
}

export function FloatingAnalyticsButton({ onClick }: FloatingAnalyticsButtonProps) {
  return (
    <Button
      onClick={onClick}
      size="icon"
      variant="ghost"
      className="border-border"
      aria-label="Show Analytics"
      type="button"
    >
      <BarChart2 className="h-6 w-6" />
    </Button>
  );
} 