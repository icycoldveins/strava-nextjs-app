import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createGear,
  updateGear,
  deleteGear,
  getGear,
  getAllGear,
  retireGear,
  addMaintenanceRecord,
  calculateGearStatus,
  getMaintenanceAlerts,
  updateGearDistance,
  getGearStats,
  syncWithStravaGear,
  getGearUsageHistory
} from '../gear';
import {
  Gear,
  GearType,
  GearStatus,
  MaintenanceAlertLevel,
  MaintenanceAlert,
  GearStats,
  MaintenanceRecord,
  DEFAULT_GEAR_THRESHOLDS
} from '../types/gear';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock as any;

describe('Gear Management - CRUD Operations', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.clear();
  });

  describe('createGear', () => {
    it('should create a new gear item with all required fields', () => {
      const newGear = {
        name: 'Nike Air Zoom Pegasus',
        type: GearType.RUNNING_SHOES,
        brand: 'Nike',
        model: 'Air Zoom Pegasus 40',
        purchasePrice: 120
      };

      const gear = createGear(newGear);

      expect(gear).toMatchObject({
        name: 'Nike Air Zoom Pegasus',
        type: GearType.RUNNING_SHOES,
        brand: 'Nike',
        model: 'Air Zoom Pegasus 40',
        purchasePrice: 120,
        totalDistance: 0,
        status: GearStatus.ACTIVE,
        distanceThreshold: DEFAULT_GEAR_THRESHOLDS[GearType.RUNNING_SHOES].distanceThreshold,
        maintenanceLog: []
      });
      expect(gear.id).toBeDefined();
      expect(gear.createdAt).toBeDefined();
      expect(gear.lastUpdated).toBeDefined();
    });

    it('should save gear to localStorage', () => {
      localStorageMock.getItem.mockReturnValue('[]');
      
      const gear = createGear({
        name: 'Test Bike',
        type: GearType.ROAD_BIKE
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'strava_gear',
        expect.stringContaining(gear.id)
      );
    });

    it('should use custom threshold if provided', () => {
      const gear = createGear({
        name: 'Custom Shoes',
        type: GearType.RUNNING_SHOES,
        distanceThreshold: 500000 // 500km custom threshold
      });

      expect(gear.distanceThreshold).toBe(500000);
    });
  });

  describe('updateGear', () => {
    it('should update an existing gear item', () => {
      const existingGear = [{
        id: 'gear-1',
        name: 'Old Name',
        type: GearType.RUNNING_SHOES,
        totalDistance: 100000,
        distanceThreshold: 650000,
        status: GearStatus.ACTIVE,
        maintenanceLog: [],
        createdAt: '2024-01-01',
        lastUpdated: '2024-01-01'
      }];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(existingGear));

      const updated = updateGear('gear-1', { 
        name: 'Updated Name', 
        brand: 'New Brand',
        totalDistance: 150000
      });

      expect(updated?.name).toBe('Updated Name');
      expect(updated?.brand).toBe('New Brand');
      expect(updated?.totalDistance).toBe(150000);
      expect(updated?.type).toBe(GearType.RUNNING_SHOES); // unchanged
      expect(updated?.lastUpdated).not.toBe('2024-01-01'); // should be updated
    });

    it('should return null if gear not found', () => {
      localStorageMock.getItem.mockReturnValue('[]');
      
      const result = updateGear('non-existent', { name: 'New Name' });
      
      expect(result).toBeNull();
    });
  });

  describe('deleteGear', () => {
    it('should remove gear from storage', () => {
      const gear = [
        { id: 'gear-1', name: 'Gear 1' },
        { id: 'gear-2', name: 'Gear 2' }
      ];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(gear));

      const result = deleteGear('gear-1');

      expect(result).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'strava_gear',
        JSON.stringify([{ id: 'gear-2', name: 'Gear 2' }])
      );
    });

    it('should return false if gear not found', () => {
      localStorageMock.getItem.mockReturnValue('[]');
      
      const result = deleteGear('non-existent');
      
      expect(result).toBe(false);
    });
  });

  describe('getGear and getAllGear', () => {
    it('should return specific gear by id', () => {
      const gear = [
        { id: 'gear-1', name: 'Gear 1' },
        { id: 'gear-2', name: 'Gear 2' }
      ];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(gear));

      const result = getGear('gear-1');

      expect(result).toEqual({ id: 'gear-1', name: 'Gear 1' });
    });

    it('should return null if gear not found', () => {
      localStorageMock.getItem.mockReturnValue('[]');

      const result = getGear('non-existent');

      expect(result).toBeNull();
    });

    it('should return all gear items', () => {
      const gear = [
        { id: 'gear-1', name: 'Gear 1' },
        { id: 'gear-2', name: 'Gear 2' }
      ];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(gear));

      const result = getAllGear();

      expect(result).toEqual(gear);
    });

    it('should return empty array if no gear', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const result = getAllGear();

      expect(result).toEqual([]);
    });
  });
});

describe('Gear Distance Tracking', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
  });

  describe('updateGearDistance', () => {
    it('should accumulate distance for gear from activities', () => {
      const gear = [{
        id: 'gear-1',
        name: 'Running Shoes',
        type: GearType.RUNNING_SHOES,
        totalDistance: 100000, // 100km existing
        distanceThreshold: 650000,
        status: GearStatus.ACTIVE,
        maintenanceLog: [],
        createdAt: '2024-01-01',
        lastUpdated: '2024-01-01'
      }];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(gear));

      const activities = [
        { id: '1', distance: 10000, gear_id: 'gear-1', start_date: '2024-01-15' },
        { id: '2', distance: 15000, gear_id: 'gear-1', start_date: '2024-01-20' },
        { id: '3', distance: 5000, gear_id: 'other-gear', start_date: '2024-01-25' }
      ];

      const updated = updateGearDistance('gear-1', activities);

      expect(updated?.totalDistance).toBe(125000); // 100km + 25km from activities
      expect(updated?.lastUpdated).not.toBe('2024-01-01');
    });

    it('should update gear status based on new distance', () => {
      const gear = [{
        id: 'gear-1',
        name: 'Running Shoes',
        type: GearType.RUNNING_SHOES,
        totalDistance: 600000, // 600km existing
        distanceThreshold: 650000, // 650km threshold
        status: GearStatus.ACTIVE,
        maintenanceLog: [],
        createdAt: '2024-01-01',
        lastUpdated: '2024-01-01'
      }];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(gear));

      const activities = [
        { id: '1', distance: 60000, gear_id: 'gear-1', start_date: '2024-01-15' } // +60km = 660km total
      ];

      const updated = updateGearDistance('gear-1', activities);

      expect(updated?.totalDistance).toBe(660000);
      expect(updated?.status).toBe(GearStatus.OVERDUE); // Over threshold
    });
  });
});

describe('Gear Status Calculations', () => {
  describe('calculateGearStatus', () => {
    it('should return ACTIVE for gear under 50% threshold', () => {
      const gear: Gear = {
        id: 'gear-1',
        name: 'New Shoes',
        type: GearType.RUNNING_SHOES,
        totalDistance: 200000, // 200km
        distanceThreshold: 650000, // 650km threshold (30.7%)
        status: GearStatus.ACTIVE,
        maintenanceLog: [],
        createdAt: '2024-01-01',
        lastUpdated: '2024-01-01'
      };

      const status = calculateGearStatus(gear);

      expect(status).toBe(GearStatus.ACTIVE);
    });

    it('should return NEEDS_MAINTENANCE for gear between 50-80% threshold', () => {
      const gear: Gear = {
        id: 'gear-1',
        name: 'Used Shoes',
        type: GearType.RUNNING_SHOES,
        totalDistance: 450000, // 450km
        distanceThreshold: 650000, // 650km threshold (69.2%)
        status: GearStatus.ACTIVE,
        maintenanceLog: [],
        createdAt: '2024-01-01',
        lastUpdated: '2024-01-01'
      };

      const status = calculateGearStatus(gear);

      expect(status).toBe(GearStatus.NEEDS_MAINTENANCE);
    });

    it('should return OVERDUE for gear over 80% threshold', () => {
      const gear: Gear = {
        id: 'gear-1',
        name: 'Well Used Shoes',
        type: GearType.RUNNING_SHOES,
        totalDistance: 600000, // 600km
        distanceThreshold: 650000, // 650km threshold (92.3%)
        status: GearStatus.ACTIVE,
        maintenanceLog: [],
        createdAt: '2024-01-01',
        lastUpdated: '2024-01-01'
      };

      const status = calculateGearStatus(gear);

      expect(status).toBe(GearStatus.OVERDUE);
    });

    it('should return RETIRED for gear that has been retired', () => {
      const gear: Gear = {
        id: 'gear-1',
        name: 'Old Shoes',
        type: GearType.RUNNING_SHOES,
        totalDistance: 700000,
        distanceThreshold: 650000,
        status: GearStatus.RETIRED,
        retiredDate: '2024-01-15',
        retiredDistance: 700000,
        maintenanceLog: [],
        createdAt: '2024-01-01',
        lastUpdated: '2024-01-15'
      };

      const status = calculateGearStatus(gear);

      expect(status).toBe(GearStatus.RETIRED);
    });
  });
});

describe('Maintenance Alerts', () => {
  describe('getMaintenanceAlerts', () => {
    const mockGear: Gear[] = [
      {
        id: 'gear-1',
        name: 'New Shoes',
        type: GearType.RUNNING_SHOES,
        totalDistance: 200000, // 30.7% of 650km
        distanceThreshold: 650000,
        status: GearStatus.ACTIVE,
        maintenanceLog: [],
        createdAt: '2024-01-01',
        lastUpdated: '2024-01-01'
      },
      {
        id: 'gear-2',
        name: 'Warning Shoes',
        type: GearType.RUNNING_SHOES,
        totalDistance: 450000, // 69.2% of 650km
        distanceThreshold: 650000,
        status: GearStatus.NEEDS_MAINTENANCE,
        maintenanceLog: [],
        createdAt: '2024-01-01',
        lastUpdated: '2024-01-01'
      },
      {
        id: 'gear-3',
        name: 'Urgent Shoes',
        type: GearType.RUNNING_SHOES,
        totalDistance: 580000, // 89.2% of 650km
        distanceThreshold: 650000,
        status: GearStatus.OVERDUE,
        maintenanceLog: [],
        createdAt: '2024-01-01',
        lastUpdated: '2024-01-01'
      },
      {
        id: 'gear-4',
        name: 'Critical Shoes',
        type: GearType.RUNNING_SHOES,
        totalDistance: 700000, // 107.7% of 650km
        distanceThreshold: 650000,
        status: GearStatus.OVERDUE,
        maintenanceLog: [],
        createdAt: '2024-01-01',
        lastUpdated: '2024-01-01'
      }
    ];

    it('should generate appropriate alerts for different wear levels', () => {
      const alerts = getMaintenanceAlerts(mockGear);

      expect(alerts).toHaveLength(3); // Only warning, urgent, and critical

      // Check warning alert
      const warningAlert = alerts.find(a => a.gearId === 'gear-2');
      expect(warningAlert?.level).toBe(MaintenanceAlertLevel.WARNING);
      expect(warningAlert?.percentageUsed).toBe(69);
      expect(warningAlert?.message).toContain('approaching maintenance');

      // Check urgent alert
      const urgentAlert = alerts.find(a => a.gearId === 'gear-3');
      expect(urgentAlert?.level).toBe(MaintenanceAlertLevel.URGENT);
      expect(urgentAlert?.percentageUsed).toBe(89);
      expect(urgentAlert?.message).toContain('needs maintenance soon');

      // Check critical alert
      const criticalAlert = alerts.find(a => a.gearId === 'gear-4');
      expect(criticalAlert?.level).toBe(MaintenanceAlertLevel.CRITICAL);
      expect(criticalAlert?.percentageUsed).toBe(107);
      expect(criticalAlert?.message).toContain('exceeded recommended');
      expect(criticalAlert?.daysOverdue).toBeDefined();
    });

    it('should not generate alerts for gear under 50% threshold', () => {
      const alerts = getMaintenanceAlerts(mockGear);

      const noAlert = alerts.find(a => a.gearId === 'gear-1');
      expect(noAlert).toBeUndefined();
    });

    it('should not generate alerts for retired gear', () => {
      const gearWithRetired = [
        ...mockGear,
        {
          id: 'gear-retired',
          name: 'Retired Shoes',
          type: GearType.RUNNING_SHOES,
          totalDistance: 800000,
          distanceThreshold: 650000,
          status: GearStatus.RETIRED,
          retiredDate: '2024-01-15',
          retiredDistance: 800000,
          maintenanceLog: [],
          createdAt: '2024-01-01',
          lastUpdated: '2024-01-15'
        }
      ];

      const alerts = getMaintenanceAlerts(gearWithRetired);

      const retiredAlert = alerts.find(a => a.gearId === 'gear-retired');
      expect(retiredAlert).toBeUndefined();
    });
  });
});

describe('Gear Retirement', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
  });

  describe('retireGear', () => {
    it('should retire gear with current distance and date', () => {
      const gear = [{
        id: 'gear-1',
        name: 'Old Shoes',
        type: GearType.RUNNING_SHOES,
        totalDistance: 700000,
        distanceThreshold: 650000,
        status: GearStatus.OVERDUE,
        maintenanceLog: [],
        createdAt: '2024-01-01',
        lastUpdated: '2024-01-01'
      }];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(gear));

      const retired = retireGear('gear-1', 'Worn out after 700km');

      expect(retired?.status).toBe(GearStatus.RETIRED);
      expect(retired?.retiredDate).toBeDefined();
      expect(retired?.retiredDistance).toBe(700000);
      expect(retired?.notes).toBe('Worn out after 700km');
    });

    it('should return null if gear not found', () => {
      localStorageMock.getItem.mockReturnValue('[]');

      const result = retireGear('non-existent');

      expect(result).toBeNull();
    });
  });
});

describe('Maintenance Records', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
  });

  describe('addMaintenanceRecord', () => {
    it('should add maintenance record to gear', () => {
      const gear = [{
        id: 'gear-1',
        name: 'Bike',
        type: GearType.ROAD_BIKE,
        totalDistance: 5000000,
        distanceThreshold: 20000000,
        status: GearStatus.ACTIVE,
        maintenanceLog: [],
        createdAt: '2024-01-01',
        lastUpdated: '2024-01-01'
      }];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(gear));

      const maintenanceRecord = {
        type: 'maintenance' as const,
        description: 'Chain replacement',
        cost: 50,
        resetDistance: false,
        notes: 'Replaced worn chain'
      };

      const updated = addMaintenanceRecord('gear-1', maintenanceRecord);

      expect(updated?.maintenanceLog).toHaveLength(1);
      const record = updated?.maintenanceLog[0];
      expect(record?.type).toBe('maintenance');
      expect(record?.description).toBe('Chain replacement');
      expect(record?.cost).toBe(50);
      expect(record?.id).toBeDefined();
      expect(record?.date).toBeDefined();
    });

    it('should reset distance if resetDistance is true', () => {
      const gear = [{
        id: 'gear-1',
        name: 'Chain',
        type: GearType.BIKE_CHAIN,
        totalDistance: 3000000, // 3000km
        distanceThreshold: 3000000,
        status: GearStatus.OVERDUE,
        maintenanceLog: [],
        createdAt: '2024-01-01',
        lastUpdated: '2024-01-01'
      }];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(gear));

      const maintenanceRecord = {
        type: 'replacement' as const,
        description: 'New chain installed',
        cost: 30,
        resetDistance: true
      };

      const updated = addMaintenanceRecord('gear-1', maintenanceRecord);

      expect(updated?.totalDistance).toBe(0); // Reset to 0
      expect(updated?.status).toBe(GearStatus.ACTIVE); // Status recalculated
    });
  });
});

describe('Gear Statistics', () => {
  describe('getGearStats', () => {
    const mockGear: Gear[] = [
      {
        id: 'gear-1',
        name: 'Active Shoes',
        type: GearType.RUNNING_SHOES,
        totalDistance: 200000,
        distanceThreshold: 650000,
        status: GearStatus.ACTIVE,
        purchasePrice: 120,
        maintenanceLog: [
          { id: '1', date: '2024-01-01', type: 'maintenance', description: 'Clean', cost: 0 }
        ],
        createdAt: '2024-01-01',
        lastUpdated: '2024-01-01'
      },
      {
        id: 'gear-2',
        name: 'Warning Bike',
        type: GearType.ROAD_BIKE,
        totalDistance: 15000000,
        distanceThreshold: 20000000,
        status: GearStatus.NEEDS_MAINTENANCE,
        purchasePrice: 2000,
        maintenanceLog: [
          { id: '2', date: '2024-01-15', type: 'maintenance', description: 'Service', cost: 150 }
        ],
        createdAt: '2024-01-01',
        lastUpdated: '2024-01-01'
      },
      {
        id: 'gear-3',
        name: 'Retired Shoes',
        type: GearType.RUNNING_SHOES,
        totalDistance: 700000,
        distanceThreshold: 650000,
        status: GearStatus.RETIRED,
        retiredDate: '2024-01-20',
        retiredDistance: 700000,
        purchasePrice: 100,
        maintenanceLog: [],
        createdAt: '2024-01-01',
        lastUpdated: '2024-01-20'
      }
    ];

    it('should calculate comprehensive gear statistics', () => {
      const stats = getGearStats(mockGear);

      expect(stats).toEqual({
        totalGearItems: 3,
        activeGear: 2, // ACTIVE + NEEDS_MAINTENANCE
        retiredGear: 1,
        totalDistanceCovered: 15900000, // 200km + 15000km + 700km
        averageGearLifespan: 5300000, // Total distance / total items
        pendingMaintenanceAlerts: 1, // Only the NEEDS_MAINTENANCE bike
        totalMaintenanceCost: 150 // Sum of all maintenance costs
      });
    });

    it('should handle empty gear array', () => {
      const stats = getGearStats([]);

      expect(stats).toEqual({
        totalGearItems: 0,
        activeGear: 0,
        retiredGear: 0,
        totalDistanceCovered: 0,
        averageGearLifespan: 0,
        pendingMaintenanceAlerts: 0,
        totalMaintenanceCost: 0
      });
    });
  });
});

describe('Strava Integration', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
  });

  describe('syncWithStravaGear', () => {
    it('should sync gear from Strava API response', () => {
      localStorageMock.getItem.mockReturnValue('[]');

      const stravaGear = [
        {
          id: 'strava-1',
          name: 'Strava Bike',
          brand_name: 'Trek',
          model_name: 'Domane SL 7',
          distance: 5000000, // 5000km from Strava
          primary: true
        },
        {
          id: 'strava-2',
          name: 'Strava Shoes',
          brand_name: 'Nike',
          model_name: 'Pegasus 40',
          distance: 300000, // 300km from Strava
          primary: false
        }
      ];

      const synced = syncWithStravaGear(stravaGear);

      expect(synced).toHaveLength(2);
      
      const bike = synced.find(g => g.stravaId === 'strava-1');
      expect(bike?.name).toBe('Strava Bike');
      expect(bike?.brand).toBe('Trek');
      expect(bike?.model).toBe('Domane SL 7');
      expect(bike?.totalDistance).toBe(5000000);
      expect(bike?.type).toBe(GearType.ROAD_BIKE); // Inferred from name

      const shoes = synced.find(g => g.stravaId === 'strava-2');
      expect(shoes?.name).toBe('Strava Shoes');
      expect(shoes?.brand).toBe('Nike');
      expect(shoes?.totalDistance).toBe(300000);
      expect(shoes?.type).toBe(GearType.RUNNING_SHOES); // Inferred from name
    });

    it('should update existing gear if already synced', () => {
      const existingGear = [{
        id: 'local-1',
        stravaId: 'strava-1',
        name: 'Old Name',
        brand: 'Trek',
        model: 'Old Model',
        type: GearType.ROAD_BIKE,
        totalDistance: 4000000,
        distanceThreshold: 20000000,
        status: GearStatus.ACTIVE,
        maintenanceLog: [],
        createdAt: '2024-01-01',
        lastUpdated: '2024-01-01'
      }];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(existingGear));

      const stravaGear = [{
        id: 'strava-1',
        name: 'Updated Bike Name',
        brand_name: 'Trek',
        model_name: 'Domane SL 8',
        distance: 6000000, // Updated distance
        primary: true
      }];

      const synced = syncWithStravaGear(stravaGear);

      expect(synced).toHaveLength(1);
      expect(synced[0].id).toBe('local-1'); // Same local ID
      expect(synced[0].name).toBe('Updated Bike Name'); // Updated name
      expect(synced[0].model).toBe('Domane SL 8'); // Updated model
      expect(synced[0].totalDistance).toBe(6000000); // Updated distance
    });
  });
});

describe('Gear Usage History', () => {
  describe('getGearUsageHistory', () => {
    it('should return usage history for specific gear', () => {
      const activities = [
        { id: '1', distance: 10000, gear_id: 'gear-1', start_date: '2024-01-15', moving_time: 3600 },
        { id: '2', distance: 15000, gear_id: 'gear-1', start_date: '2024-01-20', moving_time: 4500 },
        { id: '3', distance: 5000, gear_id: 'other-gear', start_date: '2024-01-25', moving_time: 1800 }
      ];

      const history = getGearUsageHistory('gear-1', activities);

      expect(history).toHaveLength(2);
      expect(history[0]).toEqual({
        gearId: 'gear-1',
        activityId: '1',
        distance: 10000,
        time: 3600,
        date: '2024-01-15'
      });
      expect(history[1]).toEqual({
        gearId: 'gear-1',
        activityId: '2',
        distance: 15000,
        time: 4500,
        date: '2024-01-20'
      });
    });

    it('should return empty array if no activities for gear', () => {
      const activities = [
        { id: '1', distance: 10000, gear_id: 'other-gear', start_date: '2024-01-15' }
      ];

      const history = getGearUsageHistory('gear-1', activities);

      expect(history).toEqual([]);
    });
  });
});