import { Task } from '../types/tasks';
import { Button } from './ui/button';
import { Trash2, Edit2, Play, Pause, ArrowRight, Clock } from 'lucide-react';
import { useEffect, useState } from 'react';

interface KanbanCardProps {
  task: Task;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
  onMove: (id: string, direction: 'left' | 'right') => void;
  onToggleTimer: (id: string) => void;
  onShowDetails: (id: string) => void;
}

export function KanbanCard({ task, onDelete, onEdit, onMove, onToggleTimer, onShowDetails }: KanbanCardProps) {
  const [elapsed, setElapsed] = useState(0);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (task.status === 'WORKING' && task.startedAt) {
      const interval = setInterval(() => {
        const now = Date.now();
        const currentSessionTime = Math.floor((now - new Date(task.startedAt!).getTime()) / 1000);
        const totalElapsed = Math.floor((task.totalWorkingTime || 0) / 1000) + currentSessionTime;
        setElapsed(totalElapsed);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [task.status, task.startedAt, task.totalWorkingTime]);

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  // Truncate description to 2 lines (about 100 chars)
  const shortDescription = task.description && task.description.length > 100
    ? task.description.slice(0, 100) + '...'
    : task.description;

  // Tag display logic
  const maxTags = 2;
  const showTags = (task.tags || []).slice(0, maxTags);
  const extraTags = (task.tags || []).length - maxTags;

  // Show worked time badge only if actively working
  const showWorkedTime = task.status === 'WORKING';

  // Prevent click on hover menu from triggering card click
  const stopPropagation = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div
      className={`relative bg-card border border-border rounded-xl shadow-sm group transition-all hover:shadow-md hover:-translate-y-0.5 px-6 py-5 flex flex-col justify-between cursor-pointer hover:ring-2 hover:ring-primary/20`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onShowDetails(task.id)}
    >
      <div>
        {/* Title */}
        <div
          className="font-semibold text-base leading-snug mb-2 text-foreground"
          title={task.title}
        >
          {task.title}
        </div>
        {/* Tags (up to 2, +N if more) */}
        {task.tags && task.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2 mt-1">
            {showTags.map((tag, i) => (
              <span key={i} className="bg-muted-foreground/10 text-xs rounded px-2 py-0.5 font-medium text-muted-foreground">
                {tag}
              </span>
            ))}
            {extraTags > 0 && (
              <span className="bg-muted-foreground/10 text-xs rounded px-2 py-0.5 font-medium text-muted-foreground">+{extraTags}</span>
            )}
          </div>
        )}
        {/* Short/truncated description (2 lines max) */}
        {shortDescription && (
          <div className="text-sm text-muted-foreground leading-relaxed mb-2 whitespace-pre-line break-words line-clamp-2">
            {shortDescription}
          </div>
        )}
        {/* Worked time badge if actively working */}
        {showWorkedTime && (
          <div className="inline-flex items-center gap-2 px-2 py-1 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800 text-xs text-green-700 dark:text-green-300 font-semibold mb-2">
            <Clock className="w-4 h-4" />
            {formatTime(elapsed)}
          </div>
        )}
        {/* On hover: show all tags and full description */}
        {hovered && task.tags && task.tags.length > maxTags && (
          <div className="flex flex-wrap gap-2 mb-2 mt-1">
            {task.tags.slice(maxTags).map((tag, i) => (
              <span key={i} className="bg-muted-foreground/10 text-xs rounded px-2 py-0.5 font-medium text-muted-foreground">
                {tag}
              </span>
            ))}
          </div>
        )}
        {hovered && task.description && task.description.length > 100 && (
          <div className="text-sm text-muted-foreground leading-relaxed mb-2 whitespace-pre-line break-words">
            {task.description}
          </div>
        )}
      </div>
      {/* Quick actions: only on hover */}
      <div className={`flex items-center gap-1 mt-3 transition-opacity ${hovered ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} onClick={stopPropagation}>
        {task.status === 'WORKING' ? (
          <Button size="icon" variant="ghost" onClick={() => onToggleTimer(task.id)}>
            <Pause className="h-4 w-4" />
          </Button>
        ) : (
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