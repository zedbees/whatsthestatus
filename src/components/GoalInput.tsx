import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Plus, Sparkles, Edit2, X, Check, Calendar as CalendarIcon } from 'lucide-react';
import { storage } from '../utils/storage';
import { Goal } from '../types/goals';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "./ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Calendar } from "./ui/calendar";
import { format } from "date-fns";
import { QuarterYearPicker } from './QuarterYearPicker';

export function GoalInput() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [newGoal, setNewGoal] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);

  useEffect(() => {
    const loadGoals = async () => {
      const savedGoals = await storage.getGoals();
      setGoals(savedGoals);
    };
    loadGoals();
  }, []);

  const handleAddGoal = async () => {
    if (!newGoal.trim()) return;

    const goal: Goal = {
      id: crypto.randomUUID(),
      title: newGoal.trim(),
      createdAt: new Date().toISOString(),
      milestones: []
    };

    const updatedGoals = [...goals, goal];
    setGoals(updatedGoals);
    await storage.saveGoals(updatedGoals);
    setNewGoal('');
  };

  const handleUpdateGoal = async (goalId: string, updates: Partial<Goal>) => {
    const updatedGoals = goals.map(goal => 
      goal.id === goalId ? { ...goal, ...updates } : goal
    );
    setGoals(updatedGoals);
    await storage.saveGoals(updatedGoals);
  };

  const startEditing = (goal: Goal) => {
    setEditingId(goal.id);
    setEditText(goal.title);
  };

  const handleEditSave = async (goalId: string) => {
    if (!editText.trim()) return;
    await handleUpdateGoal(goalId, { title: editText.trim() });
    setEditingId(null);
    setEditText('');
  };

  const generateInitialTimeframes = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentQuarter = Math.floor(now.getMonth() / 3) + 1;
    const timeframes = [];

    // Add "This Year" option
    timeframes.push({
      value: `${currentYear}`,
      label: 'This Year',
      timestamp: new Date(currentYear, 11, 31).getTime()
    });

    // Add remaining quarters for current year
    for (let quarter = currentQuarter + 1; quarter <= 4; quarter++) {
      timeframes.push({
        value: `Q${quarter}-${currentYear}`,
        label: `Q${quarter}`,
        timestamp: new Date(currentYear, quarter * 3 - 1).getTime()
      });
    }

    // Add "Custom" option
    timeframes.push({
      value: 'custom',
      label: 'Custom →',
      timestamp: Infinity
    });

    return timeframes;
  };

  const formatTargetDate = (goal: Goal) => {
    if (!goal.targetDate) return null;
    
    if (goal.customDate) {
      return format(new Date(goal.targetDate), 'MMM d, yyyy');
    }
    
    const timeframe = timeframes.find(t => t.value === goal.targetDate);
    return timeframe?.label;
  };

  const handleTimeframeSelect = (value: string) => {
    if (selectedGoalId) {
      if (value.startsWith('Q')) {
        // Handle quarter selection
        handleUpdateGoal(selectedGoalId, { 
          targetDate: value,
          customDate: false 
        });
      } else {
        // Handle specific date selection
        handleUpdateGoal(selectedGoalId, { 
          targetDate: value,
          customDate: true 
        });
      }
      setShowDatePicker(false);
      setSelectedGoalId(null);
    }
  };

  const timeframes = generateInitialTimeframes();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div className="text-center space-y-3">
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 text-white px-4 py-1.5 rounded-full text-sm font-medium"
        >
          <Sparkles className="h-4 w-4" />
          Dream Big, Achieve Bigger
        </motion.div>
        <h2 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
          What do you want to achieve?
        </h2>
        <p className="text-muted-foreground text-lg">
          Let's turn your dreams into reality, one goal at a time
        </p>
      </div>

      <div className="max-w-xl mx-auto">
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />
          <div className="relative flex gap-2 bg-card p-1 rounded-lg">
            <Input
              value={newGoal}
              onChange={(e) => setNewGoal(e.target.value)}
              placeholder="Enter something amazing..."
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
      </div>

      <AnimatePresence mode="popLayout">
        {goals.length > 0 && (
          <motion.div 
            className="space-y-3 max-w-xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {goals.map((goal, index) => (
              <motion.div
                key={goal.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.1 }}
                className="group relative"
              >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl blur opacity-25 group-hover:opacity-75 transition duration-300" />
                <div className="relative p-4 bg-card rounded-lg border border-purple-100 dark:border-purple-900/50 hover:border-purple-300 dark:hover:border-purple-700 transition-colors">
                  {editingId === goal.id ? (
                    <div className="flex gap-2">
                      <Input
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="flex-1 border-none text-lg bg-transparent focus-visible:ring-0"
                        onKeyDown={(e) => e.key === 'Enter' && handleEditSave(goal.id)}
                        autoFocus
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleEditSave(goal.id)}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setEditingId(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <p className="text-lg font-medium">{goal.title}</p>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => startEditing(goal)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Select
                          value={goal.targetDate}
                          onValueChange={(value) => {
                            if (value === 'custom') {
                              setSelectedGoalId(goal.id);
                              setShowDatePicker(true);
                            } else {
                              handleTimeframeSelect(value);
                            }
                          }}
                        >
                          <SelectTrigger className="w-[110px] h-8">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                            >
                              <CalendarIcon className="h-4 w-4" />
                            </Button>
                          </SelectTrigger>
                          <SelectContent>
                            {timeframes.map((timeframe) => (
                              <SelectItem 
                                key={timeframe.value} 
                                value={timeframe.value}
                                className={timeframe.value === 'custom' ? 'text-primary' : ''}
                              >
                                {timeframe.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                  {goal.targetDate && (
                    <div className="mt-2 text-sm text-muted-foreground">
                      Target: {formatTargetDate(goal)}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom Date Picker Dialog */}
      <Dialog open={showDatePicker} onOpenChange={setShowDatePicker}>
        <DialogContent className="relative sm:max-w-[400px] gap-0 bg-card border border-purple-100 dark:border-purple-900/50">
          <DialogHeader>
            <DialogTitle className="text-center">Choose Target Date</DialogTitle>
          </DialogHeader>
          <QuarterYearPicker
            onSelect={handleTimeframeSelect}
            selectedValue={selectedGoalId ? 
              goals.find(g => g.id === selectedGoalId)?.targetDate : 
              undefined
            }
          />
          <div className="p-4">
            <Calendar
              mode="single"
              selected={selectedGoalId && goals.find(g => g.id === selectedGoalId)?.customDate ? 
                new Date(goals.find(g => g.id === selectedGoalId)!.targetDate!) : 
                undefined
              }
              onSelect={(date) => date && handleTimeframeSelect(format(date, 'yyyy-MM-dd'))}
              initialFocus
              disabled={{ before: new Date() }}
              className="rounded-md border shadow-sm"
            />
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
} 