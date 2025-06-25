import { useState } from 'react';
import { Task, TaskStatus } from '../types/tasks';
import { KanbanColumn } from './KanbanColumn';
import { DoneColumn } from './DoneColumn';
import { FloatingAddButton } from './FloatingAddButton';

const STATUS_ORDER: TaskStatus[] = ['NEW', 'UP_NEXT', 'WORKING', 'BLOCKED'];
const STATUS_LABELS: Record<TaskStatus, string> = {
  NEW: 'New Item',
  UP_NEXT: 'Up Next',
  WORKING: 'Currently Working',
  BLOCKED: 'Blocked',
  DONE: 'Done',
};

const DEMO_TASKS: Task[] = [
  {
    id: '1',
    title: 'Design Kanban UI',
    status: 'NEW',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'Implement Timer Logic',
    status: 'WORKING',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    startedAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(), // 12 min ago
  },
  {
    id: '3',
    title: 'Write Documentation',
    status: 'UP_NEXT',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '4',
    title: 'Fix Chrome Storage Bug',
    status: 'BLOCKED',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '5',
    title: 'Polish UI',
    status: 'DONE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export function KanbanBoard() {
  const [tasks, setTasks] = useState<Task[]>(DEMO_TASKS);

  const addTask = (status: TaskStatus) => {
    const title = prompt('Task title?');
    if (!title) return;
    setTasks([
      ...tasks,
      {
        id: crypto.randomUUID(),
        title,
        status,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]);
  };

  const deleteTask = (id: string) => setTasks(tasks.filter(t => t.id !== id));
  const editTask = (id: string) => {
    const title = prompt('Edit task title?');
    if (!title) return;
    setTasks(tasks.map(t => t.id === id ? { ...t, title, updatedAt: new Date().toISOString() } : t));
  };
  const moveTask = (id: string, direction: 'left' | 'right') => {
    setTasks(tasks => tasks.map(t => {
      if (t.id !== id) return t;
      const idx = STATUS_ORDER.indexOf(t.status as TaskStatus);
      const newIdx = direction === 'left' ? Math.max(0, idx - 1) : Math.min(STATUS_ORDER.length - 1, idx + 1);
      return { ...t, status: STATUS_ORDER[newIdx], updatedAt: new Date().toISOString() };
    }));
  };
  const toggleTimer = (id: string) => {
    setTasks(tasks => tasks.map(t => {
      if (t.id !== id) return t;
      if (t.status !== 'WORKING') {
        return { ...t, status: 'WORKING', startedAt: new Date().toISOString() };
      } else {
        return { ...t, status: 'UP_NEXT', startedAt: undefined };
      }
    }));
  };

  return (
    <div className="flex gap-4 overflow-x-auto p-4 min-h-[70vh]">
      {STATUS_ORDER.map(status => (
        <KanbanColumn
          key={status}
          title={STATUS_LABELS[status]}
          status={status}
          tasks={tasks.filter(t => t.status === status)}
          onAdd={addTask}
          onDelete={deleteTask}
          onEdit={editTask}
          onMove={moveTask}
          onToggleTimer={toggleTimer}
        />
      ))}
      <DoneColumn
        tasks={tasks.filter(t => t.status === 'DONE')}
        onDelete={deleteTask}
        onEdit={editTask}
        onMove={moveTask}
        onToggleTimer={toggleTimer}
      />
      <FloatingAddButton onClick={() => addTask('NEW')} />
    </div>
  );
} 