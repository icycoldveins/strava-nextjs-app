'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LeaderboardTable } from './LeaderboardTable';
import { HeadToHeadCard } from './HeadToHeadCard';
import { FriendActivityFeed } from './FriendActivityFeed';
import { 
  Friend, 
  FriendActivity, 
  FriendComparison as FriendComparisonType,
  TimePeriod, 
  ActivityType 
} from '@/lib/types/friends';
import { 
  generateFriendComparison, 
  getTimePeriodLabel, 
  getActivityTypeLabel,
  FriendWithActivities 
} from '@/lib/friendComparison';

interface FriendComparisonProps {
  className?: string;
}

export function FriendComparison({ className }: FriendComparisonProps) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendActivities, setFriendActivities] = useState<Record<number, FriendActivity[]>>({});
  const [comparison, setComparison] = useState<FriendComparisonType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('month');
  const [activityType, setActivityType] = useState<ActivityType>('all');
  const [selectedFriendId, setSelectedFriendId] = useState<number | null>(null);
  const [activeView, setActiveView] = useState<'leaderboard' | 'head-to-head' | 'feed'>('leaderboard');

  // Fetch friends data
  useEffect(() => {
    fetchFriends();
  }, []);

  // Recalculate comparison when filters change
  useEffect(() => {
    if (friends.length > 0 && Object.keys(friendActivities).length > 0) {
      calculateComparison();
    }
  }, [friends, friendActivities, timePeriod, activityType, selectedFriendId]);

  const fetchFriends = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch friends list (using mock data for development)
      const friendsResponse = await fetch('/api/strava/friends?mock=true');
      if (!friendsResponse.ok) {
        throw new Error('Failed to fetch friends');
      }
      
      const friendsData = await friendsResponse.json();
      setFriends(friendsData.friends);

      // Fetch activities for each friend
      const activitiesPromises = friendsData.friends.map(async (friend: Friend) => {
        try {
          const activitiesResponse = await fetch(
            `/api/strava/friends/activities?friend_id=${friend.id}&mock=true&per_page=50`
          );
          if (!activitiesResponse.ok) {
            console.warn(`Failed to fetch activities for friend ${friend.id}`);
            return { friendId: friend.id, activities: [] };
          }
          
          const activitiesData = await activitiesResponse.json();
          return { friendId: friend.id, activities: activitiesData.activities };
        } catch (err) {
          console.warn(`Error fetching activities for friend ${friend.id}:`, err);
          return { friendId: friend.id, activities: [] };
        }
      });

      const activitiesResults = await Promise.all(activitiesPromises);
      const activitiesMap: Record<number, FriendActivity[]> = {};
      
      activitiesResults.forEach(({ friendId, activities }) => {
        activitiesMap[friendId] = activities;
      });
      
      setFriendActivities(activitiesMap);

    } catch (err) {
      console.error('Error fetching friends data:', err);
      setError('Failed to load friends data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const calculateComparison = () => {
    const friendsWithActivities: FriendWithActivities[] = friends.map(friend => ({
      friend,
      activities: friendActivities[friend.id] || [],
    }));

    const comparisonData = generateFriendComparison(
      friendsWithActivities,
      timePeriod,
      activityType,
      selectedFriendId || undefined
    );

    setComparison(comparisonData);
  };

  const handleRefresh = () => {
    fetchFriends();
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading friend data...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <Alert>
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
          <Button 
            onClick={handleRefresh} 
            className="mt-4"
            variant="outline"
          >
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (friends.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center min-h-[400px] flex items-center justify-center">
            <div>
              <h3 className="text-lg font-semibold mb-2">No Friends Found</h3>
              <p className="text-muted-foreground mb-4">
                Connect with friends on Strava to see performance comparisons.
              </p>
              <Button onClick={handleRefresh} variant="outline">
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const timePeriodOptions: { value: TimePeriod; label: string }[] = [
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'year', label: 'This Year' },
    { value: 'all', label: 'All Time' },
  ];

  const activityTypeOptions: { value: ActivityType; label: string }[] = [
    { value: 'all', label: 'All Activities' },
    { value: 'Run', label: 'Runs' },
    { value: 'Ride', label: 'Rides' },
    { value: 'Swim', label: 'Swims' },
    { value: 'Hike', label: 'Hikes' },
    { value: 'Walk', label: 'Walks' },
  ];

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Friend Performance Comparison</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Compare your performance with friends across different time periods and activities
              </p>
            </div>
            <Button
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              disabled={loading}
            >
              Refresh
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Time Period</label>
              <Select
                value={timePeriod}
                onValueChange={(value) => setTimePeriod(value as TimePeriod)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timePeriodOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Activity Type</label>
              <Select
                value={activityType}
                onValueChange={(value) => setActivityType(value as ActivityType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {activityTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {activeView === 'head-to-head' && (
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Compare With</label>
                <Select
                  value={selectedFriendId?.toString() || ''}
                  onValueChange={(value) => setSelectedFriendId(value ? parseInt(value) : null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select friend" />
                  </SelectTrigger>
                  <SelectContent>
                    {friends.map((friend) => (
                      <SelectItem key={friend.id} value={friend.id.toString()}>
                        {friend.firstname} {friend.lastname}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* View Toggle */}
          <div className="flex border-b mb-6">
            {[
              { key: 'leaderboard', label: 'Leaderboard' },
              { key: 'head-to-head', label: 'Head-to-Head' },
              { key: 'feed', label: 'Activity Feed' },
            ].map((view) => (
              <button
                key={view.key}
                onClick={() => setActiveView(view.key as any)}
                className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                  activeView === view.key
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {view.label}
              </button>
            ))}
          </div>

          {/* Content */}
          {comparison && (
            <div>
              {activeView === 'leaderboard' && (
                <LeaderboardTable
                  leaderboard={comparison.leaderboard}
                  timePeriod={timePeriod}
                  activityType={activityType}
                />
              )}

              {activeView === 'head-to-head' && (
                <div>
                  {comparison.headToHead ? (
                    <HeadToHeadCard comparison={comparison.headToHead} />
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">
                        Select a friend to compare performance head-to-head
                      </p>
                    </div>
                  )}
                </div>
              )}

              {activeView === 'feed' && (
                <FriendActivityFeed
                  friends={friends}
                  friendActivities={friendActivities}
                  timePeriod={timePeriod}
                  activityType={activityType}
                />
              )}
            </div>
          )}

          {/* Summary */}
          <div className="mt-6 pt-6 border-t text-sm text-muted-foreground">
            <p>
              Showing {getActivityTypeLabel(activityType).toLowerCase()} for{' '}
              {getTimePeriodLabel(timePeriod).toLowerCase()} • {friends.length} friends •{' '}
              Last updated: {comparison ? new Date(comparison.lastUpdated).toLocaleString() : 'Never'}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}