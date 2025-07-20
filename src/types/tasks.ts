export type TaskStatus = 'NEW' | 'UP_NEXT' | 'WORKING' | 'IN_PROGRESS' | 'BLOCKED' | 'DONE';

export interface TaskHistoryEntry {
  status: TaskStatus;
  enteredAt: string; // ISO date string
  exitedAt?: string; // ISO date string, undefined if still in this state
}

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
  startedAt?: string; // for current session timer
  totalWorkingTime?: number; // total accumulated working time in milliseconds
  priority?: number;
  history: TaskHistoryEntry[];
} 