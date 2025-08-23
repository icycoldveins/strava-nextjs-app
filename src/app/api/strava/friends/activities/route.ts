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
    const useMock = searchParams.get('mock') === 'true';

    // For development, return mock data if requested
    if (useMock || !friendId) {
      const mockActivities = await getMockFriendActivities(friendId);
      return NextResponse.json({
        activities: mockActivities,
        page: parseInt(page),
        perPage: parseInt(perPage),
        total: mockActivities.length,
        mock: true,
      });
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
      // If friend activities endpoint fails, fallback to mock data
      console.warn('Friend activities API unavailable, using mock data');
      const mockActivities = await getMockFriendActivities(friendId);
      return NextResponse.json({
        activities: mockActivities,
        page: parseInt(page),
        perPage: parseInt(perPage),
        total: mockActivities.length,
        mock: true,
        error: 'Using mock data - friend activities may require special permissions',
      });
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
    
    // Fallback to mock data on error
    try {
      const friendId = new URL(request.url).searchParams.get('friend_id');
      const mockActivities = await getMockFriendActivities(friendId);
      return NextResponse.json({
        activities: mockActivities,
        page: 1,
        perPage: 30,
        total: mockActivities.length,
        mock: true,
        error: 'Using mock data due to API error',
      });
    } catch {
      return NextResponse.json(
        { error: 'Failed to fetch friend activities' },
        { status: 500 }
      );
    }
  }
}

// Mock friend activities for development
async function getMockFriendActivities(friendId: string | null) {
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Mock friends data
  const friends = {
    '1001': { firstname: 'Sarah', lastname: 'Johnson' },
    '1002': { firstname: 'Mike', lastname: 'Chen' },
    '1003': { firstname: 'Alex', lastname: 'Rodriguez' },
    '1004': { firstname: 'Emma', lastname: 'Wilson' },
    '1005': { firstname: 'James', lastname: 'Taylor' },
    '1006': { firstname: 'Lisa', lastname: 'Kim' },
  };

  const friend = friendId ? friends[friendId as keyof typeof friends] : { firstname: 'Mock', lastname: 'Friend' };
  const athleteId = friendId ? parseInt(friendId) : 1001;

  return [
    {
      id: 10001 + athleteId,
      name: 'Morning Run',
      type: 'Run',
      sport_type: 'Run',
      distance: 8047, // 5 miles in meters
      moving_time: 2340, // 39 minutes
      elapsed_time: 2400,
      total_elevation_gain: 85,
      start_date: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      start_date_local: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      average_speed: 3.44, // m/s
      max_speed: 4.5,
      average_heartrate: 155,
      max_heartrate: 172,
      calories: 420,
      achievement_count: 1,
      kudos_count: 8,
      athlete: {
        id: athleteId,
        firstname: friend.firstname,
        lastname: friend.lastname,
      },
    },
    {
      id: 10002 + athleteId,
      name: 'Evening Bike Ride',
      type: 'Ride',
      sport_type: 'Ride',
      distance: 32186, // 20 miles in meters
      moving_time: 4800, // 80 minutes
      elapsed_time: 5100,
      total_elevation_gain: 320,
      start_date: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      start_date_local: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      average_speed: 6.7, // m/s
      max_speed: 12.3,
      average_heartrate: 140,
      max_heartrate: 165,
      average_watts: 180,
      kilojoules: 864,
      calories: 750,
      achievement_count: 2,
      kudos_count: 12,
      athlete: {
        id: athleteId,
        firstname: friend.firstname,
        lastname: friend.lastname,
      },
    },
    {
      id: 10003 + athleteId,
      name: 'Trail Hike',
      type: 'Hike',
      sport_type: 'Hike',
      distance: 12874, // 8 miles in meters
      moving_time: 7200, // 2 hours
      elapsed_time: 8100,
      total_elevation_gain: 650,
      start_date: oneWeekAgo.toISOString(),
      start_date_local: oneWeekAgo.toISOString(),
      average_speed: 1.79, // m/s
      max_speed: 3.2,
      average_heartrate: 125,
      max_heartrate: 155,
      calories: 580,
      achievement_count: 0,
      kudos_count: 15,
      athlete: {
        id: athleteId,
        firstname: friend.firstname,
        lastname: friend.lastname,
      },
    },
    {
      id: 10004 + athleteId,
      name: 'Recovery Run',
      type: 'Run',
      sport_type: 'Run',
      distance: 4828, // 3 miles in meters
      moving_time: 1800, // 30 minutes
      elapsed_time: 1860,
      total_elevation_gain: 25,
      start_date: twoWeeksAgo.toISOString(),
      start_date_local: twoWeeksAgo.toISOString(),
      average_speed: 2.68, // m/s
      max_speed: 3.8,
      average_heartrate: 130,
      max_heartrate: 145,
      calories: 280,
      achievement_count: 0,
      kudos_count: 5,
      athlete: {
        id: athleteId,
        firstname: friend.firstname,
        lastname: friend.lastname,
      },
    },
    {
      id: 10005 + athleteId,
      name: 'Long Ride',
      type: 'Ride',
      sport_type: 'Ride',
      distance: 80467, // 50 miles in meters
      moving_time: 10800, // 3 hours
      elapsed_time: 12000,
      total_elevation_gain: 1200,
      start_date: oneMonthAgo.toISOString(),
      start_date_local: oneMonthAgo.toISOString(),
      average_speed: 7.45, // m/s
      max_speed: 15.2,
      average_heartrate: 145,
      max_heartrate: 175,
      average_watts: 220,
      kilojoules: 2376,
      calories: 1850,
      achievement_count: 3,
      kudos_count: 25,
      athlete: {
        id: athleteId,
        firstname: friend.firstname,
        lastname: friend.lastname,
      },
    },
  ];
}