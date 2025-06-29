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

function statusBgColor(status: string) {
  if (status === 'UP_NEXT') return 'bg-blue-900/20';
  if (status === 'WORKING') return 'bg-green-900/20';
  if (status === 'BLOCKED') return 'bg-red-900/20';
  return 'bg-card';
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
    <div className={`relative ${statusBgColor(task.status)} rounded-md shadow-sm group overflow-hidden transition-transform hover:shadow-lg hover:-translate-y-1 px-5 py-6 flex flex-col justify-between min-h-[110px]`}>
      <div>
        <div
          className="font-medium text-base text-foreground leading-snug line-clamp-3 mb-1"
          title={task.title}
        >
          {task.title}
        </div>
        {task.status === 'WORKING' && (
          <div className="text-xs text-muted-foreground/80 font-mono mb-1">{formatTime(elapsed)}</div>
        )}
      </div>
      <div className="flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
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