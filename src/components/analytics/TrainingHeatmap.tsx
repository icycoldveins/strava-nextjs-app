"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Calendar, 
  Activity, 
  TrendingUp, 
  Clock,
  AlertCircle,
  Loader2
} from "lucide-react";
import { Tooltip } from 'react-tooltip';
import CalendarHeatmap from 'react-calendar-heatmap';
import { 
  HeatmapResponse, 
  HeatmapViewMode, 
  HeatmapMetricType, 
  HeatmapDataPoint 
} from '@/lib/types/heatmap';
import { 
  convertToHeatmapValues, 
  formatMetricValue
} from '@/lib/heatmapCalculations';
import { formatDistance, formatTime, getActivityIcon } from '@/lib/formatters';

interface TrainingHeatmapProps {
  className?: string;
  measurementPref?: 'metric' | 'imperial';
}

export function TrainingHeatmap({ 
  className = "",
  measurementPref = 'metric'
}: TrainingHeatmapProps) {
  const [data, setData] = useState<HeatmapResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<HeatmapViewMode>('year');
  const [metricType, setMetricType] = useState<HeatmapMetricType>('intensity');
  const [selectedDay, setSelectedDay] = useState<HeatmapDataPoint | null>(null);

  // Fetch heatmap data
  const fetchHeatmapData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        view: viewMode,
        metric: metricType,
      });
      
      const response = await fetch(`/api/strava/activities/heatmap?${params}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch heatmap data');
      }
      
      const heatmapData = await response.json();
      setData(heatmapData);
    } catch (err) {
      console.error('Error fetching heatmap data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load heatmap data');
    } finally {
      setLoading(false);
    }
  }, [viewMode, metricType]);

  useEffect(() => {
    fetchHeatmapData();
  }, [fetchHeatmapData]);

  // Handle day click
  const handleDayClick = useCallback((value: { date: string; count: number } | undefined) => {
    if (!data || !value || !value.date) return;
    
    const dateStr = new Date(value.date).toISOString().split('T')[0];
    const dayData = data.data.find(point => point.date === dateStr);
    
    setSelectedDay(dayData || null);
  }, [data]);


  const heatmapValues = data ? convertToHeatmapValues(data.data) : [];
  const maxValue = Math.max(...heatmapValues.map(v => v.count), 1);

  if (loading) {
    return (
      <Card className={`border-0 shadow-lg bg-white/90 dark:bg-gray-800/90 backdrop-blur ${className}`}>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-orange-500" />
            <CardTitle>Training Heatmap</CardTitle>
          </div>
          <CardDescription>Your training consistency over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-orange-500 mx-auto" />
              <p className="text-sm text-muted-foreground">Loading training data...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`border-0 shadow-lg bg-white/90 dark:bg-gray-800/90 backdrop-blur ${className}`}>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-orange-500" />
            <CardTitle>Training Heatmap</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button 
            onClick={fetchHeatmapData} 
            variant="outline" 
            className="mt-4"
          >
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  const { stats } = data;

  return (
    <div className={className}>
      <Card className="border-0 shadow-lg bg-white/90 dark:bg-gray-800/90 backdrop-blur">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-orange-500" />
                <CardTitle>Training Heatmap</CardTitle>
              </div>
              <CardDescription>
                Your training consistency over the last {viewMode === 'year' ? 'year' : viewMode}
              </CardDescription>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2">
              <Select value={viewMode} onValueChange={(value) => setViewMode(value as HeatmapViewMode)}>
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3months">3 Months</SelectItem>
                  <SelectItem value="6months">6 Months</SelectItem>
                  <SelectItem value="year">1 Year</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={metricType} onValueChange={(value) => setMetricType(value as HeatmapMetricType)}>
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="intensity">Intensity</SelectItem>
                  <SelectItem value="distance">Distance</SelectItem>
                  <SelectItem value="time">Time</SelectItem>
                  <SelectItem value="count">Count</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {stats.currentStreak}
              </div>
              <div className="text-xs text-muted-foreground">Current Streak</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {stats.bestStreak}
              </div>
              <div className="text-xs text-muted-foreground">Best Streak</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {stats.activeDays}
              </div>
              <div className="text-xs text-muted-foreground">Active Days</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {Math.round((stats.activeDays / stats.totalDays) * 100)}%
              </div>
              <div className="text-xs text-muted-foreground">Activity Rate</div>
            </div>
          </div>

          {/* Heatmap */}
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              <CalendarHeatmap
                startDate={new Date(data.dateRange.start)}
                endDate={new Date(data.dateRange.end)}
                values={heatmapValues}
                classForValue={(value) => {
                  if (!value || value.count === 0) {
                    return 'fill-gray-100 dark:fill-gray-800 hover:fill-gray-200 dark:hover:fill-gray-700';
                  }
                  
                  const intensity = value.count / maxValue;
                  
                  if (intensity <= 0.2) return 'fill-orange-200 dark:fill-orange-900 hover:fill-orange-300 dark:hover:fill-orange-800';
                  if (intensity <= 0.4) return 'fill-orange-300 dark:fill-orange-800 hover:fill-orange-400 dark:hover:fill-orange-700';
                  if (intensity <= 0.6) return 'fill-orange-400 dark:fill-orange-700 hover:fill-orange-500 dark:hover:fill-orange-600';
                  if (intensity <= 0.8) return 'fill-orange-500 dark:fill-orange-600 hover:fill-orange-600 dark:hover:fill-orange-500';
                  return 'fill-orange-600 dark:fill-orange-500 hover:fill-orange-700 dark:hover:fill-orange-400';
                }}
                // Temporarily disabled tooltips due to type incompatibility with react-calendar-heatmap
                tooltipDataAttrs={undefined}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                onClick={handleDayClick as any}
                showWeekdayLabels={true}
                weekdayLabels={['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']}
                monthLabels={[
                  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
                ]}
              />
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Less</span>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm bg-gray-100 dark:bg-gray-800" />
              <div className="w-3 h-3 rounded-sm bg-orange-200 dark:bg-orange-900" />
              <div className="w-3 h-3 rounded-sm bg-orange-300 dark:bg-orange-800" />
              <div className="w-3 h-3 rounded-sm bg-orange-400 dark:bg-orange-700" />
              <div className="w-3 h-3 rounded-sm bg-orange-500 dark:bg-orange-600" />
              <div className="w-3 h-3 rounded-sm bg-orange-600 dark:bg-orange-500" />
            </div>
            <span>More</span>
          </div>

          {/* Additional Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
            <div className="flex items-center gap-3">
              <Activity className="h-5 w-5 text-orange-500" />
              <div>
                <div className="font-semibold">{stats.totalActivities}</div>
                <div className="text-xs text-muted-foreground">Total Activities</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              <div>
                <div className="font-semibold">
                  {formatDistance(stats.totalDistance * 1000, measurementPref)}
                </div>
                <div className="text-xs text-muted-foreground">Total Distance</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-purple-500" />
              <div>
                <div className="font-semibold">{formatTime(stats.totalTime)}</div>
                <div className="text-xs text-muted-foreground">Total Time</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Day Details Modal/Panel */}
      {selectedDay && (
        <Card className="mt-4 border-0 shadow-lg bg-white/90 dark:bg-gray-800/90 backdrop-blur">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">
                  {new Date(selectedDay.date).toLocaleDateString()}
                </CardTitle>
                <CardDescription>
                  {selectedDay.count} {selectedDay.count === 1 ? 'activity' : 'activities'} • {formatMetricValue(selectedDay.value, metricType)}
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedDay(null)}
              >
                ✕
              </Button>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-3">
              {selectedDay.activities.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div>
                      <div className="font-medium">{activity.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {activity.type}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="font-medium">
                      {formatDistance(activity.distance, measurementPref)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatTime(activity.moving_time)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tooltip */}
      <Tooltip id="heatmap-tooltip" className="z-50" />
    </div>
  );
}