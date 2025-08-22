export interface Activity {
  id: number;
  name: string;
  type: string;
  sport_type: string;
  distance: number; // meters
  moving_time: number; // seconds
  elapsed_time: number;
  start_date: string;
  start_date_local: string;
  average_speed: number; // m/s
  max_speed: number;
  average_heartrate?: number;
  max_heartrate?: number;
  total_elevation_gain: number;
}

export interface StandardDistance {
  distance: number; // meters
  name: string;
  category: 'running' | 'cycling';
}

export interface PersonalRecord {
  distance: StandardDistance;
  bestTime: number; // seconds
  bestPace: number; // seconds per km for running, km/h for cycling
  activityId: number;
  activityName: string;
  achievedDate: string;
  improvementFromPrevious?: number; // percentage improvement
  recentAttempts: AttemptRecord[];
  trendData: TrendPoint[];
}

export interface AttemptRecord {
  activityId: number;
  activityName: string;
  time: number; // seconds
  pace: number;
  date: string;
  isPersonalRecord: boolean;
  improvementPercentage?: number;
}

export interface TrendPoint {
  date: string;
  time: number; // seconds
  pace: number;
  activityId: number;
}

export interface PRAnalysis {
  personalRecords: PersonalRecord[];
  recentImprovements: PersonalRecord[];
  potentialPRs: PotentialPR[];
  summary: PRSummary;
}

export interface PotentialPR {
  distance: StandardDistance;
  estimatedTime: number; // seconds based on recent performance
  confidenceLevel: 'high' | 'medium' | 'low';
  basedOnDistance: number; // the distance this estimate is based on
}

export interface PRSummary {
  totalPRs: number;
  recentPRs: number; // PRs achieved in last 30 days
  improvingDistances: StandardDistance[];
  stagnantDistances: StandardDistance[];
  averageImprovement: number; // percentage
}

export const STANDARD_DISTANCES: StandardDistance[] = [
  // Running distances
  { distance: 1000, name: '1K', category: 'running' },
  { distance: 5000, name: '5K', category: 'running' },
  { distance: 10000, name: '10K', category: 'running' },
  { distance: 21097.5, name: 'Half Marathon', category: 'running' },
  { distance: 42195, name: 'Marathon', category: 'running' },
  
  // Cycling distances
  { distance: 10000, name: '10K', category: 'cycling' },
  { distance: 20000, name: '20K', category: 'cycling' },
  { distance: 40000, name: '40K', category: 'cycling' },
  { distance: 100000, name: '100K Century', category: 'cycling' },
  { distance: 160934, name: '100 Miles', category: 'cycling' },
];

export interface DistanceEffort {
  startIndex: number;
  endIndex: number;
  distance: number;
  time: number;
  averageSpeed: number;
}