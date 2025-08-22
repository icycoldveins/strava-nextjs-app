export type BadgeCategory = 
  | 'distance' 
  | 'consistency' 
  | 'time' 
  | 'elevation' 
  | 'speed' 
  | 'special';

export type BadgeRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: BadgeCategory;
  rarity: BadgeRarity;
  isUnlocked: boolean;
  unlockedAt?: string;
  progress?: number; // 0-100 for badges with progress tracking
  maxProgress?: number; // For badges that require multiple achievements
}

export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: BadgeCategory;
  rarity: BadgeRarity;
  checkFunction: (activities: any[], badge?: Badge) => AchievementCheckResult;
}

export interface AchievementCheckResult {
  isUnlocked: boolean;
  progress: number;
  maxProgress: number;
  progressText?: string;
}

export interface UnlockedBadge {
  badgeId: string;
  unlockedAt: string;
  activityId?: string; // The activity that triggered the unlock
}

export interface AchievementState {
  unlockedBadges: UnlockedBadge[];
  badgeProgress: Record<string, number>;
  lastChecked: string;
}