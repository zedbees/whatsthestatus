import { useState } from 'react';
import { type Goal } from '../types/goals';
import { Button } from './ui/button';
import { ChevronDown, ChevronUp, CalendarIcon, Trash2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'framer-motion';

interface GoalCardProps {
  goal: Goal;
  onDelete?: (goalId: string) => void;
}

export function GoalCard({ goal, onDelete }: GoalCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getStatusColor = (deadline: string | undefined) => {
    if (!deadline) return 'bg-muted';
    
    const today = new Date();
    const deadlineDate = deadline.startsWith('Q') 
      ? new Date(parseInt(deadline.split('-')[1]), (parseInt(deadline[1]) * 3), 0)
      : new Date(deadline);
    
    const daysUntil = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntil < 0) return 'bg-red-500';
    if (daysUntil <= 7) return 'bg-yellow-500';
    if (daysUntil <= 30) return 'bg-blue-500';
    return 'bg-green-500';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative"
    >
      <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl blur opacity-25 group-hover:opacity-75 transition duration-300" />
      <div className="relative bg-card border border-purple-100 dark:border-purple-900/50 hover:border-purple-300 dark:hover:border-purple-700 rounded-lg transition-colors">
        {/* Header Section */}
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  getStatusColor(goal.targetDate)
                )} />
                <h3 className="text-lg font-medium">{goal.title}</h3>
              </div>
              {goal.targetDate && (
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  Deadline: {goal.targetDate}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete?.(goal.id)}
                className="h-8 w-8 text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-8 w-8"
              >
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Expanded Content */}
        <div className={cn(
          "overflow-hidden transition-all duration-200",
          isExpanded ? "max-h-[2000px] border-t" : "max-h-0"
        )}>
          <div className="p-4 space-y-4">
            {/* Progress Section */}
            {goal.milestones.length > 0 && (
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="text-muted-foreground">
                    {goal.milestones.filter(m => m.status === 'completed').length}/
                    {goal.milestones.length} milestones
                  </span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                    style={{ 
                      width: `${(goal.milestones.filter(m => m.status === 'completed').length / 
                        goal.milestones.length) * 100}%` 
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
} 