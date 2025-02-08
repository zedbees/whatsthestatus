import React, { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Play, Pause } from 'lucide-react';
import { cn } from '../lib/utils';

interface TimerProps {
  taskId: string;
  initialTime: number;
  isActive?: boolean;
  onTimeUpdate: (taskId: string, timeSpent: number) => void;
  onStatusChange?: (taskId: string, status: 'in-progress' | 'paused') => void;
}

export const Timer: React.FC<TimerProps> = ({
  taskId,
  initialTime,
  isActive = false,
  onTimeUpdate,
  onStatusChange
}) => {
  const [time, setTime] = useState(initialTime);
  const [isRunning, setIsRunning] = useState(isActive);

  useEffect(() => {
    let intervalId: number;

    if (isRunning) {
      intervalId = window.setInterval(() => {
        setTime(prevTime => prevTime + 1);
      }, 1000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isRunning]);

  useEffect(() => {
    onTimeUpdate(taskId, time);
  }, [time, taskId, onTimeUpdate]);

  const handleStart = () => {
    setIsRunning(true);
    onStatusChange?.(taskId, 'in-progress');
  };

  const handlePause = () => {
    setIsRunning(false);
    onStatusChange?.(taskId, 'paused');
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-2">
      <div className={cn(
        "font-mono text-sm",
        isRunning ? "text-primary" : "text-muted-foreground"
      )}>
        {formatTime(time)}
      </div>
      <div className="flex gap-1">
        {!isRunning ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleStart}
            className="h-8 w-8"
          >
            <Play className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePause}
            className="h-8 w-8 text-primary"
          >
            <Pause className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}; 