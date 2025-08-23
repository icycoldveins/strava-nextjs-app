import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  createGoal, 
  updateGoal, 
  deleteGoal, 
  getGoals, 
  calculateGoalProgress,
  getGoalDateRange 
} from '../goals';
import { Goal } from '../types/goals';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(() => null),
};
global.localStorage = localStorageMock as Storage;

describe('Goal Management', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.clear();
  });

  describe('createGoal', () => {
    it('should create a new goal with all required fields', () => {
      const newGoal = {
        name: 'Marathon Training',
        type: 'distance' as const,
        target: 42195, // meters
        period: 'monthly' as const,
      };

      const goal = createGoal(newGoal);

      expect(goal).toMatchObject({
        name: 'Marathon Training',
        type: 'distance',
        target: 42195,
        period: 'monthly',
      });
      expect(goal.id).toBeDefined();
      expect(goal.createdAt).toBeDefined();
      expect(goal.startDate).toBeDefined();
      expect(goal.endDate).toBeDefined();
    });

    it('should save goal to localStorage', () => {
      localStorageMock.getItem.mockReturnValue('[]');
      
      const goal = createGoal({
        name: 'Weekly Run',
        type: 'distance',
        target: 50000,
        period: 'weekly',
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'strava_goals',
        expect.stringContaining(goal.id)
      );
    });
  });

  describe('updateGoal', () => {
    it('should update an existing goal', () => {
      const existingGoals = [
        {
          id: 'goal-1',
          name: 'Old Goal',
          type: 'distance' as const,
          target: 10000,
          period: 'weekly' as const,
          startDate: '2024-01-01',
          endDate: '2024-01-07',
          createdAt: '2024-01-01',
        }
      ];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(existingGoals));

      const updated = updateGoal('goal-1', { name: 'Updated Goal', target: 20000 });

      expect(updated?.name).toBe('Updated Goal');
      expect(updated?.target).toBe(20000);
      expect(updated?.type).toBe('distance'); // unchanged
    });

    it('should return null if goal not found', () => {
      localStorageMock.getItem.mockReturnValue('[]');
      
      const result = updateGoal('non-existent', { name: 'New Name' });
      
      expect(result).toBeNull();
    });
  });

  describe('deleteGoal', () => {
    it('should remove a goal from storage', () => {
      const goals = [
        { id: 'goal-1', name: 'Goal 1' },
        { id: 'goal-2', name: 'Goal 2' },
      ];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(goals));

      const result = deleteGoal('goal-1');

      expect(result).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'strava_goals',
        JSON.stringify([{ id: 'goal-2', name: 'Goal 2' }])
      );
    });
  });

  describe('getGoals', () => {
    it('should return all stored goals', () => {
      const goals = [
        { id: 'goal-1', name: 'Goal 1' },
        { id: 'goal-2', name: 'Goal 2' },
      ];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(goals));

      const result = getGoals();

      expect(result).toEqual(goals);
    });

    it('should return empty array if no goals', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const result = getGoals();

      expect(result).toEqual([]);
    });
  });

  describe('getGoalDateRange', () => {
    it('should calculate weekly date range', () => {
      const { startDate, endDate } = getGoalDateRange('weekly');
      
      const start = new Date(startDate + 'T00:00:00');
      const end = new Date(endDate + 'T23:59:59');
      const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      
      expect(diff).toBe(7); // 7 days total
    });

    it('should calculate monthly date range', () => {
      const { startDate, endDate } = getGoalDateRange('monthly');
      
      // Parse dates properly considering they are YYYY-MM-DD format
      const [startYear, startMonth, startDay] = startDate.split('-').map(Number);
      const [endYear, endMonth, endDay] = endDate.split('-').map(Number);
      
      expect(startDay).toBe(1); // First day of month
      expect(startMonth).toBe(endMonth); // Same month
      expect(startYear).toBe(endYear); // Same year
      // End day should be last day of month (28-31)
      expect(endDay).toBeGreaterThanOrEqual(28);
      expect(endDay).toBeLessThanOrEqual(31);
    });

    it('should calculate yearly date range', () => {
      const { startDate, endDate } = getGoalDateRange('yearly');
      
      // Parse dates properly considering they are YYYY-MM-DD format
      const [startYear, startMonth, startDay] = startDate.split('-').map(Number);
      const [endYear, endMonth, endDay] = endDate.split('-').map(Number);
      
      expect(startMonth).toBe(1); // January (1-based in string format)
      expect(startDay).toBe(1); // First day
      expect(endMonth).toBe(12); // December (1-based in string format)
      expect(endDay).toBe(31); // Last day
      expect(startYear).toBe(endYear); // Same year
    });

    it('should handle custom date range', () => {
      const customStart = '2024-03-01';
      const customEnd = '2024-03-31';
      
      const { startDate, endDate } = getGoalDateRange('custom', customStart, customEnd);
      
      expect(startDate).toBe(customStart);
      expect(endDate).toBe(customEnd);
    });
  });

  describe('calculateGoalProgress', () => {
    const mockGoal: Goal = {
      id: 'goal-1',
      name: 'Monthly 100km',
      type: 'distance',
      target: 100000, // 100km in meters
      period: 'monthly',
      startDate: '2024-01-01',
      endDate: '2024-01-31',
      createdAt: '2024-01-01',
    };

    it('should calculate distance goal progress correctly', () => {
      const activities = [
        { distance: 10000, start_date: '2024-01-05', type: 'Run' },
        { distance: 15000, start_date: '2024-01-10', type: 'Run' },
        { distance: 5000, start_date: '2024-01-15', type: 'Run' },
      ];

      const progress = calculateGoalProgress(mockGoal, activities);

      expect(progress).toEqual({
        goalId: 'goal-1',
        current: 30000,
        target: 100000,
        percentage: 30,
        remaining: 70000,
        isCompleted: false,
        lastUpdated: expect.any(String),
      });
    });

    it('should calculate time goal progress correctly', () => {
      const timeGoal: Goal = {
        ...mockGoal,
        type: 'time',
        target: 3600, // 1 hour in seconds
      };

      const activities = [
        { moving_time: 1200, start_date: '2024-01-05', type: 'Run' },
        { moving_time: 1800, start_date: '2024-01-10', type: 'Run' },
      ];

      const progress = calculateGoalProgress(timeGoal, activities);

      expect(progress).toEqual({
        goalId: 'goal-1',
        current: 3000,
        target: 3600,
        percentage: 83,
        remaining: 600,
        isCompleted: false,
        lastUpdated: expect.any(String),
      });
    });

    it('should calculate elevation goal progress correctly', () => {
      const elevationGoal: Goal = {
        ...mockGoal,
        type: 'elevation',
        target: 1000, // 1000m elevation
      };

      const activities = [
        { total_elevation_gain: 250, start_date: '2024-01-05', type: 'Run' },
        { total_elevation_gain: 300, start_date: '2024-01-10', type: 'Ride' },
        { total_elevation_gain: 450, start_date: '2024-01-15', type: 'Run' },
      ];

      const progress = calculateGoalProgress(elevationGoal, activities);

      expect(progress).toEqual({
        goalId: 'goal-1',
        current: 1000,
        target: 1000,
        percentage: 100,
        remaining: 0,
        isCompleted: true,
        lastUpdated: expect.any(String),
      });
    });

    it('should filter activities by date range', () => {
      const activities = [
        { distance: 10000, start_date: '2023-12-31', type: 'Run' }, // Before range
        { distance: 15000, start_date: '2024-01-15', type: 'Run' }, // In range
        { distance: 5000, start_date: '2024-02-01', type: 'Run' },  // After range
      ];

      const progress = calculateGoalProgress(mockGoal, activities);

      expect(progress.current).toBe(15000); // Only middle activity
    });

    it('should filter activities by type if specified', () => {
      const goalWithTypes: Goal = {
        ...mockGoal,
        activityTypes: ['Run'],
      };

      const activities = [
        { distance: 10000, start_date: '2024-01-05', type: 'Run' },
        { distance: 20000, start_date: '2024-01-10', type: 'Ride' }, // Should be excluded
        { distance: 5000, start_date: '2024-01-15', type: 'Run' },
      ];

      const progress = calculateGoalProgress(goalWithTypes, activities);

      expect(progress.current).toBe(15000); // Only Run activities
    });

    it('should handle empty activities array', () => {
      const progress = calculateGoalProgress(mockGoal, []);

      expect(progress).toEqual({
        goalId: 'goal-1',
        current: 0,
        target: 100000,
        percentage: 0,
        remaining: 100000,
        isCompleted: false,
        lastUpdated: expect.any(String),
      });
    });

    it('should cap percentage at 100 when exceeded', () => {
      const activities = [
        { distance: 150000, start_date: '2024-01-15', type: 'Run' },
      ];

      const progress = calculateGoalProgress(mockGoal, activities);

      expect(progress.percentage).toBe(100);
      expect(progress.isCompleted).toBe(true);
      expect(progress.remaining).toBe(0);
    });
  });
});

describe('Goal Progress Calculations for UI', () => {
  it('should format distance for display', () => {
    const formatDistance = (meters: number, unit: 'metric' | 'imperial' = 'metric') => {
      if (unit === 'metric') {
        return meters >= 1000 ? `${(meters / 1000).toFixed(1)}km` : `${meters}m`;
      } else {
        const miles = meters * 0.000621371;
        return `${miles.toFixed(1)}mi`;
      }
    };

    expect(formatDistance(5000)).toBe('5.0km');
    expect(formatDistance(500)).toBe('500m');
    expect(formatDistance(42195)).toBe('42.2km');
    expect(formatDistance(5000, 'imperial')).toBe('3.1mi');
  });

  it('should format time for display', () => {
    const formatTime = (seconds: number) => {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const secs = seconds % 60;

      if (hours > 0) {
        return `${hours}h ${minutes}m`;
      } else if (minutes > 0) {
        return `${minutes}m ${secs}s`;
      } else {
        return `${secs}s`;
      }
    };

    expect(formatTime(3661)).toBe('1h 1m');
    expect(formatTime(150)).toBe('2m 30s');
    expect(formatTime(45)).toBe('45s');
  });

  it('should format elevation for display', () => {
    const formatElevation = (meters: number, unit: 'metric' | 'imperial' = 'metric') => {
      if (unit === 'metric') {
        return `${meters}m`;
      } else {
        const feet = meters * 3.28084;
        return `${Math.round(feet)}ft`;
      }
    };

    expect(formatElevation(1000)).toBe('1000m');
    expect(formatElevation(1000, 'imperial')).toBe('3281ft');
  });
});