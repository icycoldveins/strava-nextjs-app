// Friend Performance Comparison Types

export interface Friend {
  id: number;
  username: string;
  firstname: string;
  lastname: string;
  profile: string;
  profile_medium: string;
  city?: string;
  state?: string;
  country?: string;
  sex?: 'M' | 'F';
  premium: boolean;
  created_at: string;
  updated_at: string;
}

export interface FriendActivity {
  id: number;
  name: string;
  type: string;
  sport_type: string;
  distance: number; // meters
  moving_time: number; // seconds
  elapsed_time: number;
  total_elevation_gain: number;
  start_date: string;
  start_date_local: string;
  average_speed: number;
  max_speed: number;
  average_heartrate?: number;
  max_heartrate?: number;
  average_watts?: number;
  kilojoules?: number;
  calories?: number;
  achievement_count: number;
  kudos_count: number;
  comment_count?: number;
  athlete: {
    id: number;
    firstname: string;
    lastname: string;
  };
}

export interface LeaderboardEntry {
  friend: Friend;
  stats: {
    totalDistance: number; // meters
    totalTime: number; // seconds
    totalElevation: number;
    activityCount: number;
    averageSpeed: number;
    totalCalories: number;
    averagePower?: number;
    averageHeartRate?: number;
  };
  rank: number;
  percentile: number;
}

export interface HeadToHeadComparison {
  friend1: Friend;
  friend2: Friend;
  period: TimePeriod;
  comparison: {
    distance: {
      friend1: number;
      friend2: number;
      winner: number;
      difference: number;
      percentDifference: number;
    };
    time: {
      friend1: number;
      friend2: number;
      winner: number;
      difference: number;
      percentDifference: number;
    };
    elevation: {
      friend1: number;
      friend2: number;
      winner: number;
      difference: number;
      percentDifference: number;
    };
    activities: {
      friend1: number;
      friend2: number;
      winner: number;
      difference: number;
    };
    avgSpeed: {
      friend1: number;
      friend2: number;
      winner: number;
      difference: number;
      percentDifference: number;
    };
  };
  overallWinner: number;
  winScore: {
    friend1: number;
    friend2: number;
  };
}

export interface FriendComparison {
  leaderboard: LeaderboardEntry[];
  headToHead?: HeadToHeadComparison;
  period: TimePeriod;
  activityType: ActivityType;
  lastUpdated: string;
}

export interface ActivityTypeFilter {
  value: string;
  label: string;
  icon?: string;
}

export interface ComparisonMetric {
  key: keyof LeaderboardEntry['stats'];
  label: string;
  unit: string;
  formatter: (value: number) => string;
}

export type TimePeriod = 'week' | 'month' | 'year' | 'all';
export type ActivityType = 'all' | 'Run' | 'Ride' | 'Swim' | 'Hike' | 'Walk';

export interface FriendStats {
  period: TimePeriod;
  activityType: ActivityType;
  totalDistance: number;
  totalTime: number;
  totalElevation: number;
  activityCount: number;
  averageSpeed: number;
  totalCalories: number;
  averagePower?: number;
  averageHeartRate?: number;
  bestDistance: number;
  bestTime: number;
  bestSpeed: number;
}

export interface CompetitionBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedAt?: string;
  criteria: {
    metric: string;
    threshold: number;
    comparison: 'greater' | 'less' | 'equal';
  };
}

export interface SocialFeed {
  activities: FriendActivity[];
  achievements: CompetitionBadge[];
  kudos: {
    activityId: number;
    from: Friend;
    timestamp: string;
  }[];
}

// Mock data type for development
export interface MockFriendsData {
  friends: Friend[];
  activities: FriendActivity[];
  comparisons: FriendComparison[];
}