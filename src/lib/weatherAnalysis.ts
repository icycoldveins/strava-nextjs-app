import {
  ActivityWithWeather,
  WeatherData,
  WeatherImpact,
  WeatherAnalysis,
} from './types/weather';

export class WeatherAnalyzer {
  private activities: ActivityWithWeather[] = [];

  constructor(activities: ActivityWithWeather[]) {
    this.activities = activities.filter(activity => 
      activity.weather && 
      activity.distance > 0 && 
      activity.moving_time > 0
    );
  }

  /**
   * Calculate pace in minutes per kilometer
   */
  private calculatePace(distance: number, movingTime: number): number {
    const distanceKm = distance / 1000;
    const timeMinutes = movingTime / 60;
    return timeMinutes / distanceKm;
  }

  /**
   * Calculate performance score relative to personal average
   */
  private calculateRelativePerformance(activity: ActivityWithWeather): number {
    const sameTypeActivities = this.activities.filter(a => 
      a.type === activity.type && a.sport_type === activity.sport_type
    );
    
    if (sameTypeActivities.length < 2) return 0;

    const avgSpeed = sameTypeActivities.reduce((sum, a) => sum + a.average_speed, 0) / sameTypeActivities.length;
    return ((activity.average_speed - avgSpeed) / avgSpeed) * 100;
  }

  /**
   * Calculate correlation coefficient between two arrays
   */
  private calculateCorrelation(x: number[], y: number[]): number {
    if (x.length !== y.length || x.length < 2) return 0;

    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((acc, xi, i) => acc + xi * y[i], 0);
    const sumXX = x.reduce((acc, xi) => acc + xi * xi, 0);
    const sumYY = y.reduce((acc, yi) => acc + yi * yi, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));

    return denominator === 0 ? 0 : numerator / denominator;
  }

  /**
   * Calculate wind impact based on direction and activity type
   */
  private calculateWindImpact(weather: WeatherData, activityType: string): number {
    const windSpeed = weather.wind.speed;
    
    // Different activities are affected differently by wind
    const windSensitivity = {
      'Run': 1.0,
      'Ride': 1.5,
      'Swim': 0.2,
      'Walk': 0.8,
      'Hike': 0.6,
    };

    const sensitivity = windSensitivity[activityType as keyof typeof windSensitivity] || 1.0;
    
    // Simplified wind impact calculation
    // In a real app, you'd need activity direction to calculate headwind/tailwind
    const impact = -windSpeed * sensitivity * 0.1; // Negative because wind generally slows you down
    return Math.max(-1, Math.min(0, impact));
  }

  /**
   * Calculate temperature impact on performance
   */
  private calculateTemperatureImpact(temp: number, activityType: string): number {
    // Optimal temperature ranges by activity type (Celsius)
    const optimalRanges = {
      'Run': [10, 18],
      'Ride': [15, 25],
      'Swim': [20, 26],
      'Walk': [10, 20],
      'Hike': [8, 20],
    };

    const range = optimalRanges[activityType as keyof typeof optimalRanges] || [10, 20];
    const [minOptimal, maxOptimal] = range;

    if (temp >= minOptimal && temp <= maxOptimal) {
      return 0.1; // Slight performance boost in optimal range
    }

    // Calculate distance from optimal range
    let distance: number;
    if (temp < minOptimal) {
      distance = minOptimal - temp;
    } else {
      distance = temp - maxOptimal;
    }

    // Performance degradation increases with distance from optimal
    const impact = -distance * 0.05;
    return Math.max(-1, Math.min(0.1, impact));
  }

  /**
   * Calculate weather impact for a single activity
   */
  public calculateWeatherImpact(activity: ActivityWithWeather): WeatherImpact {
    if (!activity.weather) {
      throw new Error('Activity must have weather data');
    }

    const weather = activity.weather;
    const tempImpact = this.calculateTemperatureImpact(weather.main.temp, activity.type);
    const windImpact = this.calculateWindImpact(weather, activity.type);
    
    // Humidity impact (high humidity generally decreases performance)
    const humidityImpact = -(weather.main.humidity - 50) * 0.005;
    
    // Precipitation impact
    const hasRain = weather.rain && Object.values(weather.rain).some(val => val > 0);
    const hasSnow = weather.snow && Object.values(weather.snow).some(val => val > 0);
    const precipitationImpact = hasRain ? -0.2 : hasSnow ? -0.3 : 0;

    // Visibility impact
    const visibilityImpact = weather.visibility < 5000 ? -0.1 : 0;

    const overallScore = (
      tempImpact + 
      windImpact + 
      humidityImpact + 
      precipitationImpact + 
      visibilityImpact
    ) / 5;

    return {
      temperature: {
        optimal_range: this.getOptimalTemperatureRange(activity.type),
        impact_score: tempImpact,
        correlation: 0, // Will be calculated in full analysis
      },
      wind: {
        headwind_impact: windImpact,
        tailwind_benefit: 0, // Simplified for now
        crosswind_impact: windImpact * 0.5,
      },
      humidity: {
        impact_score: humidityImpact,
        correlation: 0, // Will be calculated in full analysis
      },
      precipitation: {
        impact_score: precipitationImpact,
        rain_penalty: hasRain ? -0.2 : 0,
        snow_penalty: hasSnow ? -0.3 : 0,
      },
      visibility: {
        impact_score: visibilityImpact,
        correlation: 0, // Will be calculated in full analysis
      },
      overall_weather_score: overallScore,
    };
  }

  /**
   * Get optimal temperature range for activity type
   */
  private getOptimalTemperatureRange(activityType: string): [number, number] {
    const ranges = {
      'Run': [10, 18] as [number, number],
      'Ride': [15, 25] as [number, number],
      'Swim': [20, 26] as [number, number],
      'Walk': [10, 20] as [number, number],
      'Hike': [8, 20] as [number, number],
    };

    return ranges[activityType as keyof typeof ranges] || [10, 20];
  }

  /**
   * Analyze correlations between weather and performance
   */
  public analyzeCorrelations(): {
    temperature_vs_pace: number;
    humidity_vs_pace: number;
    wind_vs_pace: number;
    pressure_vs_pace: number;
  } {
    if (this.activities.length < 3) {
      return {
        temperature_vs_pace: 0,
        humidity_vs_pace: 0,
        wind_vs_pace: 0,
        pressure_vs_pace: 0,
      };
    }

    const temperatures: number[] = [];
    const humidities: number[] = [];
    const windSpeeds: number[] = [];
    const pressures: number[] = [];
    const paces: number[] = [];

    this.activities.forEach(activity => {
      if (activity.weather) {
        temperatures.push(activity.weather.main.temp);
        humidities.push(activity.weather.main.humidity);
        windSpeeds.push(activity.weather.wind.speed);
        pressures.push(activity.weather.main.pressure);
        paces.push(this.calculatePace(activity.distance, activity.moving_time));
      }
    });

    return {
      temperature_vs_pace: this.calculateCorrelation(temperatures, paces),
      humidity_vs_pace: this.calculateCorrelation(humidities, paces),
      wind_vs_pace: this.calculateCorrelation(windSpeeds, paces),
      pressure_vs_pace: this.calculateCorrelation(pressures, paces),
    };
  }

  /**
   * Find optimal weather conditions
   */
  public findOptimalConditions(): {
    temperature: number;
    humidity: number;
    wind_speed: number;
    weather_type: string;
  } {
    if (this.activities.length === 0) {
      return {
        temperature: 15,
        humidity: 50,
        wind_speed: 5,
        weather_type: 'Clear',
      };
    }

    // Find activities with best performance (fastest pace)
    const activitiesWithPace = this.activities.map(activity => ({
      ...activity,
      pace: this.calculatePace(activity.distance, activity.moving_time),
    }));

    // Sort by pace (lower is better)
    activitiesWithPace.sort((a, b) => a.pace - b.pace);

    // Take top 25% of performances
    const topPerformances = activitiesWithPace.slice(0, Math.max(1, Math.floor(activitiesWithPace.length * 0.25)));

    const avgOptimalConditions = topPerformances.reduce(
      (acc, activity) => {
        if (activity.weather) {
          acc.temperature += activity.weather.main.temp;
          acc.humidity += activity.weather.main.humidity;
          acc.wind_speed += activity.weather.wind.speed;
        }
        return acc;
      },
      { temperature: 0, humidity: 0, wind_speed: 0 }
    );

    const count = topPerformances.length;
    const mostCommonWeatherType = this.getMostCommonWeatherType(topPerformances);

    return {
      temperature: Math.round(avgOptimalConditions.temperature / count),
      humidity: Math.round(avgOptimalConditions.humidity / count),
      wind_speed: Math.round((avgOptimalConditions.wind_speed / count) * 10) / 10,
      weather_type: mostCommonWeatherType,
    };
  }

  /**
   * Get most common weather type from activities
   */
  private getMostCommonWeatherType(activities: ActivityWithWeather[]): string {
    const weatherCounts: { [key: string]: number } = {};

    activities.forEach(activity => {
      if (activity.weather && activity.weather.weather.length > 0) {
        const weatherType = activity.weather.weather[0].main;
        weatherCounts[weatherType] = (weatherCounts[weatherType] || 0) + 1;
      }
    });

    const mostCommon = Object.entries(weatherCounts).reduce((a, b) => a[1] > b[1] ? a : b);
    return mostCommon[0] || 'Clear';
  }

  /**
   * Analyze seasonal patterns
   */
  public analyzeSeasonalPatterns(): {
    [season: string]: {
      average_pace: number;
      activity_count: number;
      weather_conditions: Partial<WeatherData['main']>;
    };
  } {
    const seasons: Record<string, ActivityWithWeather[]> = { Spring: [], Summer: [], Fall: [], Winter: [] };

    this.activities.forEach(activity => {
      const month = new Date(activity.start_date).getMonth();
      let season: string;

      if (month >= 2 && month <= 4) season = 'Spring';
      else if (month >= 5 && month <= 7) season = 'Summer';
      else if (month >= 8 && month <= 10) season = 'Fall';
      else season = 'Winter';

      seasons[season].push(activity);
    });

    const result: Record<string, {
      average_pace: number;
      activity_count: number;
      weather_conditions: Partial<WeatherData['main']>;
    }> = {};

    Object.entries(seasons).forEach(([season, activities]: [string, ActivityWithWeather[]]) => {
      if (activities.length === 0) {
        result[season] = {
          average_pace: 0,
          activity_count: 0,
          weather_conditions: {},
        };
        return;
      }

      const totalPace = activities.reduce((sum, activity) => 
        sum + this.calculatePace(activity.distance, activity.moving_time), 0
      );

      const weatherConditions = activities
        .filter(a => a.weather)
        .reduce((acc, activity) => {
          if (activity.weather) {
            acc.temp += activity.weather.main.temp;
            acc.humidity += activity.weather.main.humidity;
            acc.pressure += activity.weather.main.pressure;
          }
          return acc;
        }, { temp: 0, humidity: 0, pressure: 0 });

      const weatherCount = activities.filter(a => a.weather).length;

      result[season] = {
        average_pace: totalPace / activities.length,
        activity_count: activities.length,
        weather_conditions: weatherCount > 0 ? {
          temp: weatherConditions.temp / weatherCount,
          humidity: weatherConditions.humidity / weatherCount,
          pressure: weatherConditions.pressure / weatherCount,
        } : {},
      };
    });

    return result;
  }

  /**
   * Predict performance for given weather conditions
   */
  public predictPerformance(currentWeather: WeatherData, activityType: string): {
    predicted_pace: number;
    confidence: number;
  } {
    const sameTypeActivities = this.activities.filter(a => 
      a.type === activityType && a.weather
    );

    if (sameTypeActivities.length < 3) {
      return {
        predicted_pace: 0,
        confidence: 0,
      };
    }

    // Calculate baseline performance for this activity type
    const baselinePace = sameTypeActivities.reduce((sum, activity) => 
      sum + this.calculatePace(activity.distance, activity.moving_time), 0
    ) / sameTypeActivities.length;

    // Calculate weather impact
    const tempImpact = this.calculateTemperatureImpact(currentWeather.main.temp, activityType);
    const windImpact = this.calculateWindImpact(currentWeather, activityType);
    const humidityImpact = -(currentWeather.main.humidity - 50) * 0.005;

    const totalImpact = tempImpact + windImpact + humidityImpact;
    const adjustmentFactor = 1 + (totalImpact * 0.1); // Convert impact to pace adjustment

    const predictedPace = baselinePace * adjustmentFactor;
    
    // Confidence based on amount of historical data and weather similarity
    const confidence = Math.min(0.9, sameTypeActivities.length / 20);

    return {
      predicted_pace: predictedPace,
      confidence,
    };
  }

  /**
   * Generate insights based on analysis
   */
  public generateInsights(): string[] {
    const insights: string[] = [];
    const correlations = this.analyzeCorrelations();
    const optimalConditions = this.findOptimalConditions();

    // Temperature insights
    if (Math.abs(correlations.temperature_vs_pace) > 0.3) {
      const direction = correlations.temperature_vs_pace > 0 ? 'slower' : 'faster';
      insights.push(`Your pace tends to be ${direction} in warmer temperatures (correlation: ${(correlations.temperature_vs_pace * 100).toFixed(1)}%)`);
    }

    // Optimal conditions
    insights.push(`Your best performances occur around ${optimalConditions.temperature}°C with ${optimalConditions.humidity}% humidity`);

    // Wind insights
    if (Math.abs(correlations.wind_vs_pace) > 0.2) {
      insights.push(`Wind significantly impacts your performance (correlation: ${(correlations.wind_vs_pace * 100).toFixed(1)}%)`);
    }

    // Activity count insights
    if (this.activities.length >= 10) {
      insights.push(`Analysis based on ${this.activities.length} activities with weather data`);
    } else {
      insights.push(`Limited data available (${this.activities.length} activities). More activities will improve accuracy.`);
    }

    return insights;
  }

  /**
   * Perform complete weather analysis
   */
  public analyze(): WeatherAnalysis {
    const correlations = this.analyzeCorrelations();
    const optimalConditions = this.findOptimalConditions();
    const seasonalPatterns = this.analyzeSeasonalPatterns();
    const insights = this.generateInsights();

    const dateRange = this.activities.length > 0 ? {
      start: this.activities.reduce((earliest, activity) => 
        activity.start_date < earliest ? activity.start_date : earliest
      , this.activities[0].start_date),
      end: this.activities.reduce((latest, activity) => 
        activity.start_date > latest ? activity.start_date : latest
      , this.activities[0].start_date),
    } : { start: '', end: '' };

    return {
      activities_analyzed: this.activities.length,
      date_range: dateRange,
      optimal_conditions: optimalConditions,
      correlations,
      seasonal_patterns: seasonalPatterns,
      performance_predictions: {
        current_conditions: optimalConditions, // Placeholder
        predicted_pace: 0,
        confidence: 0,
      },
      insights,
    };
  }
}

// Utility functions
export function enrichActivitiesWithWeather(
  activities: ActivityWithWeather[],
  weatherData: Map<number, WeatherData>
): ActivityWithWeather[] {
  return activities.map(activity => {
    const weather = weatherData.get(activity.id);
    const pace = weather ? (activity.moving_time / 60) / (activity.distance / 1000) : undefined;
    
    return {
      ...activity,
      weather,
      pace,
      performance_score: weather ? calculatePerformanceScore(activity) : undefined,
    };
  });
}

function calculatePerformanceScore(activity: ActivityWithWeather): number {
  // Simple performance score based on pace and heart rate
  const basePace = activity.moving_time / (activity.distance / 1000);
  const hrFactor = activity.average_heartrate ? activity.average_heartrate / 150 : 1;
  return basePace * hrFactor;
}