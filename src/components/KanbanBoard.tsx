import { useState, useRef, useEffect } from 'react';
import { Task, TaskStatus } from '../types/tasks';
import { KanbanColumn } from './KanbanColumn';
import { DoneColumn } from './DoneColumn';
import { FloatingAddButton } from './FloatingAddButton';
import { FloatingSettingsButton } from './FloatingSettingsButton';
import { SettingsModal } from './SettingsModal';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { ThemeToggleFloatingButton } from './ThemeToggleFloatingButton';
import { ChevronDown } from 'lucide-react';

const STATUS_ORDER: TaskStatus[] = ['UP_NEXT', 'IN_PROGRESS', 'BLOCKED'];
const STATUS_LABELS: Record<TaskStatus, string> = {
  NEW: 'Backlog',
  UP_NEXT: 'Up Next',
  WORKING: 'Now Working',
  IN_PROGRESS: 'In Progress',
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
    history: [
      { status: 'NEW', enteredAt: new Date().toISOString() }
    ]
  },
  {
    id: '2',
    title: 'Implement Timer Logic',
    status: 'WORKING',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    startedAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(), // 12 min ago
    history: [
      { status: 'NEW', enteredAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(), exitedAt: new Date(Date.now() - 1000 * 60 * 15).toISOString() },
      { status: 'UP_NEXT', enteredAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(), exitedAt: new Date(Date.now() - 1000 * 60 * 12).toISOString() },
      { status: 'WORKING', enteredAt: new Date(Date.now() - 1000 * 60 * 12).toISOString() }
    ]
  },
  {
    id: '3',
    title: 'Write Documentation',
    status: 'UP_NEXT',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    history: [
      { status: 'NEW', enteredAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(), exitedAt: new Date(Date.now() - 1000 * 60 * 5).toISOString() },
      { status: 'UP_NEXT', enteredAt: new Date(Date.now() - 1000 * 60 * 5).toISOString() }
    ]
  },
  {
    id: '4',
    title: 'Fix Chrome Storage Bug',
    status: 'BLOCKED',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    history: [
      { status: 'NEW', enteredAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), exitedAt: new Date(Date.now() - 1000 * 60 * 20).toISOString() },
      { status: 'UP_NEXT', enteredAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(), exitedAt: new Date(Date.now() - 1000 * 60 * 10).toISOString() },
      { status: 'BLOCKED', enteredAt: new Date(Date.now() - 1000 * 60 * 10).toISOString() }
    ]
  },
  {
    id: '5',
    title: 'Polish UI',
    status: 'DONE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    history: [
      { status: 'NEW', enteredAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(), exitedAt: new Date(Date.now() - 1000 * 60 * 40).toISOString() },
      { status: 'UP_NEXT', enteredAt: new Date(Date.now() - 1000 * 60 * 40).toISOString(), exitedAt: new Date(Date.now() - 1000 * 60 * 20).toISOString() },
      { status: 'WORKING', enteredAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(), exitedAt: new Date(Date.now() - 1000 * 60 * 10).toISOString() },
      { status: 'DONE', enteredAt: new Date(Date.now() - 1000 * 60 * 10).toISOString() }
    ]
  },
];

export function KanbanBoard() {
  const [tasks, setTasks] = useState<Task[]>(DEMO_TASKS);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showBacklog, setShowBacklog] = useState(false);
  const [showDone, setShowDone] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Update current time every second for live timer
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClick);
    } else {
      document.removeEventListener('mousedown', handleClick);
    }
    return () => document.removeEventListener('mousedown', handleClick);
  }, [dropdownOpen]);

  // Find the active task (WORKING)
  const activeTask = tasks.find(t => t.status === 'WORKING');

  // Live timer function for "Now Working" section
  const getLiveElapsed = (startedAt: string) => {
    const elapsed = Math.floor((currentTime - new Date(startedAt).getTime()) / 1000);
    const h = Math.floor(elapsed / 3600);
    const m = Math.floor((elapsed % 3600) / 60);
    const s = elapsed % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Demo workspaces/boards
  const [workspaces] = useState([
    { id: 'default', name: 'Personal' },
    { id: 'jira', name: 'Jira Board' },
    { id: 'azure', name: 'Azure DevOps' },
  ]);
  const [currentWorkspace, setCurrentWorkspace] = useState(workspaces[0].id);

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
        history: [
          { status, enteredAt: new Date().toISOString() }
        ]
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
            // Move to IN_PROGRESS when paused
            return { ...t, status: 'IN_PROGRESS', startedAt: undefined };
          }
        } else if (currentActive && t.id === currentActive.id) {
          // Pause the previous active task
          return { ...t, status: 'IN_PROGRESS', startedAt: undefined };
        }
        return t;
      });
    });
  };

  const backlogCount = tasks.filter(t => t.status === 'NEW').length;
  const doneCount = tasks.filter(t => t.status === 'DONE').length;

  return (
    <div className="relative min-h-[80vh] bg-background">
      {/* Workspace/Board Title Selector (Top Left) */}
      <div className="absolute left-8 top-6 z-50 flex items-center select-none" ref={dropdownRef}>
        <button
          className="flex items-center gap-2 text-base font-semibold text-foreground/70 bg-transparent border-none outline-none px-0 py-0 transition hover:underline hover:bg-muted/30 rounded-lg cursor-pointer"
          style={{ boxShadow: 'none' }}
          onClick={() => setDropdownOpen(v => !v)}
        >
          {workspaces.find(ws => ws.id === currentWorkspace)?.name}
          <ChevronDown className={`w-4 h-4 text-muted-foreground opacity-70 transition ${dropdownOpen ? 'rotate-180' : ''}`} />
        </button>
        {dropdownOpen && (
          <ol className="absolute left-0 top-full mt-2 bg-card shadow-lg rounded-lg py-2 min-w-[180px] border border-border animate-in fade-in z-50 list-none p-0">
            {workspaces.map(ws => (
              <li key={ws.id}>
                <button
                  className={`w-full text-left px-4 py-2 text-sm font-medium rounded transition hover:bg-muted ${currentWorkspace === ws.id ? 'bg-muted font-bold' : ''}`}
                  onClick={() => { setCurrentWorkspace(ws.id); setDropdownOpen(false); }}
                  type="button"
                >
                  {ws.name}
                </button>
              </li>
            ))}
            <li>
              <button
                className="w-full text-left px-4 py-2 text-sm font-medium rounded transition hover:bg-primary/10 text-primary flex items-center gap-2"
                onClick={() => { setDropdownOpen(false); setSettingsOpen(true); }}
              >
                <Plus className="w-4 h-4" /> Add New Board
              </button>
            </li>
          </ol>
        )}
      </div>
      {/* Subtle dark gradient background */}
      <div className="absolute inset-0 -z-10" style={{ background: 'var(--background)' }} />
      <ThemeToggleFloatingButton />
      <FloatingSettingsButton onClick={() => setSettingsOpen(true)} />
      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
      {/* Sticky Backlog Button */}
      <button
        className="fixed left-0 top-1/2 -translate-y-1/2 z-40 bg-card text-foreground border border-border rounded-r-xl shadow-lg px-4 py-4 flex items-center gap-3 hover:bg-primary hover:text-white hover:border-primary transition-all duration-200 group"
        onClick={() => setShowBacklog(v => !v)}
        aria-label="Show Backlog"
      >
        <ChevronLeft className={`h-5 w-5 transition-transform ${showBacklog ? 'rotate-180' : ''}`} />
        <div className="flex flex-col items-start">
          <span className="text-sm font-medium select-none">Backlog</span>
          <span className="text-xs text-muted-foreground group-hover:text-white/80">{backlogCount} items</span>
        </div>
      </button>
      {/* Sticky Done Button */}
      <button
        className="fixed right-0 top-1/2 -translate-y-1/2 z-40 bg-card text-foreground border border-border rounded-l-xl shadow-lg px-4 py-4 flex items-center gap-3 hover:bg-primary hover:text-white hover:border-primary transition-all duration-200 group"
        onClick={() => setShowDone(v => !v)}
        aria-label="Show Done"
      >
        <div className="flex flex-col items-end">
          <span className="text-sm font-medium select-none">Done</span>
          <span className="text-xs text-muted-foreground group-hover:text-white/80">{doneCount} items</span>
        </div>
        <ChevronRight className={`h-5 w-5 transition-transform ${showDone ? 'rotate-180' : ''}`} />
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
                {activeTask.startedAt ? getLiveElapsed(activeTask.startedAt) : '00:00:00'}
              </span>
              <button
                className="ml-2 px-4 py-2 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 transition-colors"
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
          title={STATUS_LABELS['IN_PROGRESS']}
          status={'IN_PROGRESS'}
          tasks={tasks.filter(t => t.status === 'IN_PROGRESS')}
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