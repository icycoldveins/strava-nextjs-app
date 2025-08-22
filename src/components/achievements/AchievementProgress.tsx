'use client';

import { Badge, BadgeCategory } from '@/lib/types/achievements';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface AchievementProgressProps {
  badges: Badge[];
  className?: string;
}

const categoryLabels: Record<BadgeCategory, string> = {
  distance: 'Distance',
  consistency: 'Consistency',
  time: 'Time-based',
  elevation: 'Elevation',
  speed: 'Speed',
  special: 'Special',
};

const categoryIcons: Record<BadgeCategory, string> = {
  distance: '📏',
  consistency: '🔥',
  time: '🕐',
  elevation: '⛰️',
  speed: '💨',
  special: '⭐',
};

export function AchievementProgress({ badges, className }: AchievementProgressProps) {
  // Group badges by category
  const badgesByCategory = badges.reduce((acc, badge) => {
    if (!acc[badge.category]) {
      acc[badge.category] = [];
    }
    acc[badge.category].push(badge);
    return acc;
  }, {} as Record<BadgeCategory, Badge[]>);

  // Filter to only show categories with incomplete badges that have progress > 0
  const categoriesWithProgress = Object.entries(badgesByCategory).filter(([, categoryBadges]) => {
    return categoryBadges.some(badge => 
      !badge.isUnlocked && 
      (badge.progress || 0) > 0 && 
      (badge.progress || 0) < 100
    );
  });

  if (categoriesWithProgress.length === 0) {
    return (
      <Card className={cn('p-6 text-center', className)}>
        <div className="text-4xl mb-4">🎯</div>
        <h3 className="text-lg font-semibold mb-2">No Active Progress</h3>
        <p className="text-muted-foreground">
          Complete more activities to start making progress on achievements!
        </p>
      </Card>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold">Achievement Progress</h3>
        <div className="text-sm text-muted-foreground">
          {categoriesWithProgress.length} categories with active progress
        </div>
      </div>

      {categoriesWithProgress.map(([category, categoryBadges]) => {
        // Only show badges with progress > 0 and < 100
        const inProgressBadges = categoryBadges.filter(badge => 
          !badge.isUnlocked && 
          (badge.progress || 0) > 0 && 
          (badge.progress || 0) < 100
        ).sort((a, b) => (b.progress || 0) - (a.progress || 0)); // Sort by highest progress first

        if (inProgressBadges.length === 0) return null;

        return (
          <Card key={category} className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">{categoryIcons[category as BadgeCategory]}</span>
              <h4 className="font-semibold">{categoryLabels[category as BadgeCategory]}</h4>
              <div className="text-sm text-muted-foreground">
                ({inProgressBadges.length} in progress)
              </div>
            </div>

            <div className="space-y-3">
              {inProgressBadges.map(badge => (
                <div key={badge.id} className="space-y-2">
                  {/* Badge Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg opacity-60">{badge.icon}</span>
                      <div>
                        <div className="font-medium">{badge.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {badge.description}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold">
                        {Math.round(badge.progress || 0)}%
                      </div>
                      <div className={cn(
                        'text-xs px-2 py-1 rounded-full',
                        badge.rarity === 'common' && 'bg-gray-100 text-gray-600',
                        badge.rarity === 'rare' && 'bg-blue-100 text-blue-600',
                        badge.rarity === 'epic' && 'bg-purple-100 text-purple-600',
                        badge.rarity === 'legendary' && 'bg-yellow-100 text-yellow-600'
                      )}>
                        {badge.rarity}
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="relative">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                      <div
                        className={cn(
                          'h-2.5 rounded-full transition-all duration-500 relative overflow-hidden',
                          badge.rarity === 'common' && 'bg-gray-400',
                          badge.rarity === 'rare' && 'bg-blue-400',
                          badge.rarity === 'epic' && 'bg-purple-400',
                          badge.rarity === 'legendary' && 'bg-yellow-400'
                        )}
                        style={{ width: `${badge.progress}%` }}
                      >
                        {/* Animated shine effect for higher progress */}
                        {(badge.progress || 0) > 75 && (
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-[shimmer_3s_ease-in-out_infinite]" />
                        )}
                      </div>
                    </div>
                    
                    {/* Progress milestones */}
                    <div className="absolute inset-0 flex justify-between items-center px-1">
                      {[25, 50, 75].map(milestone => (
                        <div
                          key={milestone}
                          className={cn(
                            'w-0.5 h-4 bg-white/50 rounded-full',
                            (badge.progress || 0) >= milestone && 'bg-white/80'
                          )}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Progress Details */}
                  <div className="text-xs text-muted-foreground">
                    {getProgressText(badge)}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        );
      })}
    </div>
  );
}

// Helper function to get detailed progress text
function getProgressText(badge: Badge): string {
  const progress = badge.progress || 0;
  
  // Custom progress text based on badge category and progress
  if (progress >= 90) {
    return "🔥 Almost there! Just a little more to unlock this achievement.";
  } else if (progress >= 75) {
    return "💪 Great progress! You're in the final stretch.";
  } else if (progress >= 50) {
    return "⭐ Halfway there! Keep up the great work.";
  } else if (progress >= 25) {
    return "🚀 Good start! Continue your activities to make more progress.";
  } else {
    return "🌱 Early progress. Every activity counts!";
  }
}