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
    <div className="flex flex-col bg-column border border-border rounded-2xl shadow-md min-w-[270px] max-w-xs px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <span className="font-bold text-base uppercase tracking-wide text-muted-foreground">{title}</span>
        <Button size="icon" variant="outline" className="border-muted" onClick={() => onAdd(status)}>
          +
        </Button>
      </div>
      <div className="flex flex-col gap-6">
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