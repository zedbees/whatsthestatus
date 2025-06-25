import { Task, TaskStatus } from '../types/tasks';
import { KanbanCard } from './KanbanCard';
import { Button } from './ui/button';

interface KanbanColumnProps {
  title: string;
  status: TaskStatus;
  tasks: Task[];
  onAdd: (status: TaskStatus) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
  onMove: (id: string, direction: 'left' | 'right') => void;
  onToggleTimer: (id: string) => void;
}

export function KanbanColumn({ title, status, tasks, onAdd, onDelete, onEdit, onMove, onToggleTimer }: KanbanColumnProps) {
  return (
    <div className="flex flex-col bg-card rounded-xl border border-border shadow-md min-w-[270px] max-w-xs px-3 py-4">
      <div className="flex items-center justify-between mb-4">
        <span className="font-semibold text-xs uppercase tracking-wide text-muted-foreground">{title}</span>
        <Button size="icon" variant="outline" className="border-muted" onClick={() => onAdd(status)}>
          +
        </Button>
      </div>
      <div className="flex flex-col gap-3">
        {tasks.map(task => (
          <KanbanCard
            key={task.id}
            task={task}
            onDelete={onDelete}
            onEdit={onEdit}
            onMove={onMove}
            onToggleTimer={onToggleTimer}
          />
        ))}
      </div>
    </div>
  );
} 