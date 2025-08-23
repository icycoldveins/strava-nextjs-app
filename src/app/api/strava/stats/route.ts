import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import type { CustomSession } from '@/lib/auth-types';

const STRAVA_API_BASE = 'https://www.strava.com/api/v3';

export async function GET() {
  try {
    const session = await getServerSession(authOptions) as CustomSession;
    
    if (!session || !session.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get athlete ID first
    const athleteResponse = await fetch(`${STRAVA_API_BASE}/athlete`, {
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
      },
    });

    if (!athleteResponse.ok) {
      throw new Error('Failed to fetch athlete data');
    }

    const athlete = await athleteResponse.json();

    // Get athlete stats
    const statsResponse = await fetch(`${STRAVA_API_BASE}/athletes/${athlete.id}/stats`, {
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
      },
    });

    if (!statsResponse.ok) {
      throw new Error('Failed to fetch stats');
    }

    const stats = await statsResponse.json();

    // Calculate totals
    const totalActivities = 
      (stats.all_ride_totals?.count || 0) + 
      (stats.all_run_totals?.count || 0) + 
      (stats.all_swim_totals?.count || 0);

    const totalDistance = 
      (stats.all_ride_totals?.distance || 0) + 
      (stats.all_run_totals?.distance || 0) + 
      (stats.all_swim_totals?.distance || 0);

    const totalTime = 
      (stats.all_ride_totals?.moving_time || 0) + 
      (stats.all_run_totals?.moving_time || 0) + 
      (stats.all_swim_totals?.moving_time || 0);

    const totalElevation = 
      (stats.all_ride_totals?.elevation_gain || 0) + 
      (stats.all_run_totals?.elevation_gain || 0);

    // Recent stats (last 4 weeks)
    const recentActivities = 
      (stats.recent_ride_totals?.count || 0) + 
      (stats.recent_run_totals?.count || 0) + 
      (stats.recent_swim_totals?.count || 0);

    const recentDistance = 
      (stats.recent_ride_totals?.distance || 0) + 
      (stats.recent_run_totals?.distance || 0) + 
      (stats.recent_swim_totals?.distance || 0);

    return NextResponse.json({
      allTime: {
        activities: totalActivities,
        distance: totalDistance, // in meters
        time: totalTime, // in seconds
        elevation: totalElevation, // in meters
      },
      recent: {
        activities: recentActivities,
        distance: recentDistance,
      },
      ytd: {
        ride: stats.ytd_ride_totals,
        run: stats.ytd_run_totals,
        swim: stats.ytd_swim_totals,
      },
      raw: stats, // Include raw stats for debugging
    });

  } catch (error) {
    console.error('Error fetching Strava stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}