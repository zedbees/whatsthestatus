export type TaskStatus = 'NEW' | 'UP_NEXT' | 'WORKING' | 'BLOCKED' | 'DONE';

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
  startedAt?: string; // for timer
  priority?: number;
} 