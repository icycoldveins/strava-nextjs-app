import {
  Gear,
  GearType,
  GearStatus,
  MaintenanceAlert,
  MaintenanceAlertLevel,
  MaintenanceRecord,
  GearStats,
  GearUsageEntry,
  DEFAULT_GEAR_THRESHOLDS
} from './types/gear';

const GEAR_STORAGE_KEY = 'strava_gear';

// Helper function to generate unique IDs
const generateId = (): string => {
  return `gear_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Helper function to get current ISO date string
const getCurrentDate = (): string => {
  return new Date().toISOString();
};

// Helper function to infer gear type from name/brand
const inferGearType = (name: string, brand?: string): GearType => {
  const lowerName = name.toLowerCase();
  const lowerBrand = brand?.toLowerCase() || '';

  if (lowerName.includes('bike') || lowerName.includes('bicycle') || 
      ['trek', 'specialized', 'giant', 'cannondale', 'bianchi'].includes(lowerBrand)) {
    if (lowerName.includes('mountain') || lowerName.includes('mtb')) {
      return GearType.MOUNTAIN_BIKE;
    }
    if (lowerName.includes('gravel') || lowerName.includes('cross')) {
      return GearType.GRAVEL_BIKE;
    }
    return GearType.ROAD_BIKE;
  }

  if (lowerName.includes('shoe') || lowerName.includes('runner') ||
      ['nike', 'adidas', 'asics', 'brooks', 'hoka', 'salomon'].includes(lowerBrand)) {
    if (lowerName.includes('trail') || lowerName.includes('mountain')) {
      return GearType.TRAIL_SHOES;
    }
    return GearType.RUNNING_SHOES;
  }

  if (lowerName.includes('chain')) return GearType.BIKE_CHAIN;
  if (lowerName.includes('cassette')) return GearType.BIKE_CASSETTE;
  if (lowerName.includes('chainring')) return GearType.BIKE_CHAINRING;
  if (lowerName.includes('tire') || lowerName.includes('tyre')) return GearType.BIKE_TIRES;

  return GearType.OTHER;
};

// Storage helpers
const getStoredGear = (): Gear[] => {
  try {
    const stored = localStorage.getItem(GEAR_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error reading gear from localStorage:', error);
    return [];
  }
};

const saveGear = (gear: Gear[]): void => {
  try {
    localStorage.setItem(GEAR_STORAGE_KEY, JSON.stringify(gear));
  } catch (error) {
    console.error('Error saving gear to localStorage:', error);
  }
};

// CRUD Operations

export const createGear = (gearData: {
  name: string;
  type: GearType;
  brand?: string;
  model?: string;
  stravaId?: string;
  totalDistance?: number;
  distanceThreshold?: number;
  purchaseDate?: string;
  purchasePrice?: number;
  notes?: string;
}): Gear => {
  const now = getCurrentDate();
  const defaultThreshold = DEFAULT_GEAR_THRESHOLDS[gearData.type].distanceThreshold;
  const totalDistance = gearData.totalDistance || 0;

  const newGear: Gear = {
    id: generateId(),
    name: gearData.name,
    type: gearData.type,
    brand: gearData.brand,
    model: gearData.model,
    stravaId: gearData.stravaId,
    totalDistance: totalDistance,
    distanceThreshold: gearData.distanceThreshold || defaultThreshold,
    status: calculateGearStatus({
      totalDistance,
      distanceThreshold: gearData.distanceThreshold || defaultThreshold,
      status: GearStatus.ACTIVE
    } as Gear),
    purchaseDate: gearData.purchaseDate,
    purchasePrice: gearData.purchasePrice,
    notes: gearData.notes,
    maintenanceLog: [],
    createdAt: now,
    lastUpdated: now
  };

  const allGear = getStoredGear();
  allGear.push(newGear);
  saveGear(allGear);

  return newGear;
};

export const updateGear = (gearId: string, updates: Partial<Gear>): Gear | null => {
  const allGear = getStoredGear();
  const gearIndex = allGear.findIndex(g => g.id === gearId);

  if (gearIndex === -1) {
    return null;
  }

  const updatedGear: Gear = {
    ...allGear[gearIndex],
    ...updates,
    lastUpdated: getCurrentDate()
  };

  // Recalculate status if distance changed
  if (updates.totalDistance !== undefined) {
    updatedGear.status = calculateGearStatus(updatedGear);
  }

  allGear[gearIndex] = updatedGear;
  saveGear(allGear);

  return updatedGear;
};

export const deleteGear = (gearId: string): boolean => {
  const allGear = getStoredGear();
  const filteredGear = allGear.filter(g => g.id !== gearId);

  if (filteredGear.length === allGear.length) {
    return false; // Gear not found
  }

  saveGear(filteredGear);
  return true;
};

export const getGear = (gearId: string): Gear | null => {
  const allGear = getStoredGear();
  return allGear.find(g => g.id === gearId) || null;
};

export const getAllGear = (): Gear[] => {
  return getStoredGear();
};

// Distance Tracking

export const updateGearDistance = (gearId: string, activities: any[]): Gear | null => {
  const gear = getGear(gearId);
  if (!gear) return null;

  // Calculate total distance from activities for this gear
  const additionalDistance = activities
    .filter(activity => activity.gear_id === gearId)
    .reduce((total, activity) => total + (activity.distance || 0), 0);

  const newTotalDistance = gear.totalDistance + additionalDistance;

  return updateGear(gearId, {
    totalDistance: newTotalDistance
  });
};

// Status Calculations

export const calculateGearStatus = (gear: Gear): GearStatus => {
  if (gear.status === GearStatus.RETIRED) {
    return GearStatus.RETIRED;
  }

  const usagePercentage = (gear.totalDistance / gear.distanceThreshold) * 100;

  if (usagePercentage >= 100) {
    return GearStatus.OVERDUE;
  } else if (usagePercentage >= 80) {
    return GearStatus.OVERDUE;
  } else if (usagePercentage >= 50) {
    return GearStatus.NEEDS_MAINTENANCE;
  } else {
    return GearStatus.ACTIVE;
  }
};

// Maintenance Alerts

export const getMaintenanceAlerts = (gear: Gear[]): MaintenanceAlert[] => {
  const alerts: MaintenanceAlert[] = [];

  gear.forEach(item => {
    // Skip retired gear
    if (item.status === GearStatus.RETIRED) {
      return;
    }

    const usagePercentage = Math.floor((item.totalDistance / item.distanceThreshold) * 100);
    
    // Only generate alerts for gear over 50% threshold
    if (usagePercentage < 50) {
      return;
    }

    let level: MaintenanceAlertLevel;
    let message: string;
    let recommendedAction: string;
    let daysOverdue: number | undefined;

    if (usagePercentage >= 100) {
      level = MaintenanceAlertLevel.CRITICAL;
      message = `${item.name} has exceeded recommended distance and needs immediate attention`;
      recommendedAction = `Replace or retire ${item.name} immediately`;
      // Calculate rough days overdue (assuming 50km/week average)
      const overdueDistance = item.totalDistance - item.distanceThreshold;
      daysOverdue = Math.floor(overdueDistance / (50000 / 7));
    } else if (usagePercentage >= 80) {
      level = MaintenanceAlertLevel.URGENT;
      message = `${item.name} needs maintenance soon (${usagePercentage}% of threshold reached)`;
      recommendedAction = `Schedule maintenance for ${item.name} within the next few activities`;
    } else if (usagePercentage >= 50) {
      level = MaintenanceAlertLevel.WARNING;
      message = `${item.name} is approaching maintenance threshold (${usagePercentage}% reached)`;
      recommendedAction = `Plan maintenance for ${item.name} in the coming weeks`;
    } else {
      return; // No alert needed
    }

    alerts.push({
      gearId: item.id,
      gearName: item.name,
      level,
      message,
      currentDistance: item.totalDistance,
      threshold: item.distanceThreshold,
      percentageUsed: usagePercentage,
      recommendedAction,
      daysOverdue
    });
  });

  // Sort by severity (critical first)
  return alerts.sort((a, b) => {
    const levelOrder = {
      [MaintenanceAlertLevel.CRITICAL]: 4,
      [MaintenanceAlertLevel.URGENT]: 3,
      [MaintenanceAlertLevel.WARNING]: 2,
      [MaintenanceAlertLevel.INFO]: 1
    };
    return levelOrder[b.level] - levelOrder[a.level];
  });
};

// Gear Retirement

export const retireGear = (gearId: string, notes?: string): Gear | null => {
  const gear = getGear(gearId);
  if (!gear) return null;

  return updateGear(gearId, {
    status: GearStatus.RETIRED,
    retiredDate: getCurrentDate().split('T')[0], // YYYY-MM-DD format
    retiredDistance: gear.totalDistance,
    notes: notes || gear.notes
  });
};

// Maintenance Records

export const addMaintenanceRecord = (
  gearId: string, 
  record: Omit<MaintenanceRecord, 'id' | 'date'>
): Gear | null => {
  const gear = getGear(gearId);
  if (!gear) return null;

  const maintenanceRecord: MaintenanceRecord = {
    id: generateId(),
    date: getCurrentDate().split('T')[0], // YYYY-MM-DD format
    ...record
  };

  const updatedMaintenanceLog = [...gear.maintenanceLog, maintenanceRecord];
  
  // Reset distance if specified
  const updates: Partial<Gear> = {
    maintenanceLog: updatedMaintenanceLog
  };

  if (record.resetDistance) {
    updates.totalDistance = 0;
  }

  return updateGear(gearId, updates);
};

// Gear Statistics

export const getGearStats = (gear: Gear[]): GearStats => {
  if (gear.length === 0) {
    return {
      totalGearItems: 0,
      activeGear: 0,
      retiredGear: 0,
      totalDistanceCovered: 0,
      averageGearLifespan: 0,
      pendingMaintenanceAlerts: 0,
      totalMaintenanceCost: 0
    };
  }

  const totalGearItems = gear.length;
  const activeGear = gear.filter(g => 
    g.status === GearStatus.ACTIVE || g.status === GearStatus.NEEDS_MAINTENANCE
  ).length;
  const retiredGear = gear.filter(g => g.status === GearStatus.RETIRED).length;
  
  const totalDistanceCovered = gear.reduce((total, g) => total + g.totalDistance, 0);
  const averageGearLifespan = Math.round(totalDistanceCovered / totalGearItems);
  
  const alerts = getMaintenanceAlerts(gear);
  const pendingMaintenanceAlerts = alerts.filter(a => 
    a.level === MaintenanceAlertLevel.WARNING || 
    a.level === MaintenanceAlertLevel.URGENT ||
    a.level === MaintenanceAlertLevel.CRITICAL
  ).length;
  
  const totalMaintenanceCost = gear.reduce((total, g) => 
    total + g.maintenanceLog.reduce((logTotal, record) => 
      logTotal + (record.cost || 0), 0
    ), 0
  );

  return {
    totalGearItems,
    activeGear,
    retiredGear,
    totalDistanceCovered,
    averageGearLifespan,
    pendingMaintenanceAlerts,
    totalMaintenanceCost
  };
};

// Strava Integration

export const syncWithStravaGear = (stravaGearData: any[]): Gear[] => {
  const existingGear = getStoredGear();
  const syncedGear: Gear[] = [];

  stravaGearData.forEach(stravaItem => {
    // Check if we already have this Strava gear
    const existingItem = existingGear.find(g => g.stravaId === stravaItem.id);

    if (existingItem) {
      // Update existing gear with latest Strava data
      const updated = updateGear(existingItem.id, {
        name: stravaItem.name,
        brand: stravaItem.brand_name,
        model: stravaItem.model_name,
        totalDistance: stravaItem.distance || 0
      });
      if (updated) {
        syncedGear.push(updated);
      }
    } else {
      // Create new gear from Strava data
      const gearType = inferGearType(stravaItem.name, stravaItem.brand_name);
      const newGear = createGear({
        name: stravaItem.name,
        type: gearType,
        brand: stravaItem.brand_name,
        model: stravaItem.model_name,
        stravaId: stravaItem.id,
        totalDistance: stravaItem.distance || 0
      });
      
      syncedGear.push(newGear);
    }
  });

  return syncedGear;
};

// Gear Usage History

export const getGearUsageHistory = (gearId: string, activities: any[]): GearUsageEntry[] => {
  return activities
    .filter(activity => activity.gear_id === gearId)
    .map(activity => ({
      gearId,
      activityId: activity.id,
      distance: activity.distance || 0,
      time: activity.moving_time || 0,
      date: activity.start_date
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

// Utility Functions for UI

export const formatDistance = (meters: number, unit: 'metric' | 'imperial' = 'metric'): string => {
  if (unit === 'metric') {
    return meters >= 1000 ? `${(meters / 1000).toFixed(1)}km` : `${meters}m`;
  } else {
    const miles = meters * 0.000621371;
    return `${miles.toFixed(1)}mi`;
  }
};

export const formatGearLifespan = (totalDistance: number, threshold: number): string => {
  const percentage = Math.round((totalDistance / threshold) * 100);
  return `${percentage}%`;
};

export const getGearStatusColor = (status: GearStatus): string => {
  switch (status) {
    case GearStatus.ACTIVE:
      return 'green';
    case GearStatus.NEEDS_MAINTENANCE:
      return 'yellow';
    case GearStatus.OVERDUE:
      return 'orange';
    case GearStatus.RETIRED:
      return 'gray';
    default:
      return 'gray';
  }
};

export const getAlertLevelColor = (level: MaintenanceAlertLevel): string => {
  switch (level) {
    case MaintenanceAlertLevel.INFO:
      return 'blue';
    case MaintenanceAlertLevel.WARNING:
      return 'yellow';
    case MaintenanceAlertLevel.URGENT:
      return 'orange';
    case MaintenanceAlertLevel.CRITICAL:
      return 'red';
    default:
      return 'gray';
  }
};