'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  LeaderboardEntry, 
  TimePeriod, 
  ActivityType 
} from '@/lib/types/friends';
import { 
  COMPARISON_METRICS, 
  getRankMedal,
  getTimePeriodLabel,
  getActivityTypeLabel 
} from '@/lib/friendComparison';

interface LeaderboardTableProps {
  leaderboard: LeaderboardEntry[];
  timePeriod: TimePeriod;
  activityType: ActivityType;
  className?: string;
}

export function LeaderboardTable({ 
  leaderboard, 
  timePeriod, 
  activityType, 
  className 
}: LeaderboardTableProps) {
  const [sortBy, setSortBy] = useState<keyof LeaderboardEntry['stats']>('totalDistance');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  if (leaderboard.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <h3 className="text-lg font-semibold mb-2">No Data Available</h3>
            <p className="text-muted-foreground">
              No activities found for the selected time period and activity type.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const sortedLeaderboard = [...leaderboard].sort((a, b) => {
    const aValue = a.stats[sortBy] || 0;
    const bValue = b.stats[sortBy] || 0;
    
    if (sortDirection === 'desc') {
      return bValue - aValue;
    } else {
      return aValue - bValue;
    }
  });

  // Update ranks based on current sort
  sortedLeaderboard.forEach((entry, index) => {
    entry.rank = index + 1;
  });

  const handleSort = (metric: keyof LeaderboardEntry['stats']) => {
    if (sortBy === metric) {
      setSortDirection(sortDirection === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(metric);
      setSortDirection('desc');
    }
  };


  return (
    <div className={className}>
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">
          {getActivityTypeLabel(activityType)} Leaderboard - {getTimePeriodLabel(timePeriod)}
        </h3>
        <p className="text-sm text-muted-foreground">
          Click on column headers to sort by different metrics
        </p>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block">
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 font-medium">Rank</th>
                  <th className="text-left p-4 font-medium">Athlete</th>
                  {COMPARISON_METRICS.map((metric) => (
                    <th key={metric.key} className="text-left p-4 font-medium">
                      <Button
                        variant="ghost"
                        onClick={() => handleSort(metric.key)}
                        className="h-auto p-0 font-medium hover:bg-transparent"
                      >
                        <span className="flex items-center gap-1">
                          {metric.label}
                          {sortBy === metric.key && (
                            <span className="text-xs">
                              {sortDirection === 'desc' ? '↓' : '↑'}
                            </span>
                          )}
                        </span>
                      </Button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedLeaderboard.map((entry) => (
                  <tr 
                    key={entry.friend.id} 
                    className="border-b hover:bg-muted/50 transition-colors"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-lg">
                          #{entry.rank}
                        </span>
                        <span className="text-lg">
                          {getRankMedal(entry.rank)}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <Image
                          src={entry.friend.profile_medium || entry.friend.profile || `https://ui-avatars.com/api/?name=${entry.friend.firstname}+${entry.friend.lastname}&background=random`}
                          alt={`${entry.friend.firstname} ${entry.friend.lastname}`}
                          width={40}
                          height={40}
                          className="rounded-full object-cover"
                        />
                        <div>
                          <div className="font-medium">
                            {entry.friend.firstname} {entry.friend.lastname}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            @{entry.friend.username}
                          </div>
                        </div>
                      </div>
                    </td>
                    {COMPARISON_METRICS.map((metric) => (
                      <td key={metric.key} className="p-4">
                        <div className="font-medium">
                          {metric.formatter(entry.stats[metric.key] || 0)}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {sortedLeaderboard.map((entry) => (
          <Card key={entry.friend.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Image
                    src={entry.friend.profile_medium || entry.friend.profile || `https://ui-avatars.com/api/?name=${entry.friend.firstname}+${entry.friend.lastname}&background=random`}
                    alt={`${entry.friend.firstname} ${entry.friend.lastname}`}
                    width={48}
                    height={48}
                    className="rounded-full object-cover"
                  />
                  <div>
                    <div className="font-medium">
                      {entry.friend.firstname} {entry.friend.lastname}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      @{entry.friend.username}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-lg">#{entry.rank}</span>
                    <span className="text-lg">{getRankMedal(entry.rank)}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Top {entry.percentile}%
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {COMPARISON_METRICS.slice(0, 4).map((metric) => (
                  <div key={metric.key} className="text-center">
                    <div className="text-sm text-muted-foreground">{metric.label}</div>
                    <div className="font-medium">
                      {metric.formatter(entry.stats[metric.key] || 0)}
                    </div>
                  </div>
                ))}
              </div>

              {COMPARISON_METRICS.length > 4 && (
                <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t">
                  {COMPARISON_METRICS.slice(4).map((metric) => (
                    <div key={metric.key} className="text-center">
                      <div className="text-sm text-muted-foreground">{metric.label}</div>
                      <div className="font-medium">
                        {metric.formatter(entry.stats[metric.key] || 0)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Summary Stats */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{leaderboard.length}</div>
              <div className="text-sm text-muted-foreground">Friends</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {leaderboard.reduce((sum, entry) => sum + entry.stats.activityCount, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Total Activities</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {(leaderboard.reduce((sum, entry) => sum + entry.stats.totalDistance, 0) / 1000).toFixed(0)}km
              </div>
              <div className="text-sm text-muted-foreground">Combined Distance</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {Math.round(leaderboard.reduce((sum, entry) => sum + entry.stats.totalTime, 0) / 3600)}h
              </div>
              <div className="text-sm text-muted-foreground">Combined Time</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}