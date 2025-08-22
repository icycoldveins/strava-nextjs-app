'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { AlertTriangle, Settings, Trash2, RotateCcw, Plus } from 'lucide-react';
import { Gear, GearStatus, GearType } from '@/lib/types/gear';
import { 
  formatDistance, 
  retireGear,
  addMaintenanceRecord 
} from '@/lib/gear';

interface GearCardProps {
  gear: Gear;
  onUpdate: (updatedGear: Gear) => void;
  onDelete: (gearId: string) => void;
  onAddMaintenance: (gear: Gear) => void;
}

export const GearCard = ({ gear, onUpdate, onDelete, onAddMaintenance }: GearCardProps) => {
  const [isRetiring, setIsRetiring] = useState(false);

  const getStatusIcon = (status: GearStatus) => {
    switch (status) {
      case GearStatus.NEEDS_MAINTENANCE:
      case GearStatus.OVERDUE:
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case GearStatus.RETIRED:
        return <RotateCcw className="h-4 w-4 text-gray-500" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: GearStatus) => {
    switch (status) {
      case GearStatus.ACTIVE:
        return 'Active';
      case GearStatus.NEEDS_MAINTENANCE:
        return 'Needs Maintenance';
      case GearStatus.OVERDUE:
        return 'Overdue';
      case GearStatus.RETIRED:
        return 'Retired';
      default:
        return 'Unknown';
    }
  };

  const getProgressColor = (percentage: number, status: GearStatus) => {
    if (status === GearStatus.RETIRED) return 'bg-gray-400';
    
    if (percentage >= 100) return 'bg-red-500';
    if (percentage >= 80) return 'bg-orange-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getGearTypeIcon = (type: GearType) => {
    const iconClass = "h-5 w-5 text-gray-600";
    
    switch (type) {
      case GearType.RUNNING_SHOES:
      case GearType.TRAIL_SHOES:
        return <span className={iconClass}>👟</span>;
      case GearType.ROAD_BIKE:
      case GearType.MOUNTAIN_BIKE:
      case GearType.GRAVEL_BIKE:
        return <span className={iconClass}>🚴</span>;
      case GearType.BIKE_CHAIN:
        return <span className={iconClass}>🔗</span>;
      case GearType.BIKE_CASSETTE:
        return <span className={iconClass}>⚙️</span>;
      case GearType.BIKE_TIRES:
        return <span className={iconClass}>🛞</span>;
      default:
        return <span className={iconClass}>🛠️</span>;
    }
  };

  const handleRetire = async () => {
    setIsRetiring(true);
    try {
      const retired = retireGear(gear.id, `Retired with ${formatDistance(gear.totalDistance)}`);
      if (retired) {
        onUpdate(retired);
      }
    } catch (error) {
      console.error('Failed to retire gear:', error);
    } finally {
      setIsRetiring(false);
    }
  };

  const handleQuickMaintenance = async () => {
    try {
      const updated = addMaintenanceRecord(gear.id, {
        type: 'maintenance',
        description: 'General maintenance',
        resetDistance: false,
        notes: 'Quick maintenance logged from gear card'
      });
      if (updated) {
        onUpdate(updated);
      }
    } catch (error) {
      console.error('Failed to add maintenance record:', error);
    }
  };

  const usagePercentage = Math.min(
    Math.round((gear.totalDistance / gear.distanceThreshold) * 100),
    100
  );

  const remainingDistance = Math.max(gear.distanceThreshold - gear.totalDistance, 0);

  return (
    <Card className={`transition-all hover:shadow-md ${
      gear.status === GearStatus.OVERDUE ? 'ring-2 ring-orange-200' :
      gear.status === GearStatus.NEEDS_MAINTENANCE ? 'ring-2 ring-yellow-200' :
      gear.status === GearStatus.RETIRED ? 'opacity-75' : ''
    }`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            {getGearTypeIcon(gear.type)}
            <div>
              <CardTitle className="text-lg font-semibold">{gear.name}</CardTitle>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                {gear.brand && <span>{gear.brand}</span>}
                {gear.model && <span>• {gear.model}</span>}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {getStatusIcon(gear.status)}
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              gear.status === GearStatus.ACTIVE ? 'bg-green-100 text-green-800' :
              gear.status === GearStatus.NEEDS_MAINTENANCE ? 'bg-yellow-100 text-yellow-800' :
              gear.status === GearStatus.OVERDUE ? 'bg-orange-100 text-orange-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {getStatusText(gear.status)}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Distance Progress */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="font-medium">Distance Usage</span>
            <span className="text-gray-600">
              {formatDistance(gear.totalDistance)} / {formatDistance(gear.distanceThreshold)}
            </span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div 
              className={`h-full transition-all duration-300 ${getProgressColor(usagePercentage, gear.status)}`}
              style={{ width: `${Math.min(usagePercentage, 100)}%` }}
            />
          </div>
          
          <div className="flex justify-between text-xs text-gray-600">
            <span>{usagePercentage}% used</span>
            {gear.status !== GearStatus.RETIRED && remainingDistance > 0 && (
              <span>{formatDistance(remainingDistance)} remaining</span>
            )}
          </div>
        </div>

        {/* Maintenance Recommendations */}
        {gear.status === GearStatus.NEEDS_MAINTENANCE && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-yellow-800">Maintenance Recommended</p>
                <p className="text-yellow-700">Consider scheduling maintenance soon.</p>
              </div>
            </div>
          </div>
        )}

        {gear.status === GearStatus.OVERDUE && (
          <div className="bg-orange-50 border border-orange-200 rounded-md p-3">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-orange-800">Maintenance Overdue</p>
                <p className="text-orange-700">This gear has exceeded its recommended usage threshold.</p>
              </div>
            </div>
          </div>
        )}

        {/* Purchase Information */}
        {(gear.purchaseDate || gear.purchasePrice) && (
          <div className="text-sm text-gray-600 border-t pt-3">
            {gear.purchaseDate && (
              <div className="flex justify-between">
                <span>Purchased:</span>
                <span>{new Date(gear.purchaseDate).toLocaleDateString()}</span>
              </div>
            )}
            {gear.purchasePrice && (
              <div className="flex justify-between">
                <span>Cost:</span>
                <span>${gear.purchasePrice}</span>
              </div>
            )}
          </div>
        )}

        {/* Maintenance Log Preview */}
        {gear.maintenanceLog.length > 0 && (
          <div className="text-sm border-t pt-3">
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium">Last Maintenance</span>
              <span className="text-gray-600">{gear.maintenanceLog.length} record(s)</span>
            </div>
            <div className="text-gray-600">
              {gear.maintenanceLog[gear.maintenanceLog.length - 1].description}
              <br />
              <span className="text-xs">
                {new Date(gear.maintenanceLog[gear.maintenanceLog.length - 1].date).toLocaleDateString()}
              </span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {gear.status !== GearStatus.RETIRED && (
          <div className="flex space-x-2 pt-3 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAddMaintenance(gear)}
              className="flex-1"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Maintenance
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleQuickMaintenance}
              className="flex-1"
            >
              <Settings className="h-4 w-4 mr-1" />
              Quick Log
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleRetire}
              disabled={isRetiring}
              className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Retire
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(gear.id)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}

        {gear.status === GearStatus.RETIRED && gear.retiredDate && (
          <div className="text-sm text-gray-600 border-t pt-3 text-center">
            Retired on {new Date(gear.retiredDate).toLocaleDateString()}
            {gear.retiredDistance && (
              <span className="block">Total Distance: {formatDistance(gear.retiredDistance)}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};