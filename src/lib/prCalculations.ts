import { 
  Activity, 
  StandardDistance, 
  PersonalRecord, 
  AttemptRecord, 
  TrendPoint, 
  PRAnalysis,
  PotentialPR,
  PRSummary,
  STANDARD_DISTANCES,
  DistanceEffort
} from './types/personalRecords';

/**
 * Calculate pace in seconds per kilometer for running
 */
export function calculateRunningPace(timeInSeconds: number, distanceInMeters: number): number {
  const distanceInKm = distanceInMeters / 1000;
  return timeInSeconds / distanceInKm;
}

/**
 * Calculate speed in km/h for cycling
 */
export function calculateCyclingSpeed(timeInSeconds: number, distanceInMeters: number): number {
  const distanceInKm = distanceInMeters / 1000;
  const timeInHours = timeInSeconds / 3600;
  return distanceInKm / timeInHours;
}

/**
 * Format pace for display (MM:SS per km for running)
 */
export function formatRunningPace(paceInSeconds: number): string {
  const minutes = Math.floor(paceInSeconds / 60);
  const seconds = Math.round(paceInSeconds % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}/km`;
}

/**
 * Format speed for display (XX.X km/h for cycling)
 */
export function formatCyclingSpeed(speedInKmh: number): string {
  return `${speedInKmh.toFixed(1)} km/h`;
}

/**
 * Format time as HH:MM:SS
 */
export function formatTime(timeInSeconds: number): string {
  const hours = Math.floor(timeInSeconds / 3600);
  const minutes = Math.floor((timeInSeconds % 3600) / 60);
  const seconds = Math.round(timeInSeconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Determine if an activity is suitable for a given distance
 */
function isActivitySuitableForDistance(activity: Activity, distance: StandardDistance): boolean {
  const activityCategory = getActivityCategory(activity);
  if (activityCategory !== distance.category) {
    return false;
  }
  
  // Activity should be at least as long as the target distance
  // Allow for some tolerance (activities that are 95% of target distance)
  return activity.distance >= distance.distance * 0.95;
}

/**
 * Get activity category (running or cycling) based on Strava activity type
 */
function getActivityCategory(activity: Activity): 'running' | 'cycling' | 'other' {
  const runningTypes = ['Run', 'TrailRun', 'Treadmill'];
  const cyclingTypes = ['Ride', 'MountainBikeRide', 'GravelRide', 'EBikeRide', 'VirtualRide'];
  
  if (runningTypes.includes(activity.type) || runningTypes.includes(activity.sport_type)) {
    return 'running';
  }
  if (cyclingTypes.includes(activity.type) || cyclingTypes.includes(activity.sport_type)) {
    return 'cycling';
  }
  return 'other';
}

/**
 * Find the best effort for a specific distance within an activity
 * This is a simplified implementation - in reality, you'd need GPS data
 * to find the fastest segment of the specified distance
 */
function findBestEffortInActivity(activity: Activity, targetDistance: number): DistanceEffort | null {
  // Simplified: if activity is longer than target, estimate best effort
  if (activity.distance >= targetDistance) {
    // For activities longer than target distance, assume best effort time
    // is proportional to average speed, but slightly faster than average
    const improvementFactor = activity.distance > targetDistance * 1.5 ? 1.05 : 1.02;
    const estimatedTime = (targetDistance / activity.distance) * activity.moving_time / improvementFactor;
    
    return {
      startIndex: 0,
      endIndex: Math.floor((targetDistance / activity.distance) * 100),
      distance: targetDistance,
      time: estimatedTime,
      averageSpeed: targetDistance / estimatedTime
    };
  }
  
  // If activity is shorter than target distance, can't extract that distance
  return null;
}

/**
 * Calculate personal records for all standard distances
 */
export function calculatePersonalRecords(activities: Activity[]): PRAnalysis {
  const personalRecords: PersonalRecord[] = [];
  const recentPRDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
  
  for (const distance of STANDARD_DISTANCES) {
    const suitableActivities = activities.filter(activity => 
      isActivitySuitableForDistance(activity, distance)
    );
    
    if (suitableActivities.length === 0) continue;
    
    const attempts: AttemptRecord[] = [];
    let bestTime = Infinity;
    let bestActivity: Activity | null = null;
    
    for (const activity of suitableActivities) {
      const effort = findBestEffortInActivity(activity, distance.distance);
      if (!effort) continue;
      
      const time = effort.time;
      const pace = distance.category === 'running' 
        ? calculateRunningPace(time, distance.distance)
        : calculateCyclingSpeed(time, distance.distance);
      
      const isNewPR = time < bestTime;
      if (isNewPR) {
        bestTime = time;
        bestActivity = activity;
      }
      
      attempts.push({
        activityId: activity.id,
        activityName: activity.name,
        time,
        pace,
        date: activity.start_date_local,
        isPersonalRecord: isNewPR
      });
    }
    
    if (bestActivity) {
      // Sort attempts by date to calculate improvements
      attempts.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      // Calculate improvement percentages
      let previousBest = Infinity;
      attempts.forEach(attempt => {
        if (attempt.time < previousBest) {
          if (previousBest !== Infinity) {
            attempt.improvementPercentage = ((previousBest - attempt.time) / previousBest) * 100;
          }
          previousBest = attempt.time;
        }
      });
      
      // Create trend data (last 10 attempts)
      const recentAttempts = attempts.slice(-10);
      const trendData: TrendPoint[] = recentAttempts.map(attempt => ({
        date: attempt.date,
        time: attempt.time,
        pace: attempt.pace,
        activityId: attempt.activityId
      }));
      
      const bestPace = distance.category === 'running' 
        ? calculateRunningPace(bestTime, distance.distance)
        : calculateCyclingSpeed(bestTime, distance.distance);
      
      // Find improvement from previous PR
      const prAttempts = attempts.filter(a => a.isPersonalRecord);
      let improvementFromPrevious: number | undefined;
      if (prAttempts.length >= 2) {
        const currentPR = prAttempts[prAttempts.length - 1];
        const previousPR = prAttempts[prAttempts.length - 2];
        improvementFromPrevious = ((previousPR.time - currentPR.time) / previousPR.time) * 100;
      }
      
      personalRecords.push({
        distance,
        bestTime,
        bestPace,
        activityId: bestActivity.id,
        activityName: bestActivity.name,
        achievedDate: bestActivity.start_date_local,
        improvementFromPrevious,
        recentAttempts: attempts.slice(-5), // Last 5 attempts
        trendData
      });
    }
  }
  
  // Find recent improvements (PRs achieved in last 30 days)
  const recentImprovements = personalRecords.filter(pr => 
    new Date(pr.achievedDate) >= recentPRDate
  );
  
  // Generate potential PRs based on current fitness
  const potentialPRs = generatePotentialPRs(personalRecords, activities);
  
  // Calculate summary statistics
  const summary = calculatePRSummary(personalRecords, recentImprovements);
  
  return {
    personalRecords,
    recentImprovements,
    potentialPRs,
    summary
  };
}

/**
 * Generate potential PRs based on current performance
 */
function generatePotentialPRs(personalRecords: PersonalRecord[], activities: Activity[]): PotentialPR[] {
  const potentialPRs: PotentialPR[] = [];
  
  // Find distances not yet achieved
  const achievedDistances = new Set(personalRecords.map(pr => pr.distance.distance));
  const unachievedDistances = STANDARD_DISTANCES.filter(d => !achievedDistances.has(d.distance));
  
  for (const distance of unachievedDistances) {
    const categoryPRs = personalRecords.filter(pr => pr.distance.category === distance.category);
    if (categoryPRs.length === 0) continue;
    
    // Find the closest distance PR to base estimation on
    const closestPR = categoryPRs.reduce((closest, pr) => {
      const currentDiff = Math.abs(pr.distance.distance - distance.distance);
      const closestDiff = Math.abs(closest.distance.distance - distance.distance);
      return currentDiff < closestDiff ? pr : closest;
    });
    
    // Estimate time using Riegel's formula for running or power law for cycling
    let estimatedTime: number;
    let confidenceLevel: 'high' | 'medium' | 'low';
    
    if (distance.category === 'running') {
      // Riegel's formula: T2 = T1 * (D2/D1)^1.06
      const ratio = distance.distance / closestPR.distance.distance;
      estimatedTime = closestPR.bestTime * Math.pow(ratio, 1.06);
    } else {
      // Simplified power law for cycling
      const ratio = distance.distance / closestPR.distance.distance;
      estimatedTime = closestPR.bestTime * Math.pow(ratio, 0.98);
    }
    
    // Determine confidence level based on distance ratio
    const distanceRatio = Math.max(distance.distance / closestPR.distance.distance, 
                                  closestPR.distance.distance / distance.distance);
    if (distanceRatio <= 2) {
      confidenceLevel = 'high';
    } else if (distanceRatio <= 4) {
      confidenceLevel = 'medium';
    } else {
      confidenceLevel = 'low';
    }
    
    potentialPRs.push({
      distance,
      estimatedTime,
      confidenceLevel,
      basedOnDistance: closestPR.distance.distance
    });
  }
  
  return potentialPRs.sort((a, b) => a.distance.distance - b.distance.distance);
}

/**
 * Calculate summary statistics
 */
function calculatePRSummary(personalRecords: PersonalRecord[], recentImprovements: PersonalRecord[]): PRSummary {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  
  const improvingDistances: StandardDistance[] = [];
  const stagnantDistances: StandardDistance[] = [];
  let totalImprovement = 0;
  let improvementCount = 0;
  
  personalRecords.forEach(pr => {
    // Check if there's been improvement in the last 90 days
    const recentAttempts = pr.recentAttempts.filter(attempt => 
      new Date(attempt.date) >= ninetyDaysAgo
    );
    
    if (recentAttempts.length >= 2) {
      const oldestRecent = recentAttempts[0];
      const newestRecent = recentAttempts[recentAttempts.length - 1];
      
      if (newestRecent.time < oldestRecent.time) {
        improvingDistances.push(pr.distance);
        const improvement = ((oldestRecent.time - newestRecent.time) / oldestRecent.time) * 100;
        totalImprovement += improvement;
        improvementCount++;
      } else {
        stagnantDistances.push(pr.distance);
      }
    } else {
      stagnantDistances.push(pr.distance);
    }
  });
  
  return {
    totalPRs: personalRecords.length,
    recentPRs: recentImprovements.length,
    improvingDistances,
    stagnantDistances,
    averageImprovement: improvementCount > 0 ? totalImprovement / improvementCount : 0
  };
}

/**
 * Get the best pace/speed display for a PR
 */
export function getPRDisplayValue(pr: PersonalRecord): string {
  if (pr.distance.category === 'running') {
    return formatRunningPace(pr.bestPace);
  } else {
    return formatCyclingSpeed(pr.bestPace);
  }
}

/**
 * Calculate percentage improvement between two times
 */
export function calculateImprovement(oldTime: number, newTime: number): number {
  return ((oldTime - newTime) / oldTime) * 100;
}