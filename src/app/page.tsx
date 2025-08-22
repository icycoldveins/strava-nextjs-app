"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity, TrendingUp, Trophy, Clock, LogOut, Loader2, User, MapPin, Calendar, AlertCircle, Users } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { formatDistance, formatTime, formatDate, formatElevation, getActivityIcon } from "@/lib/formatters";
import { ThemeToggle } from "@/components/theme-toggle";
import { GoalTracker } from "@/components/goals/GoalTracker";
import { GearTracker } from "@/components/gear/GearTracker";
import { BadgeGallery } from "@/components/achievements/BadgeGallery";
import { AchievementProgress } from "@/components/achievements/AchievementProgress";
import { BadgeUnlockToast } from "@/components/achievements/BadgeUnlockToast";
import { useAchievements, useBadgesWithProgress, useAchievementStats } from "@/hooks/useAchievements";

interface Stats {
  allTime: {
    activities: number;
    distance: number;
    time: number;
    elevation: number;
  };
  recent: {
    activities: number;
    distance: number;
  };
}

interface StravaActivity {
  id: number;
  name: string;
  type: string;
  distance: number;
  moving_time: number;
  start_date_local: string;
  location: {
    city?: string;
    state?: string;
    country?: string;
  };
  achievement_count: number;
  kudos_count: number;
  average_speed: number;
}

interface KudoGiver {
  firstname: string;
  lastname: string;
  profile_medium?: string;
  profile?: string;
  city?: string;
  state?: string;
  country?: string;
  premium: boolean;
}

export default function Home() {
  const { data: session, status } = useSession();
  const [stats, setStats] = useState<Stats | null>(null);
  const [activities, setActivities] = useState<StravaActivity[]>([]);
  const [athlete, setAthlete] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [kudosData, setKudosData] = useState<{ [activityId: number]: KudoGiver[] }>({});
  const [loadingKudos, setLoadingKudos] = useState<{ [activityId: number]: boolean }>({});

  // Achievement system integration
  const {
    badges,
    unlockedBadges,
    recentlyUnlocked,
    stats: achievementStats,
    checkForNewAchievements,
    dismissRecentUnlocks,
    isLoading: achievementsLoading,
  } = useAchievements(activities);

  const badgesWithProgress = useBadgesWithProgress(badges);
  const achievementTimeStats = useAchievementStats(badges);

  useEffect(() => {
    if (status !== "loading" && !session) {
      signIn("strava");
    }
  }, [session, status]);

  useEffect(() => {
    if (session) {
      fetchStravaData();
    }
  }, [session]);

  const fetchStravaData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch all data in parallel
      const [statsRes, activitiesRes, athleteRes] = await Promise.all([
        fetch('/api/strava/stats'),
        fetch('/api/strava/activities?per_page=5'),
        fetch('/api/strava/athlete')
      ]);

      if (!statsRes.ok || !activitiesRes.ok || !athleteRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const [statsData, activitiesData, athleteData] = await Promise.all([
        statsRes.json(),
        activitiesRes.json(),
        athleteRes.json()
      ]);

      setStats(statsData);
      setActivities(activitiesData.activities);
      setAthlete(athleteData);
    } catch (err) {
      console.error('Error fetching Strava data:', err);
      setError('Failed to load Strava data. Please try refreshing the page.');
    } finally {
      setLoading(false);
    }
  };

  const fetchKudos = async (activityId: number) => {
    if (kudosData[activityId] || loadingKudos[activityId]) return;
    
    setLoadingKudos(prev => ({ ...prev, [activityId]: true }));
    
    try {
      const response = await fetch(`/api/strava/kudos?activity_id=${activityId}`);
      if (response.ok) {
        const data = await response.json();
        setKudosData(prev => ({ ...prev, [activityId]: data.kudos }));
      }
    } catch (error) {
      console.error('Error fetching kudos:', error);
    } finally {
      setLoadingKudos(prev => ({ ...prev, [activityId]: false }));
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-orange-500 mx-auto" />
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (session) {
    const measurementPref = athlete?.measurement_preference === 'feet' ? 'imperial' : 'metric';
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50/50 via-white to-orange-50/50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="absolute inset-0 bg-grid-black/[0.02] dark:bg-grid-white/[0.02] -z-10" />
        
        {/* Header */}
        <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b dark:border-gray-700 sticky top-0 z-50 shadow-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl">
                  <Activity className="h-6 w-6 text-white" />
                </div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-orange-500 dark:from-orange-400 dark:to-orange-300 bg-clip-text text-transparent">
                  Strava Dashboard
                </h1>
              </div>
              
              <div className="flex items-center space-x-4">
                <ThemeToggle />
                <div className="flex items-center space-x-3">
                  {session.user?.image ? (
                    <img 
                      src={session.user.image} 
                      alt={session.user.name || "Profile"} 
                      className="w-10 h-10 rounded-full border-2 border-orange-200 dark:border-orange-700"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center">
                      <User className="h-5 w-5 text-white" />
                    </div>
                  )}
                  <div className="hidden md:block">
                    <p className="text-sm font-semibold">{session.user?.name || "Athlete"}</p>
                    <p className="text-xs text-muted-foreground">
                      {athlete?.premium ? 'Premium' : 'Free'} Member
                    </p>
                  </div>
                </div>
                
                <Button 
                  onClick={() => signOut()} 
                  variant="outline"
                  size="sm"
                  className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign out
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-white/90 dark:bg-gray-800/90 backdrop-blur">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Activities</CardTitle>
                <Activity className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-2">
                    <div className="h-8 bg-gray-200 rounded animate-pulse" />
                    <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse" />
                  </div>
                ) : (
                  <>
                    <div className="text-2xl font-bold">
                      {stats?.allTime.activities.toLocaleString() || 0}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {stats?.recent.activities || 0} in last 4 weeks
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-white/90 dark:bg-gray-800/90 backdrop-blur">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Distance</CardTitle>
                <TrendingUp className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-2">
                    <div className="h-8 bg-gray-200 rounded animate-pulse" />
                    <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse" />
                  </div>
                ) : (
                  <>
                    <div className="text-2xl font-bold">
                      {formatDistance(stats?.allTime.distance || 0, measurementPref)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistance(stats?.recent.distance || 0, measurementPref)} recent
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-white/90 dark:bg-gray-800/90 backdrop-blur">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Elevation Gain</CardTitle>
                <Trophy className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-2">
                    <div className="h-8 bg-gray-200 rounded animate-pulse" />
                    <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse" />
                  </div>
                ) : (
                  <>
                    <div className="text-2xl font-bold">
                      {formatElevation(stats?.allTime.elevation || 0, measurementPref)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Total climbing
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-white/90 dark:bg-gray-800/90 backdrop-blur">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Time</CardTitle>
                <Clock className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-2">
                    <div className="h-8 bg-gray-200 rounded animate-pulse" />
                    <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse" />
                  </div>
                ) : (
                  <>
                    <div className="text-2xl font-bold">
                      {formatTime(stats?.allTime.time || 0)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Moving time
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Goal Tracker */}
          <GoalTracker 
            activities={activities} 
            measurementPref={measurementPref}
          />

          {/* Gear Tracker */}
          <div className="mb-8">
            <GearTracker activities={activities} />
          </div>

          {/* Achievement Progress - Only show if there are badges with progress */}
          {!achievementsLoading && badgesWithProgress.length > 0 && (
            <AchievementProgress badges={badgesWithProgress} className="mb-8" />
          )}

          {/* Achievement Stats Overview */}
          {!achievementsLoading && badges.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card className="border-0 shadow-lg bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 backdrop-blur">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Badges Unlocked</CardTitle>
                  <Trophy className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {achievementStats.unlockedCount}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    of {achievementStats.totalBadges} total ({achievementStats.completionRate.toFixed(1)}%)
                  </p>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-500 transition-all duration-500"
                      style={{ width: `${achievementStats.completionRate}%` }}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 backdrop-blur">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Recent Unlocks</CardTitle>
                  <Activity className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {achievementTimeStats.recentUnlocks.length}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    in the last 24 hours
                  </p>
                  {achievementTimeStats.recentUnlocks.length > 0 && (
                    <div className="flex -space-x-1 mt-2">
                      {achievementTimeStats.recentUnlocks.slice(0, 3).map((badge, i) => (
                        <div 
                          key={badge.id}
                          className="text-lg bg-white dark:bg-gray-700 rounded-full p-1 border-2 border-blue-200 dark:border-blue-700"
                          title={badge.name}
                        >
                          {badge.icon}
                        </div>
                      ))}
                      {achievementTimeStats.recentUnlocks.length > 3 && (
                        <div className="bg-white dark:bg-gray-700 rounded-full w-8 h-8 flex items-center justify-center border-2 border-blue-200 dark:border-blue-700 text-xs font-bold">
                          +{achievementTimeStats.recentUnlocks.length - 3}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 backdrop-blur">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Legendary Badges</CardTitle>
                  <div className="text-yellow-500">👑</div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {achievementStats.rarityBreakdown.legendary.unlocked}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    of {achievementStats.rarityBreakdown.legendary.total} available
                  </p>
                  {achievementStats.rarityBreakdown.legendary.unlocked > 0 && (
                    <div className="mt-2">
                      <span className="text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 px-2 py-1 rounded-full">
                        Elite Status ⭐
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Achievement Badge Gallery */}
          {!achievementsLoading && badges.length > 0 && (
            <div className="mb-8">
              <BadgeGallery badges={badges} />
            </div>
          )}

          {/* Recent Activities */}
          <Card className="border-0 shadow-lg bg-white/90 dark:bg-gray-800/90 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-xl">Recent Activities</CardTitle>
              <CardDescription>Your latest workouts and achievements</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <>
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="p-4 rounded-lg bg-gray-100 animate-pulse">
                      <div className="flex items-center justify-between">
                        <div className="space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-32" />
                          <div className="h-3 bg-gray-200 rounded w-48" />
                        </div>
                        <div className="space-y-2 text-right">
                          <div className="h-4 bg-gray-200 rounded w-20" />
                          <div className="h-3 bg-gray-200 rounded w-16" />
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              ) : activities.length > 0 ? (
                <>
                  {activities.map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-orange-50 to-transparent dark:from-gray-700/50 dark:to-transparent hover:from-orange-100 dark:hover:from-gray-700 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className="p-2 bg-white dark:bg-gray-700 rounded-lg shadow-sm text-2xl">
                          {getActivityIcon(activity.type)}
                        </div>
                        <div>
                          <h4 className="font-semibold">{activity.name}</h4>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            {activity.location?.city && (
                              <span className="flex items-center">
                                <MapPin className="h-3 w-3 mr-1" />
                                {activity.location.city}
                                {activity.location.state && `, ${activity.location.state}`}
                              </span>
                            )}
                            <span className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              {formatDate(activity.start_date_local)}
                            </span>
                          </div>
                          {(activity.achievement_count > 0 || activity.kudos_count > 0) && (
                            <div className="flex items-center space-x-3 mt-1">
                              {activity.achievement_count > 0 && (
                                <span className="text-xs text-yellow-600">
                                  🏆 {activity.achievement_count} achievement{activity.achievement_count > 1 ? 's' : ''}
                                </span>
                              )}
                              {activity.kudos_count > 0 && (
                                <button
                                  onClick={() => fetchKudos(activity.id)}
                                  className="text-xs text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1"
                                >
                                  👍 {activity.kudos_count} kudos
                                  {kudosData[activity.id] && (
                                    <Users className="h-3 w-3" />
                                  )}
                                </button>
                              )}
                            </div>
                          )}
                          {kudosData[activity.id] && kudosData[activity.id].length > 0 && (
                            <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                              <p className="text-xs font-semibold mb-1 text-gray-600 dark:text-gray-400">Kudos from:</p>
                              <div className="flex flex-wrap gap-2">
                                {kudosData[activity.id].map((giver, idx) => (
                                  <div key={idx} className="flex items-center gap-1">
                                    {giver.profile_medium && (
                                      <img 
                                        src={giver.profile_medium} 
                                        alt={`${giver.firstname} ${giver.lastname}`}
                                        className="w-5 h-5 rounded-full"
                                      />
                                    )}
                                    <span className="text-xs text-gray-600 dark:text-gray-400">
                                      {giver.firstname} {giver.lastname?.[0]}.
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          {formatDistance(activity.distance, measurementPref)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatTime(activity.moving_time)}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  <Button 
                    className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                    onClick={() => window.open('https://www.strava.com/athlete/activities', '_blank')}
                  >
                    View All Activities on Strava
                  </Button>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No activities found</p>
                  <p className="text-sm mt-2">Start recording activities on Strava to see them here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </main>

        {/* Achievement Unlock Toast */}
        {recentlyUnlocked.length > 0 && (
          <BadgeUnlockToast
            unlockedBadges={recentlyUnlocked}
            onDismiss={dismissRecentUnlocks}
          />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="text-center space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-orange-500 mx-auto" />
        <p className="text-muted-foreground">Redirecting to Strava login...</p>
      </div>
    </div>
  );
}