'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Badge, 
  UnlockedBadge, 
  BadgeCategory, 
  BadgeRarity,
  ActivityForBadgeCheck
} from '@/lib/types/achievements';
import { StravaActivity } from '@/lib/types/strava';
import { 
  checkAchievements, 
  getAllBadges
} from '@/lib/achievements';

export interface UseAchievementsReturn {
  // Badge data
  badges: Badge[];
  unlockedBadges: Badge[];
  lockedBadges: Badge[];
  
  // Recent unlocks for toast notifications
  recentlyUnlocked: UnlockedBadge[];
  
  // Statistics
  stats: {
    totalBadges: number;
    unlockedCount: number;
    completionRate: number;
    rarityBreakdown: Record<BadgeRarity, { total: number; unlocked: number }>;
    categoryBreakdown: Record<BadgeCategory, { total: number; unlocked: number }>;
  };
  
  // Actions
  checkForNewAchievements: (activities: StravaActivity[]) => Promise<UnlockedBadge[]>;
  dismissRecentUnlocks: () => void;
  refreshBadges: (activities?: StravaActivity[]) => void;
  
  // Loading states
  isLoading: boolean;
  isCheckingAchievements: boolean;
}

export function useAchievements(activities: StravaActivity[] = []): UseAchievementsReturn {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [recentlyUnlocked, setRecentlyUnlocked] = useState<UnlockedBadge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingAchievements, setIsCheckingAchievements] = useState(false);

  // Initialize badges on mount and when activities change
  const refreshBadges = useCallback((updatedActivities?: StravaActivity[]) => {
    setIsLoading(true);
    try {
      const activitiesToUse = updatedActivities || activities;
      const allBadges = getAllBadges(activitiesToUse as unknown as ActivityForBadgeCheck[]);
      setBadges(allBadges);
    } catch (error) {
      console.error('Error refreshing badges:', error);
    } finally {
      setIsLoading(false);
    }
  }, [activities]);

  // Check for new achievements
  const checkForNewAchievements = useCallback(async (activitiesToCheck: StravaActivity[]): Promise<UnlockedBadge[]> => {
    if (activitiesToCheck.length === 0) return [];
    
    setIsCheckingAchievements(true);
    try {
      const result = await Promise.resolve(checkAchievements(activitiesToCheck as unknown as ActivityForBadgeCheck[]));
      
      if (result.newlyUnlocked.length > 0) {
        setRecentlyUnlocked(result.newlyUnlocked);
        // Refresh badges to show newly unlocked state
        refreshBadges(activitiesToCheck);
      }
      
      return result.newlyUnlocked;
    } catch (error) {
      console.error('Error checking achievements:', error);
      return [];
    } finally {
      setIsCheckingAchievements(false);
    }
  }, [refreshBadges]);

  // Dismiss recent unlock notifications
  const dismissRecentUnlocks = useCallback(() => {
    setRecentlyUnlocked([]);
  }, []);

  // Initialize badges on mount
  useEffect(() => {
    refreshBadges();
  }, [refreshBadges]);

  // Auto-check achievements when activities change (debounced)
  useEffect(() => {
    if (activities.length === 0) return;

    const timeoutId = setTimeout(() => {
      checkForNewAchievements(activities);
    }, 1000); // Debounce by 1 second

    return () => clearTimeout(timeoutId);
  }, [activities, checkForNewAchievements]);

  // Computed values
  const unlockedBadges = useMemo(() => {
    return badges.filter(badge => badge.isUnlocked);
  }, [badges]);

  const lockedBadges = useMemo(() => {
    return badges.filter(badge => !badge.isUnlocked);
  }, [badges]);

  const stats = useMemo(() => {
    const totalBadges = badges.length;
    const unlockedCount = unlockedBadges.length;
    const completionRate = totalBadges > 0 ? (unlockedCount / totalBadges) * 100 : 0;

    // Rarity breakdown
    const rarityBreakdown: Record<BadgeRarity, { total: number; unlocked: number }> = {
      common: { total: 0, unlocked: 0 },
      rare: { total: 0, unlocked: 0 },
      epic: { total: 0, unlocked: 0 },
      legendary: { total: 0, unlocked: 0 },
    };

    // Category breakdown
    const categoryBreakdown: Record<BadgeCategory, { total: number; unlocked: number }> = {
      distance: { total: 0, unlocked: 0 },
      consistency: { total: 0, unlocked: 0 },
      time: { total: 0, unlocked: 0 },
      elevation: { total: 0, unlocked: 0 },
      speed: { total: 0, unlocked: 0 },
      special: { total: 0, unlocked: 0 },
    };

    badges.forEach(badge => {
      // Rarity counts
      rarityBreakdown[badge.rarity].total++;
      if (badge.isUnlocked) {
        rarityBreakdown[badge.rarity].unlocked++;
      }

      // Category counts
      categoryBreakdown[badge.category].total++;
      if (badge.isUnlocked) {
        categoryBreakdown[badge.category].unlocked++;
      }
    });

    return {
      totalBadges,
      unlockedCount,
      completionRate,
      rarityBreakdown,
      categoryBreakdown,
    };
  }, [badges, unlockedBadges]);

  return {
    badges,
    unlockedBadges,
    lockedBadges,
    recentlyUnlocked,
    stats,
    checkForNewAchievements,
    dismissRecentUnlocks,
    refreshBadges,
    isLoading,
    isCheckingAchievements,
  };
}

// Additional hook for specific badge categories
export function useBadgesByCategory(
  badges: Badge[], 
  category?: BadgeCategory
): Badge[] {
  return useMemo(() => {
    if (!category) return badges;
    return badges.filter(badge => badge.category === category);
  }, [badges, category]);
}

// Hook for badges with active progress (not unlocked but > 0% progress)
export function useBadgesWithProgress(badges: Badge[]): Badge[] {
  return useMemo(() => {
    return badges.filter(badge => 
      !badge.isUnlocked && 
      (badge.progress || 0) > 0 && 
      (badge.progress || 0) < 100
    ).sort((a, b) => (b.progress || 0) - (a.progress || 0));
  }, [badges]);
}

// Hook for achievement statistics by time period
export function useAchievementStats(badges: Badge[]): {
  recentUnlocks: Badge[];
  thisWeekUnlocks: Badge[];
  thisMonthUnlocks: Badge[];
} {
  return useMemo(() => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const unlockedBadges = badges.filter(badge => badge.isUnlocked && badge.unlockedAt);

    const recentUnlocks = unlockedBadges.filter(badge => 
      badge.unlockedAt && new Date(badge.unlockedAt) > oneDayAgo
    );

    const thisWeekUnlocks = unlockedBadges.filter(badge => 
      badge.unlockedAt && new Date(badge.unlockedAt) > oneWeekAgo
    );

    const thisMonthUnlocks = unlockedBadges.filter(badge => 
      badge.unlockedAt && new Date(badge.unlockedAt) > oneMonthAgo
    );

    return {
      recentUnlocks,
      thisWeekUnlocks,
      thisMonthUnlocks,
    };
  }, [badges]);
}