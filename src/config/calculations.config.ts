/**
 * Configuration for calculation constants used throughout the application
 * These values can be adjusted to fine-tune the behavior of various calculations
 */

export const HEATMAP_CALCULATIONS = {
  // Intensity calculation weights
  intensity: {
    distanceMultiplier: 10, // Base score multiplier for distance (km)
    timeMultiplier: 20, // Time bonus multiplier (hours)
    elevationMultiplier: 0.1, // Elevation bonus multiplier (meters)
    speedBonusThreshold: 15, // Speed threshold for bonus (km/h)
    speedBonusMultiplier: 2, // Speed bonus multiplier
    heartRateThreshold: 120, // Heart rate threshold for bonus (bpm)
    heartRateBonusMultiplier: 0.5, // Heart rate bonus multiplier
  },
  
  // Color intensity breakpoints (0-1 scale)
  colorBreakpoints: {
    low: 0.2,
    mediumLow: 0.4,
    medium: 0.6,
    mediumHigh: 0.8,
    high: 1.0,
  },
  
  // Color classes for different intensity levels
  colorClasses: {
    empty: 'fill-gray-100 dark:fill-gray-800',
    low: 'fill-orange-200 dark:fill-orange-900',
    mediumLow: 'fill-orange-300 dark:fill-orange-800',
    medium: 'fill-orange-400 dark:fill-orange-700',
    mediumHigh: 'fill-orange-500 dark:fill-orange-600',
    high: 'fill-orange-600 dark:fill-orange-500',
  },
};

export const ACTIVITY_THRESHOLDS = {
  // Speed thresholds for different activity types
  speed: {
    running: {
      fast: 20, // km/h - considered fast for running
      moderate: 12, // km/h - moderate running pace
      slow: 8, // km/h - slow/recovery pace
    },
    cycling: {
      fast: 50, // km/h - fast cycling speed
      moderate: 30, // km/h - moderate cycling speed
      slow: 20, // km/h - slow/recovery cycling
    },
  },
  
  // Heart rate zones
  heartRate: {
    maxZone: 180, // Maximum heart rate zone
    anaerobicThreshold: 165, // Anaerobic threshold
    aerobicThreshold: 145, // Aerobic threshold
    recovery: 120, // Recovery zone
  },
  
  // Distance categories (in meters)
  distance: {
    ultraLong: 100000, // 100km+
    veryLong: 50000, // 50km+
    long: 30000, // 30km+
    medium: 15000, // 15km+
    short: 5000, // 5km+
  },
  
  // Time categories (in seconds)
  duration: {
    ultraLong: 14400, // 4+ hours
    veryLong: 10800, // 3+ hours
    long: 7200, // 2+ hours
    medium: 3600, // 1+ hour
    short: 1800, // 30+ minutes
  },
};

export const CALCULATION_DEFAULTS = {
  // Default values for missing data
  defaults: {
    speed: 0,
    heartRate: 0,
    elevation: 0,
    power: 0,
  },
  
  // Precision settings
  precision: {
    distance: 1, // decimal places for distance display
    speed: 1, // decimal places for speed display
    percentage: 1, // decimal places for percentage display
    time: 0, // decimal places for time calculations
  },
  
  // Units conversion
  units: {
    metersToKm: 1000,
    metersToMiles: 1609.34,
    secondsToMinutes: 60,
    secondsToHours: 3600,
    msToKmh: 3.6, // meters/second to km/hour
    msToMph: 2.237, // meters/second to miles/hour
  },
};