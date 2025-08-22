'use client';

import { useState, useMemo } from 'react';
import { Badge, BadgeCategory, BadgeRarity } from '@/lib/types/achievements';
import { BadgeDisplay } from './BadgeDisplay';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface BadgeGalleryProps {
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

const rarityOrder: Record<BadgeRarity, number> = {
  common: 1,
  rare: 2,
  epic: 3,
  legendary: 4,
};

export function BadgeGallery({ badges, className }: BadgeGalleryProps) {
  const [selectedCategory, setSelectedCategory] = useState<BadgeCategory | 'all'>('all');
  const [selectedRarity, setSelectedRarity] = useState<BadgeRarity | 'all'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'rarity' | 'progress' | 'unlocked'>('rarity');
  const [showUnlockedOnly, setShowUnlockedOnly] = useState(false);

  // Get unique categories and rarities from badges
  const categories = useMemo(() => {
    const cats = [...new Set(badges.map(b => b.category))];
    return cats.sort();
  }, [badges]);

  const rarities = useMemo(() => {
    const rars = [...new Set(badges.map(b => b.rarity))];
    return rars.sort((a, b) => rarityOrder[a] - rarityOrder[b]);
  }, [badges]);

  // Filter and sort badges
  const filteredBadges = useMemo(() => {
    let filtered = badges;

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(b => b.category === selectedCategory);
    }

    // Rarity filter
    if (selectedRarity !== 'all') {
      filtered = filtered.filter(b => b.rarity === selectedRarity);
    }

    // Unlocked filter
    if (showUnlockedOnly) {
      filtered = filtered.filter(b => b.isUnlocked);
    }

    // Sort
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'rarity':
          return rarityOrder[b.rarity] - rarityOrder[a.rarity]; // Highest rarity first
        case 'progress':
          return (b.progress || 0) - (a.progress || 0); // Highest progress first
        case 'unlocked':
          if (a.isUnlocked && !b.isUnlocked) return -1;
          if (!a.isUnlocked && b.isUnlocked) return 1;
          return 0;
        default:
          return 0;
      }
    });
  }, [badges, selectedCategory, selectedRarity, sortBy, showUnlockedOnly]);

  // Statistics
  const stats = useMemo(() => {
    const unlockedCount = badges.filter(b => b.isUnlocked).length;
    const totalCount = badges.length;
    const completionRate = totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0;

    const rarityBreakdown = rarities.reduce((acc, rarity) => {
      const total = badges.filter(b => b.rarity === rarity).length;
      const unlocked = badges.filter(b => b.rarity === rarity && b.isUnlocked).length;
      acc[rarity] = { total, unlocked };
      return acc;
    }, {} as Record<BadgeRarity, { total: number; unlocked: number }>);

    return { unlockedCount, totalCount, completionRate, rarityBreakdown };
  }, [badges, rarities]);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header with stats */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold">Achievement Badges</h2>
            <p className="text-muted-foreground">
              {stats.unlockedCount} of {stats.totalCount} badges unlocked ({stats.completionRate.toFixed(1)}%)
            </p>
          </div>
          
          {/* Progress Overview */}
          <div className="flex flex-wrap gap-2">
            {rarities.map(rarity => {
              const { total, unlocked } = stats.rarityBreakdown[rarity];
              return (
                <div 
                  key={rarity}
                  className={cn(
                    'px-3 py-1 rounded-full text-xs font-medium',
                    rarity === 'common' && 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
                    rarity === 'rare' && 'bg-blue-200 text-blue-700 dark:bg-blue-700 dark:text-blue-300',
                    rarity === 'epic' && 'bg-purple-200 text-purple-700 dark:bg-purple-700 dark:text-purple-300',
                    rarity === 'legendary' && 'bg-yellow-200 text-yellow-700 dark:bg-yellow-700 dark:text-yellow-300'
                  )}
                >
                  {rarity}: {unlocked}/{total}
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('all')}
            >
              All Categories
            </Button>
            {categories.map(category => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category)}
              >
                {categoryIcons[category]} {categoryLabels[category]}
              </Button>
            ))}
          </div>

          {/* Rarity Filter */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedRarity === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedRarity('all')}
            >
              All Rarities
            </Button>
            {rarities.map(rarity => (
              <Button
                key={rarity}
                variant={selectedRarity === rarity ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedRarity(rarity)}
                className={cn(
                  rarity === 'rare' && 'border-blue-300',
                  rarity === 'epic' && 'border-purple-300',
                  rarity === 'legendary' && 'border-yellow-400'
                )}
              >
                {rarity}
              </Button>
            ))}
          </div>
        </div>

        {/* Sort and Toggle Options */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center mt-4 pt-4 border-t">
          <div className="flex gap-2 items-center">
            <span className="text-sm font-medium">Sort by:</span>
            <select
              className="px-3 py-1 border rounded text-sm"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'name' | 'rarity' | 'progress' | 'unlocked')}
            >
              <option value="rarity">Rarity</option>
              <option value="name">Name</option>
              <option value="progress">Progress</option>
              <option value="unlocked">Unlocked</option>
            </select>
          </div>

          <Button
            variant={showUnlockedOnly ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowUnlockedOnly(!showUnlockedOnly)}
          >
            {showUnlockedOnly ? '✓ Unlocked Only' : 'Show All'}
          </Button>
        </div>
      </Card>

      {/* Badge Grid */}
      {filteredBadges.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="text-4xl mb-4">🏆</div>
          <h3 className="text-lg font-semibold mb-2">No badges found</h3>
          <p className="text-muted-foreground">
            Try adjusting your filters or start completing activities to unlock badges!
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredBadges.map(badge => (
            <BadgeDisplay
              key={badge.id}
              badge={badge}
              size="md"
              showProgress={true}
            />
          ))}
        </div>
      )}

      {/* Empty state for first-time users */}
      {badges.length === 0 && (
        <Card className="p-8 text-center">
          <div className="text-6xl mb-4">🏃‍♀️</div>
          <h3 className="text-xl font-bold mb-2">Start Your Journey!</h3>
          <p className="text-muted-foreground mb-4">
            Connect your Strava account and complete activities to start earning achievement badges.
          </p>
          <p className="text-sm text-muted-foreground">
            Over 20+ badges available across distance, consistency, elevation, speed, and special categories!
          </p>
        </Card>
      )}
    </div>
  );
}