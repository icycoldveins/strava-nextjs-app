'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { WeatherCard } from './WeatherCard';
import { WeatherCorrelationChart } from './WeatherCorrelationChart';
import { WeatherAnalyzer, enrichActivitiesWithWeather } from '@/lib/weatherAnalysis';
import { ActivityWithWeather, WeatherData, WeatherAnalysis } from '@/lib/types/weather';
import { 
  CloudRain, 
  Sun, 
  Wind,
  RefreshCw,
  AlertCircle,
  Lightbulb,
  Activity,
  Target,
} from 'lucide-react';

interface WeatherImpactProps {
  className?: string;
}

export function WeatherImpact({ className = '' }: WeatherImpactProps) {
  const [activities, setActivities] = useState<ActivityWithWeather[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<WeatherAnalysis | null>(null);
  const [selectedActivityType, setSelectedActivityType] = useState<string>('all');
  const [selectedChartType, setSelectedChartType] = useState<'scatter' | 'line' | 'bar' | 'heatmap'>('scatter');
  const [selectedMetric, setSelectedMetric] = useState<'temperature' | 'humidity' | 'wind' | 'pressure'>('temperature');
  const [refreshing, setRefreshing] = useState(false);

  // Fetch activities and weather data
  useEffect(() => {
    fetchActivitiesWithWeather();
  }, []);

  const fetchActivitiesWithWeather = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch activities from Strava API
      const activitiesResponse = await fetch('/api/strava/activities?per_page=30');
      if (!activitiesResponse.ok) {
        throw new Error('Failed to fetch activities');
      }

      const activitiesData = await activitiesResponse.json();
      const stravaActivities = activitiesData.activities;

      if (!stravaActivities || stravaActivities.length === 0) {
        setActivities([]);
        setLoading(false);
        return;
      }

      // Extract location data for weather requests
      const activitiesWithLocation = stravaActivities
        .filter((activity: { map?: { summary_polyline?: string } }) => activity.map?.summary_polyline)
        .map((activity: { id: number; start_date: string; map?: { summary_polyline?: string } }) => {
          // For demo purposes, use approximate coordinates
          // In a real app, you'd decode the polyline to get start coordinates
          const lat = 37.7749 + (Math.random() - 0.5) * 0.1; // San Francisco area
          const lon = -122.4194 + (Math.random() - 0.5) * 0.1;
          
          return {
            id: activity.id,
            lat,
            lon,
            timestamp: activity.start_date,
          };
        });

      if (activitiesWithLocation.length === 0) {
        setActivities(stravaActivities);
        setLoading(false);
        return;
      }

      // Fetch weather data for activities
      const weatherResponse = await fetch('/api/weather', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          activities: activitiesWithLocation,
        }),
      });

      if (!weatherResponse.ok) {
        throw new Error('Failed to fetch weather data');
      }

      const weatherData = await weatherResponse.json();
      const weatherMap = new Map<number, WeatherData>();

      Object.entries(weatherData.weather_data).forEach(([activityId, weather]) => {
        weatherMap.set(parseInt(activityId), weather as WeatherData);
      });

      // Enrich activities with weather data
      const enrichedActivities = enrichActivitiesWithWeather(stravaActivities, weatherMap);
      setActivities(enrichedActivities);

      // Perform weather analysis
      const analyzer = new WeatherAnalyzer(enrichedActivities);
      const analysisResult = analyzer.analyze();
      setAnalysis(analysisResult);

    } catch (err) {
      console.error('Error fetching weather data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load weather data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchActivitiesWithWeather();
    setRefreshing(false);
  };

  // Filter activities by type
  const filteredActivities = useMemo(() => {
    if (selectedActivityType === 'all') {
      return activities;
    }
    return activities.filter(activity => activity.type === selectedActivityType);
  }, [activities, selectedActivityType]);

  // Get unique activity types
  const activityTypes = useMemo(() => {
    const types = [...new Set(activities.map(activity => activity.type))];
    return types.sort();
  }, [activities]);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const activitiesWithWeather = filteredActivities.filter(a => a.weather);
    
    if (activitiesWithWeather.length === 0) {
      return {
        totalActivities: 0,
        withWeatherData: 0,
        avgTemperature: 0,
        avgHumidity: 0,
        mostCommonWeather: 'N/A',
      };
    }

    const totalTemp = activitiesWithWeather.reduce((sum, a) => sum + a.weather!.main.temp, 0);
    const totalHumidity = activitiesWithWeather.reduce((sum, a) => sum + a.weather!.main.humidity, 0);
    
    const weatherTypes: { [key: string]: number } = {};
    activitiesWithWeather.forEach(a => {
      const weatherType = a.weather!.weather[0].main;
      weatherTypes[weatherType] = (weatherTypes[weatherType] || 0) + 1;
    });

    const mostCommon = Object.entries(weatherTypes).reduce((a, b) => a[1] > b[1] ? a : b);

    return {
      totalActivities: filteredActivities.length,
      withWeatherData: activitiesWithWeather.length,
      avgTemperature: totalTemp / activitiesWithWeather.length,
      avgHumidity: totalHumidity / activitiesWithWeather.length,
      mostCommonWeather: mostCommon[0],
    };
  }, [filteredActivities]);

  if (loading) {
    return (
      <Card className={`p-8 ${className}`}>
        <div className="flex items-center justify-center space-x-2">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <p className="text-lg">Loading weather impact analysis...</p>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`p-8 ${className}`}>
        <div className="text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
          <div>
            <h3 className="text-lg font-semibold text-red-600">Error Loading Weather Data</h3>
            <p className="text-gray-600 mt-2">{error}</p>
          </div>
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </Card>
    );
  }

  if (activities.length === 0) {
    return (
      <Card className={`p-8 ${className}`}>
        <div className="text-center space-y-4">
          <Activity className="h-12 w-12 text-gray-400 mx-auto" />
          <div>
            <h3 className="text-lg font-semibold">No Activities Found</h3>
            <p className="text-gray-600 mt-2">
              Connect your Strava account and record some activities to see weather impact analysis.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center">
            <CloudRain className="h-8 w-8 mr-3 text-blue-500" />
            Weather Impact Analysis
          </h2>
          <p className="text-gray-600 mt-1">
            Understand how weather conditions affect your performance
          </p>
        </div>
        <Button 
          onClick={handleRefresh} 
          variant="outline" 
          disabled={refreshing}
          className="flex items-center"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh Data
        </Button>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Activities Analyzed</p>
              <p className="text-2xl font-bold">{summaryStats.withWeatherData}</p>
              <p className="text-xs text-gray-500">of {summaryStats.totalActivities} total</p>
            </div>
            <Activity className="h-8 w-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Temperature</p>
              <p className="text-2xl font-bold">{summaryStats.avgTemperature.toFixed(1)}°C</p>
              <p className="text-xs text-gray-500">across activities</p>
            </div>
            <Sun className="h-8 w-8 text-yellow-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Humidity</p>
              <p className="text-2xl font-bold">{summaryStats.avgHumidity.toFixed(0)}%</p>
              <p className="text-xs text-gray-500">average level</p>
            </div>
            <Wind className="h-8 w-8 text-gray-500" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Common Weather</p>
              <p className="text-2xl font-bold">{summaryStats.mostCommonWeather}</p>
              <p className="text-xs text-gray-500">most frequent</p>
            </div>
            <CloudRain className="h-8 w-8 text-blue-500" />
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium">Activity Type:</label>
          <Select value={selectedActivityType} onValueChange={setSelectedActivityType}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {activityTypes.map(type => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium">Chart Type:</label>
          <Select value={selectedChartType} onValueChange={(value: 'scatter' | 'line' | 'bar' | 'heatmap') => setSelectedChartType(value)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="scatter">Scatter Plot</SelectItem>
              <SelectItem value="line">Seasonal</SelectItem>
              <SelectItem value="bar">Correlations</SelectItem>
              <SelectItem value="heatmap">Optimal Conditions</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {selectedChartType === 'scatter' && (
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium">Metric:</label>
            <Select value={selectedMetric} onValueChange={(value: 'temperature' | 'humidity' | 'wind' | 'pressure') => setSelectedMetric(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="temperature">Temperature</SelectItem>
                <SelectItem value="humidity">Humidity</SelectItem>
                <SelectItem value="wind">Wind Speed</SelectItem>
                <SelectItem value="pressure">Pressure</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Charts */}
      {analysis && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <WeatherCorrelationChart
            activities={filteredActivities}
            analysis={analysis}
            chartType={selectedChartType}
            metric={selectedMetric}
          />

          {/* Insights Card */}
          <Card className="p-4">
            <div className="flex items-center mb-4">
              <Lightbulb className="h-5 w-5 text-yellow-500 mr-2" />
              <h3 className="text-lg font-semibold">Key Insights</h3>
            </div>
            <div className="space-y-3">
              {analysis.insights.map((insight, index) => (
                <div key={index} className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-sm text-gray-700">{insight}</p>
                </div>
              ))}
            </div>

            {analysis.optimal_conditions && (
              <div className="mt-6 p-3 bg-green-50 rounded-lg">
                <div className="flex items-center mb-2">
                  <Target className="h-4 w-4 text-green-600 mr-2" />
                  <h4 className="font-medium text-green-800">Optimal Conditions</h4>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-green-700">Temperature:</span>
                    <span className="ml-1 font-medium">{analysis.optimal_conditions.temperature}°C</span>
                  </div>
                  <div>
                    <span className="text-green-700">Humidity:</span>
                    <span className="ml-1 font-medium">{analysis.optimal_conditions.humidity}%</span>
                  </div>
                  <div>
                    <span className="text-green-700">Wind:</span>
                    <span className="ml-1 font-medium">{analysis.optimal_conditions.wind_speed} m/s</span>
                  </div>
                  <div>
                    <span className="text-green-700">Weather:</span>
                    <span className="ml-1 font-medium">{analysis.optimal_conditions.weather_type}</span>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Recent Activities with Weather */}
      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-4">Recent Activities</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredActivities
            .filter(activity => activity.weather)
            .slice(0, 6)
            .map((activity) => (
              <WeatherCard
                key={activity.id}
                activity={activity}
                showPerformanceImpact={true}
                compact={true}
              />
            ))}
        </div>
        
        {filteredActivities.filter(a => a.weather).length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <CloudRain className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No activities with weather data found</p>
            <p className="text-sm mt-1">Weather data will be fetched for future activities</p>
          </div>
        )}
      </Card>
    </div>
  );
}