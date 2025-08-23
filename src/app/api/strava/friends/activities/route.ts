import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import type { CustomSession } from '@/lib/auth-types';
import { StravaActivity } from '@/lib/types/strava';

const STRAVA_API_BASE = 'https://www.strava.com/api/v3';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as CustomSession;
    
    if (!session || !session.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const friendId = searchParams.get('friend_id');
    const page = searchParams.get('page') || '1';
    const perPage = searchParams.get('per_page') || '30';
    const before = searchParams.get('before'); // Unix timestamp
    const after = searchParams.get('after'); // Unix timestamp

    if (!friendId) {
      return NextResponse.json(
        { error: 'Friend ID is required' },
        { status: 400 }
      );
    }

    // Build query parameters for Strava API
    const queryParams = new URLSearchParams({
      page,
      per_page: perPage,
    });

    if (before) queryParams.append('before', before);
    if (after) queryParams.append('after', after);

    // Get specific friend's activities from Strava
    // Note: This endpoint may require special permissions or friendship status
    const activitiesResponse = await fetch(
      `${STRAVA_API_BASE}/athletes/${friendId}/activities?${queryParams.toString()}`,
      {
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
        },
      }
    );

    if (!activitiesResponse.ok) {
      console.error('Friend activities API unavailable');
      return NextResponse.json(
        { error: 'Failed to fetch friend activities - may require special permissions' },
        { status: activitiesResponse.status }
      );
    }

    const activities = await activitiesResponse.json();

    // Format activities for frontend
    const formattedActivities = activities.map((activity: StravaActivity) => ({
      id: activity.id,
      name: activity.name,
      type: activity.type,
      sport_type: activity.sport_type,
      distance: activity.distance, // meters
      moving_time: activity.moving_time, // seconds
      elapsed_time: activity.elapsed_time,
      total_elevation_gain: activity.total_elevation_gain,
      start_date: activity.start_date,
      start_date_local: activity.start_date_local,
      average_speed: activity.average_speed,
      max_speed: activity.max_speed,
      average_heartrate: activity.average_heartrate,
      max_heartrate: activity.max_heartrate,
      average_watts: activity.average_watts,
      kilojoules: activity.kilojoules,
      calories: activity.calories,
      achievement_count: activity.achievement_count,
      kudos_count: activity.kudos_count,
      athlete: {
        id: parseInt(friendId),
        firstname: 'Friend',
        lastname: 'Athlete',
      },
    }));

    return NextResponse.json({
      activities: formattedActivities,
      page: parseInt(page),
      perPage: parseInt(perPage),
      total: formattedActivities.length,
    });

  } catch (error) {
    console.error('Error fetching friend activities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch friend activities' },
      { status: 500 }
    );
  }
}