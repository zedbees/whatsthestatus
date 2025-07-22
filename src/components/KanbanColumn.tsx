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
  const isActiveColumn = status === 'IN_PROGRESS';
  
  return (
    <div className={`flex flex-col h-full bg-column  rounded-2xl shadow-sm min-w-[280px] max-w-xs px-6 ${isActiveColumn ? 'ring-2 ring-primary/20 border-primary/30' : ''}`}>
      <div className="flex items-center justify-between pt-6 pb-2">
        <span className={`font-bold text-lg uppercase tracking-wide mb-4 ${isActiveColumn ? 'text-primary' : 'text-muted-foreground'}`}>{title}</span>
        <Button size="icon" variant="outline" className="border-border text-base font-medium hover:bg-primary hover:text-white hover:border-primary" onClick={() => onAdd(status)}>
          +
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto min-h-0 max-h-full flex flex-col gap-6 pb-6">
        {tasks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <div className="text-sm font-medium mb-1">No tasks yet</div>
            <div className="text-xs opacity-70">Click + to add a task</div>
          </div>
        ) : (
          tasks.map(task => (
          <KanbanCard
            key={task.id}
            task={task}
            onDelete={onDelete}
            onEdit={onEdit}
            onMove={onMove}
            onToggleTimer={onToggleTimer}
          />
          ))
        )}
      </div>
    </div>
  );
} 