export type TaskStatus = 'NEW' | 'UP_NEXT' | 'WORKING' | 'IN_PROGRESS' | 'BLOCKED' | 'DONE';

export interface TaskHistoryEntry {
  status: TaskStatus;
  enteredAt: string; // ISO date string
  exitedAt?: string; // ISO date string, undefined if still in this state
}

export interface Task {
  id: string;
  title: string;
  description?: string; // Optional description for the task
  tags?: string[]; // Free-form tags for the task
  taskType?: string; // Type of the task (e.g., "Bug", "Feature", "Task", etc.)
  status: TaskStatus;
  workspaceId: string; // which workspace/board this task belongs to
  createdAt: string;
  updatedAt: string;
  startedAt?: string; // for current session timer
  totalWorkingTime?: number; // total accumulated working time in milliseconds
  priority?: number;
  deadline?: string; // ISO date string for deadline
  history: TaskHistoryEntry[];
} 