'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { WeatherData, ActivityWithWeather } from '@/lib/types/weather';
import { 
  Cloud, 
  CloudRain, 
  CloudSnow, 
  Sun, 
  Wind, 
  Droplets, 
  Eye,
  Thermometer,
  Gauge
} from 'lucide-react';

interface WeatherCardProps {
  activity: ActivityWithWeather;
  showPerformanceImpact?: boolean;
  compact?: boolean;
}

export function WeatherCard({ 
  activity, 
  showPerformanceImpact = true, 
  compact = false 
}: WeatherCardProps) {
  if (!activity.weather) {
    return (
      <Card className="p-4">
        <div className="text-center text-gray-500">
          <Cloud className="h-8 w-8 mx-auto mb-2" />
          <p className="text-sm">Weather data not available</p>
        </div>
      </Card>
    );
  }

  const weather = activity.weather;
  const mainWeather = weather.weather[0];

  const getWeatherIcon = (weatherType: string, iconCode: string) => {
    const isDay = iconCode.includes('d');
    
    switch (weatherType.toLowerCase()) {
      case 'clear':
        return <Sun className="h-6 w-6 text-yellow-500" />;
      case 'clouds':
        return <Cloud className="h-6 w-6 text-gray-500" />;
      case 'rain':
      case 'drizzle':
        return <CloudRain className="h-6 w-6 text-blue-500" />;
      case 'snow':
        return <CloudSnow className="h-6 w-6 text-blue-200" />;
      case 'mist':
      case 'fog':
      case 'haze':
        return <Cloud className="h-6 w-6 text-gray-400" />;
      default:
        return <Sun className="h-6 w-6 text-yellow-500" />;
    }
  };

  const getTemperatureColor = (temp: number) => {
    if (temp < 0) return 'text-blue-600';
    if (temp < 10) return 'text-blue-400';
    if (temp < 20) return 'text-green-500';
    if (temp < 30) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getWindDescription = (speed: number) => {
    if (speed < 2) return 'Calm';
    if (speed < 6) return 'Light breeze';
    if (speed < 12) return 'Moderate breeze';
    if (speed < 20) return 'Fresh breeze';
    return 'Strong wind';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const calculatePerformanceImpact = (): { score: number; description: string; color: string } => {
    // Simplified performance impact calculation
    let impact = 0;
    
    // Temperature impact (optimal range 10-18°C for running)
    const temp = weather.main.temp;
    if (temp >= 10 && temp <= 18) {
      impact += 0.2;
    } else if (temp < 10) {
      impact -= (10 - temp) * 0.1;
    } else {
      impact -= (temp - 18) * 0.1;
    }
    
    // Wind impact
    impact -= weather.wind.speed * 0.05;
    
    // Humidity impact
    if (weather.main.humidity > 70) {
      impact -= (weather.main.humidity - 70) * 0.01;
    }
    
    // Precipitation impact
    if (weather.rain || weather.snow) {
      impact -= 0.3;
    }
    
    // Clamp between -1 and 1
    impact = Math.max(-1, Math.min(1, impact));
    
    let description: string;
    let color: string;
    
    if (impact > 0.1) {
      description = 'Favorable';
      color = 'text-green-600';
    } else if (impact > -0.1) {
      description = 'Neutral';
      color = 'text-yellow-600';
    } else if (impact > -0.5) {
      description = 'Challenging';
      color = 'text-orange-600';
    } else {
      description = 'Difficult';
      color = 'text-red-600';
    }
    
    return { score: impact, description, color };
  };

  if (compact) {
    return (
      <Card className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getWeatherIcon(mainWeather.main, mainWeather.icon)}
            <div>
              <p className={`text-lg font-semibold ${getTemperatureColor(weather.main.temp)}`}>
                {Math.round(weather.main.temp)}°C
              </p>
              <p className="text-xs text-gray-500">{mainWeather.description}</p>
            </div>
          </div>
          <div className="text-right text-xs text-gray-500">
            <p className="flex items-center"><Wind className="h-3 w-3 mr-1" />{weather.wind.speed} m/s</p>
            <p className="flex items-center"><Droplets className="h-3 w-3 mr-1" />{weather.main.humidity}%</p>
          </div>
        </div>
      </Card>
    );
  }

  const performanceImpact = showPerformanceImpact ? calculatePerformanceImpact() : null;

  return (
    <Card className="p-4">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getWeatherIcon(mainWeather.main, mainWeather.icon)}
            <div>
              <h3 className="font-semibold text-lg capitalize">{mainWeather.description}</h3>
              <p className="text-sm text-gray-500">{formatDate(activity.start_date)}</p>
            </div>
          </div>
          {weather.location.city && (
            <div className="text-right text-sm text-gray-500">
              <p>{weather.location.city}</p>
              {weather.location.country && <p>{weather.location.country}</p>}
            </div>
          )}
        </div>

        {/* Main Weather Info */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <Thermometer className="h-5 w-5 text-gray-400" />
            <div>
              <p className={`text-2xl font-bold ${getTemperatureColor(weather.main.temp)}`}>
                {Math.round(weather.main.temp)}°C
              </p>
              <p className="text-xs text-gray-500">
                Feels like {Math.round(weather.main.feels_like)}°C
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Wind className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-lg font-semibold">{weather.wind.speed} m/s</p>
              <p className="text-xs text-gray-500">{getWindDescription(weather.wind.speed)}</p>
            </div>
          </div>
        </div>

        {/* Additional Weather Details */}
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="flex items-center space-x-1">
            <Droplets className="h-4 w-4 text-blue-400" />
            <div>
              <p className="font-medium">{weather.main.humidity}%</p>
              <p className="text-xs text-gray-500">Humidity</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-1">
            <Gauge className="h-4 w-4 text-gray-400" />
            <div>
              <p className="font-medium">{weather.main.pressure}</p>
              <p className="text-xs text-gray-500">hPa</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-1">
            <Eye className="h-4 w-4 text-gray-400" />
            <div>
              <p className="font-medium">{(weather.visibility / 1000).toFixed(1)}km</p>
              <p className="text-xs text-gray-500">Visibility</p>
            </div>
          </div>
        </div>

        {/* Precipitation */}
        {(weather.rain || weather.snow) && (
          <div className="border-t pt-3">
            <h4 className="text-sm font-medium mb-2">Precipitation</h4>
            <div className="flex space-x-4 text-sm">
              {weather.rain && (
                <div className="flex items-center space-x-1">
                  <CloudRain className="h-4 w-4 text-blue-500" />
                  <span>Rain: {weather.rain['1h'] || weather.rain['3h'] || 0}mm</span>
                </div>
              )}
              {weather.snow && (
                <div className="flex items-center space-x-1">
                  <CloudSnow className="h-4 w-4 text-blue-200" />
                  <span>Snow: {weather.snow['1h'] || weather.snow['3h'] || 0}mm</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Performance Impact */}
        {showPerformanceImpact && performanceImpact && (
          <div className="border-t pt-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Performance Impact</h4>
              <div className="text-right">
                <p className={`font-semibold ${performanceImpact.color}`}>
                  {performanceImpact.description}
                </p>
                <p className="text-xs text-gray-500">
                  Score: {(performanceImpact.score * 100).toFixed(0)}%
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Activity Performance */}
        {activity.pace && (
          <div className="border-t pt-3 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Activity Pace:</span>
              <span className="font-semibold">
                {activity.pace.toFixed(2)} min/km
              </span>
            </div>
            {activity.average_speed && (
              <div className="flex justify-between items-center mt-1">
                <span className="text-gray-600">Average Speed:</span>
                <span className="font-semibold">
                  {(activity.average_speed * 3.6).toFixed(1)} km/h
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}