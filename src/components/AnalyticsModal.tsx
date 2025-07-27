import { X } from 'lucide-react';
import { BarChart as ReBarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart as RePieChart, Pie, Cell, Legend } from 'recharts';
import { Task } from '../types/tasks';

interface Workspace {
  id: string;
  name: string;
}

interface AnalyticsModalProps {
  open: boolean;
  onClose: () => void;
  tasks: Task[];
  workspaces: Workspace[];
}

// Helper function to get color intensity based on hours worked
function getContributionColor(hours: number): string {
  if (hours === 0) return '#ebedf0'; // No work
  if (hours < 0.5) return '#9be9a8'; // Light green (< 30 min)
  if (hours < 2) return '#40c463'; // Medium green (30 min - 2 hours)
  if (hours < 4) return '#30a14e'; // Dark green (2-4 hours)
  return '#216e39'; // Very dark green (4+ hours)
}

// Helper function to format hours
function formatHours(hours: number): string {
  if (hours === 0) return '0h';
  if (hours < 1) return '<1h';
  return `${Math.round(hours)}h`;
}

export function AnalyticsModal({ open, onClose, tasks, workspaces }: AnalyticsModalProps) {
  if (!open) return null;

  // Calculate daily work activity from task history
  const dailyWorkHours: Record<string, number> = {};
  
  tasks.forEach(task => {
    // Use totalWorkingTime if available (more accurate)
    if (task.totalWorkingTime && task.totalWorkingTime > 0) {
      const hours = task.totalWorkingTime / (1000 * 60 * 60);
      const createdDate = new Date(task.createdAt);
      const dateKey = createdDate.toISOString().split('T')[0];
      
      if (!dailyWorkHours[dateKey]) {
        dailyWorkHours[dateKey] = 0;
      }
      dailyWorkHours[dateKey] += hours;
    } else {
      // Fallback to history entries
      (task.history || []).forEach(entry => {
        if (entry.exitedAt) { // Only count completed time periods
          const start = new Date(entry.enteredAt);
          const end = new Date(entry.exitedAt);
          const duration = Math.max(0, end.getTime() - start.getTime());
          const hours = duration / (1000 * 60 * 60);
          
          // Get the date key (YYYY-MM-DD)
          const dateKey = start.toISOString().split('T')[0];
          
          if (!dailyWorkHours[dateKey]) {
            dailyWorkHours[dateKey] = 0;
          }
          dailyWorkHours[dateKey] += hours;
        }
      });
    }
  });

  // Generate calendar data for the last 365 days
  const calendarData: Array<{ date: string; hours: number; color: string }> = [];
  const today = new Date();
  
  for (let i = 364; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateKey = date.toISOString().split('T')[0];
    const hours = dailyWorkHours[dateKey] || 0;
    
    calendarData.push({
      date: dateKey,
      hours,
      color: getContributionColor(hours)
    });
  }

  // Calculate average hours per day
  const totalHours = Object.values(dailyWorkHours).reduce((sum, hours) => sum + hours, 0);
  const activeDays = Object.values(dailyWorkHours).filter(hours => hours > 0).length;
  const averageHoursPerDay = activeDays > 0 ? totalHours / activeDays : 0;
  const averageHoursPerWeek = averageHoursPerDay * 7;

  // Debug logging
  console.log('Daily work hours:', dailyWorkHours);
  console.log('Total hours:', totalHours);
  console.log('Active days:', activeDays);
  console.log('Average per day:', averageHoursPerDay);

  // Group calendar data by weeks for display
  const weeks: Array<Array<{ date: string; hours: number; color: string }>> = [];
  for (let i = 0; i < calendarData.length; i += 7) {
    weeks.push(calendarData.slice(i, i + 7));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="relative w-full h-full max-w-full max-h-full bg-background border border-border rounded-none shadow-xl flex flex-col">
        <button
          className="absolute top-6 right-8 text-muted-foreground hover:text-foreground transition-colors z-10"
          onClick={onClose}
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

          {/* Work Activity Calendar */}
          <div className="w-full max-w-4xl bg-card rounded-xl p-6 shadow flex flex-col items-center">
            <div className="text-lg font-semibold mb-4">Work Activity (Last 365 Days)</div>
            <div className="flex items-center gap-4 mb-6">
              <span className="text-sm text-muted-foreground">Less</span>
              <div className="flex gap-1">
                <div className="w-3 h-3 rounded-sm bg-[#ebedf0]" title="0 hours"></div>
                <div className="w-3 h-3 rounded-sm bg-[#9be9a8]" title="< 30 min"></div>
                <div className="w-3 h-3 rounded-sm bg-[#40c463]" title="30 min - 2 hours"></div>
                <div className="w-3 h-3 rounded-sm bg-[#30a14e]" title="2-4 hours"></div>
                <div className="w-3 h-3 rounded-sm bg-[#216e39]" title="4+ hours"></div>
              </div>
              <span className="text-sm text-muted-foreground">More</span>
            </div>
            
            <div className="flex gap-1 overflow-x-auto pb-4">
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="flex flex-col gap-1">
                  {week.map((day, dayIndex) => (
                    <div
                      key={dayIndex}
                      className="w-3 h-3 rounded-sm border border-border/20 cursor-pointer hover:scale-125 transition-transform"
                      style={{ backgroundColor: day.color }}
                      title={`${day.date}: ${formatHours(day.hours)}`}
                    />
                  ))}
                </div>
              ))}
            </div>
            
            <div className="flex items-center gap-8 mt-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Active days:</span>
                <span className="font-semibold text-foreground">{activeDays}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Avg per active day:</span>
                <span className="font-semibold text-foreground">{averageHoursPerDay.toFixed(1)}h</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Avg per week:</span>
                <span className="font-semibold text-foreground">{averageHoursPerWeek.toFixed(1)}h</span>
              </div>
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
  );
} 