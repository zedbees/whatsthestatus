export type TaskStatus = 'NEW' | 'UP_NEXT' | 'WORKING' | 'IN_PROGRESS' | 'BLOCKED' | 'DONE';

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
  startedAt?: string; // for timer
  priority?: number;
} 