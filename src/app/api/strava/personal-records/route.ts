import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';
import { calculatePersonalRecords } from '@/lib/prCalculations';
import { Activity } from '@/lib/types/personalRecords';
import { mockPRAnalysis } from '@/lib/mockPRData';

const STRAVA_API_BASE = 'https://www.strava.com/api/v3';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get('refresh') === 'true';
    const useMockData = searchParams.get('mock') === 'true' || process.env.NODE_ENV === 'development';
    
    // Return mock data for development/testing
    if (useMockData && searchParams.get('mock') === 'true') {
      console.log('Returning mock PR data for development');
      return NextResponse.json({
        ...mockPRAnalysis,
        metadata: {
          totalActivitiesAnalyzed: 50,
          lastUpdated: new Date().toISOString(),
          analysisDate: new Date().toISOString(),
          mockData: true
        }
      });
    }
    
    // Fetch more activities for comprehensive PR analysis
    // We'll fetch multiple pages to get a good sample of historical data
    const allActivities: Activity[] = [];
    const maxPages = 10; // Fetch up to 200 activities (20 per page)
    
    console.log('Fetching activities for PR analysis...');
    
    for (let page = 1; page <= maxPages; page++) {
      try {
        const activitiesResponse = await fetch(
          `${STRAVA_API_BASE}/athlete/activities?page=${page}&per_page=20`,
          {
            headers: {
              'Authorization': `Bearer ${session.accessToken}`,
            },
          }
        );

        if (!activitiesResponse.ok) {
          console.error(`Failed to fetch activities page ${page}:`, activitiesResponse.status);
          break;
        }

        const pageActivities = await activitiesResponse.json();
        
        if (pageActivities.length === 0) {
          // No more activities, stop fetching
          break;
        }

        // Format activities for PR analysis
        const formattedActivities: Activity[] = pageActivities.map((activity: any) => ({
          id: activity.id,
          name: activity.name,
          type: activity.type,
          sport_type: activity.sport_type,
          distance: activity.distance, // meters
          moving_time: activity.moving_time, // seconds
          elapsed_time: activity.elapsed_time,
          start_date: activity.start_date,
          start_date_local: activity.start_date_local,
          average_speed: activity.average_speed, // m/s
          max_speed: activity.max_speed,
          average_heartrate: activity.average_heartrate,
          max_heartrate: activity.max_heartrate,
          total_elevation_gain: activity.total_elevation_gain,
        }));

        allActivities.push(...formattedActivities);
        
        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`Error fetching activities page ${page}:`, error);
        break;
      }
    }

    console.log(`Fetched ${allActivities.length} activities for PR analysis`);

    if (allActivities.length === 0) {
      return NextResponse.json({ 
        error: 'No activities found',
        personalRecords: [],
        recentImprovements: [],
        potentialPRs: [],
        summary: {
          totalPRs: 0,
          recentPRs: 0,
          improvingDistances: [],
          stagnantDistances: [],
          averageImprovement: 0
        }
      });
    }

    // Filter activities for running and cycling only
    const relevantActivities = allActivities.filter(activity => {
      const runningTypes = ['Run', 'TrailRun', 'Treadmill'];
      const cyclingTypes = ['Ride', 'MountainBikeRide', 'GravelRide', 'EBikeRide', 'VirtualRide'];
      
      return runningTypes.includes(activity.type) || 
             runningTypes.includes(activity.sport_type) ||
             cyclingTypes.includes(activity.type) || 
             cyclingTypes.includes(activity.sport_type);
    });

    console.log(`Analyzing ${relevantActivities.length} relevant activities for PRs`);

    // Calculate personal records
    const prAnalysis = calculatePersonalRecords(relevantActivities);

    // Add additional metadata
    const response = {
      ...prAnalysis,
      metadata: {
        totalActivitiesAnalyzed: relevantActivities.length,
        lastUpdated: new Date().toISOString(),
        analysisDate: new Date().toISOString(),
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error calculating personal records:', error);
    return NextResponse.json(
      { 
        error: 'Failed to calculate personal records',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST endpoint to manually trigger PR recalculation
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // This could trigger a more comprehensive analysis
    // For now, just redirect to GET with refresh flag
    return NextResponse.redirect(new URL('/api/strava/personal-records?refresh=true', request.url));

  } catch (error) {
    console.error('Error triggering PR recalculation:', error);
    return NextResponse.json(
      { error: 'Failed to trigger PR recalculation' },
      { status: 500 }
    );
  }
}