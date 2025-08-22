"use client";

import { useState, useEffect } from "react";
import { Goal, GoalProgress } from "@/lib/types/goals";
import { getGoals, deleteGoal, calculateGoalProgress } from "@/lib/goals";
import { GoalCard } from "./GoalCard";
import { CreateGoalModal } from "./CreateGoalModal";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Target, TrendingUp, Calendar, Award } from "lucide-react";

interface GoalTrackerProps {
  activities: any[];
  measurementPref: 'metric' | 'imperial';
}

export function GoalTracker({ activities, measurementPref }: GoalTrackerProps) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [goalProgress, setGoalProgress] = useState<{ [goalId: string]: GoalProgress }>({});
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [loading, setLoading] = useState(true);

  const loadGoals = () => {
    try {
      const savedGoals = getGoals();
      setGoals(savedGoals);
      
      // Calculate progress for each goal
      const progressMap: { [goalId: string]: GoalProgress } = {};
      savedGoals.forEach(goal => {
        progressMap[goal.id] = calculateGoalProgress(goal, activities);
      });
      setGoalProgress(progressMap);
    } catch (error) {
      console.error('Error loading goals:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGoals();
  }, [activities]);

  const handleCreateGoal = () => {
    setEditingGoal(null);
    setIsCreateModalOpen(true);
  };

  const handleEditGoal = (goal: Goal) => {
    setEditingGoal(goal);
    setIsCreateModalOpen(true);
  };

  const handleDeleteGoal = async (goalId: string) => {
    try {
      const success = deleteGoal(goalId);
      if (success) {
        loadGoals(); // Reload goals after deletion
      }
    } catch (error) {
      console.error('Error deleting goal:', error);
    }
  };

  const handleGoalCreated = () => {
    loadGoals(); // Reload goals after creation/update
  };

  const handleCloseModal = () => {
    setIsCreateModalOpen(false);
    setEditingGoal(null);
  };

  const completedGoals = goals.filter(goal => goalProgress[goal.id]?.isCompleted).length;
  const totalGoals = goals.length;
  const averageProgress = totalGoals > 0 
    ? Math.round(Object.values(goalProgress).reduce((sum, progress) => sum + progress.percentage, 0) / totalGoals)
    : 0;

  if (loading) {
    return (
      <Card className="border-0 shadow-lg bg-white/90 dark:bg-gray-800/90 backdrop-blur">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <div className="h-6 w-6 bg-gray-200 rounded animate-pulse" />
            <div className="h-6 bg-gray-200 rounded w-32 animate-pulse" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 bg-gray-200 rounded-lg animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Goals Overview */}
      <Card className="border-0 shadow-lg bg-white/90 dark:bg-gray-800/90 backdrop-blur">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl">
                <Target className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl">Goal Tracker</CardTitle>
                <CardDescription>Track your fitness goals and progress</CardDescription>
              </div>
            </div>
            <Button 
              onClick={handleCreateGoal}
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Goal
            </Button>
          </div>
        </CardHeader>
        
        {totalGoals > 0 && (
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-blue-50 to-transparent dark:from-blue-900/20 dark:to-transparent rounded-lg">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <Calendar className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active Goals</p>
                  <p className="text-lg font-semibold">{totalGoals}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-green-50 to-transparent dark:from-green-900/20 dark:to-transparent rounded-lg">
                <div className="p-2 bg-green-500 rounded-lg">
                  <Award className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-lg font-semibold">{completedGoals}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-orange-50 to-transparent dark:from-orange-900/20 dark:to-transparent rounded-lg">
                <div className="p-2 bg-orange-500 rounded-lg">
                  <TrendingUp className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avg Progress</p>
                  <p className="text-lg font-semibold">{averageProgress}%</p>
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Goals Grid */}
      {totalGoals > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {goals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              progress={goalProgress[goal.id] || {
                goalId: goal.id,
                current: 0,
                target: goal.target,
                percentage: 0,
                remaining: goal.target,
                isCompleted: false,
                lastUpdated: new Date().toISOString()
              }}
              measurementPref={measurementPref}
              onEdit={handleEditGoal}
              onDelete={handleDeleteGoal}
            />
          ))}
        </div>
      ) : (
        <Card className="border-0 shadow-lg bg-white/90 dark:bg-gray-800/90 backdrop-blur">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="p-4 bg-gradient-to-br from-orange-100 to-orange-50 dark:from-orange-900/20 dark:to-orange-800/10 rounded-full mb-4">
              <Target className="h-12 w-12 text-orange-500" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No Goals Yet</h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              Set your first fitness goal to start tracking your progress. Whether it's running distance, 
              workout time, or elevation gain - we'll help you stay motivated!
            </p>
            <Button 
              onClick={handleCreateGoal}
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Goal
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Goal Modal */}
      <CreateGoalModal
        isOpen={isCreateModalOpen}
        onClose={handleCloseModal}
        onGoalCreated={handleGoalCreated}
        editingGoal={editingGoal}
        measurementPref={measurementPref}
      />
    </div>
  );
}