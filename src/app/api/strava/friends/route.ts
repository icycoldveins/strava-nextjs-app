import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import type { CustomSession } from '@/lib/auth-types';
import { StravaAthlete } from '@/lib/types/strava';

const STRAVA_API_BASE = 'https://www.strava.com/api/v3';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as CustomSession;
    
    if (!session || !session.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';
    const perPage = searchParams.get('per_page') || '30';

    // Get athlete's friends from Strava
    // Note: Strava API endpoint for friends requires special permissions
    // For now, we'll use the athlete's following list as a proxy
    const friendsResponse = await fetch(
      `${STRAVA_API_BASE}/athlete/following?page=${page}&per_page=${perPage}`,
      {
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
        },
      }
    );

    if (!friendsResponse.ok) {
      console.error('Friends API unavailable');
      return NextResponse.json(
        { error: 'Failed to fetch friends from Strava' },
        { status: friendsResponse.status }
      );
    }

    const friends = await friendsResponse.json();

    // Format friends data for frontend
    const formattedFriends = friends.map((friend: StravaAthlete) => ({
      id: friend.id,
      username: friend.username || `${friend.firstname}_${friend.lastname}`.toLowerCase(),
      firstname: friend.firstname,
      lastname: friend.lastname,
      profile: friend.profile || friend.profile_medium,
      profile_medium: friend.profile_medium,
      city: friend.city,
      state: friend.state,
      country: friend.country,
      sex: friend.sex,
      premium: friend.premium || false,
      created_at: friend.created_at,
      updated_at: friend.updated_at,
    }));

    return NextResponse.json({
      friends: formattedFriends,
      page: parseInt(page),
      perPage: parseInt(perPage),
      total: formattedFriends.length,
    });

  } catch (error) {
    console.error('Error fetching Strava friends:', error);
    return NextResponse.json(
      { error: 'Failed to fetch friends data' },
      { status: 500 }
    );
  }
}
