export interface HeatmapActivity {
  id: number;
  name: string;
  type: string;
  sport_type?: string;
  distance: number; // meters
  moving_time: number; // seconds
  elapsed_time: number; // seconds
  start_date: string;
  start_date_local: string;
  total_elevation_gain: number; // meters
  average_speed?: number;
  max_speed?: number;
  average_heartrate?: number;
  max_heartrate?: number;
  calories?: number;
  kilojoules?: number;
}

export interface HeatmapDataPoint {
  date: string; // YYYY-MM-DD format
  value: number; // intensity score
  count: number; // number of activities
  activities: HeatmapActivity[];
}

export interface HeatmapValue {
  date: string; // Changed to string for react-calendar-heatmap compatibility
  count: number;
}

export interface HeatmapTooltipData {
  date: string;
  value: number;
  count: number;
  activities: {
    name: string;
    type: string;
    distance: number;
    time: number;
  }[];
}

export type HeatmapViewMode = 'year' | '6months' | '3months';

export type HeatmapMetricType = 'distance' | 'time' | 'count' | 'intensity';

export interface HeatmapFilters {
  viewMode: HeatmapViewMode;
  metricType: HeatmapMetricType;
  activityTypes?: string[];
}

export interface HeatmapStats {
  totalActivities: number;
  totalDistance: number;
  totalTime: number;
  averageIntensity: number;
  bestStreak: number;
  currentStreak: number;
  activeDays: number;
  totalDays: number;
}

export interface HeatmapResponse {
  data: HeatmapDataPoint[];
  stats: HeatmapStats;
  dateRange: {
    start: string;
    end: string;
  };
}