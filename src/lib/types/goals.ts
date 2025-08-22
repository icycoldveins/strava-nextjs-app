export type GoalType = 'distance' | 'time' | 'elevation';
export type GoalPeriod = 'weekly' | 'monthly' | 'yearly' | 'custom';

export interface Goal {
  id: string;
  name: string;
  type: GoalType;
  target: number; // meters for distance/elevation, seconds for time
  period: GoalPeriod;
  startDate: string;
  endDate: string;
  createdAt: string;
  activityTypes?: string[]; // Optional: filter by activity types (Run, Ride, etc.)
}

export interface GoalProgress {
  goalId: string;
  current: number;
  target: number;
  percentage: number;
  remaining: number;
  isCompleted: boolean;
  lastUpdated: string;
}