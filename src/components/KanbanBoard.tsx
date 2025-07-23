import { useState, useRef, useEffect, useCallback } from 'react';
import { Task, TaskStatus } from '../types/tasks';
import { KanbanColumn } from './KanbanColumn';
import { FloatingAddButton } from './FloatingAddButton';
import { FloatingSettingsButton } from './FloatingSettingsButton';
import { SettingsModal } from './SettingsModal';
import { ChevronLeft, ChevronRight, Plus, X } from 'lucide-react';
import { ThemeToggleFloatingButton } from './ThemeToggleFloatingButton';
import { ChevronDown } from 'lucide-react';
import { Button } from './ui/button';
import { KanbanCard } from './KanbanCard';
import { FloatingAnalyticsButton } from './FloatingAnalyticsButton';
import { BarChart as ReBarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart as RePieChart, Pie, Cell, Legend } from 'recharts';
import CreatableSelect from 'react-select/creatable';
import { Edit2, Trash2, Play, Pause, ArrowRight, Clock, Calendar as CalendarIcon, Clock as ClockIcon } from 'lucide-react';

interface Workspace {
  id: string;
  name: string;
}

const STATUS_LABELS: Record<TaskStatus, string> = {
  NEW: 'Backlog',
  UP_NEXT: 'Up Next',
  WORKING: 'Now Working',
  IN_PROGRESS: 'In Progress',
  BLOCKED: 'Blocked',
  DONE: 'Done',
};

const DEMO_TASKS: Task[] = [];

// PieChart for analytics (reuse from KanbanCard, but inline here)
function PieChart({ data, size = 60 }: { data: Array<{ label: string; value: number; color: string }>; size?: number }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  if (total === 0) return null;
  const center = size / 2;
  const radius = center - 4;
  let currentAngle = -Math.PI / 2;
  const paths = data.map((item, index) => {
    const percentage = item.value / total;
    const angle = percentage * 2 * Math.PI;
    const endAngle = currentAngle + angle;
    const x1 = center + radius * Math.cos(currentAngle);
    const y1 = center + radius * Math.sin(currentAngle);
    const x2 = center + radius * Math.cos(endAngle);
    const y2 = center + radius * Math.sin(endAngle);
    const largeArcFlag = angle > Math.PI ? 1 : 0;
    const pathData = [
      `M ${center} ${center}`,
      `L ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      'Z'
    ].join(' ');
    currentAngle = endAngle;
    return (
      <path
        key={index}
        d={pathData}
        fill={item.color}
        stroke="white"
        strokeWidth="1"
      />
    );
  });
  return (
    <svg width={size} height={size} className="flex-shrink-0">{paths}</svg>
  );
}
// Helper for formatting durations
function formatDuration(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.ceil(s / 60);
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
// Helper for formatting time
function formatTime(s: number) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
}

function statusBadge(status: string) {
  const colorMap: Record<string, string> = {
    'NEW': 'bg-gray-200 text-gray-700',
    'UP_NEXT': 'bg-indigo-100 text-indigo-700',
    'WORKING': 'bg-green-100 text-green-700',
    'IN_PROGRESS': 'bg-blue-100 text-blue-700',
    'BLOCKED': 'bg-yellow-100 text-yellow-800',
    'DONE': 'bg-green-200 text-green-800',
  };
  return (
    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${colorMap[status] || 'bg-gray-100 text-gray-700'}`}>{status.replace('_', ' ')}</span>
  );
}
function formatShortDate(date: string) {
  const d = new Date(date);
  return d.toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

// Placeholder for TaskDetailsPanel
function TaskDetailsPanel({ task, onClose }: { task: Task | null, onClose: () => void }) {
  const [elapsed, setElapsed] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);
  // Timer for live elapsed time
  useEffect(() => {
    if (task && task.status === 'WORKING' && task.startedAt) {
      const interval = setInterval(() => {
        const now = Date.now();
        const currentSessionTime = Math.floor((now - new Date(task.startedAt!).getTime()) / 1000);
        const totalElapsed = Math.floor((task.totalWorkingTime || 0) / 1000) + currentSessionTime;
        setElapsed(totalElapsed);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [task]);
  // Close on Escape key
  useEffect(() => {
    if (!task) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [task, onClose]);
  // Prevent click inside panel from closing
  const stopPropagation = (e: React.MouseEvent) => e.stopPropagation();
  if (!task) return (
    <div className="fixed top-0 right-0 h-full w-full max-w-lg z-50 bg-background border-l border-border shadow-2xl transition-transform duration-300 translate-x-full" />
  );
  // Pie chart/time breakdown logic (reuse from KanbanCard)
  const stateDisplay: Record<string, { label: string; color: string }> = {
    UP_NEXT: { label: 'Up Next', color: '#a5b4fc' },
    WORKING: { label: 'Working', color: '#10b981' },
    IN_PROGRESS: { label: 'In Progress', color: '#fbbf24' },
    BLOCKED: { label: 'Blocked', color: '#fca5a5' },
    NEW: { label: 'Backlog', color: '#d1d5db' },
    DONE: { label: 'Done', color: '#c7d2fe' },
  };
  const statusTotals: Record<string, { totalMs: number; isCurrent: boolean }> = {};
  task.history.forEach(entry => {
    const start = new Date(entry.enteredAt).getTime();
    const end = entry.exitedAt
      ? new Date(entry.exitedAt).getTime()
      : (entry.status === 'WORKING' ? Date.now() : start);
    const durationMs = end - start;
    if (!statusTotals[entry.status]) {
      statusTotals[entry.status] = { totalMs: 0, isCurrent: false };
    }
    statusTotals[entry.status].totalMs += durationMs;
    statusTotals[entry.status].isCurrent = !entry.exitedAt;
  });
  const pieData = Object.entries(statusTotals)
    .filter(([_, data]) => data.totalMs > 0)
    .map(([status, data]) => ({
      label: stateDisplay[status]?.label || status,
      value: data.totalMs,
      color: stateDisplay[status]?.color || '#e5e7eb',
      isCurrent: data.isCurrent
    }))
    .sort((a, b) => b.value - a.value);
  const workingTime = statusTotals['WORKING']?.totalMs || 0;
  const totalTime = Object.values(statusTotals).reduce((sum, data) => sum + data.totalMs, 0);
  const workingPercentage = totalTime > 0 ? Math.round((workingTime / totalTime) * 100) : 0;
  return (
    <>
      {/* Backdrop */}
      {task && (
        <div className="fixed inset-0 z-40 bg-black/30 animate-in fade-in" onClick={onClose} />
      )}
      {/* Panel */}
      <div
        ref={panelRef}
        className={`fixed top-0 right-0 h-full w-full max-w-lg z-50 bg-background border-l border-border shadow-2xl transition-transform duration-300 ${task ? 'translate-x-0' : 'translate-x-full'} dark:bg-[#232329] dark:border-[#393943]`}
        style={{ boxShadow: 'rgba(0,0,0,0.15) -8px 0 32px 0' }}
        onClick={stopPropagation}
      >
        <button className="absolute top-4 right-6 text-muted-foreground hover:text-foreground" onClick={onClose} aria-label="Close details">✕</button>
        <div className="p-8 flex flex-col gap-6 h-full overflow-y-auto">
          {/* Header: Status badge, Title, Tags */}
          <div className="flex flex-col gap-2 mb-2">
            <div className="flex items-center gap-3 mb-1">
              {statusBadge(task.status)}
              {task.tags && task.tags.length > 0 && (
                <span className="flex flex-wrap gap-1">
                  {task.tags.map((tag, i) => (
                    <span key={i} className="inline-block px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 text-xs font-medium border border-indigo-100">{tag}</span>
                  ))}
                </span>
              )}
            </div>
            <h2 className="text-2xl font-bold leading-tight mb-1">{task.title}</h2>
          </div>
          {/* Dates */}
          <div className="flex items-center gap-6 text-xs text-muted-foreground mb-2">
            <span className="flex items-center gap-1"><CalendarIcon className="w-4 h-4" />{formatShortDate(task.createdAt)}</span>
            <span className="flex items-center gap-1"><ClockIcon className="w-4 h-4" />{formatShortDate(task.updatedAt)}</span>
          </div>
          <hr className="my-2 border-border" />
          {/* Description */}
          <div className="mb-6">
            <div className="text-sm font-semibold text-muted-foreground mb-1">Description</div>
            <div className="text-base text-foreground leading-relaxed whitespace-pre-line break-words bg-card rounded p-3 border border-border min-h-[40px]">
              {task.description ? task.description : <span className="text-muted-foreground">No description</span>}
            </div>
          </div>
          {/* Worked time and timer */}
          <div className="flex items-center gap-3 mb-2">
            {workingTime > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800 text-xs text-green-700 dark:text-green-300 font-semibold">
                <Clock className="w-4 h-4" />
                Worked: {formatDuration(workingTime)}
                {totalTime > 0 && (
                  <span className="ml-2 text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-800 px-2 py-1 rounded-full">
                    {workingPercentage}% of total time
                  </span>
                )}
              </div>
            )}
            {task.status === 'WORKING' && (
              <span className="text-xs text-green-600 dark:text-green-400 font-mono font-semibold">
                {formatTime(elapsed)}
              </span>
            )}
          </div>
          {/* Completion info */}
          {task.status === 'DONE' && (
            <div className="flex items-center gap-3 mb-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="w-4 h-4 text-blue-600 dark:text-blue-400">✓</div>
              <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                Completed in {formatDuration(new Date(task.updatedAt).getTime() - new Date(task.createdAt).getTime())}
              </span>
              <span className="text-xs text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded-full">
                {new Date(task.updatedAt).toLocaleDateString()}
              </span>
            </div>
          )}
          {/* Analytics Pie Chart and Legend */}
          {pieData.length > 0 && (
            <div className="flex items-start gap-4 mb-2">
              <PieChart data={pieData} size={60} />
              <div className="flex-1">
                <div className="text-xs text-muted-foreground mb-2 font-medium">Time Distribution</div>
                <div className="space-y-1">
                  {pieData.slice(0, 4).map((item, index) => (
                    <div key={index} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-foreground">{item.label}</span>
                      </div>
                      <span className="text-muted-foreground font-mono">{formatDuration(item.value)}</span>
                    </div>
                  ))}
                  {pieData.length > 4 && (
                    <div className="text-xs text-muted-foreground italic">+{pieData.length - 4} more statuses</div>
                  )}
                </div>
              </div>
            </div>
          )}
          {/* Actions */}
          <div className="flex gap-2 mt-4">
            <button className="p-2 rounded-lg bg-card border border-border shadow hover:bg-muted text-foreground hover:text-primary transition" title="Edit"><Edit2 className="w-5 h-5" /></button>
            <button className="p-2 rounded-lg bg-card border border-border shadow hover:bg-red-100 text-foreground hover:text-red-600 transition" title="Delete"><Trash2 className="w-5 h-5" /></button>
            <button className="p-2 rounded-lg bg-card border border-border shadow hover:bg-muted text-foreground hover:text-primary transition" title="Move Left"><ArrowRight className="w-5 h-5 rotate-180" /></button>
            <button className="p-2 rounded-lg bg-card border border-border shadow hover:bg-muted text-foreground hover:text-primary transition" title="Move Right"><ArrowRight className="w-5 h-5" /></button>
            {task.status === 'WORKING' ? (
              <button className="p-2 rounded-lg bg-card border border-border shadow hover:bg-yellow-100 text-foreground hover:text-yellow-600 transition" title="Pause"><Pause className="w-5 h-5" /></button>
            ) : (
              <button className="p-2 rounded-lg bg-card border border-border shadow hover:bg-green-100 text-foreground hover:text-green-600 transition" title="Start"><Play className="w-5 h-5" /></button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export function KanbanBoard() {
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('kanban-tasks');
    const loadedTasks = saved ? JSON.parse(saved) : DEMO_TASKS;
    
    // Migrate existing tasks that don't have workspaceId to the default workspace
    return loadedTasks.map((task: Task) => {
      if (!task.workspaceId) {
        return { ...task, workspaceId: 'default' };
      }
      return task;
    });
  });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [addBoardModalOpen, setAddBoardModalOpen] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');
  const [addTaskModalOpen, setAddTaskModalOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskStatus, setNewTaskStatus] = useState<TaskStatus>('NEW');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  // For react-select, tags are objects with label/value, but we store as string[]
  const [newTaskTags, setNewTaskTags] = useState<string[]>([]);
  const [showBacklog, setShowBacklog] = useState(false);
  const [showDone, setShowDone] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [detailsTaskId, setDetailsTaskId] = useState<string | null>(null);
  const detailsTask = detailsTaskId ? tasks.find(t => t.id === detailsTaskId) || null : null;
  const handleShowDetails = useCallback((id: string) => setDetailsTaskId(id), []);
  const handleCloseDetails = useCallback(() => setDetailsTaskId(null), []);

  // Update current time every second for live timer
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
      // Update last active timestamp
      localStorage.setItem('kanban-last-active', Date.now().toString());
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
  const getLiveElapsed = (startedAt: string, totalWorkingTime: number = 0) => {
    const currentSessionTime = Math.floor((currentTime - new Date(startedAt).getTime()) / 1000);
    const totalElapsed = Math.floor(totalWorkingTime / 1000) + currentSessionTime;
    const h = Math.floor(totalElapsed / 3600);
    const m = Math.floor((totalElapsed % 3600) / 60);
    const s = totalElapsed % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Demo workspaces/boards - load from localStorage
  const [workspaces, setWorkspaces] = useState<Workspace[]>(() => {
    const saved = localStorage.getItem('kanban-workspaces');
    return saved ? JSON.parse(saved) : [{ id: 'default', name: 'Personal' }];
  });
  const [currentWorkspace, setCurrentWorkspace] = useState(() => {
    const saved = localStorage.getItem('kanban-current-workspace');
    return saved || 'default';
  });

  // Save workspaces to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('kanban-workspaces', JSON.stringify(workspaces));
  }, [workspaces]);

  // Save current workspace to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('kanban-current-workspace', currentWorkspace);
  }, [currentWorkspace]);

  // Save tasks to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('kanban-tasks', JSON.stringify(tasks));
  }, [tasks]);

  const addNewBoard = () => {
    setAddBoardModalOpen(true);
  };

  const handleCreateBoard = () => {
    if (!newBoardName.trim()) return;
    
    const newBoard = {
      id: crypto.randomUUID(),
      name: newBoardName.trim()
    };
    
    setWorkspaces([...workspaces, newBoard]);
    setCurrentWorkspace(newBoard.id);
    setNewBoardName('');
    setAddBoardModalOpen(false);
    setDropdownOpen(false);
  };

  const handleCancelCreateBoard = () => {
    setNewBoardName('');
    setAddBoardModalOpen(false);
  };

  const addTask = (status: TaskStatus) => {
    setNewTaskStatus(status);
    setAddTaskModalOpen(true);
  };

  // Filter tasks by current workspace
  const currentWorkspaceTasks = tasks.filter(task => task.workspaceId === currentWorkspace);

  const handleCreateTask = () => {
    if (!newTaskTitle.trim()) return;
    
    const newTask: Task = {
      id: crypto.randomUUID(),
      title: newTaskTitle.trim(),
      description: newTaskDescription.trim() || undefined,
      tags: newTaskTags,
      status: newTaskStatus,
      workspaceId: currentWorkspace,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      history: [
        { status: newTaskStatus, enteredAt: new Date().toISOString() }
      ]
    };
    
    setTasks([...tasks, newTask]);
    setNewTaskTitle('');
    setNewTaskDescription('');
    setNewTaskTags([]);
    setAddTaskModalOpen(false);
  };

  const handleCancelCreateTask = () => {
    setNewTaskTitle('');
    setNewTaskDescription('');
    setNewTaskTags([]);
    setAddTaskModalOpen(false);
  };



  const deleteTask = (id: string) => setTasks(tasks.filter(t => t.id !== id));
  const editTask = (id: string) => {
    const currentTask = tasks.find(t => t.id === id);
    if (!currentTask) return;
    
    const title = window.prompt('Edit task title:', currentTask.title);
    if (!title || title.trim() === '') return;
    
    setTasks(tasks.map(t => 
      t.id === id 
        ? { ...t, title: title.trim(), updatedAt: new Date().toISOString() } 
        : t
    ));
  };
  const moveTask = (id: string, direction: 'left' | 'right') => {
    setTasks(tasks => tasks.map(t => {
      if (t.id !== id) return t;
      // Include WORKING in the status order for proper navigation
      const allStatuses: TaskStatus[] = ['NEW', 'UP_NEXT', 'WORKING', 'IN_PROGRESS', 'BLOCKED', 'DONE'];
      const idx = allStatuses.indexOf(t.status as TaskStatus);
      const newIdx = direction === 'left' ? Math.max(0, idx - 1) : Math.min(allStatuses.length - 1, idx + 1);
      const newStatus = allStatuses[newIdx];
      const now = new Date().toISOString();
      
      // Update history
      const newHistory = [...t.history];
      // Close the current status entry if it exists
      if (newHistory.length > 0 && !newHistory[newHistory.length - 1].exitedAt) {
        newHistory[newHistory.length - 1].exitedAt = now;
      }
      
      // Check if there's already an open entry for the new status
      const existingOpenEntry = newHistory.find(entry => entry.status === newStatus && !entry.exitedAt);
      if (!existingOpenEntry) {
        // Add new status entry only if there's no existing open entry
        newHistory.push({ status: newStatus, enteredAt: now });
      }
      
      return { 
        ...t, 
        status: newStatus, 
        updatedAt: now,
        history: newHistory,
        // Clear startedAt if moving away from WORKING
        startedAt: newStatus !== 'WORKING' ? undefined : t.startedAt
      };
    }));
  };
  // Only one task can be WORKING at a time
  const toggleTimer = (id: string) => {
    setTasks(tasks => {
      const currentActive = tasks.find(t => t.status === 'WORKING');
      const now = new Date().toISOString();
      
      return tasks.map(t => {
        if (t.id === id) {
          if (t.status !== 'WORKING') {
            // Start working on this task
            const newHistory = [...t.history];
            // Close the current status entry if it exists
            if (newHistory.length > 0 && !newHistory[newHistory.length - 1].exitedAt) {
              newHistory[newHistory.length - 1].exitedAt = now;
            }
            
            // Check if there's already an open WORKING entry
            const existingWorkingEntry = newHistory.find(entry => entry.status === 'WORKING' && !entry.exitedAt);
            if (!existingWorkingEntry) {
              // Add WORKING status entry only if there's no existing open entry
              newHistory.push({ status: 'WORKING', enteredAt: now });
            }
            
            return { 
              ...t, 
              status: 'WORKING', 
              startedAt: now,
              // Keep existing totalWorkingTime when resuming
              totalWorkingTime: t.totalWorkingTime || 0,
              history: newHistory
            };
          } else {
            // Stop working on this task, move to IN_PROGRESS
            const newHistory = [...t.history];
            // Calculate accumulated working time for this session
            const sessionTime = t.startedAt ? Date.now() - new Date(t.startedAt).getTime() : 0;
            const totalWorkingTime = (t.totalWorkingTime || 0) + sessionTime;
            
            // Close the WORKING status entry
            if (newHistory.length > 0 && newHistory[newHistory.length - 1].status === 'WORKING') {
              newHistory[newHistory.length - 1].exitedAt = now;
            }
            
            // Check if there's already an open IN_PROGRESS entry
            const existingInProgressEntry = newHistory.find(entry => entry.status === 'IN_PROGRESS' && !entry.exitedAt);
            if (!existingInProgressEntry) {
              // Add IN_PROGRESS status entry only if there's no existing open entry
              newHistory.push({ status: 'IN_PROGRESS', enteredAt: now });
            }
            
            return { 
              ...t, 
              status: 'IN_PROGRESS', 
              startedAt: undefined,
              totalWorkingTime,
              history: newHistory
            };
          }
        } else if (currentActive && t.id === currentActive.id) {
          // Pause the previous active task
          const newHistory = [...t.history];
          // Calculate accumulated working time for this session
          const sessionTime = t.startedAt ? Date.now() - new Date(t.startedAt).getTime() : 0;
          const totalWorkingTime = (t.totalWorkingTime || 0) + sessionTime;
          
          // Close the WORKING status entry
          if (newHistory.length > 0 && newHistory[newHistory.length - 1].status === 'WORKING') {
            newHistory[newHistory.length - 1].exitedAt = now;
          }
          
          // Check if there's already an open IN_PROGRESS entry
          const existingInProgressEntry = newHistory.find(entry => entry.status === 'IN_PROGRESS' && !entry.exitedAt);
          if (!existingInProgressEntry) {
            // Add IN_PROGRESS status entry only if there's no existing open entry
            newHistory.push({ status: 'IN_PROGRESS', enteredAt: now });
          }
          
          return { 
            ...t, 
            status: 'IN_PROGRESS', 
            startedAt: undefined,
            totalWorkingTime,
            history: newHistory
          };
        }
        return t;
      });
    });
  };

  // Function to move task directly to DONE status
  const markTaskDone = (id: string) => {
    setTasks(tasks => tasks.map(t => {
      if (t.id !== id) return t;
      const now = new Date().toISOString();
      
      // Calculate accumulated working time for this session if currently working
      const sessionTime = t.status === 'WORKING' && t.startedAt ? Date.now() - new Date(t.startedAt).getTime() : 0;
      const totalWorkingTime = (t.totalWorkingTime || 0) + sessionTime;
      
      // Update history
      const newHistory = [...t.history];
      // Close the current status entry if it exists
      if (newHistory.length > 0 && !newHistory[newHistory.length - 1].exitedAt) {
        newHistory[newHistory.length - 1].exitedAt = now;
      }
      // Add DONE status entry
      newHistory.push({ status: 'DONE', enteredAt: now });
      
      return { 
        ...t, 
        status: 'DONE', 
        updatedAt: now,
        totalWorkingTime,
        history: newHistory,
        startedAt: undefined // Clear startedAt since task is done
      };
    }));
  };

  // Auto-pause on sleep/wake: if gap since last tick is >2 minutes, auto-pause working task
  useEffect(() => {
    const lastActive = localStorage.getItem('kanban-last-active');
    const now = Date.now();
    if (lastActive) {
      const gap = now - parseInt(lastActive, 10);
      if (gap > 120000) {
        const activeTask = tasks.find(t => t.status === 'WORKING');
        if (activeTask) {
          toggleTimer(activeTask.id);
          alert('Your task was automatically paused because your computer was inactive or asleep.');
        }
      }
    }
    // No cleanup needed
    // Only run on mount and when tasks/toggleTimer change
  }, [tasks, toggleTimer]);

  // Auto-pause timer only when browser tab is closed or page is unloaded
  useEffect(() => {
    const activeTask = tasks.find(t => t.status === 'WORKING');
    if (!activeTask) return;

    // Handle page unload (closing tab, refreshing, Mac sleep)
    const handleBeforeUnload = () => {
      if (activeTask && activeTask.status === 'WORKING') {
        // Save current state before unload
        localStorage.setItem('kanban-paused-task', JSON.stringify({
          taskId: activeTask.id,
          pausedAt: new Date().toISOString()
        }));
      }
    };

    // Check for paused task on page load
    const checkPausedTask = () => {
      const pausedTaskData = localStorage.getItem('kanban-paused-task');
      if (pausedTaskData) {
        try {
          const { taskId } = JSON.parse(pausedTaskData);
          const task = tasks.find(t => t.id === taskId);
          if (task && task.status === 'WORKING') {
            // Task was paused due to page unload, show resume prompt
            if (confirm(`Your task "${task.title}" was paused when you left the page. Would you like to resume it?`)) {
              // Task is already in WORKING status, just continue
            } else {
              // User chose not to resume, move to IN_PROGRESS
              toggleTimer(taskId);
            }
          }
        } catch (error) {
          console.error('Error parsing paused task data:', error);
        }
        localStorage.removeItem('kanban-paused-task');
      }
    };

    // Set up event listeners
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Check for paused task on mount
    checkPausedTask();

    // Cleanup event listeners
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [tasks, toggleTimer]);

  const backlogCount = currentWorkspaceTasks.filter(t => t.status === 'NEW').length;
  const doneCount = currentWorkspaceTasks.filter(t => t.status === 'DONE').length;

  return (
    <div className="relative h-screen flex flex-col min-h-0 overflow-hidden bg-background">
      {/* Workspace/Board Title Selector (Top Left) */}
      {!showBacklog && !showDone && (
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
                  onClick={addNewBoard}
                >
                  <Plus className="w-4 h-4" /> Add New Board
                </button>
              </li>
            </ol>
          )}
        </div>
      )}
      {/* Subtle dark gradient background */}
      <div className="absolute inset-0 -z-10" style={{ background: 'var(--background)' }} />
      {!showDone && (
        <div className="fixed top-8 right-8 z-50 flex gap-4">
          <FloatingAnalyticsButton onClick={() => setAnalyticsOpen(true)} />
          <FloatingSettingsButton onClick={() => setSettingsOpen(true)} />
          <ThemeToggleFloatingButton />
        </div>
      )}
      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
      {/* Analytics Modal */}
      {analyticsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="relative w-full h-full max-w-full max-h-full bg-background border border-border rounded-none shadow-xl flex flex-col">
            <button
              className="absolute top-6 right-8 text-muted-foreground hover:text-foreground transition-colors z-10"
              onClick={() => setAnalyticsOpen(false)}
              aria-label="Close Analytics"
            >
              <X className="w-7 h-7" />
            </button>
            <div className="flex items-center justify-center py-8 border-b border-border">
              <h2 className="text-3xl font-bold text-foreground">Analytics & Insights</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-8 flex flex-col items-center justify-start gap-12">
              {/* Key Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 w-full max-w-5xl mb-8">
                <div className="bg-card rounded-xl p-6 shadow flex flex-col items-center">
                  <div className="text-2xl font-bold text-primary">{tasks.length}</div>
                  <div className="text-sm text-muted-foreground mt-1">Total Tickets</div>
                </div>
                <div className="bg-card rounded-xl p-6 shadow flex flex-col items-center">
                  <div className="text-2xl font-bold text-green-600">{tasks.filter(t => t.status === 'DONE').length}</div>
                  <div className="text-sm text-muted-foreground mt-1">Completed</div>
                </div>
                <div className="bg-card rounded-xl p-6 shadow flex flex-col items-center">
                  <div className="text-2xl font-bold text-yellow-600">{tasks.filter(t => t.status !== 'DONE').length}</div>
                  <div className="text-sm text-muted-foreground mt-1">Pending</div>
                </div>
                <div className="bg-card rounded-xl p-6 shadow flex flex-col items-center">
                  <div className="text-2xl font-bold text-blue-600">{Math.round(tasks.reduce((sum, t) => sum + (t.totalWorkingTime || 0), 0) / 3600000)}</div>
                  <div className="text-sm text-muted-foreground mt-1">Total Hours Worked</div>
                </div>
              </div>
              {/* Tickets by Status Bar Chart */}
              <div className="w-full max-w-3xl bg-card rounded-xl p-6 shadow flex flex-col items-center">
                <div className="text-lg font-semibold mb-4">Tickets by Status</div>
                <ResponsiveContainer width="100%" height={220}>
                  <ReBarChart data={['NEW','UP_NEXT','WORKING','IN_PROGRESS','BLOCKED','DONE'].map(status => ({
                    label: status.replace('_',' '),
                    value: tasks.filter(t => t.status === status).length
                  }))} margin={{ left: 10, right: 10, top: 10, bottom: 30 }}>
                    <XAxis dataKey="label" angle={-20} textAnchor="end" interval={0} height={50} tick={{ fontSize: 13, fill: '#888' }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 13, fill: '#888' }} />
                    <Tooltip />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]} fill="#6366f1">
                      {['#a5b4fc','#fbbf24','#10b981','#f59e42','#fca5a5','#c7d2fe'].map((color, i) => (
                        <Cell key={i} fill={color} />
                      ))}
                    </Bar>
                  </ReBarChart>
                </ResponsiveContainer>
              </div>
              {/* Tickets per Board Bar Chart */}
              <div className="w-full max-w-3xl bg-card rounded-xl p-6 shadow flex flex-col items-center">
                <div className="text-lg font-semibold mb-4">Tickets per Board</div>
                <ResponsiveContainer width="100%" height={220}>
                  <ReBarChart data={workspaces.map(ws => ({
                    label: ws.name,
                    value: tasks.filter(t => t.workspaceId === ws.id).length
                  }))} margin={{ left: 10, right: 10, top: 10, bottom: 30 }}>
                    <XAxis dataKey="label" angle={-20} textAnchor="end" interval={0} height={50} tick={{ fontSize: 13, fill: '#888' }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 13, fill: '#888' }} />
                    <Tooltip />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]} fill="#6366f1">
                      {['#60a5fa','#818cf8','#fbbf24','#10b981','#fca5a5','#c7d2fe'].map((color, i) => (
                        <Cell key={i} fill={color} />
                      ))}
                    </Bar>
                  </ReBarChart>
                </ResponsiveContainer>
              </div>
              {/* Time Distribution Pie Chart */}
              <div className="w-full max-w-3xl bg-card rounded-xl p-6 shadow flex flex-col items-center">
                <div className="text-lg font-semibold mb-4">Time Distribution (All Tickets)</div>
                <ResponsiveContainer width={320} height={220}>
                  <RePieChart>
                    <Pie
                      data={(() => {
                        const statusTotals: Record<string, number> = {};
                        tasks.forEach(task => {
                          (task.history || []).forEach(entry => {
                            const start = new Date(entry.enteredAt).getTime();
                            const end = entry.exitedAt ? new Date(entry.exitedAt).getTime() : start;
                            const duration = Math.max(0, end - start);
                            if (!statusTotals[entry.status]) statusTotals[entry.status] = 0;
                            statusTotals[entry.status] += duration;
                          });
                        });
                        return Object.entries(statusTotals).map(([status, value]) => ({
                          label: status.replace('_',' '),
                          value: value as number
                        }));
                      })()}
                      dataKey="value"
                      nameKey="label"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                    >
                      {['#a5b4fc','#fbbf24','#10b981','#f59e42','#fca5a5','#c7d2fe'].map((color, i) => (
                        <Cell key={i} fill={color} />
                      ))}
                    </Pie>
                    <Legend />
                    <Tooltip />
                  </RePieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Add Board Modal */}
      {addBoardModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background border border-border rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">Add New Board</h2>
              <button
                onClick={handleCancelCreateBoard}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="boardName" className="block text-sm font-medium text-foreground mb-2">
                  Board Name
                </label>
                <input
                  id="boardName"
                  type="text"
                  value={newBoardName}
                  onChange={(e) => setNewBoardName(e.target.value)}
                  placeholder="Enter board name..."
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleCreateBoard();
                    } else if (e.key === 'Escape') {
                      handleCancelCreateBoard();
                    }
                  }}
                  autoFocus
                />
              </div>
              
              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={handleCancelCreateBoard}
                  className="px-4 py-2 text-sm font-medium rounded-md border border-border bg-background text-foreground hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateBoard}
                  disabled={!newBoardName.trim()}
                  className="px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Create Board
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Add Task Modal */}
      {addTaskModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background border border-border rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">Add New Task</h2>
              <button
                onClick={handleCancelCreateTask}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-6">
              <div>
                <label htmlFor="taskTitle" className="block text-sm font-medium text-foreground mb-3">
                  Task Title
                </label>
                <input
                  id="taskTitle"
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="Enter task title..."
                  className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 text-base"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleCreateTask();
                    } else if (e.key === 'Escape') {
                      handleCancelCreateTask();
                    }
                  }}
                  autoFocus
                />
              </div>
              <div>
                <label htmlFor="taskDescription" className="block text-sm font-medium text-foreground mb-3">
                  Description (optional)
                </label>
                <textarea
                  id="taskDescription"
                  value={newTaskDescription}
                  onChange={(e) => setNewTaskDescription(e.target.value)}
                  placeholder="Add more details about this task..."
                  className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 text-base min-h-[80px]"
                />
              </div>
              <div>
                <label htmlFor="taskTags" className="block text-sm font-medium text-foreground mb-3">
                  Tags
                </label>
                <CreatableSelect
                  isMulti
                  inputId="taskTags"
                  placeholder="Add a tag and press enter..."
                  value={newTaskTags.map(tag => ({ label: tag, value: tag }))}
                  onChange={selected => setNewTaskTags(selected ? selected.map(opt => opt.value) : [])}
                  classNamePrefix="react-select"
                  styles={{
                    control: (base, state) => ({
                      ...base,
                      backgroundColor: 'var(--background)',
                      borderColor: 'var(--border)',
                      color: 'var(--foreground)',
                      boxShadow: state.isFocused ? '0 0 0 2px var(--primary)' : base.boxShadow,
                    }),
                    menu: (base) => ({
                      ...base,
                      backgroundColor: 'var(--card)',
                      color: 'var(--foreground)',
                      zIndex: 100,
                    }),
                    option: (base, state) => ({
                      ...base,
                      backgroundColor: state.isFocused
                        ? 'var(--primary)/10'
                        : 'var(--card)',
                      color: 'var(--foreground)',
                      cursor: 'pointer',
                    }),
                    multiValue: (base) => {
                      const isDark = document.documentElement.classList.contains('dark');
                      return {
                        ...base,
                        backgroundColor: isDark ? '#334155' : '#e0e7ff', // slate-700 for dark, indigo-100 for light
                        color: isDark ? '#f1f5f9' : '#1e293b', // slate-100 for dark, slate-800 for light
                        borderRadius: '6px',
                        padding: '0 2px',
                      };
                    },
                    multiValueLabel: (base) => {
                      const isDark = document.documentElement.classList.contains('dark');
                      return {
                        ...base,
                        color: isDark ? '#f1f5f9' : '#1e293b',
                        fontWeight: 500,
                      };
                    },
                    multiValueRemove: (base) => {
                      const isDark = document.documentElement.classList.contains('dark');
                      return {
                        ...base,
                        color: isDark ? '#f1f5f9' : '#1e293b',
                        ':hover': {
                          backgroundColor: isDark ? '#475569' : '#c7d2fe',
                          color: isDark ? '#fff' : '#1e293b',
                        },
                      };
                    },
                    input: (base) => ({ ...base, color: 'var(--foreground)' }),
                    placeholder: (base) => ({ ...base, color: 'var(--muted-foreground)' }),
                  }}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-3">
                  Add to Column
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setNewTaskStatus('NEW')}
                    className={`p-4 rounded-lg border transition-all duration-200 text-left ${
                      newTaskStatus === 'NEW'
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-card hover:border-primary/50 hover:bg-primary/5'
                    }`}
                  >
                    <div className="font-medium">Backlog</div>
                    <div className="text-xs text-muted-foreground mt-1">New tasks</div>
                  </button>
                  
                  <button
                    onClick={() => setNewTaskStatus('UP_NEXT')}
                    className={`p-4 rounded-lg border transition-all duration-200 text-left ${
                      newTaskStatus === 'UP_NEXT'
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-card hover:border-primary/50 hover:bg-primary/5'
                    }`}
                  >
                    <div className="font-medium">Up Next</div>
                    <div className="text-xs text-muted-foreground mt-1">Ready to start</div>
                  </button>
                  
                  <button
                    onClick={() => setNewTaskStatus('IN_PROGRESS')}
                    className={`p-4 rounded-lg border transition-all duration-200 text-left ${
                      newTaskStatus === 'IN_PROGRESS'
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-card hover:border-primary/50 hover:bg-primary/5'
                    }`}
                  >
                    <div className="font-medium">In Progress</div>
                    <div className="text-xs text-muted-foreground mt-1">Currently working</div>
                  </button>
                  
                  <button
                    onClick={() => setNewTaskStatus('BLOCKED')}
                    className={`p-4 rounded-lg border transition-all duration-200 text-left ${
                      newTaskStatus === 'BLOCKED'
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-card hover:border-primary/50 hover:bg-primary/5'
                    }`}
                  >
                    <div className="font-medium">Blocked</div>
                    <div className="text-xs text-muted-foreground mt-1">Waiting for something</div>
                  </button>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={handleCancelCreateTask}
                  className="px-4 py-2 text-sm font-medium rounded-md border border-border bg-background text-foreground hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateTask}
                  disabled={!newTaskTitle.trim()}
                  className="px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Add Task
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Sticky Backlog Button */}
      {!showBacklog && (
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
      )}
      {/* Sticky Done Button */}
      {!showDone && (
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
      )}
      {/* Slide-in Backlog */}
      <div className={`fixed top-0 left-0 h-full z-30 transition-transform duration-300 ${showBacklog ? 'translate-x-0' : '-translate-x-full'}`} style={{width: 340}}>
        <div className="h-full bg-white dark:bg-gray-900 border-r border-border shadow-lg flex flex-col">
          <div className="flex items-center justify-between p-6 border-b border-border">
            <div className="flex flex-col">
              <span className="font-bold text-base uppercase tracking-wide text-muted-foreground">BACKLOG</span>
            </div>
            <Button size="icon" variant="outline" className="border-border hover:bg-primary hover:text-white hover:border-primary" onClick={() => addTask('NEW')}>
              +
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            <div className="flex flex-col gap-4">
              {currentWorkspaceTasks.filter(t => t.status === 'NEW').length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <div className="text-sm font-medium mb-1">No tasks yet</div>
                  <div className="text-xs opacity-70">Click + to add a task</div>
                </div>
              ) : (
                currentWorkspaceTasks.filter(t => t.status === 'NEW').map(task => (
                  <KanbanCard
                    key={task.id}
                    task={task}
                    onDelete={deleteTask}
                    onEdit={editTask}
                    onMove={moveTask}
                    onToggleTimer={toggleTimer}
                    onShowDetails={handleShowDetails}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Backdrop overlay for backlog */}
      {showBacklog && (
        <div 
          className="fixed inset-0 bg-black/20 z-20"
          onClick={() => setShowBacklog(false)}
        />
      )}
      {/* Slide-in Done */}
      <div className={`fixed top-0 right-0 h-full z-30 transition-transform duration-300 ${showDone ? 'translate-x-0' : 'translate-x-full'}`} style={{width: 340}}>
        <div className="h-full bg-white dark:bg-gray-900 border-l border-border shadow-lg flex flex-col">
          <div className="flex items-center justify-between p-6 border-b border-border">
            <div className="flex flex-col">
              <span className="font-bold text-base uppercase tracking-wide text-muted-foreground">DONE</span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            <div className="flex flex-col gap-4">
              {currentWorkspaceTasks.filter(t => t.status === 'DONE').length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <div className="text-sm font-medium mb-1">No completed tasks yet</div>
                  <div className="text-xs opacity-70">Move tasks here when finished</div>
                </div>
              ) : (
                currentWorkspaceTasks.filter(t => t.status === 'DONE').map(task => (
                  <KanbanCard
                    key={task.id}
                    task={task}
                    onDelete={deleteTask}
                    onEdit={editTask}
                    onMove={moveTask}
                    onToggleTimer={toggleTimer}
                    onShowDetails={handleShowDetails}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Backdrop overlay for done */}
      {showDone && (
        <div 
          className="fixed inset-0 bg-black/20 z-20"
          onClick={() => setShowDone(false)}
        />
      )}
      {/* Active Task Player or Status Message */}
      <div className="w-full flex justify-center items-center mt-4 mb-6">
        {activeTask ? (
          <div className="w-full max-w-xl bg-card border-primary/40 rounded-xl shadow-lg px-8 py-6 flex flex-col items-center gap-3 animate-in fade-in slide-in-from-top-6">
            <div className="text-lg font-semibold text-primary mb-1">Now Working</div>
            <div className="text-2xl font-bold text-foreground mb-2">{activeTask.title}</div>
            {/* Timer and controls */}
            <div className="flex items-center gap-4">
              <span className="font-mono text-xl text-primary">
                {activeTask.startedAt ? getLiveElapsed(activeTask.startedAt, activeTask.totalWorkingTime) : '00:00:00'}
              </span>
              <button
                className="ml-2 px-4 py-2 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 transition-colors"
                onClick={() => toggleTimer(activeTask.id)}
              >
                Pause
              </button>
              <button
                className="ml-2 px-4 py-2 rounded-lg bg-muted text-foreground font-medium hover:bg-muted/80 transition-colors"
                onClick={() => markTaskDone(activeTask.id)}
              >
                Mark Done
              </button>
            </div>
          </div>
        ) : currentWorkspaceTasks.length === 0 ? (
          <div className="w-full max-w-xl bg-card border border-border rounded-xl shadow px-8 py-8 flex flex-col items-center justify-center text-center animate-in fade-in slide-in-from-top-6">
            <div className="text-2xl font-bold text-foreground mb-2">Welcome to Your Kanban Board!</div>
            <div className="text-muted-foreground mb-4 max-w-md">
              Start organizing your work by adding tasks to any column. Use the floating + button or click the + in any column to get started.
            </div>
            <button
              onClick={() => addTask('UP_NEXT')}
              className="px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              Add Your First Task
            </button>
          </div>
        ) : (
          <div className="w-full max-w-xl bg-card border border-border rounded-xl shadow px-8 py-8 flex flex-col items-center justify-center text-center animate-in fade-in slide-in-from-top-6">
            <div className="text-2xl font-bold text-foreground mb-2">No Active Task</div>
            <div className="text-muted-foreground mb-4 max-w-md">
              You have {currentWorkspaceTasks.length} task{currentWorkspaceTasks.length !== 1 ? 's' : ''} in your board. Click the play button on any task to start working on it.
            </div>
            <button
              onClick={() => addTask('UP_NEXT')}
              className="px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              Add New Task
            </button>
          </div>
        )}
      </div>
      {/* Main Columns Centered */}
      <div className="flex-1 flex h-full min-h-0 gap-8 justify-center items-stretch overflow-x-auto p-4 sm:p-6 md:p-8 w-full z-10">
        <KanbanColumn
          title={STATUS_LABELS['UP_NEXT']}
          status={'UP_NEXT'}
          tasks={currentWorkspaceTasks.filter(t => t.status === 'UP_NEXT')}
          onAdd={addTask}
          onDelete={deleteTask}
          onEdit={editTask}
          onMove={moveTask}
          onToggleTimer={toggleTimer}
          onShowDetails={handleShowDetails}
        />
        <KanbanColumn
          title={STATUS_LABELS['IN_PROGRESS']}
          status={'IN_PROGRESS'}
          tasks={currentWorkspaceTasks.filter(t => t.status === 'IN_PROGRESS')}
          onAdd={addTask}
          onDelete={deleteTask}
          onEdit={editTask}
          onMove={moveTask}
          onToggleTimer={toggleTimer}
          onShowDetails={handleShowDetails}
        />
        <KanbanColumn
          title={STATUS_LABELS['BLOCKED']}
          status={'BLOCKED'}
          tasks={currentWorkspaceTasks.filter(t => t.status === 'BLOCKED')}
          onAdd={addTask}
          onDelete={deleteTask}
          onEdit={editTask}
          onMove={moveTask}
          onToggleTimer={toggleTimer}
          onShowDetails={handleShowDetails}
        />
      </div>
      {analyticsOpen === false && <FloatingAddButton onClick={() => addTask('NEW')} />}
      {/* Slide-in Task Details Panel */}
      <TaskDetailsPanel task={detailsTask} onClose={handleCloseDetails} />
    </div>
  );
} 