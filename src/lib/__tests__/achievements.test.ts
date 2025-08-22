import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getBadgeDefinitions,
  checkAchievements,
  getUnlockedBadges,
  getBadgeProgress,
  saveAchievementState,
  loadAchievementState,
  calculateActivityStreaks,
  isActivityInTimeRange,
  getActivityStats,
} from '../achievements';
import { BadgeDefinition, Badge, AchievementState, BadgeCategory, BadgeRarity } from '../types/achievements';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock activities data for testing
const mockActivities = [
  {
    id: 1,
    name: 'Morning Run',
    type: 'Run',
    distance: 5000, // 5km
    moving_time: 1800, // 30 minutes
    total_elevation_gain: 100,
    average_speed: 2.78, // ~10km/h
    start_date: '2024-01-15T06:00:00Z',
    start_date_local: '2024-01-15T07:00:00',
  },
  {
    id: 2,
    name: 'Evening Cycle',
    type: 'Ride',
    distance: 25000, // 25km
    moving_time: 3600, // 1 hour
    total_elevation_gain: 300,
    average_speed: 6.94, // ~25km/h
    start_date: '2024-01-15T18:00:00Z',
    start_date_local: '2024-01-15T19:00:00',
  },
  {
    id: 3,
    name: 'Long Run',
    type: 'Run',
    distance: 21097, // Half marathon
    moving_time: 7200, // 2 hours
    total_elevation_gain: 500,
    average_speed: 2.93,
    start_date: '2024-01-16T08:00:00Z',
    start_date_local: '2024-01-16T09:00:00',
  },
  {
    id: 4,
    name: 'Century Ride',
    type: 'Ride',
    distance: 100000, // 100km
    moving_time: 14400, // 4 hours
    total_elevation_gain: 1200,
    average_speed: 6.94,
    start_date: '2024-01-17T08:00:00Z',
    start_date_local: '2024-01-17T09:00:00',
  },
  {
    id: 5,
    name: 'Mountain Climb',
    type: 'Run',
    distance: 15000,
    moving_time: 5400,
    total_elevation_gain: 1500, // High elevation
    average_speed: 2.78,
    start_date: '2024-01-18T05:30:00Z',
    start_date_local: '2024-01-18T06:30:00',
  },
];

describe('Achievement Badge System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  describe('Badge Definitions', () => {
    it('should return all badge definitions', () => {
      const badges = getBadgeDefinitions();
      
      expect(badges).toBeInstanceOf(Array);
      expect(badges.length).toBeGreaterThanOrEqual(20); // At least 20 badges
      
      // Check that all required properties exist
      badges.forEach(badge => {
        expect(badge).toHaveProperty('id');
        expect(badge).toHaveProperty('name');
        expect(badge).toHaveProperty('description');
        expect(badge).toHaveProperty('icon');
        expect(badge).toHaveProperty('category');
        expect(badge).toHaveProperty('rarity');
        expect(badge).toHaveProperty('checkFunction');
        expect(typeof badge.checkFunction).toBe('function');
      });
    });

    it('should have badges in all categories', () => {
      const badges = getBadgeDefinitions();
      const categories: BadgeCategory[] = ['distance', 'consistency', 'time', 'elevation', 'speed', 'special'];
      
      categories.forEach(category => {
        const categoryBadges = badges.filter(b => b.category === category);
        expect(categoryBadges.length).toBeGreaterThan(0);
      });
    });

    it('should have badges of all rarity levels', () => {
      const badges = getBadgeDefinitions();
      const rarities: BadgeRarity[] = ['common', 'rare', 'epic', 'legendary'];
      
      rarities.forEach(rarity => {
        const rarityBadges = badges.filter(b => b.rarity === rarity);
        expect(rarityBadges.length).toBeGreaterThan(0);
      });
    });

    it('should have unique badge IDs', () => {
      const badges = getBadgeDefinitions();
      const ids = badges.map(b => b.id);
      const uniqueIds = new Set(ids);
      
      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  describe('Distance Badges', () => {
    it('should unlock First 5K badge for 5km+ run', () => {
      const badges = getBadgeDefinitions();
      const first5k = badges.find(b => b.id === 'first-5k');
      
      expect(first5k).toBeDefined();
      
      const result = first5k!.checkFunction(mockActivities);
      expect(result.isUnlocked).toBe(true);
      expect(result.progress).toBe(100);
    });

    it('should unlock Half Marathon badge for 21km+ run', () => {
      const badges = getBadgeDefinitions();
      const halfMarathon = badges.find(b => b.id === 'half-marathon');
      
      expect(halfMarathon).toBeDefined();
      
      const result = halfMarathon!.checkFunction(mockActivities);
      expect(result.isUnlocked).toBe(true);
    });

    it('should unlock Century Ride badge for 100km+ cycle', () => {
      const badges = getBadgeDefinitions();
      const centuryRide = badges.find(b => b.id === 'century-ride');
      
      expect(centuryRide).toBeDefined();
      
      const result = centuryRide!.checkFunction(mockActivities);
      expect(result.isUnlocked).toBe(true);
    });

    it('should show progress for Marathon badge when not achieved', () => {
      const shortActivities = mockActivities.filter(a => a.distance < 42195);
      const badges = getBadgeDefinitions();
      const marathon = badges.find(b => b.id === 'marathon');
      
      expect(marathon).toBeDefined();
      
      const result = marathon!.checkFunction(shortActivities);
      expect(result.isUnlocked).toBe(false);
      expect(result.progress).toBeGreaterThan(0);
      expect(result.progress).toBeLessThan(100);
    });
  });

  describe('Elevation Badges', () => {
    it('should unlock Mountain Goat badge for 1000m+ elevation in single activity', () => {
      const badges = getBadgeDefinitions();
      const mountainGoat = badges.find(b => b.id === 'mountain-goat');
      
      expect(mountainGoat).toBeDefined();
      
      const result = mountainGoat!.checkFunction(mockActivities);
      expect(result.isUnlocked).toBe(true);
    });

    it('should track progress for Everest Challenge badge', () => {
      const badges = getBadgeDefinitions();
      const everest = badges.find(b => b.id === 'everest-challenge');
      
      expect(everest).toBeDefined();
      
      const result = everest!.checkFunction(mockActivities);
      const totalElevation = mockActivities.reduce((sum, a) => sum + a.total_elevation_gain, 0);
      const expectedProgress = Math.min(100, (totalElevation / 8848) * 100);
      
      expect(result.progress).toBe(expectedProgress);
    });
  });

  describe('Time-based Badges', () => {
    it('should unlock Early Bird badge for 5+ activities before 6 AM', () => {
      const earlyActivities = Array(5).fill(null).map((_, i) => ({
        ...mockActivities[0],
        id: i + 100,
        start_date_local: `2024-01-${15 + i}T05:30:00`,
      }));
      
      const badges = getBadgeDefinitions();
      const earlyBird = badges.find(b => b.id === 'early-bird');
      
      expect(earlyBird).toBeDefined();
      
      const result = earlyBird!.checkFunction(earlyActivities);
      expect(result.isUnlocked).toBe(true);
    });

    it('should unlock Night Owl badge for 5+ activities after 9 PM', () => {
      const nightActivities = Array(5).fill(null).map((_, i) => ({
        ...mockActivities[0],
        id: i + 200,
        start_date_local: `2024-01-${15 + i}T21:30:00`,
      }));
      
      const badges = getBadgeDefinitions();
      const nightOwl = badges.find(b => b.id === 'night-owl');
      
      expect(nightOwl).toBeDefined();
      
      const result = nightOwl!.checkFunction(nightActivities);
      expect(result.isUnlocked).toBe(true);
    });
  });

  describe('Consistency Badges', () => {
    it('should calculate activity streaks correctly', () => {
      const consecutiveActivities = [
        { ...mockActivities[0], start_date_local: '2024-01-15T06:00:00' },
        { ...mockActivities[1], start_date_local: '2024-01-16T06:00:00' },
        { ...mockActivities[2], start_date_local: '2024-01-17T06:00:00' },
        { ...mockActivities[3], start_date_local: '2024-01-18T06:00:00' },
        { ...mockActivities[4], start_date_local: '2024-01-19T06:00:00' },
      ];
      
      const streaks = calculateActivityStreaks(consecutiveActivities);
      expect(streaks.currentStreak).toBe(5);
      expect(streaks.longestStreak).toBe(5);
    });

    it('should unlock Week Warrior badge for 7 consecutive days', () => {
      const weekActivities = Array(7).fill(null).map((_, i) => ({
        ...mockActivities[0],
        id: i + 300,
        start_date_local: `2024-01-${15 + i}T06:00:00`,
      }));
      
      const badges = getBadgeDefinitions();
      const weekWarrior = badges.find(b => b.id === 'week-warrior');
      
      expect(weekWarrior).toBeDefined();
      
      const result = weekWarrior!.checkFunction(weekActivities);
      expect(result.isUnlocked).toBe(true);
    });
  });

  describe('Speed Badges', () => {
    it('should unlock Speed Demon badge for high average speeds', () => {
      const fastActivity = {
        ...mockActivities[1],
        type: 'Ride',
        average_speed: 15, // 54 km/h
      };
      
      const badges = getBadgeDefinitions();
      const speedDemon = badges.find(b => b.id === 'speed-demon');
      
      expect(speedDemon).toBeDefined();
      
      const result = speedDemon!.checkFunction([fastActivity]);
      expect(result.isUnlocked).toBe(true);
    });
  });

  describe('Achievement State Management', () => {
    it('should save and load achievement state', () => {
      const state: AchievementState = {
        unlockedBadges: [
          { badgeId: 'first-5k', unlockedAt: '2024-01-15T06:00:00Z', activityId: '1' }
        ],
        badgeProgress: { 'marathon': 50 },
        lastChecked: '2024-01-15T06:00:00Z'
      };
      
      saveAchievementState(state);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'strava_achievements',
        JSON.stringify(state)
      );
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(state));
      const loadedState = loadAchievementState();
      expect(loadedState).toEqual(state);
    });

    it('should return default state when no saved state exists', () => {
      localStorageMock.getItem.mockReturnValue(null);
      
      const state = loadAchievementState();
      expect(state.unlockedBadges).toEqual([]);
      expect(state.badgeProgress).toEqual({});
      expect(state.lastChecked).toBeDefined();
    });
  });

  describe('Achievement Checking', () => {
    it('should check achievements and return newly unlocked badges', () => {
      const existingState: AchievementState = {
        unlockedBadges: [],
        badgeProgress: {},
        lastChecked: '2024-01-01T00:00:00Z'
      };
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(existingState));
      
      const result = checkAchievements(mockActivities);
      
      expect(result.newlyUnlocked.length).toBeGreaterThan(0);
      expect(result.updatedProgress).toBeDefined();
      
      // Should have unlocked distance badges
      const unlockedIds = result.newlyUnlocked.map(b => b.badgeId);
      expect(unlockedIds).toContain('first-5k');
      expect(unlockedIds).toContain('half-marathon');
      expect(unlockedIds).toContain('century-ride');
    });

    it('should not re-unlock already unlocked badges', () => {
      const existingState: AchievementState = {
        unlockedBadges: [
          { badgeId: 'first-5k', unlockedAt: '2024-01-01T00:00:00Z' }
        ],
        badgeProgress: {},
        lastChecked: '2024-01-01T00:00:00Z'
      };
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(existingState));
      
      const result = checkAchievements(mockActivities);
      
      const first5kUnlocked = result.newlyUnlocked.find(b => b.badgeId === 'first-5k');
      expect(first5kUnlocked).toBeUndefined();
    });

    it('should update progress for incomplete badges', () => {
      const result = checkAchievements(mockActivities);
      
      expect(result.updatedProgress).toBeDefined();
      expect(Object.keys(result.updatedProgress).length).toBeGreaterThan(0);
      
      // Should have progress for badges that aren't unlocked yet
      Object.values(result.updatedProgress).forEach(progress => {
        expect(progress).toBeGreaterThanOrEqual(0);
        expect(progress).toBeLessThanOrEqual(100);
      });
    });
  });

  describe('Utility Functions', () => {
    it('should check if activity is in time range correctly', () => {
      expect(isActivityInTimeRange('06:00:00', 5, 7)).toBe(true);
      expect(isActivityInTimeRange('21:30:00', 21, 23)).toBe(true);
      expect(isActivityInTimeRange('12:00:00', 5, 7)).toBe(false);
      expect(isActivityInTimeRange('08:00:00', 21, 23)).toBe(false);
    });

    it('should calculate activity statistics correctly', () => {
      const stats = getActivityStats(mockActivities);
      
      expect(stats.totalDistance).toBe(mockActivities.reduce((sum, a) => sum + a.distance, 0));
      expect(stats.totalTime).toBe(mockActivities.reduce((sum, a) => sum + a.moving_time, 0));
      expect(stats.totalElevation).toBe(mockActivities.reduce((sum, a) => sum + a.total_elevation_gain, 0));
      expect(stats.activityCount).toBe(mockActivities.length);
      
      expect(stats.avgSpeed).toBeGreaterThan(0);
      expect(stats.longestDistance).toBe(Math.max(...mockActivities.map(a => a.distance)));
      expect(stats.maxElevation).toBe(Math.max(...mockActivities.map(a => a.total_elevation_gain)));
    });
  });

  describe('Badge Display Helpers', () => {
    it('should get unlocked badges correctly', () => {
      const state: AchievementState = {
        unlockedBadges: [
          { badgeId: 'first-5k', unlockedAt: '2024-01-15T06:00:00Z' },
          { badgeId: 'half-marathon', unlockedAt: '2024-01-16T08:00:00Z' }
        ],
        badgeProgress: {},
        lastChecked: '2024-01-15T06:00:00Z'
      };
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(state));
      
      const unlockedBadges = getUnlockedBadges();
      expect(unlockedBadges).toHaveLength(2);
      expect(unlockedBadges.map(b => b.id)).toContain('first-5k');
      expect(unlockedBadges.map(b => b.id)).toContain('half-marathon');
      
      unlockedBadges.forEach(badge => {
        expect(badge.isUnlocked).toBe(true);
        expect(badge.unlockedAt).toBeDefined();
      });
    });

    it('should get badge progress correctly', () => {
      const state: AchievementState = {
        unlockedBadges: [],
        badgeProgress: {
          'marathon': 75,
          'everest-challenge': 25
        },
        lastChecked: '2024-01-15T06:00:00Z'
      };
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(state));
      
      const progress = getBadgeProgress();
      expect(progress['marathon']).toBe(75);
      expect(progress['everest-challenge']).toBe(25);
    });
  });
});