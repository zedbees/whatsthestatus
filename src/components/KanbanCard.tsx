import { Task, TaskStatus } from '../types/tasks';
import { Button } from './ui/button';
import { Trash2, Edit2, Play, Pause, ArrowRight, Clock } from 'lucide-react';
import { useEffect, useState } from 'react';

interface KanbanCardProps {
  task: Task;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
  onMove: (id: string, direction: 'left' | 'right') => void;
  onToggleTimer: (id: string) => void;
}

// Simple SVG Pie Chart Component
function PieChart({ data, size = 60 }: { data: Array<{ label: string; value: number; color: string }>; size?: number }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  if (total === 0) return null;

  const center = size / 2;
  const radius = center - 4;
  let currentAngle = -Math.PI / 2; // Start from top

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
    <svg width={size} height={size} className="flex-shrink-0">
      {paths}
    </svg>
  );
}

export function KanbanCard({ task, onDelete, onEdit, onMove, onToggleTimer }: KanbanCardProps) {
  const [elapsed, setElapsed] = useState(0);
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    if (task.status === 'WORKING' && task.startedAt) {
      const interval = setInterval(() => {
        const now = Date.now();
        const currentSessionTime = Math.floor((now - new Date(task.startedAt!).getTime()) / 1000);
        const totalElapsed = Math.floor((task.totalWorkingTime || 0) / 1000) + currentSessionTime;
        setElapsed(totalElapsed);
        setCurrentTime(now);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [task.status, task.startedAt, task.totalWorkingTime]);

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  // State display names and colors for pie chart
  const stateDisplay: Record<string, { label: string; color: string }> = {
    UP_NEXT: { label: 'Up Next', color: '#a5b4fc' },
    WORKING: { label: 'Working', color: '#10b981' }, // Brighter green for emphasis
    IN_PROGRESS: { label: 'In Progress', color: '#fbbf24' },
    BLOCKED: { label: 'Blocked', color: '#fca5a5' },
    NEW: { label: 'Backlog', color: '#d1d5db' },
    DONE: { label: 'Done', color: '#c7d2fe' },
  };

  // Human-readable duration formatter - minimum unit is minutes
  function formatDuration(ms: number): string {
    const s = Math.floor(ms / 1000);
    const m = Math.ceil(s / 60); // Round up to next minute
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

  // Calculate time distribution for pie chart
  const statusTotals: Record<TaskStatus, { totalMs: number; isCurrent: boolean }> = {} as any;
  
  task.history.forEach(entry => {
    const start = new Date(entry.enteredAt).getTime();
    const end = entry.exitedAt 
      ? new Date(entry.exitedAt).getTime() 
      : (entry.status === 'WORKING' ? currentTime : start);
    const durationMs = end - start;
    
    if (!statusTotals[entry.status]) {
      statusTotals[entry.status] = { totalMs: 0, isCurrent: false };
    }
    statusTotals[entry.status].totalMs += durationMs;
    statusTotals[entry.status].isCurrent = !entry.exitedAt;
  });

  // Prepare data for pie chart (only statuses with time > 0)
  const pieData = Object.entries(statusTotals)
    .filter(([_, data]) => data.totalMs > 0)
    .map(([status, data]) => ({
      label: stateDisplay[status]?.label || status,
      value: data.totalMs,
      color: stateDisplay[status]?.color || '#e5e7eb',
      isCurrent: data.isCurrent
    }))
    .sort((a, b) => b.value - a.value); // Sort by time, most time first

  // Get working time for prominent display
  const workingTime = statusTotals['WORKING']?.totalMs || 0;
  const totalTime = Object.values(statusTotals).reduce((sum, data) => sum + data.totalMs, 0);
  const workingPercentage = totalTime > 0 ? Math.round((workingTime / totalTime) * 100) : 0;

  return (
    <div className={`relative bg-card border border-border rounded-xl shadow-sm group transition-all hover:shadow-md hover:-translate-y-0.5 px-6 py-5 flex flex-col justify-between`}>
      <div>
        <div
          className="font-semibold text-base leading-snug mb-2 text-foreground"
          title={task.title}
        >
          {task.title}
        </div>
        {task.description && (
          <div className="text-base text-muted-foreground leading-relaxed mb-2 whitespace-pre-line break-words">
            {task.description}
          </div>
        )}
        
        {/* Working Time Highlight */}
        {workingTime > 0 && (
          <div className="flex items-center gap-3 mb-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-green-600 dark:text-green-400" />
              <span className="text-sm font-semibold text-green-700 dark:text-green-300">
                Worked: {formatDuration(workingTime)}
              </span>
            </div>
            {totalTime > 0 && (
              <span className="text-xs text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-800 px-2 py-1 rounded-full">
                {workingPercentage}% of total time
              </span>
            )}
          </div>
        )}

        {/* Completion Info for Done Tasks */}
        {task.status === 'DONE' && (
          <div className="flex items-center gap-3 mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 text-blue-600 dark:text-blue-400">✓</div>
              <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                Completed in {formatDuration(new Date(task.updatedAt).getTime() - new Date(task.createdAt).getTime())}
              </span>
            </div>
            <span className="text-xs text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-800 px-2 py-1 rounded-full">
              {new Date(task.updatedAt).toLocaleDateString()}
            </span>
          </div>
        )}

        {/* Pie Chart and Legend */}
        {pieData.length > 0 && (
          <div className="flex items-start gap-3">
            <PieChart data={pieData} size={50} />
            <div className="flex-1">
              <div className="text-xs text-muted-foreground mb-2 font-medium">Time Distribution</div>
              <div className="space-y-1">
                {pieData.slice(0, 3).map((item, index) => (
                  <div key={index} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-foreground">{item.label}</span>
                    </div>
                    <span className="text-muted-foreground font-mono">
                      {formatDuration(item.value)}
                    </span>
                  </div>
                ))}
                {pieData.length > 3 && (
                  <div className="text-xs text-muted-foreground italic">
                    +{pieData.length - 3} more statuses
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Live timer for currently working task */}
        {task.status === 'WORKING' && (
          <div className="text-xs text-green-600 dark:text-green-400 font-mono mt-2 font-semibold">
            {formatTime(elapsed)}
          </div>
        )}
      </div>
      
      <div className="flex items-center gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
        {task.status === 'WORKING' && (
          <Button size="icon" variant="ghost" onClick={() => onToggleTimer(task.id)}>
            <Pause className="h-4 w-4" />
          </Button>
        )}
        {task.status !== 'WORKING' && (
          <Button size="icon" variant="ghost" onClick={() => onToggleTimer(task.id)}>
            <Play className="h-4 w-4" />
          </Button>
        )}
        <Button size="icon" variant="ghost" onClick={() => onEdit(task.id)}>
          <Edit2 className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="ghost" onClick={() => onDelete(task.id)}>
          <Trash2 className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="ghost" onClick={() => onMove(task.id, 'left')}>
          <ArrowRight className="h-4 w-4 rotate-180" />
        </Button>
        <Button size="icon" variant="ghost" onClick={() => onMove(task.id, 'right')}>
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
} 