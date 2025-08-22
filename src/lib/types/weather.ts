export interface WeatherData {
  timestamp: string;
  location: {
    lat: number;
    lon: number;
    city?: string;
    country?: string;
  };
  main: {
    temp: number; // Celsius
    feels_like: number;
    temp_min: number;
    temp_max: number;
    pressure: number; // hPa
    humidity: number; // %
  };
  wind: {
    speed: number; // m/s
    deg: number; // degrees
    gust?: number; // m/s
  };
  visibility: number; // meters
  clouds: {
    all: number; // % cloudiness
  };
  weather: Array<{
    id: number;
    main: string; // Rain, Snow, Clear, etc.
    description: string;
    icon: string;
  }>;
  rain?: {
    '1h'?: number; // mm/h
    '3h'?: number; // mm/3h
  };
  snow?: {
    '1h'?: number; // mm/h
    '3h'?: number; // mm/3h
  };
}

export interface ActivityWithWeather {
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
  timezone: string;
  location: {
    city?: string;
    state?: string;
    country?: string;
  };
  average_speed: number; // m/s
  max_speed: number;
  average_heartrate?: number;
  max_heartrate?: number;
  average_watts?: number;
  calories?: number;
  map?: {
    id: string;
    summary_polyline: string;
    resource_state: number;
  };
  weather?: WeatherData;
  pace?: number; // min/km (calculated)
  performance_score?: number; // calculated performance metric
}

export interface WeatherImpact {
  temperature: {
    optimal_range: [number, number]; // [min, max] in Celsius
    impact_score: number; // -1 to 1 (negative = worse performance)
    correlation: number; // correlation coefficient
  };
  wind: {
    headwind_impact: number; // negative impact on performance
    tailwind_benefit: number; // positive impact on performance
    crosswind_impact: number;
  };
  humidity: {
    impact_score: number;
    correlation: number;
  };
  precipitation: {
    impact_score: number;
    rain_penalty: number;
    snow_penalty: number;
  };
  visibility: {
    impact_score: number;
    correlation: number;
  };
  overall_weather_score: number; // composite score
}

export interface PerformanceCorrelation {
  activity_id: number;
  weather_conditions: WeatherData;
  performance_metrics: {
    pace: number; // min/km
    speed: number; // m/s
    relative_performance: number; // compared to personal average
    effort_level: number; // based on heart rate if available
  };
  weather_impact: WeatherImpact;
}

export interface WeatherAnalysis {
  activities_analyzed: number;
  date_range: {
    start: string;
    end: string;
  };
  optimal_conditions: {
    temperature: number;
    humidity: number;
    wind_speed: number;
    weather_type: string;
  };
  correlations: {
    temperature_vs_pace: number;
    humidity_vs_pace: number;
    wind_vs_pace: number;
    pressure_vs_pace: number;
  };
  seasonal_patterns: {
    [season: string]: {
      average_pace: number;
      activity_count: number;
      weather_conditions: Partial<WeatherData['main']>;
    };
  };
  performance_predictions: {
    current_conditions: WeatherData;
    predicted_pace: number;
    confidence: number;
  };
  insights: string[];
}

export interface WeatherCache {
  [key: string]: {
    data: WeatherData;
    timestamp: number;
    expires: number;
  };
}

export type WeatherApiProvider = 'openweathermap' | 'mock';

export interface WeatherServiceConfig {
  provider: WeatherApiProvider;
  apiKey?: string;
  baseUrl?: string;
  cacheExpiry?: number; // milliseconds
}

// Mock weather data for development/demo
export interface MockWeatherCondition {
  type: 'clear' | 'cloudy' | 'rain' | 'snow' | 'fog' | 'wind';
  temperature: number;
  humidity: number;
  wind_speed: number;
  precipitation: number;
}