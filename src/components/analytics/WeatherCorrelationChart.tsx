'use client';

import React from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  Legend,
  Cell,
} from 'recharts';
import { Card } from '@/components/ui/card';
import { ActivityWithWeather, WeatherAnalysis } from '@/lib/types/weather';

interface WeatherCorrelationChartProps {
  activities: ActivityWithWeather[];
  analysis: WeatherAnalysis;
  chartType?: 'scatter' | 'line' | 'bar' | 'heatmap';
  metric?: 'temperature' | 'humidity' | 'wind' | 'pressure';
  className?: string;
}

export function WeatherCorrelationChart({
  activities,
  analysis,
  chartType = 'scatter',
  metric = 'temperature',
  className = '',
}: WeatherCorrelationChartProps) {
  // Prepare data for different chart types
  const prepareScatterData = () => {
    return activities
      .filter(activity => activity.weather && activity.pace)
      .map(activity => {
        const weather = activity.weather!;
        let xValue: number;
        let xLabel: string;

        switch (metric) {
          case 'temperature':
            xValue = weather.main.temp;
            xLabel = 'Temperature (°C)';
            break;
          case 'humidity':
            xValue = weather.main.humidity;
            xLabel = 'Humidity (%)';
            break;
          case 'wind':
            xValue = weather.wind.speed;
            xLabel = 'Wind Speed (m/s)';
            break;
          case 'pressure':
            xValue = weather.main.pressure;
            xLabel = 'Pressure (hPa)';
            break;
          default:
            xValue = weather.main.temp;
            xLabel = 'Temperature (°C)';
        }

        return {
          x: xValue,
          y: activity.pace!,
          pace: activity.pace!,
          speed: activity.average_speed * 3.6, // Convert to km/h
          activityType: activity.type,
          name: activity.name,
          date: new Date(activity.start_date).toLocaleDateString(),
          weather: weather.weather[0].main,
          xLabel,
        };
      });
  };

  const prepareSeasonalData = () => {
    return Object.entries(analysis.seasonal_patterns).map(([season, data]) => ({
      season,
      averagePace: data.average_pace,
      activityCount: data.activity_count,
      temperature: data.weather_conditions.temp || 0,
      humidity: data.weather_conditions.humidity || 0,
    }));
  };

  const prepareCorrelationData = () => {
    return [
      {
        metric: 'Temperature',
        correlation: analysis.correlations.temperature_vs_pace,
        absCorrelation: Math.abs(analysis.correlations.temperature_vs_pace),
      },
      {
        metric: 'Humidity',
        correlation: analysis.correlations.humidity_vs_pace,
        absCorrelation: Math.abs(analysis.correlations.humidity_vs_pace),
      },
      {
        metric: 'Wind Speed',
        correlation: analysis.correlations.wind_vs_pace,
        absCorrelation: Math.abs(analysis.correlations.wind_vs_pace),
      },
      {
        metric: 'Pressure',
        correlation: analysis.correlations.pressure_vs_pace,
        absCorrelation: Math.abs(analysis.correlations.pressure_vs_pace),
      },
    ];
  };

  const getCorrelationColor = (correlation: number) => {
    const abs = Math.abs(correlation);
    if (abs < 0.1) return '#94a3b8'; // Weak - gray
    if (abs < 0.3) return '#fbbf24'; // Moderate - yellow
    if (abs < 0.5) return '#f97316'; // Strong - orange
    return '#dc2626'; // Very strong - red
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-semibold">{data.name}</p>
          <p className="text-sm text-gray-600">{data.date}</p>
          <p className="text-sm">
            <span className="font-medium">{data.xLabel}:</span> {data.x}
          </p>
          <p className="text-sm">
            <span className="font-medium">Pace:</span> {data.pace?.toFixed(2)} min/km
          </p>
          <p className="text-sm">
            <span className="font-medium">Speed:</span> {data.speed?.toFixed(1)} km/h
          </p>
          <p className="text-sm">
            <span className="font-medium">Weather:</span> {data.weather}
          </p>
          <p className="text-sm">
            <span className="font-medium">Type:</span> {data.activityType}
          </p>
        </div>
      );
    }
    return null;
  };

  const renderScatterChart = () => {
    const data = prepareScatterData();
    const correlation = analysis.correlations[`${metric}_vs_pace` as keyof typeof analysis.correlations];

    return (
      <Card className={`p-4 ${className}`}>
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">
            Pace vs {metric.charAt(0).toUpperCase() + metric.slice(1)}
          </h3>
          <p className="text-sm text-gray-600">
            Correlation: {(correlation * 100).toFixed(1)}% 
            {Math.abs(correlation) > 0.3 && (
              <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                {Math.abs(correlation) > 0.5 ? 'Strong' : 'Moderate'} correlation
              </span>
            )}
          </p>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <ScatterChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="x" 
              type="number" 
              domain={['dataMin - 2', 'dataMax + 2']}
              name={data[0]?.xLabel || 'Value'}
            />
            <YAxis 
              dataKey="y" 
              type="number" 
              domain={['dataMin - 0.5', 'dataMax + 0.5']}
              name="Pace (min/km)"
            />
            <Tooltip content={<CustomTooltip />} />
            <Scatter dataKey="y" fill="#3b82f6" fillOpacity={0.6} />
          </ScatterChart>
        </ResponsiveContainer>
      </Card>
    );
  };

  const renderSeasonalChart = () => {
    const data = prepareSeasonalData();

    return (
      <Card className={`p-4 ${className}`}>
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">Seasonal Performance</h3>
          <p className="text-sm text-gray-600">
            Average pace and activity count by season
          </p>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="season" />
            <YAxis yAxisId="pace" orientation="left" />
            <YAxis yAxisId="count" orientation="right" />
            <Tooltip />
            <Legend />
            <Bar 
              yAxisId="pace" 
              dataKey="averagePace" 
              fill="#3b82f6" 
              name="Avg Pace (min/km)"
            />
            <Bar 
              yAxisId="count" 
              dataKey="activityCount" 
              fill="#10b981" 
              name="Activity Count"
            />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    );
  };

  const renderCorrelationChart = () => {
    const data = prepareCorrelationData();

    return (
      <Card className={`p-4 ${className}`}>
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">Weather Correlations</h3>
          <p className="text-sm text-gray-600">
            How different weather factors correlate with your pace
          </p>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} layout="horizontal">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" domain={[-1, 1]} />
            <YAxis dataKey="metric" type="category" width={80} />
            <Tooltip 
              formatter={(value: number) => [
                `${(value * 100).toFixed(1)}%`,
                'Correlation'
              ]}
            />
            <Bar dataKey="correlation">
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={getCorrelationColor(entry.correlation)}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-4 text-xs text-gray-500">
          <p>Positive correlation: slower pace in higher values</p>
          <p>Negative correlation: faster pace in higher values</p>
        </div>
      </Card>
    );
  };

  const renderOptimalConditionsChart = () => {
    const optimalData = [
      {
        condition: 'Temperature',
        optimal: analysis.optimal_conditions.temperature,
        unit: '°C',
        range: [5, 30],
      },
      {
        condition: 'Humidity',
        optimal: analysis.optimal_conditions.humidity,
        unit: '%',
        range: [0, 100],
      },
      {
        condition: 'Wind Speed',
        optimal: analysis.optimal_conditions.wind_speed,
        unit: 'm/s',
        range: [0, 20],
      },
    ];

    return (
      <Card className={`p-4 ${className}`}>
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">Optimal Conditions</h3>
          <p className="text-sm text-gray-600">
            Weather conditions for your best performances
          </p>
        </div>
        <div className="space-y-4">
          {optimalData.map((item, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex-1">
                <p className="font-medium">{item.condition}</p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                  <div
                    className="bg-green-500 h-2 rounded-full relative"
                    style={{
                      width: `${((item.optimal - item.range[0]) / (item.range[1] - item.range[0])) * 100}%`
                    }}
                  >
                    <div className="absolute right-0 top-0 w-1 h-2 bg-green-700 rounded-full"></div>
                  </div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>{item.range[0]}{item.unit}</span>
                  <span>{item.range[1]}{item.unit}</span>
                </div>
              </div>
              <div className="ml-4 text-right">
                <p className="text-lg font-bold text-green-600">
                  {item.optimal}{item.unit}
                </p>
                <p className="text-xs text-gray-500">Optimal</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  };

  // Render based on chart type
  switch (chartType) {
    case 'scatter':
      return renderScatterChart();
    case 'line':
      return renderSeasonalChart();
    case 'bar':
      return renderCorrelationChart();
    case 'heatmap':
      return renderOptimalConditionsChart();
    default:
      return renderScatterChart();
  }
}