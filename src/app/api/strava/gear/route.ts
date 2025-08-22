import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import type { CustomSession } from '@/lib/auth-types';
import { StravaGear } from '@/lib/types/strava';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as CustomSession;
    
    if (!session?.accessToken) {
      return NextResponse.json(
        { error: 'Unauthorized - No access token' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const gearId = searchParams.get('id');
    
    let apiUrl = 'https://www.strava.com/api/v3/athlete';
    
    // If specific gear ID is requested, fetch that gear detail
    if (gearId) {
      apiUrl = `https://www.strava.com/api/v3/gear/${gearId}`;
    }

    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Strava API error:', response.status, response.statusText);
      return NextResponse.json(
        { error: 'Failed to fetch data from Strava', status: response.status },
        { status: response.status }
      );
    }

    const data = await response.json();

    // If fetching specific gear, return gear details
    if (gearId) {
      return NextResponse.json({
        id: data.id,
        name: data.name,
        brand_name: data.brand_name,
        model_name: data.model_name,
        description: data.description,
        distance: data.distance,
        primary: data.primary,
        frame_type: data.frame_type, // For bikes
        resource_state: data.resource_state
      });
    }

    // Otherwise, extract gear from athlete data
    const gearData = {
      bikes: data.bikes || [],
      shoes: data.shoes || []
    };

    // Transform to consistent format
    const allGear = [
      ...gearData.bikes.map((bike: StravaGear) => ({
        id: bike.id,
        name: bike.name,
        brand_name: bike.brand_name,
        model_name: bike.model_name,
        description: bike.description,
        distance: bike.distance,
        primary: bike.primary,
        frame_type: bike.frame_type,
        type: 'bike',
        resource_state: bike.resource_state
      })),
      ...gearData.shoes.map((shoe: StravaGear) => ({
        id: shoe.id,
        name: shoe.name,
        brand_name: shoe.brand_name,
        model_name: shoe.model_name,
        description: shoe.description,
        distance: shoe.distance,
        primary: shoe.primary,
        type: 'shoes',
        resource_state: shoe.resource_state
      }))
    ];

    return NextResponse.json({ gear: allGear });
    
  } catch (error) {
    console.error('Error fetching Strava gear:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST endpoint to fetch detailed gear information for multiple gear items
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions) as CustomSession;
    
    if (!session?.accessToken) {
      return NextResponse.json(
        { error: 'Unauthorized - No access token' },
        { status: 401 }
      );
    }

    const { gearIds } = await request.json();
    
    if (!Array.isArray(gearIds)) {
      return NextResponse.json(
        { error: 'gearIds must be an array' },
        { status: 400 }
      );
    }

    // Fetch detailed information for each gear item
    const gearDetailsPromises = gearIds.map(async (gearId: string) => {
      try {
        const response = await fetch(`https://www.strava.com/api/v3/gear/${gearId}`, {
          headers: {
            'Authorization': `Bearer ${session.accessToken}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          console.warn(`Failed to fetch gear ${gearId}:`, response.status);
          return null;
        }

        const data = await response.json();
        return {
          id: data.id,
          name: data.name,
          brand_name: data.brand_name,
          model_name: data.model_name,
          description: data.description,
          distance: data.distance,
          primary: data.primary,
          frame_type: data.frame_type,
          resource_state: data.resource_state
        };
      } catch (error) {
        console.warn(`Error fetching gear ${gearId}:`, error);
        return null;
      }
    });

    const gearDetails = await Promise.all(gearDetailsPromises);
    
    // Filter out failed requests
    const validGearDetails = gearDetails.filter(gear => gear !== null);

    return NextResponse.json({ gear: validGearDetails });
    
  } catch (error) {
    console.error('Error fetching detailed Strava gear:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}