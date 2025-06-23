import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Plus } from 'lucide-react';
import { Goal } from '../types/goals';
import { motion } from 'framer-motion';

interface GoalInputProps {
  onGoalAdded: (goal: Goal) => void;
}

export function GoalInput({ onGoalAdded }: GoalInputProps) {
  const [newGoal, setNewGoal] = useState('');

  const handleAddGoal = () => {
    if (!newGoal.trim()) return;

    const goal: Goal = {
      id: crypto.randomUUID(),
      title: newGoal.trim(),
      createdAt: new Date().toISOString(),
      milestones: []
    };

    onGoalAdded(goal);
    setNewGoal('');
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />
        <div className="relative flex gap-2 bg-card p-1 rounded-lg">
          <Input
            value={newGoal}
            onChange={(e) => setNewGoal(e.target.value)}
            placeholder="Add a new deadline..."
            className="border-none text-lg bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/50"
            onKeyDown={(e) => e.key === 'Enter' && handleAddGoal()}
          />
          <Button 
            onClick={handleAddGoal}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg px-6 hover:opacity-90 transition-opacity"
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
} 