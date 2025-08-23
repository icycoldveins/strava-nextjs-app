import { 
  BadgeDefinition, 
  Badge, 
  AchievementState, 
  UnlockedBadge, 
  AchievementCheckResult,
  ActivityForBadgeCheck
} from './types/achievements';

const STORAGE_KEY = 'strava_achievements';

// Helper function to check if activity is within time range
export function isActivityInTimeRange(timeString: string, startHour: number, endHour: number): boolean {
  const hour = parseInt(timeString.split(':')[0]);
  if (startHour <= endHour) {
    return hour >= startHour && hour <= endHour;
  } else {
    // Handle overnight ranges (e.g., 21-7)
    return hour >= startHour || hour <= endHour;
  }
}

// Calculate activity streaks
export function calculateActivityStreaks(activities: ActivityForBadgeCheck[]): {
  currentStreak: number;
  longestStreak: number;
} {
  if (activities.length === 0) return { currentStreak: 0, longestStreak: 0 };

  // Sort activities by date
  const sortedActivities = activities
    .map(a => ({
      ...a,
      date: new Date(a.start_date_local || a.start_date).toDateString()
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Get unique dates
  const uniqueDates = [...new Set(sortedActivities.map(a => a.date))];
  
  let longestStreak = 1;
  let currentStreak = 1;
  
  for (let i = 1; i < uniqueDates.length; i++) {
    const prevDate = new Date(uniqueDates[i - 1]);
    const currentDate = new Date(uniqueDates[i]);
    const diffDays = (currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);
    
    if (diffDays === 1) {
      currentStreak++;
      longestStreak = Math.max(longestStreak, currentStreak);
    } else {
      currentStreak = 1;
    }
  }

  return { currentStreak, longestStreak };
}

// Calculate activity statistics
export function getActivityStats(activities: ActivityForBadgeCheck[]) {
  if (activities.length === 0) {
    return {
      totalDistance: 0,
      totalTime: 0,
      totalElevation: 0,
      activityCount: 0,
      avgSpeed: 0,
      longestDistance: 0,
      maxElevation: 0,
    };
  }

  const totalDistance = activities.reduce((sum, a) => sum + (a.distance || 0), 0);
  const totalTime = activities.reduce((sum, a) => sum + (a.moving_time || 0), 0);
  const totalElevation = activities.reduce((sum, a) => sum + (a.total_elevation_gain || 0), 0);
  
  return {
    totalDistance,
    totalTime,
    totalElevation,
    activityCount: activities.length,
    avgSpeed: totalTime > 0 ? totalDistance / totalTime : 0,
    longestDistance: Math.max(...activities.map(a => a.distance || 0)),
    maxElevation: Math.max(...activities.map(a => a.total_elevation_gain || 0)),
  };
}

// Badge definitions with check functions
export function getBadgeDefinitions(): BadgeDefinition[] {
  return [
    // Distance Badges
    {
      id: 'first-5k',
      name: 'First 5K',
      description: 'Complete your first 5 kilometer run',
      icon: '🏃‍♀️',
      category: 'distance',
      rarity: 'common',
      checkFunction: (activities: ActivityForBadgeCheck[]): AchievementCheckResult => {
        const runs = activities.filter(a => a.type === 'Run' && (a.distance || 0) >= 5000);
        const isUnlocked = runs.length > 0;
        const longestRun = Math.max(...activities.filter(a => a.type === 'Run').map(a => a.distance || 0), 0);
        const progress = Math.min(100, (longestRun / 5000) * 100);
        
        return {
          isUnlocked,
          progress,
          maxProgress: 100,
          progressText: isUnlocked ? 'Completed!' : `${Math.round(longestRun)}m / 5,000m`
        };
      }
    },
    {
      id: 'first-10k',
      name: 'First 10K',
      description: 'Complete your first 10 kilometer run',
      icon: '🏃‍♂️',
      category: 'distance',
      rarity: 'common',
      checkFunction: (activities: ActivityForBadgeCheck[]): AchievementCheckResult => {
        const runs = activities.filter(a => a.type === 'Run' && (a.distance || 0) >= 10000);
        const isUnlocked = runs.length > 0;
        const longestRun = Math.max(...activities.filter(a => a.type === 'Run').map(a => a.distance || 0), 0);
        const progress = Math.min(100, (longestRun / 10000) * 100);
        
        return {
          isUnlocked,
          progress,
          maxProgress: 100,
          progressText: isUnlocked ? 'Completed!' : `${Math.round(longestRun)}m / 10,000m`
        };
      }
    },
    {
      id: 'half-marathon',
      name: 'Half Marathon Hero',
      description: 'Complete a half marathon (21.1km)',
      icon: '🏅',
      category: 'distance',
      rarity: 'rare',
      checkFunction: (activities: ActivityForBadgeCheck[]): AchievementCheckResult => {
        const runs = activities.filter(a => a.type === 'Run' && (a.distance || 0) >= 21097);
        const isUnlocked = runs.length > 0;
        const longestRun = Math.max(...activities.filter(a => a.type === 'Run').map(a => a.distance || 0), 0);
        const progress = Math.min(100, (longestRun / 21097) * 100);
        
        return {
          isUnlocked,
          progress,
          maxProgress: 100,
          progressText: isUnlocked ? 'Completed!' : `${(longestRun / 1000).toFixed(1)}km / 21.1km`
        };
      }
    },
    {
      id: 'marathon',
      name: 'Marathon Master',
      description: 'Complete a full marathon (42.2km)',
      icon: '🏆',
      category: 'distance',
      rarity: 'epic',
      checkFunction: (activities: ActivityForBadgeCheck[]): AchievementCheckResult => {
        const runs = activities.filter(a => a.type === 'Run' && (a.distance || 0) >= 42195);
        const isUnlocked = runs.length > 0;
        const longestRun = Math.max(...activities.filter(a => a.type === 'Run').map(a => a.distance || 0), 0);
        const progress = Math.min(100, (longestRun / 42195) * 100);
        
        return {
          isUnlocked,
          progress,
          maxProgress: 100,
          progressText: isUnlocked ? 'Completed!' : `${(longestRun / 1000).toFixed(1)}km / 42.2km`
        };
      }
    },
    {
      id: 'century-ride',
      name: 'Century Rider',
      description: 'Complete a 100km cycling ride',
      icon: '🚴‍♂️',
      category: 'distance',
      rarity: 'rare',
      checkFunction: (activities: ActivityForBadgeCheck[]): AchievementCheckResult => {
        const rides = activities.filter(a => a.type === 'Ride' && (a.distance || 0) >= 100000);
        const isUnlocked = rides.length > 0;
        const longestRide = Math.max(...activities.filter(a => a.type === 'Ride').map(a => a.distance || 0), 0);
        const progress = Math.min(100, (longestRide / 100000) * 100);
        
        return {
          isUnlocked,
          progress,
          maxProgress: 100,
          progressText: isUnlocked ? 'Completed!' : `${(longestRide / 1000).toFixed(1)}km / 100km`
        };
      }
    },
    {
      id: 'ultra-runner',
      name: 'Ultra Runner',
      description: 'Complete a 50km+ ultra run',
      icon: '🦸‍♀️',
      category: 'distance',
      rarity: 'legendary',
      checkFunction: (activities: ActivityForBadgeCheck[]): AchievementCheckResult => {
        const runs = activities.filter(a => a.type === 'Run' && (a.distance || 0) >= 50000);
        const isUnlocked = runs.length > 0;
        const longestRun = Math.max(...activities.filter(a => a.type === 'Run').map(a => a.distance || 0), 0);
        const progress = Math.min(100, (longestRun / 50000) * 100);
        
        return {
          isUnlocked,
          progress,
          maxProgress: 100,
          progressText: isUnlocked ? 'Completed!' : `${(longestRun / 1000).toFixed(1)}km / 50km`
        };
      }
    },

    // Consistency Badges
    {
      id: 'week-warrior',
      name: 'Week Warrior',
      description: 'Exercise 7 days in a row',
      icon: '📅',
      category: 'consistency',
      rarity: 'common',
      checkFunction: (activities: ActivityForBadgeCheck[]): AchievementCheckResult => {
        const streaks = calculateActivityStreaks(activities);
        const isUnlocked = streaks.longestStreak >= 7;
        const progress = Math.min(100, (streaks.longestStreak / 7) * 100);
        
        return {
          isUnlocked,
          progress,
          maxProgress: 100,
          progressText: isUnlocked ? 'Completed!' : `${streaks.longestStreak} / 7 days`
        };
      }
    },
    {
      id: 'monthly-motivation',
      name: 'Monthly Motivation',
      description: 'Stay active for 30 consecutive days',
      icon: '🔥',
      category: 'consistency',
      rarity: 'rare',
      checkFunction: (activities: ActivityForBadgeCheck[]): AchievementCheckResult => {
        const streaks = calculateActivityStreaks(activities);
        const isUnlocked = streaks.longestStreak >= 30;
        const progress = Math.min(100, (streaks.longestStreak / 30) * 100);
        
        return {
          isUnlocked,
          progress,
          maxProgress: 100,
          progressText: isUnlocked ? 'Completed!' : `${streaks.longestStreak} / 30 days`
        };
      }
    },
    {
      id: 'streak-100',
      name: 'Century Streak',
      description: '100 day activity streak',
      icon: '💯',
      category: 'consistency',
      rarity: 'epic',
      checkFunction: (activities: ActivityForBadgeCheck[]): AchievementCheckResult => {
        const streaks = calculateActivityStreaks(activities);
        const isUnlocked = streaks.longestStreak >= 100;
        const progress = Math.min(100, (streaks.longestStreak / 100) * 100);
        
        return {
          isUnlocked,
          progress,
          maxProgress: 100,
          progressText: isUnlocked ? 'Completed!' : `${streaks.longestStreak} / 100 days`
        };
      }
    },
    {
      id: 'year-round-athlete',
      name: 'Year-Round Athlete',
      description: 'Stay active for 365 consecutive days',
      icon: '🌟',
      category: 'consistency',
      rarity: 'legendary',
      checkFunction: (activities: ActivityForBadgeCheck[]): AchievementCheckResult => {
        const streaks = calculateActivityStreaks(activities);
        const isUnlocked = streaks.longestStreak >= 365;
        const progress = Math.min(100, (streaks.longestStreak / 365) * 100);
        
        return {
          isUnlocked,
          progress,
          maxProgress: 100,
          progressText: isUnlocked ? 'Completed!' : `${streaks.longestStreak} / 365 days`
        };
      }
    },

    // Time-based Badges
    {
      id: 'early-bird',
      name: 'Early Bird',
      description: 'Complete 5 activities before 6 AM',
      icon: '🌅',
      category: 'time',
      rarity: 'common',
      checkFunction: (activities: ActivityForBadgeCheck[]): AchievementCheckResult => {
        const earlyActivities = activities.filter(a => {
          const dateString = a.start_date_local || a.start_date;
          const timeString = dateString.split('T')[1];
          return timeString && isActivityInTimeRange(timeString, 0, 5); // Before 6 AM (0-5:59)
        });
        const isUnlocked = earlyActivities.length >= 5;
        const progress = Math.min(100, (earlyActivities.length / 5) * 100);
        
        return {
          isUnlocked,
          progress,
          maxProgress: 100,
          progressText: isUnlocked ? 'Completed!' : `${earlyActivities.length} / 5 activities`
        };
      }
    },
    {
      id: 'night-owl',
      name: 'Night Owl',
      description: 'Complete 5 activities after 9 PM',
      icon: '🦉',
      category: 'time',
      rarity: 'common',
      checkFunction: (activities: ActivityForBadgeCheck[]): AchievementCheckResult => {
        const nightActivities = activities.filter(a => {
          const dateString = a.start_date_local || a.start_date;
          const timeString = dateString.split('T')[1];
          return timeString && isActivityInTimeRange(timeString, 21, 23); // After 9 PM
        });
        const isUnlocked = nightActivities.length >= 5;
        const progress = Math.min(100, (nightActivities.length / 5) * 100);
        
        return {
          isUnlocked,
          progress,
          maxProgress: 100,
          progressText: isUnlocked ? 'Completed!' : `${nightActivities.length} / 5 activities`
        };
      }
    },
    {
      id: 'weekend-warrior',
      name: 'Weekend Warrior',
      description: 'Complete 10 weekend activities',
      icon: '🎯',
      category: 'time',
      rarity: 'rare',
      checkFunction: (activities: ActivityForBadgeCheck[]): AchievementCheckResult => {
        const weekendActivities = activities.filter(a => {
          const dateString = a.start_date_local || a.start_date;
          const date = new Date(dateString);
          const day = date.getDay();
          return day === 0 || day === 6; // Sunday = 0, Saturday = 6
        });
        const isUnlocked = weekendActivities.length >= 10;
        const progress = Math.min(100, (weekendActivities.length / 10) * 100);
        
        return {
          isUnlocked,
          progress,
          maxProgress: 100,
          progressText: isUnlocked ? 'Completed!' : `${weekendActivities.length} / 10 activities`
        };
      }
    },

    // Elevation Badges
    {
      id: 'mountain-goat',
      name: 'Mountain Goat',
      description: 'Climb 1000m in a single activity',
      icon: '🐐',
      category: 'elevation',
      rarity: 'rare',
      checkFunction: (activities: ActivityForBadgeCheck[]): AchievementCheckResult => {
        const highActivities = activities.filter(a => (a.total_elevation_gain || 0) >= 1000);
        const isUnlocked = highActivities.length > 0;
        const maxElevation = Math.max(...activities.map(a => a.total_elevation_gain || 0), 0);
        const progress = Math.min(100, (maxElevation / 1000) * 100);
        
        return {
          isUnlocked,
          progress,
          maxProgress: 100,
          progressText: isUnlocked ? 'Completed!' : `${maxElevation}m / 1,000m`
        };
      }
    },
    {
      id: 'everest-challenge',
      name: 'Everest Challenge',
      description: 'Climb a total of 8,848m (Mt. Everest height)',
      icon: '🏔️',
      category: 'elevation',
      rarity: 'epic',
      checkFunction: (activities: ActivityForBadgeCheck[]): AchievementCheckResult => {
        const totalElevation = activities.reduce((sum, a) => sum + (a.total_elevation_gain || 0), 0);
        const isUnlocked = totalElevation >= 8848;
        const progress = Math.min(100, (totalElevation / 8848) * 100);
        
        return {
          isUnlocked,
          progress,
          maxProgress: 100,
          progressText: isUnlocked ? 'Completed!' : `${Math.round(totalElevation)}m / 8,848m`
        };
      }
    },
    {
      id: 'climbing-king',
      name: 'Climbing King',
      description: 'Climb 5000m in a single month',
      icon: '👑',
      category: 'elevation',
      rarity: 'rare',
      checkFunction: (activities: ActivityForBadgeCheck[]): AchievementCheckResult => {
        // Group activities by month
        const monthlyElevation = new Map<string, number>();
        
        activities.forEach(a => {
          const dateString = a.start_date_local || a.start_date;
          const date = new Date(dateString);
          const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
          const current = monthlyElevation.get(monthKey) || 0;
          monthlyElevation.set(monthKey, current + (a.total_elevation_gain || 0));
        });
        
        const maxMonthlyElevation = Math.max(...Array.from(monthlyElevation.values()), 0);
        const isUnlocked = maxMonthlyElevation >= 5000;
        const progress = Math.min(100, (maxMonthlyElevation / 5000) * 100);
        
        return {
          isUnlocked,
          progress,
          maxProgress: 100,
          progressText: isUnlocked ? 'Completed!' : `${Math.round(maxMonthlyElevation)}m / 5,000m`
        };
      }
    },

    // Speed Badges
    {
      id: 'speed-demon',
      name: 'Speed Demon',
      description: 'Achieve 50km/h average speed on a ride',
      icon: '💨',
      category: 'speed',
      rarity: 'epic',
      checkFunction: (activities: ActivityForBadgeCheck[]): AchievementCheckResult => {
        const targetSpeed = 50 / 3.6; // Convert km/h to m/s
        const fastRides = activities.filter(a => 
          a.type === 'Ride' && (a.average_speed || 0) >= targetSpeed
        );
        const isUnlocked = fastRides.length > 0;
        const maxSpeed = Math.max(...activities.filter(a => a.type === 'Ride').map(a => (a.average_speed || 0) * 3.6), 0);
        const progress = Math.min(100, (maxSpeed / 50) * 100);
        
        return {
          isUnlocked,
          progress,
          maxProgress: 100,
          progressText: isUnlocked ? 'Completed!' : `${maxSpeed.toFixed(1)}km/h / 50km/h`
        };
      }
    },
    {
      id: 'running-rocket',
      name: 'Running Rocket',
      description: 'Achieve 20km/h average speed on a run',
      icon: '🚀',
      category: 'speed',
      rarity: 'rare',
      checkFunction: (activities: ActivityForBadgeCheck[]): AchievementCheckResult => {
        const targetSpeed = 20 / 3.6; // Convert km/h to m/s
        const fastRuns = activities.filter(a => 
          a.type === 'Run' && (a.average_speed || 0) >= targetSpeed
        );
        const isUnlocked = fastRuns.length > 0;
        const maxSpeed = Math.max(...activities.filter(a => a.type === 'Run').map(a => (a.average_speed || 0) * 3.6), 0);
        const progress = Math.min(100, (maxSpeed / 20) * 100);
        
        return {
          isUnlocked,
          progress,
          maxProgress: 100,
          progressText: isUnlocked ? 'Completed!' : `${maxSpeed.toFixed(1)}km/h / 20km/h`
        };
      }
    },

    // Special Badges
    {
      id: 'new-year-resolution',
      name: 'New Year Resolution',
      description: 'Exercise on New Year\'s Day',
      icon: '🎊',
      category: 'special',
      rarity: 'common',
      checkFunction: (activities: ActivityForBadgeCheck[]): AchievementCheckResult => {
        const newYearActivities = activities.filter(a => {
          const dateString = a.start_date_local || a.start_date;
          const date = new Date(dateString);
          return date.getMonth() === 0 && date.getDate() === 1; // January 1st
        });
        const isUnlocked = newYearActivities.length > 0;
        
        return {
          isUnlocked,
          progress: isUnlocked ? 100 : 0,
          maxProgress: 100,
          progressText: isUnlocked ? 'Completed!' : 'Exercise on New Year\'s Day'
        };
      }
    },
    {
      id: 'valentine-runner',
      name: 'Valentine Runner',
      description: 'Exercise on Valentine\'s Day',
      icon: '💝',
      category: 'special',
      rarity: 'common',
      checkFunction: (activities: ActivityForBadgeCheck[]): AchievementCheckResult => {
        const valentineActivities = activities.filter(a => {
          const dateString = a.start_date_local || a.start_date;
          const date = new Date(dateString);
          return date.getMonth() === 1 && date.getDate() === 14; // February 14th
        });
        const isUnlocked = valentineActivities.length > 0;
        
        return {
          isUnlocked,
          progress: isUnlocked ? 100 : 0,
          maxProgress: 100,
          progressText: isUnlocked ? 'Completed!' : 'Exercise on Valentine\'s Day'
        };
      }
    },
    {
      id: 'christmas-spirit',
      name: 'Christmas Spirit',
      description: 'Exercise on Christmas Day',
      icon: '🎄',
      category: 'special',
      rarity: 'rare',
      checkFunction: (activities: ActivityForBadgeCheck[]): AchievementCheckResult => {
        const christmasActivities = activities.filter(a => {
          const dateString = a.start_date_local || a.start_date;
          const date = new Date(dateString);
          return date.getMonth() === 11 && date.getDate() === 25; // December 25th
        });
        const isUnlocked = christmasActivities.length > 0;
        
        return {
          isUnlocked,
          progress: isUnlocked ? 100 : 0,
          maxProgress: 100,
          progressText: isUnlocked ? 'Completed!' : 'Exercise on Christmas Day'
        };
      }
    },
  ];
}

// State management functions
export function loadAchievementState(): AchievementState {
  if (typeof window === 'undefined') {
    return {
      unlockedBadges: [],
      badgeProgress: {},
      lastChecked: new Date().toISOString(),
    };
  }

  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return {
      unlockedBadges: [],
      badgeProgress: {},
      lastChecked: new Date().toISOString(),
    };
  }

  return JSON.parse(stored);
}

export function saveAchievementState(state: AchievementState): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }
}

// Main achievement checking function
export function checkAchievements(activities: ActivityForBadgeCheck[]): {
  newlyUnlocked: UnlockedBadge[];
  updatedProgress: Record<string, number>;
} {
  const state = loadAchievementState();
  const badges = getBadgeDefinitions();
  const unlockedBadgeIds = new Set(state.unlockedBadges.map(b => b.badgeId));
  
  const newlyUnlocked: UnlockedBadge[] = [];
  const updatedProgress: Record<string, number> = {};

  badges.forEach(badgeDefinition => {
    const result = badgeDefinition.checkFunction(activities);
    
    // Check if badge should be unlocked
    if (result.isUnlocked && !unlockedBadgeIds.has(badgeDefinition.id)) {
      const unlockedBadge: UnlockedBadge = {
        badgeId: badgeDefinition.id,
        unlockedAt: new Date().toISOString(),
      };
      
      // Try to find the specific activity that triggered this achievement
      const triggeringActivity = findTriggeringActivity(badgeDefinition, activities);
      if (triggeringActivity) {
        unlockedBadge.activityId = triggeringActivity.id?.toString();
      }
      
      newlyUnlocked.push(unlockedBadge);
      state.unlockedBadges.push(unlockedBadge);
    }
    
    // Update progress for all badges (unlocked or not)
    updatedProgress[badgeDefinition.id] = result.progress;
    state.badgeProgress[badgeDefinition.id] = result.progress;
  });

  state.lastChecked = new Date().toISOString();
  saveAchievementState(state);

  return { newlyUnlocked, updatedProgress };
}

// Helper function to find the activity that triggered an achievement
function findTriggeringActivity(badgeDefinition: BadgeDefinition, activities: ActivityForBadgeCheck[]): ActivityForBadgeCheck | null {
  // This is a simplified approach - in practice, you might want more sophisticated logic
  // to identify the exact activity that unlocked each badge
  
  switch (badgeDefinition.category) {
    case 'distance':
      // Find the activity with the longest distance of the appropriate type
      if (badgeDefinition.id.includes('run') || badgeDefinition.id.includes('marathon')) {
        const runActivities = activities.filter(a => a.type === 'Run');
        if (runActivities.length === 0) return null;
        return runActivities.reduce((max, current) => ((current.distance || 0) > (max.distance || 0)) ? current : max);
      } else if (badgeDefinition.id.includes('ride') || badgeDefinition.id.includes('century')) {
        const rideActivities = activities.filter(a => a.type === 'Ride');
        if (rideActivities.length === 0) return null;
        return rideActivities.reduce((max, current) => ((current.distance || 0) > (max.distance || 0)) ? current : max);
      }
      break;
      
    case 'elevation':
      if (badgeDefinition.id === 'mountain-goat') {
        if (activities.length === 0) return null;
        return activities.reduce((max, current) => ((current.total_elevation_gain || 0) > (max.total_elevation_gain || 0)) ? current : max);
      }
      break;
      
    case 'speed':
      const filteredActivities = activities.filter(a => badgeDefinition.id.includes('run') ? a.type === 'Run' : a.type === 'Ride');
      if (filteredActivities.length === 0) return null;
      return filteredActivities.reduce((max, current) => ((current.average_speed || 0) > (max.average_speed || 0)) ? current : max);
  }
  
  return activities[activities.length - 1] || null; // Return most recent activity as fallback
}

// Helper functions for components
export function getUnlockedBadges(): Badge[] {
  const state = loadAchievementState();
  const badges = getBadgeDefinitions();
  const unlockedBadgeIds = new Set(state.unlockedBadges.map(b => b.badgeId));
  
  return badges
    .filter(badgeDefinition => unlockedBadgeIds.has(badgeDefinition.id))
    .map(badgeDefinition => {
      const unlockedInfo = state.unlockedBadges.find(b => b.badgeId === badgeDefinition.id);
      return {
        id: badgeDefinition.id,
        name: badgeDefinition.name,
        description: badgeDefinition.description,
        icon: badgeDefinition.icon,
        category: badgeDefinition.category,
        rarity: badgeDefinition.rarity,
        isUnlocked: true,
        unlockedAt: unlockedInfo?.unlockedAt,
        progress: 100,
      };
    });
}

export function getBadgeProgress(): Record<string, number> {
  const state = loadAchievementState();
  return state.badgeProgress;
}

export function getAllBadges(activities: ActivityForBadgeCheck[] = []): Badge[] {
  const state = loadAchievementState();
  const badges = getBadgeDefinitions();
  const unlockedBadgeIds = new Set(state.unlockedBadges.map(b => b.badgeId));
  
  return badges.map(badgeDefinition => {
    const isUnlocked = unlockedBadgeIds.has(badgeDefinition.id);
    const unlockedInfo = state.unlockedBadges.find(b => b.badgeId === badgeDefinition.id);
    
    let progress = state.badgeProgress[badgeDefinition.id] || 0;
    let maxProgress = 100;
    
    // If we have activities, calculate current progress
    if (activities.length > 0) {
      const result = badgeDefinition.checkFunction(activities);
      progress = result.progress;
      maxProgress = result.maxProgress;
    }
    
    return {
      id: badgeDefinition.id,
      name: badgeDefinition.name,
      description: badgeDefinition.description,
      icon: badgeDefinition.icon,
      category: badgeDefinition.category,
      rarity: badgeDefinition.rarity,
      isUnlocked,
      unlockedAt: unlockedInfo?.unlockedAt,
      progress: isUnlocked ? 100 : progress,
      maxProgress,
    };
  });
}