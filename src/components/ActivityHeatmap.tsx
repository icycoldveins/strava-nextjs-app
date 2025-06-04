"use client";

import React, { useState, useEffect } from 'react';
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import { Tooltip } from 'react-tooltip';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import './ActivityHeatmap.css';

// Define the activity data shape
type Activity = {
  id: number;
  name: string;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  total_elevation_gain: number;
  start_date: string;
  type: string;
};

// Define the format for the heatmap data point
type HeatmapDataPoint = {
  date: string;
  count: number;
  details?: {
    activities: Activity[];
  };
};

const ActivityHeatmap: React.FC = () => {
  const { data: session } = useSession();
  const [loading, setLoading] = useState<boolean>(true);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [heatmapData, setHeatmapData] = useState<HeatmapDataPoint[]>([]);
  
  // Fetch activities from our API route
  useEffect(() => {
    const fetchActivities = async () => {
      if (session) {
        try {
          setLoading(true);
          // Get athlete activities for the last year
          const today = new Date();
          const oneYearAgo = new Date();
          oneYearAgo.setFullYear(today.getFullYear() - 1);
          
          const response = await axios.get(
            `/api/strava/activities`,
            {
              params: {
                after: Math.floor(oneYearAgo.getTime() / 1000),
                per_page: 200 // Max allowed by Strava API
              }
            }
          );
          
          setActivities(response.data);
          processActivitiesForHeatmap(response.data);
        } catch (error) {
          console.error('Error fetching Strava activities:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchActivities();
  }, [session]);

  // Process activities into the format needed for the heatmap
  const processActivitiesForHeatmap = (activityData: Activity[]) => {
    // Group activities by date
    const groupedByDate = activityData.reduce<Record<string, Activity[]>>((acc, activity) => {
      const date = activity.start_date.split('T')[0]; // Extract YYYY-MM-DD
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(activity);
      return acc;
    }, {});

    // Create the heatmap data array
    const heatmapValues: HeatmapDataPoint[] = [];
    
    // Fill in data for all dates in the last year
    const endDate = new Date();
    const startDate = new Date();
    startDate.setFullYear(endDate.getFullYear() - 1);
    
    // Loop through each day of the year
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const dayActivities = groupedByDate[dateStr] || [];
      
      heatmapValues.push({
        date: dateStr,
        count: dayActivities.length,
        details: dayActivities.length ? { activities: dayActivities } : undefined
      });
    }
    
    setHeatmapData(heatmapValues);
  };
  
  // Custom tooltip content
  const getTooltipContent = (value: HeatmapDataPoint | null) => {
    if (!value || !value.count) {
      return 'No activities on this day';
    }
    
    const date = new Date(value.date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    return `${date}: ${value.count} ${value.count === 1 ? 'activity' : 'activities'}`;
  };

  // Get color based on activity count
  const getClassForValue = (value: HeatmapDataPoint) => {
    if (!value || !value.count) {
      return 'color-empty';
    }
    if (value.count === 1) return 'color-scale-1';
    if (value.count === 2) return 'color-scale-2';
    if (value.count === 3) return 'color-scale-3';
    return 'color-scale-4'; // 4 or more activities
  };
  
  return (
    <div className="activity-heatmap mt-8">
      <h2 className="text-xl font-semibold mb-4">Your Activity Contributions</h2>
      
      {loading ? (
        <div>Loading activity data...</div>
      ) : (
        <div>
          <div className="heatmap-container">
            <CalendarHeatmap
              startDate={new Date(new Date().setFullYear(new Date().getFullYear() - 1))}
              endDate={new Date()}
              values={heatmapData}
              classForValue={getClassForValue}
              tooltipDataAttrs={(value: HeatmapDataPoint) => {
                return {
                  'data-tooltip-id': 'activity-tooltip',
                  'data-tooltip-content': getTooltipContent(value),
                };
              }}
            />
            <Tooltip id="activity-tooltip" />
          </div>
          
          <div className="flex justify-end text-sm mt-2">
            <div className="flex items-center">
              <span className="mr-2">Less</span>
              <div className="color-empty heatmap-square"></div>
              <div className="color-scale-1 heatmap-square"></div>
              <div className="color-scale-2 heatmap-square"></div>
              <div className="color-scale-3 heatmap-square"></div>
              <div className="color-scale-4 heatmap-square"></div>
              <span className="ml-2">More</span>
            </div>
          </div>
          
          <div className="mt-4 text-sm">
            {activities.length} activities in the last year
          </div>
        </div>
      )}
      
      {/* Add CSS for the heatmap squares */}
      <style jsx>{`
        .heatmap-container {
          overflow-x: auto;
        }
        .heatmap-square {
          display: inline-block;
          width: 10px;
          height: 10px;
          margin: 0 2px;
        }
        /* GitHub style colors */
        :global(.react-calendar-heatmap .color-empty) {
          fill: #ebedf0;
        }
        :global(.dark .react-calendar-heatmap .color-empty) {
          fill: #161b22;
        }
        :global(.react-calendar-heatmap .color-scale-1) {
          fill: #9be9a8;
        }
        :global(.react-calendar-heatmap .color-scale-2) {
          fill: #40c463;
        }
        :global(.react-calendar-heatmap .color-scale-3) {
          fill: #30a14e;
        }
        :global(.react-calendar-heatmap .color-scale-4) {
          fill: #216e39;
        }
        /* For Strava theme, we can use oranges instead */
        :global(.strava-theme .react-calendar-heatmap .color-scale-1) {
          fill: #ffb799;
        }
        :global(.strava-theme .react-calendar-heatmap .color-scale-2) {
          fill: #ff8c66;
        }
        :global(.strava-theme .react-calendar-heatmap .color-scale-3) {
          fill: #fc5c30;
        }
        :global(.strava-theme .react-calendar-heatmap .color-scale-4) {
          fill: #e34c26;
        }
      `}</style>
    </div>
  );
};

export default ActivityHeatmap;
