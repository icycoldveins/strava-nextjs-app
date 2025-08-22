import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';

const STRAVA_API_BASE = 'https://www.strava.com/api/v3';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get athlete profile
    const athleteResponse = await fetch(`${STRAVA_API_BASE}/athlete`, {
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
      },
    });

    if (!athleteResponse.ok) {
      throw new Error('Failed to fetch athlete data');
    }

    const athlete = await athleteResponse.json();

    return NextResponse.json({
      id: athlete.id,
      username: athlete.username,
      firstname: athlete.firstname,
      lastname: athlete.lastname,
      bio: athlete.bio,
      city: athlete.city,
      state: athlete.state,
      country: athlete.country,
      sex: athlete.sex,
      premium: athlete.premium,
      summit: athlete.summit,
      created_at: athlete.created_at,
      updated_at: athlete.updated_at,
      follower_count: athlete.follower_count,
      friend_count: athlete.friend_count,
      measurement_preference: athlete.measurement_preference,
      ftp: athlete.ftp,
      weight: athlete.weight,
      clubs: athlete.clubs,
      bikes: athlete.bikes,
      shoes: athlete.shoes,
      profile: athlete.profile,
      profile_medium: athlete.profile_medium,
    });

  } catch (error) {
    console.error('Error fetching Strava athlete:', error);
    return NextResponse.json(
      { error: 'Failed to fetch athlete profile' },
      { status: 500 }
    );
  }
}