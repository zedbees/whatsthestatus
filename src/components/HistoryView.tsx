import React from 'react';
import { Button } from './ui/button';
import { ChevronLeft } from 'lucide-react';

interface HistoryViewProps {
  onClose: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-background">
      <div className="h-full p-8">
        <div className="mx-auto max-w-2xl">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={onClose}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-2xl font-bold">History</h1>
            </div>
          </div>

          <div className="text-center text-muted-foreground">
            No history available
          </div>
        </div>
      </div>
    </div>
  );
}; 