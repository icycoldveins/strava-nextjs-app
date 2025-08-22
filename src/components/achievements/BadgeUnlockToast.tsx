'use client';

import { useEffect, useState } from 'react';
import { UnlockedBadge } from '@/lib/types/achievements';
import { getBadgeDefinitions } from '@/lib/achievements';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface BadgeUnlockToastProps {
  unlockedBadges: UnlockedBadge[];
  onDismiss: () => void;
  className?: string;
}

export function BadgeUnlockToast({ 
  unlockedBadges, 
  onDismiss, 
  className 
}: BadgeUnlockToastProps) {
  const [currentBadgeIndex, setCurrentBadgeIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);

  const badgeDefinitions = getBadgeDefinitions();
  
  useEffect(() => {
    if (unlockedBadges.length > 0) {
      setIsAnimating(true);
      // Start celebration animation
      const timer = setTimeout(() => setIsAnimating(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [unlockedBadges]);

  useEffect(() => {
    // Auto-advance through multiple badges
    if (unlockedBadges.length > 1) {
      const timer = setTimeout(() => {
        if (currentBadgeIndex < unlockedBadges.length - 1) {
          setCurrentBadgeIndex(currentBadgeIndex + 1);
        }
      }, 3000); // Show each badge for 3 seconds
      
      return () => clearTimeout(timer);
    }
  }, [currentBadgeIndex, unlockedBadges.length]);

  useEffect(() => {
    // Auto-dismiss after showing all badges
    if (unlockedBadges.length > 0) {
      const totalTime = unlockedBadges.length * 3000 + 2000; // Extra 2s for last badge
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onDismiss, 300); // Allow fade out animation
      }, totalTime);
      
      return () => clearTimeout(timer);
    }
  }, [unlockedBadges.length, onDismiss]);

  if (unlockedBadges.length === 0 || !isVisible) {
    return null;
  }

  const currentUnlockedBadge = unlockedBadges[currentBadgeIndex];
  const badgeDefinition = badgeDefinitions.find(b => b.id === currentUnlockedBadge.badgeId);

  if (!badgeDefinition) {
    return null;
  }

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(onDismiss, 300);
  };

  const isLegendary = badgeDefinition.rarity === 'legendary';
  const isEpic = badgeDefinition.rarity === 'epic';

  return (
    <div className={cn(
      'fixed top-4 right-4 z-50 transition-all duration-300',
      isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full',
      className
    )}>
      <Card className={cn(
        'p-6 max-w-sm relative overflow-hidden',
        'border-2 shadow-xl',
        badgeDefinition.rarity === 'common' && 'border-gray-200 bg-gray-50',
        badgeDefinition.rarity === 'rare' && 'border-blue-300 bg-blue-50',
        badgeDefinition.rarity === 'epic' && 'border-purple-300 bg-purple-50',
        badgeDefinition.rarity === 'legendary' && 'border-yellow-400 bg-yellow-50',
        isAnimating && 'animate-bounce'
      )}>
        {/* Animated Background Effects */}
        {isLegendary && (
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 via-transparent to-yellow-400/20 animate-pulse" />
        )}
        
        {isEpic && (
          <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 via-transparent to-purple-400/20 animate-pulse" />
        )}

        {/* Celebration Particles */}
        {isAnimating && (
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className={cn(
                  'absolute w-2 h-2 rounded-full animate-ping',
                  badgeDefinition.rarity === 'legendary' && 'bg-yellow-400',
                  badgeDefinition.rarity === 'epic' && 'bg-purple-400',
                  badgeDefinition.rarity === 'rare' && 'bg-blue-400',
                  badgeDefinition.rarity === 'common' && 'bg-gray-400'
                )}
                style={{
                  left: `${20 + i * 15}%`,
                  top: `${10 + (i % 2) * 30}%`,
                  animationDelay: `${i * 0.1}s`,
                }}
              />
            ))}
          </div>
        )}

        {/* Close Button */}
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-2 right-2 h-6 w-6 p-0"
          onClick={handleDismiss}
        >
          ×
        </Button>

        {/* Toast Content */}
        <div className="relative z-10">
          {/* Header */}
          <div className="text-center mb-4">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
              🎉 Achievement Unlocked! 🎉
            </div>
            {unlockedBadges.length > 1 && (
              <div className="text-xs text-muted-foreground">
                {currentBadgeIndex + 1} of {unlockedBadges.length}
              </div>
            )}
          </div>

          {/* Badge Display */}
          <div className="flex flex-col items-center text-center space-y-3">
            {/* Badge Icon with glow effect */}
            <div className={cn(
              'text-6xl relative',
              isAnimating && 'animate-pulse',
              isLegendary && 'drop-shadow-lg filter',
              isEpic && 'drop-shadow-md filter'
            )}>
              <span>{badgeDefinition.icon}</span>
              
              {/* Sparkle Effect for Legendary */}
              {isLegendary && isAnimating && (
                <>
                  <span className="absolute -top-1 -right-1 text-yellow-400 animate-ping">✨</span>
                  <span className="absolute -bottom-1 -left-1 text-yellow-400 animate-ping" style={{ animationDelay: '0.5s' }}>✨</span>
                </>
              )}
            </div>

            {/* Badge Info */}
            <div className="space-y-2">
              <div className={cn(
                'px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide',
                badgeDefinition.rarity === 'common' && 'bg-gray-200 text-gray-700',
                badgeDefinition.rarity === 'rare' && 'bg-blue-200 text-blue-700',
                badgeDefinition.rarity === 'epic' && 'bg-purple-200 text-purple-700',
                badgeDefinition.rarity === 'legendary' && 'bg-yellow-200 text-yellow-700'
              )}>
                {badgeDefinition.rarity} Badge
              </div>
              
              <h3 className="text-lg font-bold">
                {badgeDefinition.name}
              </h3>
              
              <p className="text-sm text-muted-foreground">
                {badgeDefinition.description}
              </p>

              {currentUnlockedBadge.unlockedAt && (
                <div className="text-xs text-muted-foreground">
                  Unlocked {new Date(currentUnlockedBadge.unlockedAt).toLocaleString()}
                </div>
              )}
            </div>
          </div>

          {/* Progress Indicator for Multiple Badges */}
          {unlockedBadges.length > 1 && (
            <div className="mt-4 flex justify-center space-x-1">
              {unlockedBadges.map((_, index) => (
                <div
                  key={index}
                  className={cn(
                    'w-2 h-2 rounded-full transition-colors duration-200',
                    index === currentBadgeIndex ? 'bg-primary' : 'bg-muted'
                  )}
                />
              ))}
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-4 flex justify-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDismiss}
            >
              Dismiss
            </Button>
            {unlockedBadges.length > 1 && currentBadgeIndex < unlockedBadges.length - 1 && (
              <Button
                variant="default"
                size="sm"
                onClick={() => setCurrentBadgeIndex(currentBadgeIndex + 1)}
              >
                Next Badge
              </Button>
            )}
          </div>
        </div>

        {/* Special Effects for Legendary Badges */}
        {isLegendary && isAnimating && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-300/30 to-transparent animate-[shimmer_2s_ease-in-out_infinite]" />
          </div>
        )}
      </Card>
    </div>
  );
}