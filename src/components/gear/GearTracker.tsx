'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { 
  RefreshCw, 
  Package, 
  RotateCcw,
  Filter,
  Eye,
  EyeOff
} from 'lucide-react';

import { GearCard } from './GearCard';
import { AddGearModal } from './AddGearModal';
import { MaintenanceAlertsList } from './MaintenanceAlert';

import { 
  getAllGear, 
  getMaintenanceAlerts, 
  getGearStats,
  deleteGear,
  addMaintenanceRecord,
  syncWithStravaGear,
  updateGearDistance
} from '@/lib/gear';
import { 
  Gear, 
  GearStats, 
  MaintenanceAlert, 
  GearStatus, 
  GearType
} from '@/lib/types/gear';
import { formatDistance } from '@/lib/gear';

interface GearTrackerProps {
  activities?: any[]; // Activities from Strava to calculate distances
}

export const GearTracker = ({ activities = [] }: GearTrackerProps) => {
  const [gear, setGear] = useState<Gear[]>([]);
  const [alerts, setAlerts] = useState<MaintenanceAlert[]>([]);
  const [stats, setStats] = useState<GearStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedGear, setSelectedGear] = useState<Gear | null>(null);
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
  const [showRetired, setShowRetired] = useState(false);
  const [filterType, setFilterType] = useState<GearType | 'all'>('all');
  
  // Maintenance form state
  const [maintenanceForm, setMaintenanceForm] = useState({
    type: 'maintenance' as const,
    description: '',
    cost: '',
    resetDistance: false,
    notes: ''
  });

  // Load gear data on component mount
  useEffect(() => {
    loadGearData();
  }, []);

  // Update distances when activities change
  useEffect(() => {
    if (activities.length > 0) {
      updateAllGearDistances();
    }
  }, [activities]);

  const loadGearData = useCallback(() => {
    try {
      const allGear = getAllGear();
      setGear(allGear);
      
      const maintenanceAlerts = getMaintenanceAlerts(allGear);
      setAlerts(maintenanceAlerts);
      
      const gearStats = getGearStats(allGear);
      setStats(gearStats);
    } catch (error) {
      console.error('Error loading gear data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateAllGearDistances = useCallback(() => {
    if (activities.length === 0) return;
    
    const allGear = getAllGear();
    let hasUpdates = false;
    
    allGear.forEach(gearItem => {
      if (gearItem.stravaId) {
        const updated = updateGearDistance(gearItem.id, activities);
        if (updated) {
          hasUpdates = true;
        }
      }
    });
    
    if (hasUpdates) {
      loadGearData();
    }
  }, [activities, loadGearData]);

  const handleSyncWithStrava = async () => {
    setIsSyncing(true);
    try {
      const response = await fetch('/api/strava/gear');
      if (!response.ok) {
        throw new Error('Failed to fetch Strava gear');
      }
      
      const { gear: stravaGear } = await response.json();
      if (stravaGear && stravaGear.length > 0) {
        const syncedGear = syncWithStravaGear(stravaGear);
        console.log('Synced gear:', syncedGear);
        loadGearData();
      }
    } catch (error) {
      console.error('Error syncing with Strava:', error);
      // Could add a toast notification here
    } finally {
      setIsSyncing(false);
    }
  };

  const handleGearAdded = () => {
    loadGearData();
  };

  const handleGearUpdated = () => {
    loadGearData();
  };

  const handleGearDeleted = (gearId: string) => {
    if (confirm('Are you sure you want to delete this gear? This action cannot be undone.')) {
      const success = deleteGear(gearId);
      if (success) {
        loadGearData();
      }
    }
  };

  const handleAddMaintenance = (gearItem: Gear) => {
    setSelectedGear(gearItem);
    setMaintenanceForm({
      type: 'maintenance',
      description: '',
      cost: '',
      resetDistance: false,
      notes: ''
    });
    setIsMaintenanceModalOpen(true);
  };

  const handleMaintenanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGear) return;

    try {
      const maintenanceData = {
        type: maintenanceForm.type,
        description: maintenanceForm.description,
        cost: maintenanceForm.cost ? parseFloat(maintenanceForm.cost) : undefined,
        resetDistance: maintenanceForm.resetDistance,
        notes: maintenanceForm.notes || undefined
      };

      const updated = addMaintenanceRecord(selectedGear.id, maintenanceData);
      if (updated) {
        loadGearData();
        setIsMaintenanceModalOpen(false);
        setSelectedGear(null);
      }
    } catch (error) {
      console.error('Failed to add maintenance record:', error);
    }
  };

  const handleTakeAction = (alert: MaintenanceAlert) => {
    const gearItem = gear.find(g => g.id === alert.gearId);
    if (gearItem) {
      handleAddMaintenance(gearItem);
    }
  };

  // Filter gear based on status and type
  const filteredGear = gear.filter(gearItem => {
    if (!showRetired && gearItem.status === GearStatus.RETIRED) {
      return false;
    }
    
    if (filterType !== 'all' && gearItem.type !== filterType) {
      return false;
    }
    
    return true;
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-48">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-gray-400" />
            <p className="text-gray-600">Loading gear...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats and Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Package className="h-5 w-5" />
              <span>Gear Tracker</span>
            </CardTitle>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSyncWithStrava}
                disabled={isSyncing}
              >
                <RotateCcw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? 'Syncing...' : 'Sync with Strava'}
              </Button>
              
              <AddGearModal onGearAdded={handleGearAdded} />
            </div>
          </div>
        </CardHeader>

        {stats && (
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.totalGearItems}</div>
                <div className="text-sm text-gray-600">Total Gear</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.activeGear}</div>
                <div className="text-sm text-gray-600">Active</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{stats.pendingMaintenanceAlerts}</div>
                <div className="text-sm text-gray-600">Need Attention</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {formatDistance(stats.totalDistanceCovered)}
                </div>
                <div className="text-sm text-gray-600">Total Distance</div>
              </div>
            </div>
            
            {stats.totalMaintenanceCost > 0 && (
              <div className="text-center text-sm text-gray-600 border-t pt-2">
                Total Maintenance Cost: <span className="font-medium">${stats.totalMaintenanceCost.toFixed(2)}</span>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Maintenance Alerts */}
      {alerts.length > 0 && (
        <MaintenanceAlertsList
          alerts={alerts}
          onTakeAction={handleTakeAction}
          maxDisplayed={3}
        />
      )}

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium">Filters:</span>
              </div>
              
              <Select value={filterType} onValueChange={(value: GearType | 'all') => setFilterType(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value={GearType.RUNNING_SHOES}>Running Shoes</SelectItem>
                  <SelectItem value={GearType.TRAIL_SHOES}>Trail Shoes</SelectItem>
                  <SelectItem value={GearType.ROAD_BIKE}>Road Bike</SelectItem>
                  <SelectItem value={GearType.MOUNTAIN_BIKE}>Mountain Bike</SelectItem>
                  <SelectItem value={GearType.GRAVEL_BIKE}>Gravel Bike</SelectItem>
                  <SelectItem value={GearType.BIKE_CHAIN}>Bike Chain</SelectItem>
                  <SelectItem value={GearType.BIKE_CASSETTE}>Bike Cassette</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowRetired(!showRetired)}
            >
              {showRetired ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
              {showRetired ? 'Hide' : 'Show'} Retired
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Gear Grid */}
      {filteredGear.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredGear.map((gearItem) => (
            <GearCard
              key={gearItem.id}
              gear={gearItem}
              onUpdate={handleGearUpdated}
              onDelete={handleGearDeleted}
              onAddMaintenance={handleAddMaintenance}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Gear Found</h3>
            <p className="text-gray-600 mb-4">
              {gear.length === 0 
                ? "Get started by adding your first piece of gear or syncing with Strava."
                : "No gear matches your current filters."
              }
            </p>
            <div className="space-x-2">
              <AddGearModal trigger={
                <Button>Add Your First Gear</Button>
              } onGearAdded={handleGearAdded} />
              <Button variant="outline" onClick={handleSyncWithStrava}>
                Sync with Strava
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Maintenance Modal */}
      <Dialog open={isMaintenanceModalOpen} onOpenChange={setIsMaintenanceModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Maintenance Record</DialogTitle>
            {selectedGear && (
              <p className="text-sm text-gray-600">{selectedGear.name}</p>
            )}
          </DialogHeader>
          
          <form onSubmit={handleMaintenanceSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Type</label>
              <Select 
                value={maintenanceForm.type} 
                onValueChange={(value: 'maintenance' | 'replacement' | 'repair') => 
                  setMaintenanceForm(prev => ({ ...prev, type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="replacement">Replacement</SelectItem>
                  <SelectItem value="repair">Repair</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Description *</label>
              <Input
                placeholder="e.g., Chain replacement, tire change"
                value={maintenanceForm.description}
                onChange={(e) => setMaintenanceForm(prev => ({ ...prev, description: e.target.value }))}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Cost ($)</label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={maintenanceForm.cost}
                onChange={(e) => setMaintenanceForm(prev => ({ ...prev, cost: e.target.value }))}
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="resetDistance"
                checked={maintenanceForm.resetDistance}
                onChange={(e) => setMaintenanceForm(prev => ({ ...prev, resetDistance: e.target.checked }))}
              />
              <label htmlFor="resetDistance" className="text-sm">
                Reset distance counter (for replacements)
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Notes</label>
              <Input
                placeholder="Additional notes..."
                value={maintenanceForm.notes}
                onChange={(e) => setMaintenanceForm(prev => ({ ...prev, notes: e.target.value }))}
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsMaintenanceModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                Add Record
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};