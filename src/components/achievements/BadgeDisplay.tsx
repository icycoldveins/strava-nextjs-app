'use client';

import { Badge, BadgeRarity } from '@/lib/types/achievements';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface BadgeDisplayProps {
  badge: Badge;
  size?: 'sm' | 'md' | 'lg';
  showProgress?: boolean;
  className?: string;
}

const rarityStyles: Record<BadgeRarity, string> = {
  common: 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800',
  rare: 'border-blue-200 bg-blue-50 dark:border-blue-700 dark:bg-blue-900/20',
  epic: 'border-purple-200 bg-purple-50 dark:border-purple-700 dark:bg-purple-900/20',
  legendary: 'border-yellow-200 bg-yellow-50 dark:border-yellow-600 dark:bg-yellow-900/20',
};

const rarityGlow: Record<BadgeRarity, string> = {
  common: '',
  rare: 'shadow-blue-500/20',
  epic: 'shadow-purple-500/30',
  legendary: 'shadow-yellow-500/40 shadow-lg',
};

const sizeStyles = {
  sm: {
    container: 'p-3',
    icon: 'text-2xl',
    title: 'text-sm font-medium',
    description: 'text-xs text-muted-foreground',
    progress: 'text-xs',
  },
  md: {
    container: 'p-4',
    icon: 'text-3xl',
    title: 'text-base font-semibold',
    description: 'text-sm text-muted-foreground',
    progress: 'text-sm',
  },
  lg: {
    container: 'p-6',
    icon: 'text-4xl',
    title: 'text-lg font-bold',
    description: 'text-base text-muted-foreground',
    progress: 'text-base',
  },
};

export function BadgeDisplay({ 
  badge, 
  size = 'md', 
  showProgress = true, 
  className 
}: BadgeDisplayProps) {
  const styles = sizeStyles[size];
  const isLocked = !badge.isUnlocked;
  
  return (
    <Card 
      className={cn(
        'relative transition-all duration-300 hover:scale-105',
        rarityStyles[badge.rarity],
        badge.isUnlocked && rarityGlow[badge.rarity],
        isLocked && 'opacity-60',
        styles.container,
        className
      )}
    >
      {/* Rarity indicator */}
      <div className="absolute top-2 right-2">
        <div className={cn(
          'px-2 py-1 rounded-full text-xs font-medium',
          badge.rarity === 'common' && 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
          badge.rarity === 'rare' && 'bg-blue-200 text-blue-700 dark:bg-blue-700 dark:text-blue-300',
          badge.rarity === 'epic' && 'bg-purple-200 text-purple-700 dark:bg-purple-700 dark:text-purple-300',
          badge.rarity === 'legendary' && 'bg-yellow-200 text-yellow-700 dark:bg-yellow-700 dark:text-yellow-300'
        )}>
          {badge.rarity}
        </div>
      </div>

      <div className="flex flex-col items-center text-center space-y-2">
        {/* Badge Icon */}
        <div className={cn(
          'relative',
          isLocked && 'grayscale'
        )}>
          <span className={styles.icon}>{badge.icon}</span>
          {isLocked && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xl">🔒</span>
            </div>
          )}
        </div>

        {/* Badge Info */}
        <div className="space-y-1">
          <h3 className={cn(
            styles.title,
            isLocked && 'text-muted-foreground'
          )}>
            {badge.name}
          </h3>
          <p className={styles.description}>
            {badge.description}
          </p>
        </div>

        {/* Progress or Unlock Date */}
        {badge.isUnlocked ? (
          <div className="text-center">
            <div className="text-green-600 dark:text-green-400 font-medium text-sm">
              ✓ Unlocked
            </div>
            {badge.unlockedAt && (
              <div className="text-xs text-muted-foreground mt-1">
                {new Date(badge.unlockedAt).toLocaleDateString()}
              </div>
            )}
          </div>
        ) : (
          showProgress && badge.progress !== undefined && (
            <div className="w-full space-y-2">
              {/* Progress Bar */}
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className={cn(
                    'h-2 rounded-full transition-all duration-500',
                    badge.rarity === 'common' && 'bg-gray-400',
                    badge.rarity === 'rare' && 'bg-blue-400',
                    badge.rarity === 'epic' && 'bg-purple-400',
                    badge.rarity === 'legendary' && 'bg-yellow-400'
                  )}
                  style={{ width: `${badge.progress}%` }}
                />
              </div>
              
              {/* Progress Text */}
              <div className={cn(
                styles.progress,
                'text-muted-foreground'
              )}>
                {Math.round(badge.progress)}%
              </div>
            </div>
          )
        )}
      </div>

      {/* Unlock Animation Effect */}
      {badge.isUnlocked && badge.rarity === 'legendary' && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-yellow-400/20 via-transparent to-yellow-400/20 animate-pulse" />
        </div>
      )}
    </Card>
  );
}