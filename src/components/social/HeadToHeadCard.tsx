'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { HeadToHeadComparison } from '@/lib/types/friends';
import { COMPARISON_METRICS, getTimePeriodLabel, getActivityTypeLabel } from '@/lib/friendComparison';

interface HeadToHeadCardProps {
  comparison: HeadToHeadComparison;
  className?: string;
}

export function HeadToHeadCard({ comparison, className }: HeadToHeadCardProps) {
  const { friend1, friend2, period, comparison: comp, overallWinner, winScore } = comparison;

  const getWinnerColor = (winnerId: number): string => {
    if (winnerId === friend1.id) return 'text-green-600';
    if (winnerId === friend2.id) return 'text-blue-600';
    return 'text-muted-foreground';
  };

  const getWinnerBg = (winnerId: number): string => {
    if (winnerId === friend1.id) return 'bg-green-50 border-green-200';
    if (winnerId === friend2.id) return 'bg-blue-50 border-blue-200';
    return 'bg-muted/10';
  };

  const formatComparison = (metric: string, friend1Value: number, friend2Value: number, difference: number, percentDiff?: number) => {
    const metricConfig = COMPARISON_METRICS.find(m => m.key === metric);
    const formatter = metricConfig?.formatter || ((val: number) => val.toString());
    
    return {
      friend1Formatted: formatter(friend1Value),
      friend2Formatted: formatter(friend2Value),
      differenceFormatted: formatter(difference),
      percentDiff: percentDiff ? `${percentDiff}%` : null,
    };
  };

  return (
    <div className={className}>
      {/* Header */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-center">
            Head-to-Head Comparison - {getTimePeriodLabel(period)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center gap-8">
            {/* Friend 1 */}
            <div className={`text-center p-4 rounded-lg border-2 ${getWinnerBg(overallWinner === friend1.id ? friend1.id : 0)}`}>
              <img
                src={friend1.profile_medium || friend1.profile}
                alt={`${friend1.firstname} ${friend1.lastname}`}
                className="w-16 h-16 rounded-full object-cover mx-auto mb-2"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = `https://ui-avatars.com/api/?name=${friend1.firstname}+${friend1.lastname}&background=random`;
                }}
              />
              <div className="font-semibold">{friend1.firstname} {friend1.lastname}</div>
              <div className="text-sm text-muted-foreground">@{friend1.username}</div>
              <div className="mt-2">
                <div className="text-2xl font-bold text-green-600">{winScore.friend1}</div>
                <div className="text-xs text-muted-foreground">wins</div>
              </div>
            </div>

            {/* VS */}
            <div className="text-center">
              <div className="text-2xl font-bold text-muted-foreground">VS</div>
              {overallWinner && (
                <div className="mt-2">
                  <div className={`text-lg font-semibold ${getWinnerColor(overallWinner)}`}>
                    {overallWinner === friend1.id ? friend1.firstname : friend2.firstname} Wins!
                  </div>
                </div>
              )}
            </div>

            {/* Friend 2 */}
            <div className={`text-center p-4 rounded-lg border-2 ${getWinnerBg(overallWinner === friend2.id ? friend2.id : 0)}`}>
              <img
                src={friend2.profile_medium || friend2.profile}
                alt={`${friend2.firstname} ${friend2.lastname}`}
                className="w-16 h-16 rounded-full object-cover mx-auto mb-2"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = `https://ui-avatars.com/api/?name=${friend2.firstname}+${friend2.lastname}&background=random`;
                }}
              />
              <div className="font-semibold">{friend2.firstname} {friend2.lastname}</div>
              <div className="text-sm text-muted-foreground">@{friend2.username}</div>
              <div className="mt-2">
                <div className="text-2xl font-bold text-blue-600">{winScore.friend2}</div>
                <div className="text-xs text-muted-foreground">wins</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Comparisons */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Distance Comparison */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span>Distance</span>
              <span className={`text-sm ${getWinnerColor(comp.distance.winner)}`}>
                {comp.distance.winner === friend1.id ? friend1.firstname : friend2.firstname} wins
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const { friend1Formatted, friend2Formatted, differenceFormatted, percentDiff } = 
                formatComparison('totalDistance', comp.distance.friend1, comp.distance.friend2, comp.distance.difference, comp.distance.percentDifference);
              
              return (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">{friend1.firstname}</span>
                    <span className="font-semibold">{friend1Formatted}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">{friend2.firstname}</span>
                    <span className="font-semibold">{friend2Formatted}</span>
                  </div>
                  <div className="pt-2 border-t text-center">
                    <div className="text-sm text-muted-foreground">Difference</div>
                    <div className="font-medium">{differenceFormatted}</div>
                    {percentDiff && <div className="text-xs text-muted-foreground">({percentDiff})</div>}
                  </div>
                </div>
              );
            })()}
          </CardContent>
        </Card>

        {/* Time Comparison */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span>Time</span>
              <span className={`text-sm ${getWinnerColor(comp.time.winner)}`}>
                {comp.time.winner === friend1.id ? friend1.firstname : friend2.firstname} wins
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const { friend1Formatted, friend2Formatted, differenceFormatted, percentDiff } = 
                formatComparison('totalTime', comp.time.friend1, comp.time.friend2, comp.time.difference, comp.time.percentDifference);
              
              return (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">{friend1.firstname}</span>
                    <span className="font-semibold">{friend1Formatted}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">{friend2.firstname}</span>
                    <span className="font-semibold">{friend2Formatted}</span>
                  </div>
                  <div className="pt-2 border-t text-center">
                    <div className="text-sm text-muted-foreground">Difference</div>
                    <div className="font-medium">{differenceFormatted}</div>
                    {percentDiff && <div className="text-xs text-muted-foreground">({percentDiff})</div>}
                  </div>
                </div>
              );
            })()}
          </CardContent>
        </Card>

        {/* Elevation Comparison */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span>Elevation</span>
              <span className={`text-sm ${getWinnerColor(comp.elevation.winner)}`}>
                {comp.elevation.winner === friend1.id ? friend1.firstname : friend2.firstname} wins
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const { friend1Formatted, friend2Formatted, differenceFormatted, percentDiff } = 
                formatComparison('totalElevation', comp.elevation.friend1, comp.elevation.friend2, comp.elevation.difference, comp.elevation.percentDifference);
              
              return (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">{friend1.firstname}</span>
                    <span className="font-semibold">{friend1Formatted}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">{friend2.firstname}</span>
                    <span className="font-semibold">{friend2Formatted}</span>
                  </div>
                  <div className="pt-2 border-t text-center">
                    <div className="text-sm text-muted-foreground">Difference</div>
                    <div className="font-medium">{differenceFormatted}</div>
                    {percentDiff && <div className="text-xs text-muted-foreground">({percentDiff})</div>}
                  </div>
                </div>
              );
            })()}
          </CardContent>
        </Card>

        {/* Activities Comparison */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span>Activities</span>
              <span className={`text-sm ${getWinnerColor(comp.activities.winner)}`}>
                {comp.activities.winner === friend1.id ? friend1.firstname : friend2.firstname} wins
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">{friend1.firstname}</span>
                <span className="font-semibold">{comp.activities.friend1}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">{friend2.firstname}</span>
                <span className="font-semibold">{comp.activities.friend2}</span>
              </div>
              <div className="pt-2 border-t text-center">
                <div className="text-sm text-muted-foreground">Difference</div>
                <div className="font-medium">{comp.activities.difference} activities</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Average Speed Comparison */}
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            <span>Average Speed</span>
            <span className={`text-sm ${getWinnerColor(comp.avgSpeed.winner)}`}>
              {comp.avgSpeed.winner === friend1.id ? friend1.firstname : friend2.firstname} wins
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(() => {
            const { friend1Formatted, friend2Formatted, differenceFormatted, percentDiff } = 
              formatComparison('averageSpeed', comp.avgSpeed.friend1, comp.avgSpeed.friend2, comp.avgSpeed.difference, comp.avgSpeed.percentDifference);
            
            return (
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-sm text-muted-foreground">{friend1.firstname}</div>
                  <div className="text-xl font-semibold">{friend1Formatted}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Difference</div>
                  <div className="font-medium">{differenceFormatted}</div>
                  {percentDiff && <div className="text-xs text-muted-foreground">({percentDiff})</div>}
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">{friend2.firstname}</div>
                  <div className="text-xl font-semibold">{friend2Formatted}</div>
                </div>
              </div>
            );
          })()}
        </CardContent>
      </Card>

      {/* Progress Bars for Visual Comparison */}
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-base">Visual Comparison</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { key: 'distance', label: 'Distance', friend1: comp.distance.friend1, friend2: comp.distance.friend2 },
            { key: 'time', label: 'Time', friend1: comp.time.friend1, friend2: comp.time.friend2 },
            { key: 'elevation', label: 'Elevation', friend1: comp.elevation.friend1, friend2: comp.elevation.friend2 },
            { key: 'activities', label: 'Activities', friend1: comp.activities.friend1, friend2: comp.activities.friend2 },
          ].map((item) => {
            const max = Math.max(item.friend1, item.friend2);
            const friend1Percent = max > 0 ? (item.friend1 / max) * 100 : 0;
            const friend2Percent = max > 0 ? (item.friend2 / max) * 100 : 0;
            
            return (
              <div key={item.key}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs w-20 truncate">{friend1.firstname}</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${friend1Percent}%` }}
                      />
                    </div>
                    <span className="text-xs w-8 text-right">{Math.round(friend1Percent)}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs w-20 truncate">{friend2.firstname}</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${friend2Percent}%` }}
                      />
                    </div>
                    <span className="text-xs w-8 text-right">{Math.round(friend2Percent)}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}