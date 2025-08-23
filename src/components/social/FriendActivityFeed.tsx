'use client';

import React, { useMemo, useState } from 'react';
import Image from 'next/image';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Friend, 
  FriendActivity, 
  TimePeriod, 
  ActivityType 
} from '@/lib/types/friends';
import { 
  filterActivitiesByPeriod, 
  filterActivitiesByType,
  getTimePeriodLabel,
  getActivityTypeLabel
} from '@/lib/friendComparison';

interface FriendActivityFeedProps {
  friends: Friend[];
  friendActivities: Record<number, FriendActivity[]>;
  timePeriod: TimePeriod;
  activityType: ActivityType;
  className?: string;
}

export function FriendActivityFeed({ 
  friends, 
  friendActivities, 
  timePeriod, 
  activityType, 
  className 
}: FriendActivityFeedProps) {
  const [showCount, setShowCount] = useState(10);

  const feedActivities = useMemo(() => {
    // Combine all friend activities
    const allActivities: (FriendActivity & { friendInfo: Friend })[] = [];
    
    friends.forEach(friend => {
      const activities = friendActivities[friend.id] || [];
      const filteredActivities = filterActivitiesByType(
        filterActivitiesByPeriod(activities, timePeriod),
        activityType
      );
      
      filteredActivities.forEach(activity => {
        allActivities.push({
          ...activity,
          friendInfo: friend,
        });
      });
    });

    // Sort by date (newest first)
    return allActivities
      .sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime())
      .slice(0, showCount);
  }, [friends, friendActivities, timePeriod, activityType, showCount]);

  if (feedActivities.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <h3 className="text-lg font-semibold mb-2">No Activities Found</h3>
            <p className="text-muted-foreground">
              No activities found for the selected time period and activity type.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getActivityIcon = (type: string): string => {
    switch (type.toLowerCase()) {
      case 'run':
        return '🏃';
      case 'ride':
        return '🚴';
      case 'swim':
        return '🏊';
      case 'hike':
        return '🥾';
      case 'walk':
        return '🚶';
      case 'workout':
        return '💪';
      default:
        return '🏃';
    }
  };

  const formatDistance = (distance: number): string => {
    return `${(distance / 1000).toFixed(1)} km`;
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatSpeed = (speed: number): string => {
    return `${(speed * 3.6).toFixed(1)} km/h`;
  };

  const getRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  };

  const getPerformanceBadge = (activity: FriendActivity): string | null => {
    if (activity.achievement_count > 0) return '🏆';
    if (activity.kudos_count > 10) return '❤️';
    if (activity.distance > 20000) return '🎯'; // 20km+
    if (activity.moving_time > 3600) return '⏱️'; // 1h+
    return null;
  };

  return (
    <div className={className}>
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">
          Friend Activity Feed - {getTimePeriodLabel(timePeriod)}
        </h3>
        <p className="text-sm text-muted-foreground">
          Recent {getActivityTypeLabel(activityType).toLowerCase()} from your friends
        </p>
      </div>

      <div className="space-y-4">
        {feedActivities.map((activity) => (
          <Card key={`${activity.friendInfo.id}-${activity.id}`} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                {/* Friend Profile */}
                <Image
                  src={activity.friendInfo.profile_medium || activity.friendInfo.profile || `https://ui-avatars.com/api/?name=${activity.friendInfo.firstname}+${activity.friendInfo.lastname}&background=random`}
                  alt={`${activity.friendInfo.firstname} ${activity.friendInfo.lastname}`}
                  width={48}
                  height={48}
                  className="rounded-full object-cover flex-shrink-0"
                />

                {/* Activity Content */}
                <div className="flex-1 min-w-0">
                  {/* Header */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold">
                      {activity.friendInfo.firstname} {activity.friendInfo.lastname}
                    </span>
                    <span className="text-muted-foreground">completed a</span>
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
                      {getActivityIcon(activity.type)}
                      {activity.type}
                    </span>
                    {getPerformanceBadge(activity) && (
                      <span className="text-lg">{getPerformanceBadge(activity)}</span>
                    )}
                  </div>

                  {/* Activity Title */}
                  <h4 className="font-medium text-lg mb-2 line-clamp-1">
                    {activity.name}
                  </h4>

                  {/* Activity Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                    <div>
                      <div className="text-sm text-muted-foreground">Distance</div>
                      <div className="font-semibold">{formatDistance(activity.distance)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Time</div>
                      <div className="font-semibold">{formatTime(activity.moving_time)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Avg Speed</div>
                      <div className="font-semibold">{formatSpeed(activity.average_speed)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Elevation</div>
                      <div className="font-semibold">{activity.total_elevation_gain}m</div>
                    </div>
                  </div>

                  {/* Additional Stats Row for Detailed Activities */}
                  {(activity.average_heartrate || activity.average_watts || activity.calories) && (
                    <div className="grid grid-cols-3 gap-4 mb-3 text-sm">
                      {activity.average_heartrate && (
                        <div>
                          <span className="text-muted-foreground">Avg HR: </span>
                          <span className="font-medium">{Math.round(activity.average_heartrate)} bpm</span>
                        </div>
                      )}
                      {activity.average_watts && (
                        <div>
                          <span className="text-muted-foreground">Avg Power: </span>
                          <span className="font-medium">{Math.round(activity.average_watts)}W</span>
                        </div>
                      )}
                      {activity.calories && (
                        <div>
                          <span className="text-muted-foreground">Calories: </span>
                          <span className="font-medium">{activity.calories}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-4">
                      <span>{getRelativeTime(activity.start_date)}</span>
                      {activity.achievement_count > 0 && (
                        <span className="flex items-center gap-1">
                          <span>🏆</span>
                          {activity.achievement_count} {activity.achievement_count === 1 ? 'achievement' : 'achievements'}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      {activity.kudos_count > 0 && (
                        <span className="flex items-center gap-1">
                          <span>❤️</span>
                          {activity.kudos_count}
                        </span>
                      )}
                      {activity.comment_count && activity.comment_count > 0 && (
                        <span className="flex items-center gap-1">
                          <span>💬</span>
                          {activity.comment_count}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Load More Button */}
      {Object.values(friendActivities).some(activities => 
        filterActivitiesByType(
          filterActivitiesByPeriod(activities, timePeriod),
          activityType
        ).length > showCount
      ) && (
        <div className="text-center mt-6">
          <Button
            variant="outline"
            onClick={() => setShowCount(prev => prev + 10)}
          >
            Load More Activities
          </Button>
        </div>
      )}

      {/* Summary Card */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Feed Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold">{feedActivities.length}</div>
              <div className="text-sm text-muted-foreground">Activities Shown</div>
            </div>
            <div>
              <div className="text-2xl font-bold">
                {new Set(feedActivities.map(a => a.friendInfo.id)).size}
              </div>
              <div className="text-sm text-muted-foreground">Active Friends</div>
            </div>
            <div>
              <div className="text-2xl font-bold">
                {feedActivities.reduce((sum, a) => sum + a.kudos_count, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Total Kudos</div>
            </div>
            <div>
              <div className="text-2xl font-bold">
                {feedActivities.reduce((sum, a) => sum + a.achievement_count, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Achievements</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}