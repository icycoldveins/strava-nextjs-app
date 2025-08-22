import { Goal, GoalProgress, GoalPeriod } from './types/goals';

const STORAGE_KEY = 'strava_goals';

export function getGoals(): Goal[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}

export function createGoal(goalData: {
  name: string;
  type: Goal['type'];
  target: number;
  period: GoalPeriod;
  activityTypes?: string[];
  customStartDate?: string;
  customEndDate?: string;
}): Goal {
  const { startDate, endDate } = getGoalDateRange(
    goalData.period,
    goalData.customStartDate,
    goalData.customEndDate
  );

  const newGoal: Goal = {
    id: `goal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: goalData.name,
    type: goalData.type,
    target: goalData.target,
    period: goalData.period,
    startDate,
    endDate,
    createdAt: new Date().toISOString(),
    activityTypes: goalData.activityTypes,
  };

  const goals = getGoals();
  goals.push(newGoal);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(goals));

  return newGoal;
}

export function updateGoal(id: string, updates: Partial<Goal>): Goal | null {
  const goals = getGoals();
  const index = goals.findIndex(g => g.id === id);
  
  if (index === -1) return null;

  const updatedGoal = { ...goals[index], ...updates };
  goals[index] = updatedGoal;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(goals));

  return updatedGoal;
}

export function deleteGoal(id: string): boolean {
  const goals = getGoals();
  const filtered = goals.filter(g => g.id !== id);
  
  if (filtered.length === goals.length) return false;
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  return true;
}

export function getGoalDateRange(
  period: GoalPeriod,
  customStartDate?: string,
  customEndDate?: string
): { startDate: string; endDate: string } {
  const now = new Date();
  let startDate: Date;
  let endDate: Date;

  switch (period) {
    case 'weekly':
      // Start from Monday of current week
      startDate = new Date(now);
      const day = startDate.getDay();
      const diff = startDate.getDate() - day + (day === 0 ? -6 : 1);
      startDate.setDate(diff);
      startDate.setHours(0, 0, 0, 0);
      
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      break;

    case 'monthly':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      break;

    case 'yearly':
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now.getFullYear(), 11, 31);
      break;

    case 'custom':
      if (!customStartDate || !customEndDate) {
        throw new Error('Custom date range requires start and end dates');
      }
      return { startDate: customStartDate, endDate: customEndDate };

    default:
      throw new Error(`Unknown period: ${period}`);
  }

  // Format dates as YYYY-MM-DD in local timezone
  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return {
    startDate: formatDate(startDate),
    endDate: formatDate(endDate),
  };
}

export function calculateGoalProgress(
  goal: Goal,
  activities: any[]
): GoalProgress {
  // Filter activities within the goal date range
  const startTime = new Date(goal.startDate).getTime();
  const endTime = new Date(goal.endDate).setHours(23, 59, 59, 999);

  const relevantActivities = activities.filter(activity => {
    const activityTime = new Date(activity.start_date || activity.start_date_local).getTime();
    
    // Check date range
    if (activityTime < startTime || activityTime > endTime) {
      return false;
    }

    // Check activity type if specified
    if (goal.activityTypes && goal.activityTypes.length > 0) {
      return goal.activityTypes.includes(activity.type);
    }

    return true;
  });

  let current = 0;

  switch (goal.type) {
    case 'distance':
      current = relevantActivities.reduce((sum, act) => sum + (act.distance || 0), 0);
      break;

    case 'time':
      current = relevantActivities.reduce((sum, act) => sum + (act.moving_time || 0), 0);
      break;

    case 'elevation':
      current = relevantActivities.reduce((sum, act) => sum + (act.total_elevation_gain || 0), 0);
      break;
  }

  const percentage = Math.min(100, Math.round((current / goal.target) * 100));
  const remaining = Math.max(0, goal.target - current);

  return {
    goalId: goal.id,
    current,
    target: goal.target,
    percentage,
    remaining,
    isCompleted: percentage >= 100,
    lastUpdated: new Date().toISOString(),
  };
}

// Format helpers for display
export function formatGoalValue(value: number, type: Goal['type'], unit: 'metric' | 'imperial' = 'metric'): string {
  switch (type) {
    case 'distance':
      if (unit === 'metric') {
        return value >= 1000 ? `${(value / 1000).toFixed(1)}km` : `${value}m`;
      } else {
        const miles = value * 0.000621371;
        return `${miles.toFixed(1)}mi`;
      }

    case 'time':
      const hours = Math.floor(value / 3600);
      const minutes = Math.floor((value % 3600) / 60);
      const seconds = value % 60;

      if (hours > 0) {
        return `${hours}h ${minutes}m`;
      } else if (minutes > 0) {
        return `${minutes}m ${seconds}s`;
      } else {
        return `${seconds}s`;
      }

    case 'elevation':
      if (unit === 'metric') {
        return `${value}m`;
      } else {
        const feet = value * 3.28084;
        return `${Math.round(feet)}ft`;
      }

    default:
      return value.toString();
  }
}