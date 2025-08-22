import { 
  Friend, 
  FriendActivity, 
  LeaderboardEntry, 
  HeadToHeadComparison, 
  FriendComparison,
  TimePeriod,
  ActivityType,
  FriendStats,
  ComparisonMetric 
} from './types/friends';

/**
 * Friend Performance Comparison Logic
 * Handles calculations for leaderboards, head-to-head comparisons, and performance analysis
 */

export interface FriendWithActivities {
  friend: Friend;
  activities: FriendActivity[];
}

// Comparison metrics configuration
export const COMPARISON_METRICS: ComparisonMetric[] = [
  {
    key: 'totalDistance',
    label: 'Distance',
    unit: 'km',
    formatter: (value: number) => `${(value / 1000).toFixed(1)} km`,
  },
  {
    key: 'totalTime',
    label: 'Time',
    unit: 'hours',
    formatter: (value: number) => {
      const hours = Math.floor(value / 3600);
      const minutes = Math.floor((value % 3600) / 60);
      return `${hours}h ${minutes}m`;
    },
  },
  {
    key: 'totalElevation',
    label: 'Elevation',
    unit: 'm',
    formatter: (value: number) => `${value.toLocaleString()} m`,
  },
  {
    key: 'activityCount',
    label: 'Activities',
    unit: 'count',
    formatter: (value: number) => value.toString(),
  },
  {
    key: 'averageSpeed',
    label: 'Avg Speed',
    unit: 'km/h',
    formatter: (value: number) => `${(value * 3.6).toFixed(1)} km/h`,
  },
  {
    key: 'totalCalories',
    label: 'Calories',
    unit: 'kcal',
    formatter: (value: number) => `${value.toLocaleString()} kcal`,
  },
];

/**
 * Filter activities by time period
 */
export function filterActivitiesByPeriod(
  activities: FriendActivity[], 
  period: TimePeriod
): FriendActivity[] {
  const now = new Date();
  let startDate: Date;

  switch (period) {
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case 'year':
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      break;
    case 'all':
    default:
      return activities;
  }

  return activities.filter(activity => 
    new Date(activity.start_date) >= startDate
  );
}

/**
 * Filter activities by type
 */
export function filterActivitiesByType(
  activities: FriendActivity[],
  activityType: ActivityType
): FriendActivity[] {
  if (activityType === 'all') {
    return activities;
  }
  
  return activities.filter(activity => activity.type === activityType);
}

/**
 * Calculate friend statistics from activities
 */
export function calculateFriendStats(
  activities: FriendActivity[],
  period: TimePeriod,
  activityType: ActivityType
): FriendStats {
  const filteredActivities = filterActivitiesByType(
    filterActivitiesByPeriod(activities, period),
    activityType
  );

  if (filteredActivities.length === 0) {
    return {
      period,
      activityType,
      totalDistance: 0,
      totalTime: 0,
      totalElevation: 0,
      activityCount: 0,
      averageSpeed: 0,
      totalCalories: 0,
      averagePower: 0,
      averageHeartRate: 0,
      bestDistance: 0,
      bestTime: 0,
      bestSpeed: 0,
    };
  }

  const totalDistance = filteredActivities.reduce((sum, a) => sum + (a.distance || 0), 0);
  const totalTime = filteredActivities.reduce((sum, a) => sum + (a.moving_time || 0), 0);
  const totalElevation = filteredActivities.reduce((sum, a) => sum + (a.total_elevation_gain || 0), 0);
  const totalCalories = filteredActivities.reduce((sum, a) => sum + (a.calories || 0), 0);
  
  const activitiesWithPower = filteredActivities.filter(a => a.average_watts);
  const averagePower = activitiesWithPower.length > 0 
    ? activitiesWithPower.reduce((sum, a) => sum + (a.average_watts || 0), 0) / activitiesWithPower.length
    : undefined;

  const activitiesWithHR = filteredActivities.filter(a => a.average_heartrate);
  const averageHeartRate = activitiesWithHR.length > 0
    ? activitiesWithHR.reduce((sum, a) => sum + (a.average_heartrate || 0), 0) / activitiesWithHR.length
    : undefined;

  const averageSpeed = totalTime > 0 ? totalDistance / totalTime : 0;
  const bestDistance = Math.max(...filteredActivities.map(a => a.distance || 0));
  const bestTime = Math.max(...filteredActivities.map(a => a.moving_time || 0));
  const bestSpeed = Math.max(...filteredActivities.map(a => a.average_speed || 0));

  return {
    period,
    activityType,
    totalDistance,
    totalTime,
    totalElevation,
    activityCount: filteredActivities.length,
    averageSpeed,
    totalCalories,
    averagePower,
    averageHeartRate,
    bestDistance,
    bestTime,
    bestSpeed,
  };
}

/**
 * Generate leaderboard from friends and their activities
 */
export function generateLeaderboard(
  friendsWithActivities: FriendWithActivities[],
  period: TimePeriod,
  activityType: ActivityType,
  sortBy: keyof LeaderboardEntry['stats'] = 'totalDistance'
): LeaderboardEntry[] {
  const entries = friendsWithActivities.map(({ friend, activities }) => {
    const stats = calculateFriendStats(activities, period, activityType);
    
    return {
      friend,
      stats: {
        totalDistance: stats.totalDistance,
        totalTime: stats.totalTime,
        totalElevation: stats.totalElevation,
        activityCount: stats.activityCount,
        averageSpeed: stats.averageSpeed,
        totalCalories: stats.totalCalories,
        averagePower: stats.averagePower,
        averageHeartRate: stats.averageHeartRate,
      },
      rank: 0, // Will be set after sorting
      percentile: 0, // Will be calculated after sorting
    };
  });

  // Sort by the specified metric (descending)
  entries.sort((a, b) => {
    const aValue = a.stats[sortBy] || 0;
    const bValue = b.stats[sortBy] || 0;
    return bValue - aValue;
  });

  // Assign ranks and percentiles
  entries.forEach((entry, index) => {
    entry.rank = index + 1;
    entry.percentile = Math.round(((entries.length - index) / entries.length) * 100);
  });

  return entries;
}

/**
 * Generate head-to-head comparison between two friends
 */
export function generateHeadToHeadComparison(
  friend1: Friend,
  friend1Activities: FriendActivity[],
  friend2: Friend,
  friend2Activities: FriendActivity[],
  period: TimePeriod,
  activityType: ActivityType
): HeadToHeadComparison {
  const stats1 = calculateFriendStats(friend1Activities, period, activityType);
  const stats2 = calculateFriendStats(friend2Activities, period, activityType);

  // Calculate comparisons for each metric
  const distanceComparison = {
    friend1: stats1.totalDistance,
    friend2: stats2.totalDistance,
    winner: stats1.totalDistance > stats2.totalDistance ? friend1.id : friend2.id,
    difference: Math.abs(stats1.totalDistance - stats2.totalDistance),
    percentDifference: stats2.totalDistance > 0 
      ? Math.round((Math.abs(stats1.totalDistance - stats2.totalDistance) / stats2.totalDistance) * 100)
      : 0,
  };

  const timeComparison = {
    friend1: stats1.totalTime,
    friend2: stats2.totalTime,
    winner: stats1.totalTime > stats2.totalTime ? friend1.id : friend2.id,
    difference: Math.abs(stats1.totalTime - stats2.totalTime),
    percentDifference: stats2.totalTime > 0
      ? Math.round((Math.abs(stats1.totalTime - stats2.totalTime) / stats2.totalTime) * 100)
      : 0,
  };

  const elevationComparison = {
    friend1: stats1.totalElevation,
    friend2: stats2.totalElevation,
    winner: stats1.totalElevation > stats2.totalElevation ? friend1.id : friend2.id,
    difference: Math.abs(stats1.totalElevation - stats2.totalElevation),
    percentDifference: stats2.totalElevation > 0
      ? Math.round((Math.abs(stats1.totalElevation - stats2.totalElevation) / stats2.totalElevation) * 100)
      : 0,
  };

  const activitiesComparison = {
    friend1: stats1.activityCount,
    friend2: stats2.activityCount,
    winner: stats1.activityCount > stats2.activityCount ? friend1.id : friend2.id,
    difference: Math.abs(stats1.activityCount - stats2.activityCount),
  };

  const avgSpeedComparison = {
    friend1: stats1.averageSpeed,
    friend2: stats2.averageSpeed,
    winner: stats1.averageSpeed > stats2.averageSpeed ? friend1.id : friend2.id,
    difference: Math.abs(stats1.averageSpeed - stats2.averageSpeed),
    percentDifference: stats2.averageSpeed > 0
      ? Math.round((Math.abs(stats1.averageSpeed - stats2.averageSpeed) / stats2.averageSpeed) * 100)
      : 0,
  };

  // Calculate win scores
  let friend1Wins = 0;
  let friend2Wins = 0;

  [distanceComparison, timeComparison, elevationComparison, activitiesComparison, avgSpeedComparison]
    .forEach(comparison => {
      if (comparison.winner === friend1.id) friend1Wins++;
      else if (comparison.winner === friend2.id) friend2Wins++;
    });

  return {
    friend1,
    friend2,
    period,
    comparison: {
      distance: distanceComparison,
      time: timeComparison,
      elevation: elevationComparison,
      activities: activitiesComparison,
      avgSpeed: avgSpeedComparison,
    },
    overallWinner: friend1Wins > friend2Wins ? friend1.id : friend2.id,
    winScore: {
      friend1: friend1Wins,
      friend2: friend2Wins,
    },
  };
}

/**
 * Generate complete friend comparison data
 */
export function generateFriendComparison(
  friendsWithActivities: FriendWithActivities[],
  period: TimePeriod,
  activityType: ActivityType,
  selectedFriendId?: number
): FriendComparison {
  const leaderboard = generateLeaderboard(friendsWithActivities, period, activityType);

  let headToHead: HeadToHeadComparison | undefined;

  // Generate head-to-head if a specific friend is selected and we have at least 2 friends
  if (selectedFriendId && friendsWithActivities.length >= 2) {
    const selectedFriend = friendsWithActivities.find(f => f.friend.id === selectedFriendId);
    const otherFriend = friendsWithActivities.find(f => f.friend.id !== selectedFriendId);

    if (selectedFriend && otherFriend) {
      headToHead = generateHeadToHeadComparison(
        selectedFriend.friend,
        selectedFriend.activities,
        otherFriend.friend,
        otherFriend.activities,
        period,
        activityType
      );
    }
  }

  return {
    leaderboard,
    headToHead,
    period,
    activityType,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Utility function to get time period label
 */
export function getTimePeriodLabel(period: TimePeriod): string {
  switch (period) {
    case 'week':
      return 'This Week';
    case 'month':
      return 'This Month';
    case 'year':
      return 'This Year';
    case 'all':
      return 'All Time';
    default:
      return period;
  }
}

/**
 * Utility function to get activity type label
 */
export function getActivityTypeLabel(activityType: ActivityType): string {
  switch (activityType) {
    case 'all':
      return 'All Activities';
    case 'Run':
      return 'Runs';
    case 'Ride':
      return 'Rides';
    case 'Swim':
      return 'Swims';
    case 'Hike':
      return 'Hikes';
    case 'Walk':
      return 'Walks';
    default:
      return activityType;
  }
}

/**
 * Format comparison percentage for display
 */
export function formatComparisonPercentage(percentage: number): string {
  if (percentage === 0) return 'Equal';
  return `${percentage}% ${percentage > 0 ? 'ahead' : 'behind'}`;
}

/**
 * Get medal emoji based on rank
 */
export function getRankMedal(rank: number): string {
  switch (rank) {
    case 1:
      return '🥇';
    case 2:
      return '🥈';
    case 3:
      return '🥉';
    default:
      return '';
  }
}

/**
 * Calculate performance trend between two periods
 */
export function calculatePerformanceTrend(
  currentStats: FriendStats,
  previousStats: FriendStats,
  metric: keyof FriendStats
): {
  change: number;
  percentChange: number;
  trend: 'up' | 'down' | 'stable';
} {
  const current = currentStats[metric] as number || 0;
  const previous = previousStats[metric] as number || 0;
  
  const change = current - previous;
  const percentChange = previous > 0 ? (change / previous) * 100 : 0;
  
  let trend: 'up' | 'down' | 'stable' = 'stable';
  if (Math.abs(percentChange) > 5) {
    trend = percentChange > 0 ? 'up' : 'down';
  }

  return {
    change,
    percentChange,
    trend,
  };
}