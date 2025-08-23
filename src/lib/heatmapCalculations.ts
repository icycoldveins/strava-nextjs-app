import { 
  HeatmapActivity, 
  HeatmapDataPoint, 
  HeatmapStats, 
  HeatmapMetricType, 
  HeatmapViewMode,
  HeatmapValue
} from './types/heatmap';
import { HEATMAP_CALCULATIONS, CALCULATION_DEFAULTS } from '@/config/calculations.config';

/**
 * Calculate intensity score based on distance, time, and elevation
 * Uses a weighted formula to create a meaningful activity intensity metric
 */
export function calculateActivityIntensity(activity: HeatmapActivity): number {
  const config = HEATMAP_CALCULATIONS.intensity;
  const units = CALCULATION_DEFAULTS.units;
  
  const distanceKm = activity.distance / units.metersToKm;
  const timeHours = activity.moving_time / units.secondsToHours;
  const elevationM = activity.total_elevation_gain || 0;
  
  // Base score from distance (km)
  let intensity = distanceKm * config.distanceMultiplier;
  
  // Time bonus (hours)
  intensity += timeHours * config.timeMultiplier;
  
  // Elevation bonus
  intensity += elevationM * config.elevationMultiplier;
  
  // Speed bonus for high-intensity activities
  if (activity.average_speed && activity.average_speed > 0) {
    const speedKmh = activity.average_speed * units.msToKmh;
    if (speedKmh > config.speedBonusThreshold) {
      intensity += (speedKmh - config.speedBonusThreshold) * config.speedBonusMultiplier;
    }
  }
  
  // Heart rate bonus if available
  if (activity.average_heartrate && activity.average_heartrate > config.heartRateThreshold) {
    intensity += (activity.average_heartrate - config.heartRateThreshold) * config.heartRateBonusMultiplier;
  }
  
  return Math.round(intensity);
}

/**
 * Get metric value for a given activity
 */
export function getActivityMetricValue(
  activity: HeatmapActivity, 
  metricType: HeatmapMetricType
): number {
  const units = CALCULATION_DEFAULTS.units;
  
  switch (metricType) {
    case 'distance':
      return activity.distance / units.metersToKm; // Convert to km
    case 'time':
      return activity.moving_time / units.secondsToMinutes; // Convert to minutes
    case 'count':
      return 1;
    case 'intensity':
    default:
      return calculateActivityIntensity(activity);
  }
}

/**
 * Group activities by date and calculate aggregated values
 */
export function groupActivitiesByDate(
  activities: HeatmapActivity[],
  metricType: HeatmapMetricType = 'intensity'
): HeatmapDataPoint[] {
  const groupedActivities = new Map<string, HeatmapActivity[]>();
  
  // Group activities by local date
  activities.forEach(activity => {
    const date = new Date(activity.start_date_local).toISOString().split('T')[0];
    if (!groupedActivities.has(date)) {
      groupedActivities.set(date, []);
    }
    groupedActivities.get(date)!.push(activity);
  });
  
  // Calculate aggregated values for each date
  const dataPoints: HeatmapDataPoint[] = [];
  
  groupedActivities.forEach((dayActivities, date) => {
    const totalValue = dayActivities.reduce((sum, activity) => {
      return sum + getActivityMetricValue(activity, metricType);
    }, 0);
    
    dataPoints.push({
      date,
      value: Math.round(totalValue * 10) / 10, // Round to 1 decimal
      count: dayActivities.length,
      activities: dayActivities,
    });
  });
  
  return dataPoints.sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Generate date range for the heatmap view
 */
export function getDateRange(viewMode: HeatmapViewMode): { start: Date; end: Date } {
  const end = new Date();
  const start = new Date();
  
  switch (viewMode) {
    case '3months':
      start.setMonth(end.getMonth() - 3);
      break;
    case '6months':
      start.setMonth(end.getMonth() - 6);
      break;
    case 'year':
    default:
      start.setFullYear(end.getFullYear() - 1);
      break;
  }
  
  // Set to beginning of start date and end of end date
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  
  return { start, end };
}

/**
 * Calculate activity streaks
 */
export function calculateStreaks(dataPoints: HeatmapDataPoint[]): {
  currentStreak: number;
  bestStreak: number;
} {
  if (dataPoints.length === 0) {
    return { currentStreak: 0, bestStreak: 0 };
  }
  
  // Create a set of active dates for quick lookup
  const activeDates = new Set(dataPoints.map(point => point.date));
  
  // Generate all dates in the range to check for consecutive days
  const sortedPoints = dataPoints.sort((a, b) => a.date.localeCompare(b.date));
  const startDate = new Date(sortedPoints[0].date);
  const endDate = new Date(sortedPoints[sortedPoints.length - 1].date);
  
  let bestStreak = 0;
  let currentStreak = 0;
  let streakFromEnd = 0;
  
  // Check from end date backwards for current streak
  const today = new Date();
  let checkDate = new Date(today);
  
  // Calculate current streak (consecutive days from today backwards)
  while (checkDate >= startDate) {
    const dateStr = checkDate.toISOString().split('T')[0];
    if (activeDates.has(dateStr)) {
      streakFromEnd++;
    } else if (streakFromEnd > 0) {
      // If we hit a gap and already had a streak, stop
      break;
    }
    checkDate.setDate(checkDate.getDate() - 1);
  }
  
  // Calculate best streak (longest consecutive period)
  checkDate = new Date(startDate);
  currentStreak = 0;
  
  while (checkDate <= endDate) {
    const dateStr = checkDate.toISOString().split('T')[0];
    if (activeDates.has(dateStr)) {
      currentStreak++;
      bestStreak = Math.max(bestStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
    checkDate.setDate(checkDate.getDate() + 1);
  }
  
  return {
    currentStreak: streakFromEnd,
    bestStreak: bestStreak,
  };
}

/**
 * Calculate comprehensive heatmap statistics
 */
export function calculateHeatmapStats(
  dataPoints: HeatmapDataPoint[],
  dateRange: { start: Date; end: Date }
): HeatmapStats {
  if (dataPoints.length === 0) {
    return {
      totalActivities: 0,
      totalDistance: 0,
      totalTime: 0,
      averageIntensity: 0,
      bestStreak: 0,
      currentStreak: 0,
      activeDays: 0,
      totalDays: 0,
    };
  }
  
  const totalActivities = dataPoints.reduce((sum, point) => sum + point.count, 0);
  
  const totalDistance = dataPoints.reduce((sum, point) => {
    return sum + point.activities.reduce((actSum, activity) => {
      return actSum + (activity.distance / 1000); // Convert to km
    }, 0);
  }, 0);
  
  const totalTime = dataPoints.reduce((sum, point) => {
    return sum + point.activities.reduce((actSum, activity) => {
      return actSum + activity.moving_time;
    }, 0);
  }, 0);
  
  const totalIntensity = dataPoints.reduce((sum, point) => sum + point.value, 0);
  const averageIntensity = totalActivities > 0 ? totalIntensity / dataPoints.length : 0;
  
  const { currentStreak, bestStreak } = calculateStreaks(dataPoints);
  
  const activeDays = dataPoints.length;
  const totalDays = Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24));
  
  return {
    totalActivities,
    totalDistance: Math.round(totalDistance * 10) / 10,
    totalTime: Math.round(totalTime),
    averageIntensity: Math.round(averageIntensity * 10) / 10,
    bestStreak,
    currentStreak,
    activeDays,
    totalDays,
  };
}

/**
 * Convert heatmap data points to react-calendar-heatmap format
 */
export function convertToHeatmapValues(dataPoints: HeatmapDataPoint[]): HeatmapValue[] {
  return dataPoints.map(point => ({
    date: point.date, // Keep as string for react-calendar-heatmap
    count: point.value,
  }));
}

/**
 * Filter activities by type
 */
export function filterActivitiesByType(
  activities: HeatmapActivity[],
  activityTypes?: string[]
): HeatmapActivity[] {
  if (!activityTypes || activityTypes.length === 0) {
    return activities;
  }
  
  return activities.filter(activity => 
    activityTypes.includes(activity.type) || 
    (activity.sport_type && activityTypes.includes(activity.sport_type))
  );
}

/**
 * Get color class based on intensity value
 */
export function getIntensityColorClass(value: number, maxValue: number): string {
  const breakpoints = HEATMAP_CALCULATIONS.colorBreakpoints;
  const colors = HEATMAP_CALCULATIONS.colorClasses;
  
  if (value === 0) return colors.empty;
  
  const intensity = maxValue > 0 ? value / maxValue : 0;
  
  if (intensity <= breakpoints.low) return colors.low;
  if (intensity <= breakpoints.mediumLow) return colors.mediumLow;
  if (intensity <= breakpoints.medium) return colors.medium;
  if (intensity <= breakpoints.mediumHigh) return colors.mediumHigh;
  return colors.high;
}

/**
 * Format metric value for display
 */
export function formatMetricValue(value: number, metricType: HeatmapMetricType): string {
  const precision = CALCULATION_DEFAULTS.precision;
  const units = CALCULATION_DEFAULTS.units;
  
  switch (metricType) {
    case 'distance':
      return `${value.toFixed(precision.distance)} km`;
    case 'time':
      const hours = Math.floor(value / units.secondsToMinutes);
      const minutes = Math.round(value % units.secondsToMinutes);
      return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
    case 'count':
      return `${value} ${value === 1 ? 'activity' : 'activities'}`;
    case 'intensity':
    default:
      return `${value} intensity`;
  }
}