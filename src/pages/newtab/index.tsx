import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Navigation } from '../../components/Navigation';
import { SettingsView } from '../../components/SettingsView';
import { HistoryView } from '../../components/HistoryView';
import { ThemeProvider } from '../../components/ThemeProvider';
import { GoalInput } from '../../components/GoalInput';
import '../../index.css';
import { storage } from '../../utils/storage';

const NewTab: React.FC = () => {
  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Run this once to clean up old data
  useEffect(() => {
    const cleanup = async () => {
      await storage.cleanStorage();
      // or use storage.cleanTasks() if you want to keep some other settings
    };
    cleanup();
  }, []);

  return (
    <>
      <div className="min-h-screen bg-background p-8">
        <div className="mx-auto max-w-2xl space-y-6">
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold">What's The Status</h1>
            <p className="mt-2 text-muted-foreground">
              Your daily companion
            </p>
          </div>
          <GoalInput />
        </div>
      </div>

      <Navigation
        onHistoryClick={() => setShowHistory(true)}
        onSettingsClick={() => setShowSettings(true)}
      />

      {showHistory && (
        <HistoryView
          onClose={() => setShowHistory(false)}
        />
      )}

      {showSettings && (
        <SettingsView
          onClose={() => setShowSettings(false)}
        />
      )}
    </>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(
  <ThemeProvider>
    <NewTab />
  </ThemeProvider>
); 