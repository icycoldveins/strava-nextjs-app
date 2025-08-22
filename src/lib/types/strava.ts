// Strava API Response Types

export interface StravaActivity {
  id: number;
  name: string;
  type: string;
  sport_type: string;
  distance: number; // meters
  moving_time: number; // seconds
  elapsed_time: number; // seconds
  total_elevation_gain: number;
  start_date: string;
  start_date_local: string;
  timezone: string;
  location_city?: string;
  location_state?: string;
  location_country?: string;
  achievement_count: number;
  kudos_count: number;
  comment_count: number;
  athlete_count: number;
  photo_count: number;
  map?: {
    id: string;
    summary_polyline: string;
    resource_state: number;
  };
  average_speed: number;
  max_speed: number;
  average_heartrate?: number;
  max_heartrate?: number;
  average_watts?: number;
  kilojoules?: number;
  device_watts?: boolean;
  calories?: number;
  gear_id?: string;
  trainer?: boolean;
  commute?: boolean;
  manual?: boolean;
  private?: boolean;
  visibility?: string;
  flagged?: boolean;
  workout_type?: number;
  upload_id?: number;
  external_id?: string;
  from_accepted_tag?: boolean;
  segment_efforts?: StravaSegmentEffort[];
  splits_metric?: StravaLap[];
  splits_standard?: StravaLap[];
  laps?: StravaLap[];
  best_efforts?: StravaBestEffort[];
}

export interface StravaSegmentEffort {
  id: number;
  resource_state: number;
  name: string;
  activity: {
    id: number;
    resource_state: number;
  };
  athlete: {
    id: number;
    resource_state: number;
  };
  elapsed_time: number;
  moving_time: number;
  start_date: string;
  start_date_local: string;
  distance: number;
  start_index: number;
  end_index: number;
  average_cadence?: number;
  device_watts?: boolean;
  average_watts?: number;
  segment: {
    id: number;
    resource_state: number;
    name: string;
    activity_type: string;
    distance: number;
    average_grade: number;
    maximum_grade: number;
    elevation_high: number;
    elevation_low: number;
    start_latlng?: [number, number];
    end_latlng?: [number, number];
    climb_category: number;
    city: string;
    state: string;
    country: string;
    private: boolean;
    hazardous: boolean;
    starred: boolean;
  };
  kom_rank?: number;
  pr_rank?: number;
  achievements?: Array<{
    type_id: number;
    type: string;
    rank: number;
  }>;
  hidden: boolean;
}

export interface StravaLap {
  id: number;
  resource_state: number;
  name: string;
  activity: {
    id: number;
    resource_state: number;
  };
  athlete: {
    id: number;
    resource_state: number;
  };
  elapsed_time: number;
  moving_time: number;
  start_date: string;
  start_date_local: string;
  distance: number;
  start_index: number;
  end_index: number;
  total_elevation_gain: number;
  average_speed: number;
  max_speed: number;
  average_cadence?: number;
  device_watts?: boolean;
  average_watts?: number;
  average_heartrate?: number;
  max_heartrate?: number;
  lap_index: number;
  split: number;
}

export interface StravaBestEffort {
  id: number;
  resource_state: number;
  name: string;
  activity: {
    id: number;
    resource_state: number;
  };
  athlete: {
    id: number;
    resource_state: number;
  };
  elapsed_time: number;
  moving_time: number;
  start_date: string;
  start_date_local: string;
  distance: number;
  start_index: number;
  end_index: number;
  pr_rank?: number;
  achievements?: Array<{
    type_id: number;
    type: string;
    rank: number;
  }>;
}

export interface StravaAthlete {
  id: number;
  username?: string;
  resource_state: number;
  firstname?: string;
  lastname?: string;
  bio?: string;
  city?: string;
  state?: string;
  country?: string;
  sex?: 'M' | 'F';
  premium?: boolean;
  summit?: boolean;
  created_at?: string;
  updated_at?: string;
  badge_type_id?: number;
  weight?: number;
  profile_medium?: string;
  profile?: string;
  friend?: string;
  follower?: string;
  blocked?: boolean;
  can_follow?: boolean;
  follower_count?: number;
  friend_count?: number;
  mutual_friend_count?: number;
  athlete_type?: number;
  date_preference?: string;
  measurement_preference?: 'feet' | 'meters';
  clubs?: StravaClub[];
  ftp?: number;
  bikes?: StravaGear[];
  shoes?: StravaGear[];
}

export interface StravaGear {
  id: string;
  primary: boolean;
  name: string;
  nickname?: string;
  resource_state: number;
  retired: boolean;
  distance: number;
  converted_distance?: number;
  brand_name?: string;
  model_name?: string;
  frame_type?: number;
  description?: string;
}

export interface StravaClub {
  id: number;
  resource_state: number;
  name: string;
  profile_medium?: string;
  profile?: string;
  cover_photo?: string;
  cover_photo_small?: string;
  sport_type?: string;
  activity_types?: string[];
  city?: string;
  state?: string;
  country?: string;
  private?: boolean;
  member_count?: number;
  featured?: boolean;
  verified?: boolean;
  url?: string;
}

export interface StravaStats {
  biggest_ride_distance?: number;
  biggest_climb_elevation_gain?: number;
  recent_ride_totals?: StravaStatsTotals;
  recent_run_totals?: StravaStatsTotals;
  recent_swim_totals?: StravaStatsTotals;
  ytd_ride_totals?: StravaStatsTotals;
  ytd_run_totals?: StravaStatsTotals;
  ytd_swim_totals?: StravaStatsTotals;
  all_ride_totals?: StravaStatsTotals;
  all_run_totals?: StravaStatsTotals;
  all_swim_totals?: StravaStatsTotals;
}

export interface StravaStatsTotals {
  count: number;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  elevation_gain: number;
  achievement_count?: number;
}

export interface FormattedActivity {
  id: number;
  name: string;
  type: string;
  sport_type: string;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  total_elevation_gain: number;
  start_date: string;
  start_date_local: string;
  timezone: string;
  location: {
    city?: string;
    state?: string;
    country?: string;
  };
  achievement_count: number;
  kudos_count: number;
  comment_count: number;
  athlete_count: number;
  photo_count: number;
  map?: {
    id: string;
    summary_polyline: string;
    resource_state: number;
  };
  average_speed: number;
  max_speed: number;
  average_heartrate?: number;
  max_heartrate?: number;
  average_watts?: number;
  kilojoules?: number;
  device_watts?: boolean;
  calories?: number;
}

export interface HeatmapDataPoint {
  date: string;
  value: number;
  intensity: number;
  activities: FormattedActivity[];
}

export interface FriendActivity {
  athlete: {
    id: number;
    firstname: string;
    lastname: string;
    profile?: string;
    profile_medium?: string;
  };
  activity: FormattedActivity;
}