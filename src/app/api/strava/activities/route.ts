import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function GET(req: NextRequest) {
  try {
    // Get user's JWT token (which contains the Strava access token)
    const token = await getToken({ req });
    
    if (!token || !token.accessToken) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get query parameters
    const url = new URL(req.url);
    const after = url.searchParams.get("after");
    const perPage = url.searchParams.get("per_page") || "30";
    
    // Get activities from Strava API
    const response = await axios.get("https://www.strava.com/api/v3/athlete/activities", {
      params: {
        after: after,
        per_page: perPage
      },
      headers: {
        Authorization: `Bearer ${token.accessToken}`
      }
    });
    
    // Return the activities
    return NextResponse.json(response.data);
    
  } catch (error: any) {
    console.error("Error fetching Strava activities:", error.response?.data || error.message);
    
    // Handle token expiration
    if (error.response?.status === 401) {
      return NextResponse.json({ error: "Strava token expired" }, { status: 401 });
    }
    
    return NextResponse.json({ error: "Failed to fetch activities" }, { status: 500 });
  }
}
