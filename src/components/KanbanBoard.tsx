import { useState } from 'react';
import { Task, TaskStatus } from '../types/tasks';
import { KanbanColumn } from './KanbanColumn';
import { DoneColumn } from './DoneColumn';
import { FloatingAddButton } from './FloatingAddButton';
import { FloatingSettingsButton } from './FloatingSettingsButton';
import { SettingsModal } from './SettingsModal';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const STATUS_ORDER: TaskStatus[] = ['UP_NEXT', 'WORKING', 'BLOCKED'];
const STATUS_LABELS: Record<TaskStatus, string> = {
  NEW: 'Backlog',
  UP_NEXT: 'Up Next',
  WORKING: 'Currently Working',
  BLOCKED: 'Blocked',
  DONE: 'Done',
};

const DEMO_TASKS: Task[] = [
  {
    id: '1',
    title: 'Design Kanban UI',
    status: 'NEW',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'Implement Timer Logic',
    status: 'WORKING',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    startedAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(), // 12 min ago
  },
  {
    id: '3',
    title: 'Write Documentation',
    status: 'UP_NEXT',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '4',
    title: 'Fix Chrome Storage Bug',
    status: 'BLOCKED',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '5',
    title: 'Polish UI',
    status: 'DONE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export function KanbanBoard() {
  const [tasks, setTasks] = useState<Task[]>(DEMO_TASKS);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showBacklog, setShowBacklog] = useState(false);
  const [showDone, setShowDone] = useState(false);

  const addTask = (status: TaskStatus) => {
    const title = prompt('Task title?');
    if (!title) return;
    setTasks([
      ...tasks,
      {
        id: crypto.randomUUID(),
        title,
        status,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]);
  };

  const deleteTask = (id: string) => setTasks(tasks.filter(t => t.id !== id));
  const editTask = (id: string) => {
    const title = prompt('Edit task title?');
    if (!title) return;
    setTasks(tasks.map(t => t.id === id ? { ...t, title, updatedAt: new Date().toISOString() } : t));
  };
  const moveTask = (id: string, direction: 'left' | 'right') => {
    setTasks(tasks => tasks.map(t => {
      if (t.id !== id) return t;
      const allStatuses: TaskStatus[] = ['NEW', ...STATUS_ORDER, 'DONE'];
      const idx = allStatuses.indexOf(t.status as TaskStatus);
      const newIdx = direction === 'left' ? Math.max(0, idx - 1) : Math.min(allStatuses.length - 1, idx + 1);
      return { ...t, status: allStatuses[newIdx], updatedAt: new Date().toISOString() };
    }));
  };
  const toggleTimer = (id: string) => {
    setTasks(tasks => tasks.map(t => {
      if (t.id !== id) return t;
      if (t.status !== 'WORKING') {
        return { ...t, status: 'WORKING', startedAt: new Date().toISOString() };
      } else {
        return { ...t, status: 'UP_NEXT', startedAt: undefined };
      }
    }));
  };

  return (
    <div className="relative min-h-[80vh] bg-background">
      {/* Subtle dark gradient background */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[#18181b] via-[#232336] to-[#18181b] opacity-90" />
      <FloatingSettingsButton onClick={() => setSettingsOpen(true)} />
      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
      {/* Sticky Backlog Button */}
      <button
        className="fixed left-0 top-1/2 -translate-y-1/2 z-40 bg-card border border-border rounded-r-lg shadow px-3 py-3 flex items-center gap-2 hover:bg-muted transition-colors"
        onClick={() => setShowBacklog(v => !v)}
        aria-label="Show Backlog"
      >
        <ChevronLeft className={`h-6 w-6 transition-transform ${showBacklog ? 'rotate-180' : ''}`} />
        <span className="text-xs font-medium text-muted-foreground select-none">Backlog</span>
      </button>
      {/* Sticky Done Button */}
      <button
        className="fixed right-0 top-1/2 -translate-y-1/2 z-40 bg-card border border-border rounded-l-lg shadow px-3 py-3 flex items-center gap-2 hover:bg-muted transition-colors"
        onClick={() => setShowDone(v => !v)}
        aria-label="Show Done"
      >
        <span className="text-xs font-medium text-muted-foreground select-none">Done</span>
        <ChevronRight className={`h-6 w-6 transition-transform ${showDone ? 'rotate-180' : ''}`} />
      </button>
      {/* Slide-in Backlog */}
      <div className={`fixed top-0 left-0 h-full z-30 transition-transform duration-300 ${showBacklog ? 'translate-x-0' : '-translate-x-full'}`} style={{width: 340}}>
        <div className="h-full bg-background border-r border-border shadow-lg flex flex-col">
          <KanbanColumn
            title={STATUS_LABELS['NEW']}
            status={'NEW'}
            tasks={tasks.filter(t => t.status === 'NEW')}
            onAdd={addTask}
            onDelete={deleteTask}
            onEdit={editTask}
            onMove={moveTask}
            onToggleTimer={toggleTimer}
          />
        </div>
      </div>
      {/* Slide-in Done */}
      <div className={`fixed top-0 right-0 h-full z-30 transition-transform duration-300 ${showDone ? 'translate-x-0' : 'translate-x-full'}`} style={{width: 340}}>
        <div className="h-full bg-background border-l border-border shadow-lg flex flex-col">
          <DoneColumn
            tasks={tasks.filter(t => t.status === 'DONE')}
            onDelete={deleteTask}
            onEdit={editTask}
            onMove={moveTask}
            onToggleTimer={toggleTimer}
          />
        </div>
      </div>
      {/* Main Columns */}
      <div className="flex gap-8 overflow-x-auto p-4 sm:p-6 md:p-8 w-full">
        {STATUS_ORDER.map(status => (
          <KanbanColumn
            key={status}
            title={STATUS_LABELS[status]}
            status={status}
            tasks={tasks.filter(t => t.status === status)}
            onAdd={addTask}
            onDelete={deleteTask}
            onEdit={editTask}
            onMove={moveTask}
            onToggleTimer={toggleTimer}
          />
        ))}
      </div>
      <FloatingAddButton onClick={() => addTask('NEW')} />
    </div>
  );
} 