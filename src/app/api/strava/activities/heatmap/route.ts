import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import type { CustomSession } from '@/lib/auth-types';
import { 
  groupActivitiesByDate, 
  calculateHeatmapStats, 
  getDateRange,
  filterActivitiesByType 
} from '@/lib/heatmapCalculations';
import { 
  HeatmapActivity, 
  HeatmapViewMode, 
  HeatmapMetricType, 
  HeatmapResponse 
} from '@/lib/types/heatmap';
import { StravaActivity } from '@/lib/types/strava';

const STRAVA_API_BASE = 'https://www.strava.com/api/v3';

/**
 * Fetch activities from Strava API with pagination support
 */
async function fetchAllActivities(
  accessToken: string,
  startDate: Date,
  endDate: Date
): Promise<HeatmapActivity[]> {
  const activities: HeatmapActivity[] = [];
  let page = 1;
  const perPage = 200; // Maximum allowed by Strava API
  
  const after = Math.floor(startDate.getTime() / 1000);
  const before = Math.floor(endDate.getTime() / 1000);
  
  while (true) {
    try {
      const response = await fetch(
        `${STRAVA_API_BASE}/athlete/activities?` +
        `page=${page}&per_page=${perPage}&after=${after}&before=${before}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );
      
      if (!response.ok) {
        console.error(`Strava API error: ${response.status} ${response.statusText}`);
        break;
      }
      
      const pageActivities = await response.json();
      
      // If we got less than perPage activities, this is the last page
      if (pageActivities.length === 0) {
        break;
      }
      
      // Map to our HeatmapActivity interface
      const mappedActivities: HeatmapActivity[] = pageActivities.map((activity: StravaActivity) => ({
        id: activity.id,
        name: activity.name,
        type: activity.type,
        sport_type: activity.sport_type,
        distance: activity.distance || 0,
        moving_time: activity.moving_time || 0,
        elapsed_time: activity.elapsed_time || 0,
        start_date: activity.start_date,
        start_date_local: activity.start_date_local,
        total_elevation_gain: activity.total_elevation_gain || 0,
        average_speed: activity.average_speed,
        max_speed: activity.max_speed,
        average_heartrate: activity.average_heartrate,
        max_heartrate: activity.max_heartrate,
        calories: activity.calories,
        kilojoules: activity.kilojoules,
      }));
      
      activities.push(...mappedActivities);
      
      // If we got less than perPage activities, this is the last page
      if (pageActivities.length < perPage) {
        break;
      }
      
      page++;
      
      // Safety check to prevent infinite loops
      if (page > 50) {
        console.warn('Reached maximum page limit for activity fetching');
        break;
      }
    } catch (error) {
      console.error(`Error fetching activities page ${page}:`, error);
      break;
    }
  }
  
  return activities;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions as any) as CustomSession;
    
    if (!session || !session.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const viewMode = (searchParams.get('view') as HeatmapViewMode) || 'year';
    const metricType = (searchParams.get('metric') as HeatmapMetricType) || 'intensity';
    const activityTypesParam = searchParams.get('types');
    const activityTypes = activityTypesParam ? activityTypesParam.split(',') : undefined;

    // Validate parameters
    const validViewModes: HeatmapViewMode[] = ['year', '6months', '3months'];
    const validMetricTypes: HeatmapMetricType[] = ['distance', 'time', 'count', 'intensity'];
    
    if (!validViewModes.includes(viewMode)) {
      return NextResponse.json(
        { error: 'Invalid view mode. Must be one of: year, 6months, 3months' }, 
        { status: 400 }
      );
    }
    
    if (!validMetricTypes.includes(metricType)) {
      return NextResponse.json(
        { error: 'Invalid metric type. Must be one of: distance, time, count, intensity' }, 
        { status: 400 }
      );
    }

    // Get date range based on view mode
    const dateRange = getDateRange(viewMode);
    
    console.log(`Fetching heatmap data for ${viewMode} view (${dateRange.start.toISOString()} to ${dateRange.end.toISOString()})`);

    // Fetch activities from Strava
    const allActivities = await fetchAllActivities(
      session.accessToken, 
      dateRange.start, 
      dateRange.end
    );

    console.log(`Fetched ${allActivities.length} activities from Strava`);

    // Filter activities by type if specified
    const filteredActivities = filterActivitiesByType(allActivities, activityTypes);

    // Group activities by date and calculate values
    const heatmapData = groupActivitiesByDate(filteredActivities, metricType);

    // Calculate statistics
    const stats = calculateHeatmapStats(heatmapData, dateRange);

    const response: HeatmapResponse = {
      data: heatmapData,
      stats,
      dateRange: {
        start: dateRange.start.toISOString().split('T')[0],
        end: dateRange.end.toISOString().split('T')[0],
      },
    };

    console.log(`Returning heatmap data: ${heatmapData.length} data points, ${stats.totalActivities} activities`);

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching heatmap data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch heatmap data' },
      { status: 500 }
    );
  }
}