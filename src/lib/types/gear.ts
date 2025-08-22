export enum GearType {
  RUNNING_SHOES = 'running_shoes',
  TRAIL_SHOES = 'trail_shoes',
  ROAD_BIKE = 'road_bike',
  MOUNTAIN_BIKE = 'mountain_bike',
  GRAVEL_BIKE = 'gravel_bike',
  BIKE_CHAIN = 'bike_chain',
  BIKE_CASSETTE = 'bike_cassette',
  BIKE_CHAINRING = 'bike_chainring',
  BIKE_TIRES = 'bike_tires',
  OTHER = 'other'
}

export enum GearStatus {
  ACTIVE = 'active',
  NEEDS_MAINTENANCE = 'needs_maintenance',
  OVERDUE = 'overdue',
  RETIRED = 'retired'
}

export enum MaintenanceAlertLevel {
  INFO = 'info',      // 0-50% of threshold
  WARNING = 'warning', // 50-80% of threshold  
  URGENT = 'urgent',   // 80-100% of threshold
  CRITICAL = 'critical' // Over threshold
}

export interface GearThreshold {
  gearType: GearType;
  distanceThreshold: number; // in meters
  timeThreshold?: number;    // in seconds (for components that wear based on time)
  defaultMaintenance: string;
}

export interface Gear {
  id: string;
  name: string;
  type: GearType;
  brand?: string;
  model?: string;
  stravaId?: string; // ID from Strava API if synced
  totalDistance: number; // in meters
  totalTime?: number;    // in seconds
  distanceThreshold: number; // custom maintenance threshold in meters
  timeThreshold?: number;    // custom maintenance threshold in seconds
  status: GearStatus;
  purchaseDate?: string;
  purchasePrice?: number;
  retiredDate?: string;
  retiredDistance?: number;
  notes?: string;
  maintenanceLog: MaintenanceRecord[];
  createdAt: string;
  lastUpdated: string;
}

export interface MaintenanceRecord {
  id: string;
  date: string;
  type: 'maintenance' | 'replacement' | 'repair';
  description: string;
  cost?: number;
  resetDistance?: boolean; // whether this resets the distance counter
  notes?: string;
}

export interface MaintenanceAlert {
  gearId: string;
  gearName: string;
  level: MaintenanceAlertLevel;
  message: string;
  currentDistance: number;
  threshold: number;
  percentageUsed: number;
  recommendedAction: string;
  daysOverdue?: number;
}

export interface GearStats {
  totalGearItems: number;
  activeGear: number;
  retiredGear: number;
  totalDistanceCovered: number;
  averageGearLifespan: number; // in meters
  pendingMaintenanceAlerts: number;
  totalMaintenanceCost: number;
}

export interface GearUsageEntry {
  gearId: string;
  activityId: string;
  distance: number;
  time: number;
  date: string;
}

// Default thresholds for different gear types
export const DEFAULT_GEAR_THRESHOLDS: Record<GearType, GearThreshold> = {
  [GearType.RUNNING_SHOES]: {
    gearType: GearType.RUNNING_SHOES,
    distanceThreshold: 650000, // 650km average
    defaultMaintenance: 'Replace shoes when worn out'
  },
  [GearType.TRAIL_SHOES]: {
    gearType: GearType.TRAIL_SHOES,
    distanceThreshold: 800000, // 800km (more durable)
    defaultMaintenance: 'Replace shoes when lugs are worn down'
  },
  [GearType.ROAD_BIKE]: {
    gearType: GearType.ROAD_BIKE,
    distanceThreshold: 20000000, // 20,000km
    defaultMaintenance: 'Full service and component check'
  },
  [GearType.MOUNTAIN_BIKE]: {
    gearType: GearType.MOUNTAIN_BIKE,
    distanceThreshold: 15000000, // 15,000km
    defaultMaintenance: 'Full service, suspension check'
  },
  [GearType.GRAVEL_BIKE]: {
    gearType: GearType.GRAVEL_BIKE,
    distanceThreshold: 18000000, // 18,000km
    defaultMaintenance: 'Full service and drivetrain check'
  },
  [GearType.BIKE_CHAIN]: {
    gearType: GearType.BIKE_CHAIN,
    distanceThreshold: 3000000, // 3,000km
    defaultMaintenance: 'Replace chain'
  },
  [GearType.BIKE_CASSETTE]: {
    gearType: GearType.BIKE_CASSETTE,
    distanceThreshold: 8000000, // 8,000km
    defaultMaintenance: 'Replace cassette'
  },
  [GearType.BIKE_CHAINRING]: {
    gearType: GearType.BIKE_CHAINRING,
    distanceThreshold: 12000000, // 12,000km
    defaultMaintenance: 'Replace chainring'
  },
  [GearType.BIKE_TIRES]: {
    gearType: GearType.BIKE_TIRES,
    distanceThreshold: 5000000, // 5,000km
    defaultMaintenance: 'Replace tires'
  },
  [GearType.OTHER]: {
    gearType: GearType.OTHER,
    distanceThreshold: 10000000, // 10,000km default
    defaultMaintenance: 'Check and maintain as needed'
  }
};