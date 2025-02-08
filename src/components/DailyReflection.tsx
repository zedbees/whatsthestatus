import React, { useState } from 'react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';

interface DailyReflectionProps {
  onSubmit: (reflection: string) => void;
  onSkip: () => void;
}

export const DailyReflection: React.FC<DailyReflectionProps> = ({
  onSubmit,
  onSkip
}) => {
  const [reflection, setReflection] = useState('');

  return (
    <div className="bg-card rounded-lg border p-4 space-y-3">
      <h2 className="font-semibold">End of Day Reflection</h2>
      <Textarea
        value={reflection}
        onChange={(e) => setReflection(e.target.value)}
        placeholder="How did today go?"
        className="h-20"
      />
      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={onSkip}>
          Skip
        </Button>
        <Button onClick={() => onSubmit(reflection)}>
          Save
        </Button>
      </div>
    </div>
  );
}; 