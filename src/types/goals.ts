export interface Goal {
  id: string;
  title: string;
  targetDate?: string;
  customDate?: boolean;
  why?: string;
  successCriteria?: string;
  createdAt: string;
  milestones: Milestone[];
}

export interface Milestone {
  id: string;
  goalId: string;
  title: string;
  status: 'not-started' | 'in-progress' | 'completed';
  tasks: Task[];
  order: number;
}

export interface Task {
  id: string;
  milestoneId: string;
  name: string;
  description?: string;
  status: 'not-started' | 'in-progress' | 'completed' | 'paused';
  timeSpent: number;
  createdAt: string;
  scheduledFor?: string;
}

export interface DailySession {
  id: string;
  date: string;
  goals: Goal[];
  todaysTasks: Task[];
  reflection?: string;
  totalTimeSpent: number;
  activeTaskId?: string;
} 