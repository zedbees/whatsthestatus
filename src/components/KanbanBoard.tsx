import { useState, useRef, useEffect } from 'react';
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

export function KanbanBoard() {
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('kanban-tasks');
    return saved ? JSON.parse(saved) : DEMO_TASKS;
  });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [addBoardModalOpen, setAddBoardModalOpen] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');
  const [addTaskModalOpen, setAddTaskModalOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskStatus, setNewTaskStatus] = useState<TaskStatus>('NEW');
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
  const currentWorkspaceTasks = tasks.filter(() => {
    // For now, show all tasks since we don't have workspace filtering implemented yet
    // TODO: Implement proper workspace filtering when workspaceId is added to Task interface
    return true;
  });

  const handleCreateTask = () => {
    if (!newTaskTitle.trim()) return;
    
    const newTask: Task = {
      id: crypto.randomUUID(),
      title: newTaskTitle.trim(),
      status: newTaskStatus,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      history: [
        { status: newTaskStatus, enteredAt: new Date().toISOString() }
      ]
    };
    
    setTasks([...tasks, newTask]);
    setNewTaskTitle('');
    setAddTaskModalOpen(false);
  };

  const handleCancelCreateTask = () => {
    setNewTaskTitle('');
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

  const backlogCount = currentWorkspaceTasks.filter(t => t.status === 'NEW').length;
  const doneCount = currentWorkspaceTasks.filter(t => t.status === 'DONE').length;

  return (
    <div className="relative min-h-[80vh] bg-background">
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
      {!showDone && <ThemeToggleFloatingButton />}
      {!showDone && <FloatingSettingsButton onClick={() => setSettingsOpen(true)} />}
      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
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
          <div className="w-full max-w-xl bg-card border border-primary/40 rounded-xl shadow-lg px-8 py-6 flex flex-col items-center gap-3 animate-in fade-in slide-in-from-top-6">
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
                onClick={() => moveTask(activeTask.id, 'right')}
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
      <div className="flex gap-8 justify-center overflow-x-auto p-4 sm:p-6 md:p-8 w-full z-10 mt-8">
        <KanbanColumn
          title={STATUS_LABELS['UP_NEXT']}
          status={'UP_NEXT'}
          tasks={currentWorkspaceTasks.filter(t => t.status === 'UP_NEXT')}
          onAdd={addTask}
          onDelete={deleteTask}
          onEdit={editTask}
          onMove={moveTask}
          onToggleTimer={toggleTimer}
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
        />
      </div>
      <FloatingAddButton onClick={() => addTask('NEW')} />
    </div>
  );
} 