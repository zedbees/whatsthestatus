import { useState } from 'react';
import { Task } from '../types/tasks';
import { KanbanCard } from './KanbanCard';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface DoneColumnProps {
  tasks: Task[];
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
  onMove: (id: string, direction: 'left' | 'right') => void;
  onToggleTimer: (id: string) => void;
  onShowDetails: (id: string) => void;
}

export function DoneColumn({ tasks, onDelete, onEdit, onMove, onToggleTimer, onShowDetails }: DoneColumnProps) {
  const [collapsed, setCollapsed] = useState(true);
  return (
    <div className="flex flex-col bg-column border border-border rounded-2xl shadow-sm min-w-[280px] max-w-xs px-6 py-6">
      <div className="flex items-center justify-between mb-4 cursor-pointer" onClick={() => setCollapsed(!collapsed)}>
        <span className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Done ({tasks.length})</span>
        {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
      </div>
      {!collapsed && (
        <div className="flex flex-col gap-4">
          {tasks.map(task => (
            <KanbanCard
              key={task.id}
              task={task}
              onDelete={onDelete}
              onEdit={onEdit}
              onMove={onMove}
              onToggleTimer={onToggleTimer}
              onShowDetails={onShowDetails}
            />
          ))}
        </div>
      )}
    </div>
  );
} 