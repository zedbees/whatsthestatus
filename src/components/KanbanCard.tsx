import { Task } from '../types/tasks';
import { Button } from './ui/button';
import { Trash2, Edit2, Play, Pause, ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';

interface KanbanCardProps {
  task: Task;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
  onMove: (id: string, direction: 'left' | 'right') => void;
  onToggleTimer: (id: string) => void;
}

export function KanbanCard({ task, onDelete, onEdit, onMove, onToggleTimer }: KanbanCardProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (task.status === 'WORKING' && task.startedAt) {
      const interval = setInterval(() => {
        setElapsed(Math.floor((Date.now() - new Date(task.startedAt!).getTime()) / 1000));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [task.status, task.startedAt]);

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-card rounded-lg border border-purple-700/40 p-4 flex items-center justify-between gap-2 shadow-sm">
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">{task.title}</div>
        {task.status === 'WORKING' && (
          <div className="text-xs text-purple-400 mt-1">{formatTime(elapsed)}</div>
        )}
      </div>
      <div className="flex items-center gap-1">
        {task.status === 'WORKING' && (
          <Button size="icon" variant="ghost" onClick={() => onToggleTimer(task.id)}>
            <Pause className="h-4 w-4" />
          </Button>
        )}
        {task.status !== 'WORKING' && (
          <Button size="icon" variant="ghost" onClick={() => onToggleTimer(task.id)}>
            <Play className="h-4 w-4" />
          </Button>
        )}
        <Button size="icon" variant="ghost" onClick={() => onEdit(task.id)}>
          <Edit2 className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="ghost" onClick={() => onDelete(task.id)}>
          <Trash2 className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="ghost" onClick={() => onMove(task.id, 'left')}>
          <ArrowRight className="h-4 w-4 rotate-180" />
        </Button>
        <Button size="icon" variant="ghost" onClick={() => onMove(task.id, 'right')}>
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
} 