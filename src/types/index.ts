export type Status = 'not-started' | 'now-working' | 'in-progress' | 'blocked' | 'completed';

export interface Project {
  id: string;
  name: string;
  description: string;
  category?: string;
  status: Status;
  progress?: number;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
}

export interface TimerState {
  isRunning: boolean;
  taskId?: string;
  startTime?: number;
  elapsedTime: number;
} 