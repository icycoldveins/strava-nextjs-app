import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { WeatherService } from '@/lib/weatherService';
import { WeatherData } from '@/lib/types/weather';

const weatherService = new WeatherService({
  provider: process.env.NODE_ENV === 'production' ? 'openweathermap' : 'mock',
  apiKey: process.env.OPENWEATHERMAP_API_KEY,
  cacheExpiry: 3600000, // 1 hour
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const lat = searchParams.get('lat');
    const lon = searchParams.get('lon');
    const timestamp = searchParams.get('timestamp');

    if (!lat || !lon || !timestamp) {
      return NextResponse.json(
        { error: 'Missing required parameters: lat, lon, timestamp' },
        { status: 400 }
      );
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);

    if (isNaN(latitude) || isNaN(longitude)) {
      return NextResponse.json(
        { error: 'Invalid coordinates' },
        { status: 400 }
      );
    }

    // Validate timestamp
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) {
      return NextResponse.json(
        { error: 'Invalid timestamp' },
        { status: 400 }
      );
    }

    const weatherData = await weatherService.getWeatherForActivity(
      latitude,
      longitude,
      timestamp
    );

    return NextResponse.json({ weather: weatherData });

  } catch (error) {
    console.error('Error fetching weather data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch weather data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { activities } = body;

    if (!activities || !Array.isArray(activities)) {
      return NextResponse.json(
        { error: 'Invalid request body. Expected array of activities.' },
        { status: 400 }
      );
    }

    // Validate activity structure
    const validActivities = activities.filter(activity => {
      return (
        activity.id &&
        typeof activity.lat === 'number' &&
        typeof activity.lon === 'number' &&
        activity.timestamp &&
        !isNaN(new Date(activity.timestamp).getTime())
      );
    });

    if (validActivities.length === 0) {
      return NextResponse.json(
        { error: 'No valid activities provided' },
        { status: 400 }
      );
    }

    // Limit batch size to prevent abuse
    const MAX_BATCH_SIZE = 50;
    if (validActivities.length > MAX_BATCH_SIZE) {
      return NextResponse.json(
        { error: `Batch size too large. Maximum ${MAX_BATCH_SIZE} activities allowed.` },
        { status: 400 }
      );
    }

    const weatherResults = await weatherService.getWeatherForMultipleActivities(
      validActivities.map(activity => ({
        id: activity.id,
        lat: activity.lat,
        lon: activity.lon,
        timestamp: activity.timestamp,
      }))
    );

    // Convert Map to object for JSON response
    const weatherData: { [key: string]: WeatherData } = {};
    weatherResults.forEach((weather, activityId) => {
      weatherData[activityId.toString()] = weather;
    });

    return NextResponse.json({
      weather_data: weatherData,
      processed_count: weatherResults.size,
      requested_count: validActivities.length,
    });

  } catch (error) {
    console.error('Error processing batch weather request:', error);
    return NextResponse.json(
      { error: 'Failed to process weather data request' },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function HEAD(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return new NextResponse(null, { status: 401 });
    }

    return new NextResponse(null, { status: 200 });
  } catch (error) {
    return new NextResponse(null, { status: 500 });
  }
}