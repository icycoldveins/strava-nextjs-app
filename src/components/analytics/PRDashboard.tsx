'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PRCard } from './PRCard';
import { PotentialPR, PersonalRecord } from '@/lib/types/personalRecords';
import { formatTime, getPRDisplayValue } from '@/lib/prCalculations';
import { usePersonalRecords } from '@/hooks/usePersonalRecords';
import { 
  Trophy, 
  TrendingUp, 
  Target, 
  Download, 
  RefreshCw,
  Calendar,
  Medal,
  Clock,
  Zap,
  Activity,
  Filter
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, PieChart, Pie, Cell } from 'recharts';

interface PRDashboardProps {
  className?: string;
}

export function PRDashboard({ className }: PRDashboardProps) {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'running' | 'cycling'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'compact'>('grid');

  const {
    prAnalysis,
    personalRecords,
    recentImprovements,
    potentialPRs,
    summary,
    loading,
    error,
    refreshPRData,
    hasData,
    isStale
  } = usePersonalRecords();

  const exportPRData = () => {
    if (!hasData || !prAnalysis) return;
    
    const exportData = {
      personalRecords: personalRecords.map(pr => ({
        distance: pr.distance.name,
        category: pr.distance.category,
        bestTime: formatTime(pr.bestTime),
        pace: getPRDisplayValue(pr),
        achievedDate: pr.achievedDate,
        activityName: pr.activityName
      })),
      summary,
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `strava-personal-records-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Personal Records</h2>
            <p className="text-muted-foreground">Analyzing your best performances...</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
              <div className="h-8 bg-muted rounded w-3/4"></div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`space-y-6 ${className}`}>
        <Card className="p-6">
          <div className="text-center space-y-4">
            <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/20 w-fit mx-auto">
              <Activity className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Failed to Load Personal Records</h3>
              <p className="text-muted-foreground">{error}</p>
            </div>
            <Button onClick={refreshPRData} className="w-fit">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (!hasData || !summary) return null;

  // Filter PRs by category
  const filteredPRs = selectedCategory === 'all' 
    ? personalRecords 
    : personalRecords.filter(pr => pr.distance.category === selectedCategory);

  // Prepare chart data
  const categoryData = [
    { name: 'Running PRs', value: personalRecords.filter(pr => pr.distance.category === 'running').length, color: '#3b82f6' },
    { name: 'Cycling PRs', value: personalRecords.filter(pr => pr.distance.category === 'cycling').length, color: '#10b981' }
  ];

  const improvementData = personalRecords
    .filter(pr => pr.improvementFromPrevious !== undefined)
    .map(pr => ({
      distance: pr.distance.name,
      improvement: pr.improvementFromPrevious!,
      category: pr.distance.category
    }))
    .sort((a, b) => b.improvement - a.improvement)
    .slice(0, 6);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold">Personal Records</h2>
          <p className="text-muted-foreground">
            Your best performances across {summary.totalPRs} distances
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-muted rounded-lg p-1">
            <Button
              variant={selectedCategory === 'all' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSelectedCategory('all')}
            >
              All
            </Button>
            <Button
              variant={selectedCategory === 'running' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSelectedCategory('running')}
            >
              Running
            </Button>
            <Button
              variant={selectedCategory === 'cycling' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSelectedCategory('cycling')}
            >
              Cycling
            </Button>
          </div>
          
          <div className="flex items-center bg-muted rounded-lg p-1">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              Grid
            </Button>
            <Button
              variant={viewMode === 'compact' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('compact')}
            >
              Compact
            </Button>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={refreshPRData}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={exportPRData}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-full bg-yellow-100 dark:bg-yellow-900/20">
              <Trophy className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total PRs</p>
              <p className="text-2xl font-bold">{summary.totalPRs}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/20">
              <Calendar className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Recent PRs</p>
              <p className="text-2xl font-bold">{summary.recentPRs}</p>
              <p className="text-xs text-muted-foreground">Last 30 days</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/20">
              <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Improving</p>
              <p className="text-2xl font-bold">{summary.improvingDistances.length}</p>
              <p className="text-xs text-muted-foreground">distances</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900/20">
              <Zap className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg Improvement</p>
              <p className="text-2xl font-bold">{summary.averageImprovement.toFixed(1)}%</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Distribution */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">PR Distribution</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Recent Improvements */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Biggest Improvements</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={improvementData}>
                <XAxis 
                  dataKey="distance" 
                  fontSize={10}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  fontSize={10}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip 
                  formatter={(value: number) => [`${value.toFixed(1)}%`, 'Improvement']}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                    fontSize: '12px'
                  }}
                />
                <Bar 
                  dataKey="improvement" 
                  fill="hsl(var(--primary))"
                  radius={[2, 2, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Recent Achievements */}
      {recentImprovements.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Medal className="h-5 w-5 text-yellow-600" />
            <h3 className="text-lg font-semibold">Recent Achievements</h3>
            <span className="text-sm text-muted-foreground">({recentImprovements.length} new PRs)</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentImprovements.map(pr => (
              <PRCard key={`${pr.distance.name}-${pr.distance.category}`} personalRecord={pr} compact showTrend={false} />
            ))}
          </div>
        </Card>
      )}

      {/* Potential PRs */}
      {potentialPRs.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Target className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold">Potential PRs</h3>
            <span className="text-sm text-muted-foreground">Estimated based on current fitness</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {potentialPRs.slice(0, 6).map((potential, index) => (
              <Card key={index} className="p-4 border-dashed">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">{potential.distance.name}</h4>
                    <p className="text-sm text-muted-foreground capitalize">{potential.distance.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{formatTime(potential.estimatedTime)}</p>
                    <div className={`text-xs px-2 py-1 rounded ${
                      potential.confidenceLevel === 'high' ? 'bg-green-100 text-green-700' :
                      potential.confidenceLevel === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {potential.confidenceLevel} confidence
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </Card>
      )}

      {/* Personal Records Grid */}
      <div>
        <h3 className="text-xl font-semibold mb-4">
          All Personal Records 
          {selectedCategory !== 'all' && (
            <span className="text-muted-foreground text-base ml-2">
              ({selectedCategory})
            </span>
          )}
        </h3>
        
        {filteredPRs.length === 0 ? (
          <Card className="p-8">
            <div className="text-center space-y-3">
              <Target className="h-12 w-12 text-muted-foreground mx-auto" />
              <h4 className="text-lg font-semibold">No Personal Records Found</h4>
              <p className="text-muted-foreground">
                {selectedCategory === 'all' 
                  ? "Start tracking your activities to see personal records here."
                  : `No ${selectedCategory} personal records found. Try a different category.`
                }
              </p>
            </div>
          </Card>
        ) : (
          <div className={`grid gap-4 ${
            viewMode === 'compact' 
              ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
              : 'grid-cols-1 lg:grid-cols-2'
          }`}>
            {filteredPRs.map(pr => (
              <PRCard 
                key={`${pr.distance.name}-${pr.distance.category}`}
                personalRecord={pr}
                compact={viewMode === 'compact'}
                showTrend={viewMode === 'grid'}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}