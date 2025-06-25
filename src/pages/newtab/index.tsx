import React from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from '../../components/ThemeProvider';
import { KanbanBoard } from '../../components/KanbanBoard';
import '../../index.css';

const NewTab: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      <KanbanBoard />
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(
  <ThemeProvider>
    <NewTab />
  </ThemeProvider>
); 