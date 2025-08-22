"use client";

import { useState } from "react";
import { Goal, GoalProgress } from "@/lib/types/goals";
import { formatGoalValue } from "@/lib/goals";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2, Target, MapPin, Calendar, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface GoalCardProps {
  goal: Goal;
  progress: GoalProgress;
  measurementPref: 'metric' | 'imperial';
  onEdit: (goal: Goal) => void;
  onDelete: (goalId: string) => void;
}

const getGoalTypeIcon = (type: Goal['type']) => {
  switch (type) {
    case 'distance':
      return <MapPin className="h-4 w-4" />;
    case 'time':
      return <Calendar className="h-4 w-4" />;
    case 'elevation':
      return <TrendingUp className="h-4 w-4" />;
    default:
      return <Target className="h-4 w-4" />;
  }
};

const getGoalTypeColor = (type: Goal['type']) => {
  switch (type) {
    case 'distance':
      return 'text-blue-500';
    case 'time':
      return 'text-purple-500';
    case 'elevation':
      return 'text-yellow-500';
    default:
      return 'text-gray-500';
  }
};

export function GoalCard({ goal, progress, measurementPref, onEdit, onDelete }: GoalCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  
  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(goal.id);
    } finally {
      setIsDeleting(false);
    }
  };

  const formatPeriod = (period: Goal['period']) => {
    switch (period) {
      case 'weekly':
        return 'This Week';
      case 'monthly':
        return 'This Month';
      case 'yearly':
        return 'This Year';
      case 'custom':
        return 'Custom Period';
      default:
        return period;
    }
  };

  return (
    <Card className={cn(
      "border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white/90 dark:bg-gray-800/90 backdrop-blur group",
      progress.isCompleted && "ring-2 ring-green-500/50 bg-gradient-to-br from-green-50/80 to-white/90 dark:from-green-900/20 dark:to-gray-800/90"
    )}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center space-x-2">
          <div className={cn("p-2 rounded-lg bg-white dark:bg-gray-700 shadow-sm", getGoalTypeColor(goal.type))}>
            {getGoalTypeIcon(goal.type)}
          </div>
          <div>
            <CardTitle className="text-base font-semibold">{goal.name}</CardTitle>
            <p className="text-xs text-muted-foreground capitalize">
              {goal.type} • {formatPeriod(goal.period)}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onEdit(goal)}
            className="h-8 w-8 p-0 hover:bg-orange-100 dark:hover:bg-orange-900/20"
          >
            <Edit2 className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleDelete}
            disabled={isDeleting}
            className="h-8 w-8 p-0 hover:bg-red-100 dark:hover:bg-red-900/20 text-red-500"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="font-medium">
              {formatGoalValue(progress.current, goal.type, measurementPref)}
            </span>
            <span className="text-muted-foreground">
              {formatGoalValue(progress.target, goal.type, measurementPref)}
            </span>
          </div>
          
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
            <div 
              className={cn(
                "h-2.5 rounded-full transition-all duration-700 ease-out",
                progress.isCompleted 
                  ? "bg-gradient-to-r from-green-500 to-green-600" 
                  : "bg-gradient-to-r from-orange-500 to-orange-600"
              )}
              style={{ 
                width: `${Math.min(progress.percentage, 100)}%`,
                transform: progress.isCompleted ? 'scale(1.02)' : 'scale(1)'
              }}
            />
          </div>
          
          <div className="flex justify-between items-center text-xs text-muted-foreground">
            <span>{progress.percentage}% complete</span>
            {!progress.isCompleted && (
              <span>
                {formatGoalValue(progress.remaining, goal.type, measurementPref)} remaining
              </span>
            )}
          </div>
        </div>

        {/* Completion Status */}
        {progress.isCompleted && (
          <div className="flex items-center justify-center space-x-2 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded-lg py-2 animate-pulse">
            <span className="text-lg">🎉</span>
            <span className="text-sm font-semibold">Goal Completed!</span>
          </div>
        )}

        {/* Activity Types Filter */}
        {goal.activityTypes && goal.activityTypes.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {goal.activityTypes.map((type) => (
              <span 
                key={type}
                className="text-xs px-2 py-1 bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 rounded-full"
              >
                {type}
              </span>
            ))}
          </div>
        )}

        {/* Date Range */}
        <div className="text-xs text-muted-foreground">
          {new Date(goal.startDate).toLocaleDateString()} - {new Date(goal.endDate).toLocaleDateString()}
        </div>
      </CardContent>
    </Card>
  );
}