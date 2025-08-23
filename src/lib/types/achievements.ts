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
  checkFunction: (activities: ActivityForBadgeCheck[], badge?: Badge) => AchievementCheckResult;
}

export interface ActivityForBadgeCheck {
  id: number;
  type: string;
  sport_type?: string;
  distance?: number;
  moving_time?: number;
  start_date: string;
  start_date_local?: string;
  total_elevation_gain?: number;
  average_speed?: number;
  max_speed?: number;
  calories?: number;
  [key: string]: unknown;
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