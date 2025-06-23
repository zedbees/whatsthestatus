import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Navigation } from '../../components/Navigation';
import { SettingsView } from '../../components/SettingsView';
import { HistoryView } from '../../components/HistoryView';
import { ThemeProvider } from '../../components/ThemeProvider';
import { GoalInput } from '../../components/GoalInput';
import { GoalCard } from '../../components/GoalCard';
import { storage } from '../../utils/storage';
import { type Goal } from '../../types/goals';
import '../../index.css';

const NewTab: React.FC = () => {
  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [goals, setGoals] = useState<Goal[]>([]);

  useEffect(() => {
    const loadGoals = async () => {
      const savedGoals = await storage.getGoals();
      setGoals(savedGoals);
    };
    loadGoals();
  }, []);

  const handleAddGoal = async (goal: Goal) => {
    const updatedGoals = [...goals, goal];
    setGoals(updatedGoals);
    await storage.saveGoals(updatedGoals);
  };

  const handleDeleteGoal = async (goalId: string) => {
    const updatedGoals = goals.filter(goal => goal.id !== goalId);
    setGoals(updatedGoals);
    await storage.saveGoals(updatedGoals);
  };

  return (
    <>
      <div className="min-h-screen bg-background p-8">
        <div className="mx-auto max-w-3xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
              What's The Status
            </h1>
          </div>

          {/* Main Content */}
          <div className="space-y-6">
            <GoalInput onGoalAdded={handleAddGoal} />
            
            {/* Goals List */}
            <div className="space-y-4">
              {goals.map((goal) => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  onDelete={handleDeleteGoal}
                />
              ))}
            </div>
          </div>
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