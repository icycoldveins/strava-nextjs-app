import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import type { CustomSession } from '@/lib/auth-types';
import { StravaAthlete } from '@/lib/types/strava';

const STRAVA_API_BASE = 'https://www.strava.com/api/v3';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions as any) as CustomSession;
    
    if (!session || !session.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') || '1';
    const perPage = searchParams.get('per_page') || '30';
    const useMock = searchParams.get('mock') === 'true';

    // For development, return mock data if requested
    if (useMock) {
      const mockFriends = await getMockFriends();
      return NextResponse.json({
        friends: mockFriends,
        page: parseInt(page),
        perPage: parseInt(perPage),
        total: mockFriends.length,
      });
    }

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
      // If friends endpoint fails, fallback to mock data for development
      console.warn('Friends API unavailable, using mock data');
      const mockFriends = await getMockFriends();
      return NextResponse.json({
        friends: mockFriends,
        page: parseInt(page),
        perPage: parseInt(perPage),
        total: mockFriends.length,
        mock: true,
      });
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
    
    // Fallback to mock data on error
    try {
      const mockFriends = await getMockFriends();
      return NextResponse.json({
        friends: mockFriends,
        page: 1,
        perPage: 30,
        total: mockFriends.length,
        mock: true,
        error: 'Using mock data due to API error',
      });
    } catch {
      return NextResponse.json(
        { error: 'Failed to fetch friends data' },
        { status: 500 }
      );
    }
  }
}

// Mock friends data for development
async function getMockFriends() {
  return [
    {
      id: 1001,
      username: 'sarah_runner',
      firstname: 'Sarah',
      lastname: 'Johnson',
      profile: 'https://images.unsplash.com/photo-1494790108755-2616b9a2e6b5?w=150',
      profile_medium: 'https://images.unsplash.com/photo-1494790108755-2616b9a2e6b5?w=80',
      city: 'San Francisco',
      state: 'CA',
      country: 'United States',
      sex: 'F' as const,
      premium: true,
      created_at: '2020-01-15T00:00:00Z',
      updated_at: '2024-01-15T00:00:00Z',
    },
    {
      id: 1002,
      username: 'mike_cyclist',
      firstname: 'Mike',
      lastname: 'Chen',
      profile: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
      profile_medium: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80',
      city: 'Portland',
      state: 'OR',
      country: 'United States',
      sex: 'M' as const,
      premium: false,
      created_at: '2019-03-22T00:00:00Z',
      updated_at: '2024-01-10T00:00:00Z',
    },
    {
      id: 1003,
      username: 'alex_hiker',
      firstname: 'Alex',
      lastname: 'Rodriguez',
      profile: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      profile_medium: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80',
      city: 'Denver',
      state: 'CO',
      country: 'United States',
      sex: 'M' as const,
      premium: true,
      created_at: '2021-07-08T00:00:00Z',
      updated_at: '2024-01-20T00:00:00Z',
    },
    {
      id: 1004,
      username: 'emma_swimmer',
      firstname: 'Emma',
      lastname: 'Wilson',
      profile: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
      profile_medium: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80',
      city: 'Miami',
      state: 'FL',
      country: 'United States',
      sex: 'F' as const,
      premium: true,
      created_at: '2020-11-30T00:00:00Z',
      updated_at: '2024-01-18T00:00:00Z',
    },
    {
      id: 1005,
      username: 'james_triathlete',
      firstname: 'James',
      lastname: 'Taylor',
      profile: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
      profile_medium: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80',
      city: 'Austin',
      state: 'TX',
      country: 'United States',
      sex: 'M' as const,
      premium: false,
      created_at: '2018-05-14T00:00:00Z',
      updated_at: '2024-01-12T00:00:00Z',
    },
    {
      id: 1006,
      username: 'lisa_marathoner',
      firstname: 'Lisa',
      lastname: 'Kim',
      profile: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
      profile_medium: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80',
      city: 'Seattle',
      state: 'WA',
      country: 'United States',
      sex: 'F' as const,
      premium: true,
      created_at: '2019-09-03T00:00:00Z',
      updated_at: '2024-01-22T00:00:00Z',
    },
  ];
}