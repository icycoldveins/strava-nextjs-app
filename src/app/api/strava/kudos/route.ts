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

    const { searchParams } = new URL(request.url);
    const activityId = searchParams.get('activity_id');

    if (!activityId) {
      return NextResponse.json({ error: 'Activity ID is required' }, { status: 400 });
    }

    // Get kudos for a specific activity
    const kudosResponse = await fetch(
      `${STRAVA_API_BASE}/activities/${activityId}/kudos`,
      {
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
        },
      }
    );

    if (!kudosResponse.ok) {
      throw new Error('Failed to fetch kudos');
    }

    const kudos = await kudosResponse.json();

    // Format kudos data with sender information
    const formattedKudos = kudos.map((kudo: any) => ({
      firstname: kudo.firstname,
      lastname: kudo.lastname,
      profile_medium: kudo.profile_medium,
      profile: kudo.profile,
      city: kudo.city,
      state: kudo.state,
      country: kudo.country,
      premium: kudo.premium,
    }));

    return NextResponse.json({
      activityId,
      kudos: formattedKudos,
      count: formattedKudos.length,
    });

  } catch (error) {
    console.error('Error fetching kudos:', error);
    return NextResponse.json(
      { error: 'Failed to fetch kudos' },
      { status: 500 }
    );
  }
}