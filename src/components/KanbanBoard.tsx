import { useState } from 'react';
import { Task, TaskStatus } from '../types/tasks';
import { KanbanColumn } from './KanbanColumn';
import { DoneColumn } from './DoneColumn';
import { FloatingAddButton } from './FloatingAddButton';
import { FloatingSettingsButton } from './FloatingSettingsButton';
import { SettingsModal } from './SettingsModal';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const STATUS_ORDER: TaskStatus[] = ['UP_NEXT', 'BLOCKED'];
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

  // Find the active task (WORKING)
  const activeTask = tasks.find(t => t.status === 'WORKING');

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
  // Only one task can be WORKING at a time
  const toggleTimer = (id: string) => {
    setTasks(tasks => {
      const currentActive = tasks.find(t => t.status === 'WORKING');
      return tasks.map(t => {
        if (t.id === id) {
          if (t.status !== 'WORKING') {
            // Pause any other active task
            return { ...t, status: 'WORKING', startedAt: new Date().toISOString() };
          } else {
            return { ...t, status: 'UP_NEXT', startedAt: undefined };
          }
        } else if (currentActive && t.id === currentActive.id) {
          // Pause the previous active task
          return { ...t, status: 'UP_NEXT', startedAt: undefined };
        }
        return t;
      });
    });
  };

  const backlogCount = tasks.filter(t => t.status === 'NEW').length;
  const doneCount = tasks.filter(t => t.status === 'DONE').length;

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
        <span className="ml-2 bg-muted text-xs rounded-full px-2 py-0.5 font-semibold">{backlogCount}</span>
      </button>
      {/* Sticky Done Button */}
      <button
        className="fixed right-0 top-1/2 -translate-y-1/2 z-40 bg-card border border-border rounded-l-lg shadow px-3 py-3 flex items-center gap-2 hover:bg-muted transition-colors"
        onClick={() => setShowDone(v => !v)}
        aria-label="Show Done"
      >
        <span className="text-xs font-medium text-muted-foreground select-none">Done</span>
        <span className="ml-2 bg-muted text-xs rounded-full px-2 py-0.5 font-semibold">{doneCount}</span>
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
      {/* Active Task Player */}
      <div className="w-full flex justify-center items-center mt-4 mb-6">
        {activeTask ? (
          <div className="w-full max-w-xl bg-card border border-primary/40 rounded-xl shadow-lg px-8 py-6 flex flex-col items-center gap-3 animate-in fade-in slide-in-from-top-6">
            <div className="text-lg font-semibold text-primary mb-1">Now Working</div>
            <div className="text-2xl font-bold text-foreground mb-2">{activeTask.title}</div>
            {/* Timer and controls */}
            <div className="flex items-center gap-4">
              <span className="font-mono text-xl text-primary">
                {activeTask.startedAt ? formatElapsed(activeTask.startedAt) : '00:00:00'}
              </span>
              <button
                className="ml-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
                onClick={() => toggleTimer(activeTask.id)}
              >
                Pause
              </button>
              <button
                className="ml-2 px-4 py-2 rounded-lg bg-muted text-foreground font-medium hover:bg-muted/80 transition-colors"
                onClick={() => moveTask(activeTask.id, 'right')}
              >
                Mark Done
              </button>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-xl bg-card border border-border rounded-xl shadow px-8 py-6 flex items-center justify-center text-muted-foreground animate-in fade-in slide-in-from-top-6">
            <span className="text-base">Start a task to begin tracking time</span>
          </div>
        )}
      </div>
      {/* Main Columns Centered */}
      <div className="flex gap-8 justify-center overflow-x-auto p-4 sm:p-6 md:p-8 w-full z-10 mt-8">
        <KanbanColumn
          title={STATUS_LABELS['UP_NEXT']}
          status={'UP_NEXT'}
          tasks={tasks.filter(t => t.status === 'UP_NEXT')}
          onAdd={addTask}
          onDelete={deleteTask}
          onEdit={editTask}
          onMove={moveTask}
          onToggleTimer={toggleTimer}
        />
        <KanbanColumn
          title={STATUS_LABELS['BLOCKED']}
          status={'BLOCKED'}
          tasks={tasks.filter(t => t.status === 'BLOCKED')}
          onAdd={addTask}
          onDelete={deleteTask}
          onEdit={editTask}
          onMove={moveTask}
          onToggleTimer={toggleTimer}
        />
      </div>
      <FloatingAddButton onClick={() => addTask('NEW')} />
    </div>
  );
}

// Helper to format elapsed time from startedAt
function formatElapsed(startedAt: string) {
  const elapsed = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000);
  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const s = elapsed % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
} 