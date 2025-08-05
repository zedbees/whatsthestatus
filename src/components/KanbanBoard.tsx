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
import { AnalyticsModal } from './AnalyticsModal';
import CreatableSelect from 'react-select/creatable';
import { Edit2, Trash2, Play, Pause, ArrowRight, Clock, Calendar as CalendarIcon, Clock as ClockIcon } from 'lucide-react';
import { settingsStore, Settings } from '../stores/settings';

interface Workspace {
  id: string;
  name: string;
  taskTypes?: string[]; // Available task types for this workspace
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

function formatDeadline(deadline: string) {
  const d = new Date(deadline);
  const now = new Date();
  
  // Compare dates only (ignoring time) for day-level comparison
  const deadlineDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.floor((deadlineDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));
  
  // Check if time is set (not midnight)
  const hasTime = d.getHours() !== 0 || d.getMinutes() !== 0;
  
  // For time-sensitive deadlines, check if the specific time has passed
  const isTimePassed = hasTime && d.getTime() < now.getTime();
  
  if (diffDays < 0) {
    // Past date - overdue
    const text = `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? 's' : ''}`;
    return { text, color: 'text-red-500 dark:text-red-400', hasTime };
  } else if (diffDays === 0) {
    // Same date
    if (isTimePassed) {
      const text = 'Overdue today';
      return { text, color: 'text-red-500 dark:text-red-400', hasTime };
    } else {
      const text = hasTime ? 'Due today' : 'Due today (end of day)';
      return { text, color: 'text-orange-500 dark:text-orange-400', hasTime };
    }
  } else if (diffDays === 1) {
    const text = hasTime ? 'Due tomorrow' : 'Due tomorrow (end of day)';
    return { text, color: 'text-yellow-500 dark:text-yellow-400', hasTime };
  } else if (diffDays <= 7) {
    const text = hasTime ? `Due in ${diffDays} days` : `Due in ${diffDays} days (end of day)`;
    return { text, color: 'text-blue-500 dark:text-blue-400', hasTime };
  } else {
    const dateText = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    const text = hasTime ? dateText : `${dateText} (end of day)`;
    return { text, color: 'text-muted-foreground', hasTime };
  }
}

// Placeholder for TaskDetailsPanel
function TaskDetailsPanel({ task, onClose, onUpdateTask, onUpdateTaskTime, availableTaskTypes }: { 
  task: Task | null, 
  onClose: () => void, 
  onUpdateTask?: (taskId: string, updates: Partial<Task>) => void, 
  onUpdateTaskTime?: (taskId: string, newTotalWorkingTime: number) => void,
  availableTaskTypes: string[] 
}) {
  const [elapsed, setElapsed] = useState(0);
  const [editingTags, setEditingTags] = useState<string[]>(task?.tags || []);
  const [newTag, setNewTag] = useState('');
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingDescription, setEditingDescription] = useState(false);
  const [titleValue, setTitleValue] = useState(task?.title || '');
  const [descriptionValue, setDescriptionValue] = useState(task?.description || '');
  const [detailsTaskTypeDropdownOpen, setDetailsTaskTypeDropdownOpen] = useState(false);
  const [editingTime, setEditingTime] = useState(false);
  const [timeValue, setTimeValue] = useState('');
  const [editingDeadline, setEditingDeadline] = useState(false);
  const [deadlineValue, setDeadlineValue] = useState('');
  const panelRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const descriptionInputRef = useRef<HTMLTextAreaElement>(null);
  const timeInputRef = useRef<HTMLInputElement>(null);
  const deadlineInputRef = useRef<HTMLInputElement>(null);
  
  // Calculate task age
  const getTaskAge = (createdAt: string) => {
    const created = new Date(createdAt);
    const now = new Date();
    const diffMs = now.getTime() - created.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffDays > 0) {
      return diffDays === 1 ? '1d ago' : `${diffDays}d ago`;
    } else if (diffHours > 0) {
      return diffHours === 1 ? '1h ago' : `${diffHours}h ago`;
    } else if (diffMinutes > 0) {
      return diffMinutes === 1 ? '1m ago' : `${diffMinutes}m ago`;
    } else {
      return 'Just now';
    }
  };

  // Get age color based on how old the task is
  const getAgeColor = (createdAt: string) => {
    const created = new Date(createdAt);
    const now = new Date();
    const diffMs = now.getTime() - created.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays >= 7) return 'text-red-500 dark:text-red-400'; // Old - red
    if (diffDays >= 3) return 'text-orange-500 dark:text-orange-400'; // Medium - orange
    if (diffDays >= 1) return 'text-yellow-500 dark:text-yellow-400'; // Recent - yellow
    return 'text-green-500 dark:text-green-400'; // New - green
  };

  // Tag management functions
  const addTag = () => {
    if (newTag.trim() && !editingTags.includes(newTag.trim())) {
      setEditingTags([...editingTags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setEditingTags(editingTags.filter(tag => tag !== tagToRemove));
  };

  const handleTagKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  // Save tags when they change
  const saveTags = () => {
    if (task && onUpdateTask && JSON.stringify(editingTags) !== JSON.stringify(task.tags)) {
      onUpdateTask(task.id, {
        tags: editingTags,
        updatedAt: new Date().toISOString()
      });
    }
  };

  // Auto-save tags when editingTags changes
  useEffect(() => {
    if (task && onUpdateTask) {
      const timeoutId = setTimeout(saveTags, 1000); // Debounce for 1 second
      return () => clearTimeout(timeoutId);
    }
  }, [editingTags, task, onUpdateTask]);

  // Inline editing functions
  const startEditingTitle = () => {
    setEditingTitle(true);
    setTitleValue(task?.title || '');
    setTimeout(() => titleInputRef.current?.focus(), 0);
  };

  const saveTitle = () => {
    if (task && onUpdateTask && titleValue.trim() !== task.title) {
      onUpdateTask(task.id, {
        title: titleValue.trim(),
        updatedAt: new Date().toISOString()
      });
    }
    setEditingTitle(false);
  };

  const cancelTitleEdit = () => {
    setTitleValue(task?.title || '');
    setEditingTitle(false);
  };

  const startEditingDescription = () => {
    setEditingDescription(true);
    setDescriptionValue(task?.description || '');
    setTimeout(() => descriptionInputRef.current?.focus(), 0);
  };

  const saveDescription = () => {
    if (task && onUpdateTask && descriptionValue !== task.description) {
      onUpdateTask(task.id, {
        description: descriptionValue || undefined,
        updatedAt: new Date().toISOString()
      });
    }
    setEditingDescription(false);
  };

  const cancelDescriptionEdit = () => {
    setDescriptionValue(task?.description || '');
    setEditingDescription(false);
  };

  // Handle keyboard events for inline editing
  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveTitle();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelTitleEdit();
    }
  };

  const handleDescriptionKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      cancelDescriptionEdit();
    }
  };

  // Time editing functions
  const startEditingTime = () => {
    setEditingTime(true);
    const currentTime = task?.totalWorkingTime || 0;
    const hours = Math.floor(currentTime / (1000 * 60 * 60));
    const minutes = Math.floor((currentTime % (1000 * 60 * 60)) / (1000 * 60));
    setTimeValue(`${hours}:${minutes.toString().padStart(2, '0')}`);
    setTimeout(() => timeInputRef.current?.focus(), 0);
  };

  const saveTime = () => {
    if (task && onUpdateTaskTime) {
      const [hours, minutes] = timeValue.split(':').map(Number);
      const newTotalWorkingTime = ((hours || 0) * 60 * 60 + (minutes || 0) * 60) * 1000;
      onUpdateTaskTime(task.id, newTotalWorkingTime);
    }
    setEditingTime(false);
  };

  const cancelTimeEdit = () => {
    setEditingTime(false);
  };

  const handleTimeKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveTime();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelTimeEdit();
    }
  };

  // Deadline editing functions
  const startEditingDeadline = () => {
    setEditingDeadline(true);
    if (task?.deadline) {
      // Convert ISO string to datetime-local format
      const deadlineDate = new Date(task.deadline);
      const localDateTime = new Date(deadlineDate.getTime() - deadlineDate.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
      setDeadlineValue(localDateTime);
    } else {
      setDeadlineValue('');
    }
    setTimeout(() => deadlineInputRef.current?.focus(), 0);
  };

  const saveDeadline = () => {
    if (task && onUpdateTask) {
      const newDeadline = deadlineValue ? new Date(deadlineValue).toISOString() : undefined;
      onUpdateTask(task.id, {
        deadline: newDeadline,
        updatedAt: new Date().toISOString()
      });
    }
    setEditingDeadline(false);
  };

  const cancelDeadlineEdit = () => {
    setEditingDeadline(false);
  };

  const handleDeadlineKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveDeadline();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelDeadlineEdit();
    }
  };
  
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
  // Close on Escape key and handle dropdown clicks
  useEffect(() => {
    if (!task) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (detailsTaskTypeDropdownOpen) {
          setDetailsTaskTypeDropdownOpen(false);
        } else {
          onClose();
        }
      }
    };

    const handleClickOutside = () => {
      if (detailsTaskTypeDropdownOpen) {
        setDetailsTaskTypeDropdownOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [task, onClose, detailsTaskTypeDropdownOpen]);
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
          {/* Header: Status badge, Age, Worked Time, Title, Tags */}
          <div className="flex flex-col gap-2 mb-2">
            <div className="flex items-center gap-3 mb-1">
              {statusBadge(task.status)}
              <span className={`text-xs font-medium ${getAgeColor(task.createdAt)}`}>
                {getTaskAge(task.createdAt)}
              </span>
              {workingTime > 0 && (
                <span className="text-xs font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded border border-green-200 dark:border-green-800">
                  {formatDuration(workingTime)}
                </span>
              )}
              {task.tags && task.tags.length > 0 && (
                <span className="flex flex-wrap gap-1">
                  {task.tags.map((tag, i) => (
                    <span key={i} className="inline-block px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 text-xs font-medium border border-indigo-100">{tag}</span>
                  ))}
                </span>
              )}
            </div>
            {editingTitle ? (
              <div className="mb-1">
                <input
                  ref={titleInputRef}
                  type="text"
                  value={titleValue}
                  onChange={(e) => setTitleValue(e.target.value)}
                  onKeyDown={handleTitleKeyDown}
                  onBlur={saveTitle}
                  className="text-2xl font-bold leading-tight bg-transparent border-none outline-none focus:ring-2 focus:ring-primary focus:ring-inset rounded px-2 py-1 w-full"
                  placeholder="Enter task title..."
                />
              </div>
            ) : (
              <h2 
                className="text-2xl font-bold leading-tight mb-1 cursor-pointer hover:bg-muted/50 rounded px-2 py-1 transition-colors"
                onClick={startEditingTitle}
                title="Click to edit title"
              >
                {task.title}
              </h2>
            )}
          </div>
          {/* Dates */}
          <div className="flex items-center gap-6 text-xs text-muted-foreground mb-2">
            <span className="flex items-center gap-1"><CalendarIcon className="w-4 h-4" />{formatShortDate(task.createdAt)}</span>
            <span className="flex items-center gap-1"><ClockIcon className="w-4 h-4" />{formatShortDate(task.updatedAt)}</span>
            {task.deadline && (
              <span className={`flex items-center gap-1 ${formatDeadline(task.deadline).color}`}>
                <span className="text-red-500">⏰</span>
                {formatDeadline(task.deadline).text}
                <button
                  onClick={startEditingDeadline}
                  className="ml-1 hover:text-foreground transition-colors"
                  title="Edit deadline"
                >
                  ✏️
                </button>
              </span>
            )}
          </div>
          <hr className="my-2 border-border" />
          {/* Description */}
          <div className="mb-6">
            <div className="text-sm font-semibold text-muted-foreground mb-1">Description</div>
            {editingDescription ? (
              <div className="relative">
                <textarea
                  ref={descriptionInputRef}
                  value={descriptionValue}
                  onChange={(e) => setDescriptionValue(e.target.value)}
                  onKeyDown={handleDescriptionKeyDown}
                  onBlur={saveDescription}
                  className="w-full text-base text-foreground leading-relaxed whitespace-pre-line break-words bg-card rounded p-3 border border-border min-h-[100px] resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Add a description..."
                />
                <div className="absolute top-2 right-2 text-xs text-muted-foreground">
                  Press Esc to cancel
                </div>
              </div>
            ) : (
              <div 
                className="text-base text-foreground leading-relaxed whitespace-pre-line break-words bg-card rounded p-3 border border-border min-h-[40px] cursor-pointer hover:bg-muted/20 transition-colors"
                onClick={startEditingDescription}
                title="Click to edit description"
              >
                {task.description ? task.description : <span className="text-muted-foreground">No description</span>}
              </div>
            )}
          </div>
          {/* Task Type */}
          <div className="mb-6">
            <div className="text-sm font-semibold text-muted-foreground mb-2">Task Type</div>
            <div className="relative">
              <button
                type="button"
                onClick={() => setDetailsTaskTypeDropdownOpen(v => !v)}
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm text-left flex items-center justify-between"
              >
                <span className={task.taskType ? 'text-foreground' : 'text-muted-foreground'}>
                  {task.taskType || 'No type'}
                </span>
                <ChevronDown className={`w-4 h-4 text-muted-foreground transition ${detailsTaskTypeDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {detailsTaskTypeDropdownOpen && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-card shadow-lg rounded-lg py-2 border border-border animate-in fade-in z-50 max-h-48 overflow-y-auto">
                  <button
                    className={`w-full text-left px-4 py-2 text-sm font-medium rounded transition hover:bg-muted ${!task.taskType ? 'bg-muted font-bold' : ''}`}
                    onClick={() => {
                      if (task && onUpdateTask) {
                        onUpdateTask(task.id, {
                          taskType: undefined,
                          updatedAt: new Date().toISOString()
                        });
                      }
                      setDetailsTaskTypeDropdownOpen(false);
                    }}
                  >
                    No type
                  </button>
                  {availableTaskTypes.map(type => (
                    <button
                      key={type}
                      className={`w-full text-left px-4 py-2 text-sm font-medium rounded transition hover:bg-muted ${task.taskType === type ? 'bg-muted font-bold' : ''}`}
                      onClick={() => {
                        if (task && onUpdateTask) {
                          onUpdateTask(task.id, {
                            taskType: type,
                            updatedAt: new Date().toISOString()
                          });
                        }
                        setDetailsTaskTypeDropdownOpen(false);
                      }}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          {/* Deadline */}
          <div className="mb-6">
            <div className="text-sm font-semibold text-muted-foreground mb-2">Deadline</div>
            {task.deadline ? (
              <div className="flex items-center gap-2">
                <div className={`flex items-center gap-2 px-3 py-2 rounded border text-sm font-medium ${formatDeadline(task.deadline).color.includes('red') ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300' : formatDeadline(task.deadline).color.includes('orange') ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-300' : formatDeadline(task.deadline).color.includes('yellow') ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-300' : formatDeadline(task.deadline).color.includes('blue') ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300' : 'bg-muted-foreground/10 border-border text-foreground'}`}>
                  <span className="text-red-500">⏰</span>
                  {formatDeadline(task.deadline).text}
                </div>
                <button
                  onClick={startEditingDeadline}
                  className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                  title="Edit deadline"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="px-3 py-2 bg-muted/20 border border-border rounded text-sm text-muted-foreground">
                  No deadline set
                </div>
                <button
                  onClick={startEditingDeadline}
                  className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                  title="Add deadline"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
          {/* Tags */}
          <div className="mb-6">
            <div className="text-sm font-semibold text-muted-foreground mb-2">Tags</div>
            <div className="space-y-3">
              {/* Existing tags */}
              {editingTags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {editingTags.map((tag, index) => (
                    <span key={index} className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-sm font-medium border border-indigo-100">
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="ml-1 text-indigo-500 hover:text-indigo-700 transition-colors"
                        title="Remove tag"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
              {/* Add new tag */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={handleTagKeyPress}
                  placeholder="Add a tag..."
                  className="flex-1 px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                />
                <button
                  onClick={addTag}
                  disabled={!newTag.trim()}
                  className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                >
                  Add
                </button>
              </div>
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
                <button
                  onClick={startEditingTime}
                  className="ml-2 text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200 transition-colors"
                  title="Edit time"
                >
                  ✏️
                </button>
              </div>
            )}
            {task.status === 'WORKING' && (
              <span className="text-xs text-green-600 dark:text-green-400 font-mono font-semibold">
                {formatTime(elapsed)}
              </span>
            )}
          </div>

          {/* Time editing input */}
          {editingTime && (
            <div className="mb-4 p-3 bg-muted/20 rounded-lg border border-border">
              <div className="text-sm font-medium text-foreground mb-2">Edit Total Working Time</div>
              <div className="flex gap-2 items-center">
                <input
                  ref={timeInputRef}
                  type="text"
                  value={timeValue}
                  onChange={(e) => setTimeValue(e.target.value)}
                  onKeyDown={handleTimeKeyDown}
                  onBlur={saveTime}
                  placeholder="0:30"
                  className="flex-1 px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                />
                <button
                  onClick={saveTime}
                  className="px-3 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors text-sm"
                >
                  Save
                </button>
                <button
                  onClick={cancelTimeEdit}
                  className="px-3 py-2 bg-muted text-foreground rounded-md hover:bg-muted/80 transition-colors text-sm"
                >
                  Cancel
                </button>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Format: hours:minutes (e.g., 1:30 for 1 hour 30 minutes)
              </div>
            </div>
          )}

          {/* Deadline editing input */}
          {editingDeadline && (
            <div className="mb-4 p-3 bg-muted/20 rounded-lg border border-border">
              <div className="text-sm font-medium text-foreground mb-2">Edit Deadline</div>
              <div className="space-y-3">
                <div className="flex gap-2 items-center">
                  <div className="relative flex-1">
                    <input
                      ref={deadlineInputRef}
                      type="date"
                      value={deadlineValue ? deadlineValue.split('T')[0] : ''}
                      onChange={(e) => {
                        const dateValue = e.target.value;
                        if (dateValue) {
                          // If there's already a time, preserve it
                          const existingTime = deadlineValue ? deadlineValue.split('T')[1] : '';
                          const newDateTime = existingTime ? `${dateValue}T${existingTime}` : `${dateValue}T00:00`;
                          setDeadlineValue(newDateTime);
                        } else {
                          setDeadlineValue('');
                        }
                      }}
                      onKeyDown={handleDeadlineKeyDown}
                      onBlur={saveDeadline}
                      className="w-full px-3 py-2 pr-10 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                    />
                    {deadlineValue && (
                      <button
                        type="button"
                        onClick={() => setDeadlineValue('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors"
                        title="Clear deadline"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <button
                    onClick={saveDeadline}
                    className="px-3 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors text-sm"
                  >
                    Save
                  </button>
                  <button
                    onClick={cancelDeadlineEdit}
                    className="px-3 py-2 bg-muted text-foreground rounded-md hover:bg-muted/80 transition-colors text-sm"
                  >
                    Cancel
                  </button>
                </div>
                {deadlineValue && (
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={deadlineValue.split('T')[1] || '00:00'}
                      onChange={(e) => {
                        const timeValue = e.target.value;
                        const dateValue = deadlineValue.split('T')[0];
                        setDeadlineValue(`${dateValue}T${timeValue}`);
                      }}
                      className="px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                    />
                    <span className="text-xs text-muted-foreground">Time (optional)</span>
                  </div>
                )}
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                Leave empty to remove deadline
              </div>
            </div>
          )}
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
  const [settings, setSettings] = useState<Settings | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [addBoardModalOpen, setAddBoardModalOpen] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');
  const [addTaskModalOpen, setAddTaskModalOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskStatus, setNewTaskStatus] = useState<TaskStatus>('NEW');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskType, setNewTaskType] = useState<string>('');
  const [newTaskTypeName, setNewTaskTypeName] = useState('');
  const [taskTypeDropdownOpen, setTaskTypeDropdownOpen] = useState(false);
  // For react-select, tags are objects with label/value, but we store as string[]
  const [newTaskTags, setNewTaskTags] = useState<string[]>([]);
  const [newTaskDeadline, setNewTaskDeadline] = useState<string>('');
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

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const currentSettings = await settingsStore.getSettings();
        setSettings(currentSettings);
      } catch (error) {
        console.error('Failed to load settings:', error);
        // Fallback to default settings
        setSettings({
          autoStartDay: true,
          endOfDayTime: 16,
          autoPauseAfterMinutes: 30,
          showCompletedTasks: true,
          theme: 'system'
        });
      }
    };
    loadSettings();
  }, []);

  // Update current time every second for live timer
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Track user activity more comprehensively
  useEffect(() => {
    const updateLastActive = () => {
      const now = Date.now();
      localStorage.setItem('kanban-last-active', now.toString());
    };

    // Update on various user activities
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      document.addEventListener(event, updateLastActive, { passive: true });
    });

    // Also communicate with background script for better detection
    const updateBackgroundScript = () => {
      if (chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage({ type: 'UPDATE_LAST_ACTIVE' }).catch(() => {
          // Background script might not be available, ignore error
        });
      }
    };

    // Enhanced activity tracking that also updates background script
    const enhancedUpdateLastActive = () => {
      updateLastActive();
      updateBackgroundScript();
    };

    // Handle keyboard shortcuts that might cause system events
    const handleKeyDown = (e: KeyboardEvent) => {
      enhancedUpdateLastActive();
      
      // Detect Cmd+Ctrl+Q (macOS quit) and other system shortcuts
      if ((e.metaKey || e.ctrlKey) && e.key === 'q') {
        console.log('Detected Cmd+Ctrl+Q - updating last active time');
        enhancedUpdateLastActive();
      }
      
      // Quick pause shortcut (Cmd/Ctrl + Shift + P)
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'p') {
        e.preventDefault();
        const activeTask = tasks.find(t => t.status === 'WORKING');
        if (activeTask) {
          toggleTimer(activeTask.id);
          alert('Task paused via keyboard shortcut!');
        }
      }
    };

    // Enhanced system-level detection
    const handleSystemEvents = () => {
      enhancedUpdateLastActive();
      console.log('System event detected - updating last active time');
    };

    // Also update on focus and visibility change
    window.addEventListener('focus', enhancedUpdateLastActive);
    window.addEventListener('blur', enhancedUpdateLastActive);
    document.addEventListener('visibilitychange', enhancedUpdateLastActive);
    document.addEventListener('keydown', handleKeyDown);

    // Additional system-level events for better MacBook detection
    window.addEventListener('online', handleSystemEvents);
    window.addEventListener('offline', handleSystemEvents);
    window.addEventListener('resize', handleSystemEvents);
    window.addEventListener('orientationchange', handleSystemEvents);
    
    // Try to detect sleep/wake cycles
    if ('wakeLock' in navigator) {
      navigator.wakeLock?.request('screen').then(() => {
        console.log('Wake lock acquired');
      }).catch(err => {
        console.log('Wake lock failed:', err);
      });
    }

    // Periodic activity check (every 30 seconds)
    const activityInterval = setInterval(() => {
      const lastActive = localStorage.getItem('kanban-last-active');
      if (lastActive) {
        const gap = Date.now() - parseInt(lastActive);
        const threshold = settings?.autoPauseAfterMinutes ? settings.autoPauseAfterMinutes * 60 * 1000 : 30 * 60 * 1000;
        
        if (gap > threshold) {
          const activeTask = tasks.find(t => t.status === 'WORKING');
          if (activeTask) {
            console.log(`Auto-pausing task due to ${Math.round(gap / 60000)} minutes of inactivity`);
            toggleTimer(activeTask.id);
            
            // Show notification
            if (gap > 300000) { // Only show for 5+ minutes
              setTimeout(() => {
                alert(`Task "${activeTask.title}" was auto-paused due to ${Math.round(gap / 60000)} minutes of inactivity.\n\nThis usually happens when:\n• Your MacBook went to sleep\n• You were away from the computer\n• The browser tab was inactive`);
              }, 1000);
            }
          }
        }
      }
    }, 30000);

    // Initial update
    enhancedUpdateLastActive();

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, updateLastActive);
      });
      window.removeEventListener('focus', enhancedUpdateLastActive);
      window.removeEventListener('blur', enhancedUpdateLastActive);
      document.removeEventListener('visibilitychange', enhancedUpdateLastActive);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('online', handleSystemEvents);
      window.removeEventListener('offline', handleSystemEvents);
      window.removeEventListener('resize', handleSystemEvents);
      window.removeEventListener('orientationchange', handleSystemEvents);
      clearInterval(activityInterval);
    };
  }, [tasks, settings]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as Node;
      
      // Handle workspace dropdown
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        setDropdownOpen(false);
      }
      
      // Handle task type dropdown - only close if click is outside the dropdown container
      if (taskTypeDropdownOpen) {
        // Check if the click is inside the task type dropdown area
        const taskTypeDropdown = document.querySelector('[data-task-type-dropdown]');
        if (taskTypeDropdown && !taskTypeDropdown.contains(target)) {
          setTaskTypeDropdownOpen(false);
        }
      }
    }
    
    if (dropdownOpen || taskTypeDropdownOpen) {
      document.addEventListener('mousedown', handleClick);
    } else {
      document.removeEventListener('mousedown', handleClick);
    }
    return () => document.removeEventListener('mousedown', handleClick);
  }, [dropdownOpen, taskTypeDropdownOpen]);

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
    return saved ? JSON.parse(saved) : [{ 
      id: 'default', 
      name: 'Personal',
      taskTypes: ['Task', 'Bug', 'Feature', 'Improvement']
    }];
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

  // Listen for task updates from other tabs
  useEffect(() => {
    if (!window.BroadcastChannel) return;
    
    const channel = new BroadcastChannel('kanban-tasks');
    
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'TASKS_UPDATED') {
        const incomingTasks = event.data.tasks;
        const currentTimestamp = event.data.timestamp;
        
        // Only update if the incoming data is newer
        const lastUpdate = localStorage.getItem('kanban-last-update');
        if (!lastUpdate || currentTimestamp > parseInt(lastUpdate)) {
          setTasks(incomingTasks);
          localStorage.setItem('kanban-last-update', currentTimestamp.toString());
          
          // Check if there's a conflict with active tasks
          const currentActiveTask = tasks.find((t: Task) => t.status === 'WORKING');
          const incomingActiveTask = incomingTasks.find((t: Task) => t.status === 'WORKING');
          
          if (currentActiveTask && incomingActiveTask && currentActiveTask.id !== incomingActiveTask.id) {
            // Conflict detected - ask user what to do
            setTimeout(() => {
              const choice = confirm(
                `Task conflict detected!\n\n` +
                `Current tab: "${currentActiveTask.title}" (${formatDuration(currentActiveTask.totalWorkingTime || 0)})\n` +
                `Other tab: "${incomingActiveTask.title}" (${formatDuration(incomingActiveTask.totalWorkingTime || 0)})\n\n` +
                `Only one task can be active at a time. Would you like to keep the task from the other tab?`
              );
              
              if (choice) {
                                 // Keep the incoming task, pause the current one
                 setTasks((currentTasks: Task[]) => currentTasks.map((t: Task) => {
                   if (t.id === currentActiveTask.id) {
                     return { ...t, status: 'IN_PROGRESS', startedAt: undefined };
                   }
                   return t;
                 }));
              }
            }, 1000);
          }
        }
      }
    };
    
    channel.addEventListener('message', handleMessage);
    
    return () => {
      channel.removeEventListener('message', handleMessage);
      channel.close();
    };
  }, [tasks]);

  // Save tasks to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('kanban-tasks', JSON.stringify(tasks));
    
    // Broadcast task changes to other tabs
    if (window.BroadcastChannel) {
      const channel = new BroadcastChannel('kanban-tasks');
      channel.postMessage({
        type: 'TASKS_UPDATED',
        tasks: tasks,
        timestamp: Date.now()
      });
    }
  }, [tasks]);

  const addNewBoard = () => {
    setAddBoardModalOpen(true);
  };

  const handleCreateBoard = () => {
    if (!newBoardName.trim()) return;
    
    const newBoard = {
      id: crypto.randomUUID(),
      name: newBoardName.trim(),
      taskTypes: ['Task', 'Bug', 'Feature', 'Improvement'] // Default task types for new boards
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
    setNewTaskType(''); // Reset task type when opening modal
    setNewTaskDeadline(''); // Reset deadline when opening modal
    setTaskTypeDropdownOpen(false); // Reset dropdown state
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
      taskType: newTaskType.trim() || undefined,
      deadline: newTaskDeadline || undefined,
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
    setNewTaskType('');
    setNewTaskTags([]);
    setAddTaskModalOpen(false);
  };

  const handleCancelCreateTask = () => {
    setNewTaskTitle('');
    setNewTaskDescription('');
    setNewTaskType('');
    setNewTaskTypeName('');
    setNewTaskDeadline('');
    setTaskTypeDropdownOpen(false);
    setNewTaskTags([]);
    setAddTaskModalOpen(false);
  };

  // Function to add new task type to current workspace
  const addNewTaskType = (newType: string) => {
    if (!newType.trim()) return;
    
    setWorkspaces(workspaces => workspaces.map(ws => {
      if (ws.id === currentWorkspace) {
        const existingTypes = ws.taskTypes || [];
        if (!existingTypes.includes(newType.trim())) {
          return {
            ...ws,
            taskTypes: [...existingTypes, newType.trim()]
          };
        }
      }
      return ws;
    }));
    
    setNewTaskType(newType.trim());
  };

  const handleCreateTaskType = () => {
    if (!newTaskTypeName.trim()) return;
    
    addNewTaskType(newTaskTypeName.trim());
    setNewTaskTypeName('');
  };



  const deleteTask = (id: string) => setTasks(tasks.filter(t => t.id !== id));
  const editTask = (id: string) => {
    // Open the task details panel for editing
    setDetailsTaskId(id);
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
      const currentActive = tasks.find((t: Task) => t.status === 'WORKING');
      const now = new Date().toISOString();
      
      return tasks.map((t: Task) => {
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

  // Update task function for TaskDetailsPanel
  const updateTask = (taskId: string, updates: Partial<Task>) => {
    setTasks(tasks => tasks.map(t => 
      t.id === taskId 
        ? { ...t, ...updates }
        : t
    ));
  };

  // Manual time editing function (for paid users later)
  const updateTaskTime = (taskId: string, newTotalWorkingTime: number) => {
    setTasks(tasks => tasks.map(t => {
      if (t.id !== taskId) return t;
      
      // Update the total working time
      return {
        ...t,
        totalWorkingTime: newTotalWorkingTime,
        updatedAt: new Date().toISOString()
      };
    }));
  };

  // Comprehensive inactivity detection - runs on mount, visibility change, and storage changes
  const checkAndHandleInactivity = useCallback(() => {
    if (!settings) return; // Wait for settings to load
    
    const lastActiveStr = localStorage.getItem('kanban-last-active');
    const now = Date.now();
    
    if (!lastActiveStr) return;
    
    const lastActive = parseInt(lastActiveStr, 10);
    const gap = now - lastActive;
    
    // Use settings value instead of hardcoded 2 minutes
    const autoPauseThreshold = settings.autoPauseAfterMinutes * 60 * 1000; // Convert to milliseconds
    
    // Check for significant inactivity based on user settings
    if (gap > autoPauseThreshold) {
      const activeTask = tasks.find(t => t.status === 'WORKING');
      if (activeTask) {
        // Calculate session time up to lastActive (not now)
        const startedAt = activeTask.startedAt ? new Date(activeTask.startedAt).getTime() : null;
        let sessionTime = 0;
        
        if (startedAt && lastActive > startedAt) {
          sessionTime = lastActive - startedAt;
        }
        
        const totalWorkingTime = (activeTask.totalWorkingTime || 0) + sessionTime;
        
        // Update history: close WORKING, add IN_PROGRESS
        const newHistory = [...activeTask.history];
        
        // Close the current WORKING entry if it exists
        if (newHistory.length > 0 && newHistory[newHistory.length - 1].status === 'WORKING' && !newHistory[newHistory.length - 1].exitedAt) {
          newHistory[newHistory.length - 1].exitedAt = new Date(lastActive).toISOString();
        }
        
        // Add IN_PROGRESS entry if none exists
        const existingInProgressEntry = newHistory.find(entry => entry.status === 'IN_PROGRESS' && !entry.exitedAt);
        if (!existingInProgressEntry) {
          newHistory.push({ status: 'IN_PROGRESS', enteredAt: new Date(lastActive).toISOString() });
        }
        
        // Update the task in state
        setTasks(tasks => tasks.map(t =>
          t.id === activeTask.id
            ? {
                ...t,
                status: 'IN_PROGRESS',
                startedAt: undefined,
                totalWorkingTime,
                history: newHistory
              }
            : t
        ));
        
        // Show notification with settings-based threshold
        console.log(`Task "${activeTask.title}" auto-paused due to ${Math.round(gap / 60000)} minutes of inactivity (threshold: ${settings.autoPauseAfterMinutes} minutes)`);
        
        // Use a more user-friendly notification instead of alert
        if (gap > 300000) { // Only show alert for 5+ minutes of inactivity
          alert(`Your task "${activeTask.title}" was automatically paused because your computer was inactive or asleep for ${Math.round(gap / 60000)} minutes. The time while your Mac was closed was not counted.`);
        }
      }
    }
  }, [tasks, settings]);

  // Check for inactivity on mount and when page becomes visible
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const handleInactivityCheck = () => {
      // Clear any existing timeout to prevent multiple checks
      if (timeoutId) clearTimeout(timeoutId);
      
      // Add a small delay to ensure state is loaded and prevent race conditions
      timeoutId = setTimeout(() => {
        checkAndHandleInactivity();
      }, 500);
    };

    // Check on mount
    handleInactivityCheck();

    // Check when page becomes visible (e.g., after sleep)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        handleInactivityCheck();
      }
    };

    // Check when window gains focus (e.g., switching back to tab)
    const handleFocus = () => {
      handleInactivityCheck();
    };

    // Check when user returns from lock screen or other system events
    const handleResume = () => {
      handleInactivityCheck();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('resume', handleResume);

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('resume', handleResume);
    };
  }, [checkAndHandleInactivity]);

  // Enhanced before unload handling - save current state when leaving
  useEffect(() => {
    const activeTask = tasks.find(t => t.status === 'WORKING');
    if (!activeTask) return;

    const handleBeforeUnload = () => {
      if (activeTask && activeTask.status === 'WORKING') {
        // Save current state before unload
        localStorage.setItem('kanban-paused-task', JSON.stringify({
          taskId: activeTask.id,
          pausedAt: new Date().toISOString(),
          lastActive: Date.now()
        }));
      }
    };

    // Check for paused task on page load
    const checkPausedTask = () => {
      const pausedTaskData = localStorage.getItem('kanban-paused-task');
      if (pausedTaskData) {
        try {
          const { taskId, lastActive } = JSON.parse(pausedTaskData);
          const task = tasks.find(t => t.id === taskId);
          if (task && task.status === 'WORKING') {
            // Check if there was a significant gap
            const now = Date.now();
            const gap = now - lastActive;
            
            // Use settings value instead of hardcoded 2 minutes
            const autoPauseThreshold = settings?.autoPauseAfterMinutes ? settings.autoPauseAfterMinutes * 60 * 1000 : 120000;
            
            if (gap > autoPauseThreshold) {
              // Auto-pause due to inactivity
              console.log(`Auto-pausing task due to ${Math.round(gap / 60000)} minute gap (threshold: ${settings?.autoPauseAfterMinutes || 2} minutes)`);
              checkAndHandleInactivity();
            } else {
              // Task was paused due to page unload, show resume prompt
              setTimeout(() => {
                if (confirm(`Your task "${task.title}" was paused when you left the page. Would you like to resume it?`)) {
                  // Task is already in WORKING status, just continue
                  console.log('User chose to resume task');
                } else {
                  // User chose not to resume, move to IN_PROGRESS
                  console.log('User chose not to resume task');
                  toggleTimer(taskId);
                }
              }, 1000); // Small delay to ensure UI is ready
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
    
    // Check for paused task on mount with delay
    setTimeout(checkPausedTask, 2000);

    // Cleanup event listeners
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [tasks, toggleTimer, checkAndHandleInactivity]);

  const backlogCount = currentWorkspaceTasks.filter(t => t.status === 'NEW').length;
  const doneCount = currentWorkspaceTasks.filter(t => t.status === 'DONE').length;
  const currentWorkspaceData = workspaces.find(ws => ws.id === currentWorkspace);
  const availableTaskTypes = currentWorkspaceData?.taskTypes || [];

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
      <AnalyticsModal 
        open={analyticsOpen} 
        onClose={() => setAnalyticsOpen(false)} 
        tasks={tasks} 
        workspaces={workspaces} 
      />
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
          <div className="bg-background border border-border rounded-lg p-6 w-full max-w-4xl mx-4">
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
              {/* Task Title - Full Width */}
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

              {/* Two Column Layout */}
              <div className="grid grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-6">
                  <div>
                    <label htmlFor="taskType" className="block text-sm font-medium text-foreground mb-3">
                      Task Type (optional)
                    </label>
                    <div className="relative" data-task-type-dropdown>
                      <button
                        type="button"
                        onClick={() => setTaskTypeDropdownOpen(v => !v)}
                        className="w-full px-4 py-3 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 text-base text-left flex items-center justify-between"
                      >
                        <span className={newTaskType ? 'text-foreground' : 'text-muted-foreground'}>
                          {newTaskType || 'Select a task type...'}
                        </span>
                        <ChevronDown className={`w-4 h-4 text-muted-foreground transition ${taskTypeDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>
                      
                      {taskTypeDropdownOpen && (
                        <div className="absolute left-0 right-0 top-full mt-1 bg-card shadow-lg rounded-lg py-2 border border-border animate-in fade-in z-50 max-h-48 overflow-y-auto">
                          <button
                            className={`w-full text-left px-4 py-2 text-sm font-medium rounded transition hover:bg-muted ${!newTaskType ? 'bg-muted font-bold' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setNewTaskType('');
                              setTaskTypeDropdownOpen(false);
                            }}
                          >
                            No type
                          </button>
                          {availableTaskTypes.map(type => (
                            <button
                              key={type}
                              className={`w-full text-left px-4 py-2 text-sm font-medium rounded transition hover:bg-muted ${newTaskType === type ? 'bg-muted font-bold' : ''}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setNewTaskType(type);
                                setTaskTypeDropdownOpen(false);
                              }}
                            >
                              {type}
                            </button>
                          ))}
                          <button
                            className="w-full text-left px-4 py-2 text-sm font-medium rounded transition hover:bg-primary/10 text-primary flex items-center gap-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              setNewTaskType('__add_new__');
                              setTaskTypeDropdownOpen(false);
                            }}
                          >
                            <Plus className="w-4 h-4" /> Add New Type
                          </button>
                        </div>
                      )}
                    </div>
                    
                    {newTaskType === '__add_new__' && (
                      <div className="mt-3 p-3 bg-muted/20 rounded-lg border border-border">
                        <input
                          type="text"
                          placeholder="Enter new task type name..."
                          value={newTaskTypeName}
                          onChange={(e) => setNewTaskTypeName(e.target.value)}
                          className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleCreateTaskType();
                            } else if (e.key === 'Escape') {
                              setNewTaskType('');
                              setNewTaskTypeName('');
                            }
                          }}
                          autoFocus
                        />
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={handleCreateTaskType}
                            disabled={!newTaskTypeName.trim()}
                            className="px-3 py-1 text-sm bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            Add Type
                          </button>
                          <button
                            onClick={() => {
                              setNewTaskType('');
                              setNewTaskTypeName('');
                            }}
                            className="px-3 py-1 text-sm bg-muted text-foreground rounded-md hover:bg-muted/80 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label htmlFor="taskDeadline" className="block text-sm font-medium text-foreground mb-3">
                      Deadline (optional)
                    </label>
                    <div className="space-y-2">
                      <div className="relative">
                        <input
                          id="taskDeadline"
                          type="date"
                          value={newTaskDeadline ? newTaskDeadline.split('T')[0] : ''}
                          onChange={(e) => {
                            const dateValue = e.target.value;
                            if (dateValue) {
                              // If there's already a time, preserve it
                              const existingTime = newTaskDeadline ? newTaskDeadline.split('T')[1] : '';
                              const newDateTime = existingTime ? `${dateValue}T${existingTime}` : `${dateValue}T00:00`;
                              setNewTaskDeadline(newDateTime);
                            } else {
                              setNewTaskDeadline('');
                            }
                          }}
                          className="w-full px-4 py-3 pr-12 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 text-base"
                        />
                        {newTaskDeadline && (
                          <button
                            type="button"
                            onClick={() => setNewTaskDeadline('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors"
                            title="Clear deadline"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      {newTaskDeadline && (
                        <div className="flex items-center gap-2">
                          <input
                            type="time"
                            value={newTaskDeadline.split('T')[1] || '00:00'}
                            onChange={(e) => {
                              const timeValue = e.target.value;
                              const dateValue = newTaskDeadline.split('T')[0];
                              setNewTaskDeadline(`${dateValue}T${timeValue}`);
                            }}
                            className="px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 text-sm"
                          />
                          <span className="text-xs text-muted-foreground">Time (optional)</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
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
                </div>
              </div>

              {/* Description - Full Width */}
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
            {/* Activity status */}
            <div className="text-xs text-muted-foreground mt-2">
              Last active: {(() => {
                const lastActive = localStorage.getItem('kanban-last-active');
                if (lastActive) {
                  const gap = Date.now() - parseInt(lastActive);
                  if (gap < 60000) return 'Just now';
                  if (gap < 3600000) return `${Math.floor(gap / 60000)}m ago`;
                  return `${Math.floor(gap / 3600000)}h ago`;
                }
                return 'Unknown';
              })()}
            </div>
            {/* Multi-tab warning */}
            <div className="text-xs text-amber-600 dark:text-amber-400 mt-1">
              💡 Tip: Only one task can be active across all tabs. Changes sync automatically.
            </div>
            {/* Keyboard shortcuts */}
            <div className="text-xs text-muted-foreground">
              Quick pause: {navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}+Shift+P
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
      <TaskDetailsPanel 
        task={detailsTask} 
        onClose={handleCloseDetails} 
        onUpdateTask={updateTask} 
        onUpdateTaskTime={updateTaskTime}
        availableTaskTypes={availableTaskTypes} 
      />
    </div>
  );
} 