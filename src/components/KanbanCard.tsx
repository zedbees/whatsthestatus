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

  // State display names and colors for pills
  const stateDisplay: Record<string, { label: string; color: string }> = {
    UP_NEXT: { label: 'Up Next', color: '#a5b4fc' },
    WORKING: { label: 'Working', color: '#6ee7b7' },
    IN_PROGRESS: { label: 'In Progress', color: '#fbbf24' },
    BLOCKED: { label: 'Blocked', color: '#fca5a5' },
    NEW: { label: 'Backlog', color: '#d1d5db' },
    DONE: { label: 'Done', color: '#c7d2fe' },
  };

  // Human-readable duration formatter
  function formatDuration(ms: number): string {
    const s = Math.floor(ms / 1000);
    if (s < 60) return `${s} second${s !== 1 ? 's' : ''}`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m} minute${m !== 1 ? 's' : ''}`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} hour${h !== 1 ? 's' : ''}`;
    const d = Math.floor(h / 24);
    if (d < 7) return `${d} day${d !== 1 ? 's' : ''}`;
    const w = Math.floor(d / 7);
    if (w < 4) return `${w} week${w !== 1 ? 's' : ''}`;
    const mo = Math.floor(d / 30);
    return `${mo} month${mo !== 1 ? 's' : ''}`;
  }

  // Prepare pills from history
  const now = Date.now();
  const pills = task.history.map((entry, i) => {
    const start = new Date(entry.enteredAt).getTime();
    const end = entry.exitedAt ? new Date(entry.exitedAt).getTime() : now;
    const durationMs = end - start;
    return {
      key: `${entry.status}-${i}`,
      status: entry.status,
      label: stateDisplay[entry.status]?.label || entry.status,
      color: stateDisplay[entry.status]?.color || '#e5e7eb',
      duration: formatDuration(durationMs),
    };
  });

  return (
    <div className={`relative bg-card border border-border rounded-xl shadow-sm group overflow-hidden transition-all hover:shadow-md hover:-translate-y-0.5 px-6 py-5 flex flex-col justify-between min-h-[120px]`}>
      <div>
        <div
          className="font-semibold text-base text-foreground leading-snug line-clamp-3 mb-3"
          title={task.title}
        >
          {task.title}
        </div>
        {/* Pills row for state durations */}
        <div className="flex flex-wrap gap-2 mt-2">
          {pills.map(pill => (
            <span
              key={pill.key}
              className="px-2 py-0.5 rounded-full text-xs font-semibold shadow-sm"
              style={{ background: pill.color, color: '#222', minWidth: 70, textAlign: 'center' }}
              title={`${pill.label}: ${pill.duration}`}
            >
              {pill.label} {pill.duration}
            </span>
          ))}
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