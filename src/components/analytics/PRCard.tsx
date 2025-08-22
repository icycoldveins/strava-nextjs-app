'use client';

import { Card } from '@/components/ui/card';
import { PersonalRecord } from '@/lib/types/personalRecords';
import { getPRDisplayValue, formatTime, calculateImprovement } from '@/lib/prCalculations';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Trophy, TrendingUp, TrendingDown, Calendar, Clock, Target } from 'lucide-react';

interface PRCardProps {
  personalRecord: PersonalRecord;
  showTrend?: boolean;
  compact?: boolean;
}

export function PRCard({ personalRecord, showTrend = true, compact = false }: PRCardProps) {
  const { distance, bestTime, achievedDate, improvementFromPrevious, recentAttempts, trendData } = personalRecord;
  
  // Format the achieved date
  const formattedDate = new Date(achievedDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  // Prepare trend data for chart
  const chartData = trendData.map((point, index) => ({
    attempt: index + 1,
    time: point.time,
    pace: point.pace,
    date: new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }));

  // Calculate recent performance trend
  const recentTrend = trendData.length >= 2 ? 
    calculateImprovement(trendData[trendData.length - 2].time, trendData[trendData.length - 1].time) : null;

  const isImproving = recentTrend !== null && recentTrend > 0;
  const isStagnant = recentTrend !== null && Math.abs(recentTrend) < 1;

  if (compact) {
    return (
      <Card className="p-4 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-full bg-yellow-100 dark:bg-yellow-900/20">
              <Trophy className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">{distance.name}</h3>
              <p className="text-xs text-muted-foreground">{distance.category}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-bold text-lg">{formatTime(bestTime)}</p>
            <p className="text-xs text-muted-foreground">{getPRDisplayValue(personalRecord)}</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-full bg-yellow-100 dark:bg-yellow-900/20">
            <Trophy className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold">{distance.name}</h3>
            <p className="text-sm text-muted-foreground capitalize">{distance.category}</p>
          </div>
        </div>
        
        {/* Improvement indicator */}
        {improvementFromPrevious !== undefined && (
          <div className="flex items-center space-x-1 px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/20">
            <TrendingUp className="h-3 w-3 text-green-600 dark:text-green-400" />
            <span className="text-xs font-medium text-green-600 dark:text-green-400">
              -{improvementFromPrevious.toFixed(1)}%
            </span>
          </div>
        )}
      </div>

      {/* PR Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Best Time</span>
          </div>
          <p className="text-2xl font-bold">{formatTime(bestTime)}</p>
          <p className="text-sm text-muted-foreground">{getPRDisplayValue(personalRecord)}</p>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Achieved</span>
          </div>
          <p className="text-lg font-semibold">{formattedDate}</p>
          <p className="text-xs text-muted-foreground">
            {Math.floor((Date.now() - new Date(achievedDate).getTime()) / (1000 * 60 * 60 * 24))} days ago
          </p>
        </div>
      </div>

      {/* Recent Performance */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium">Recent Performance</h4>
          {recentTrend !== null && (
            <div className="flex items-center space-x-1">
              {isImproving ? (
                <TrendingUp className="h-3 w-3 text-green-500" />
              ) : isStagnant ? (
                <Target className="h-3 w-3 text-yellow-500" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500" />
              )}
              <span className={`text-xs ${
                isImproving ? 'text-green-600' : isStagnant ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {isImproving ? `+${recentTrend.toFixed(1)}%` : 
                 isStagnant ? 'Stable' : 
                 `${recentTrend.toFixed(1)}%`}
              </span>
            </div>
          )}
        </div>
        
        <div className="space-y-2">
          {recentAttempts.slice(-3).map((attempt, index) => (
            <div key={attempt.activityId} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {new Date(attempt.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
              <div className="flex items-center space-x-2">
                <span className={attempt.isPersonalRecord ? 'font-bold text-yellow-600' : ''}>
                  {formatTime(attempt.time)}
                </span>
                {attempt.isPersonalRecord && (
                  <Trophy className="h-3 w-3 text-yellow-600" />
                )}
                {attempt.improvementPercentage && (
                  <span className="text-xs text-green-600">
                    (-{attempt.improvementPercentage.toFixed(1)}%)
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Trend Chart */}
      {showTrend && chartData.length > 1 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Progress Trend</h4>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis 
                  dataKey="date" 
                  fontSize={10}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  domain={['dataMin - 10', 'dataMax + 10']}
                  fontSize={10}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => formatTime(value)}
                />
                <Tooltip 
                  labelFormatter={(label) => `Attempt: ${label}`}
                  formatter={(value: number) => [formatTime(value), 'Time']}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                    fontSize: '12px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="time" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 3 }}
                  activeDot={{ r: 4, fill: 'hsl(var(--primary))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </Card>
  );
}