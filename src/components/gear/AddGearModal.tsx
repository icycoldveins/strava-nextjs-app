'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Plus } from 'lucide-react';
import { GearType, DEFAULT_GEAR_THRESHOLDS, Gear } from '@/lib/types/gear';
import { createGear } from '@/lib/gear';

interface AddGearModalProps {
  onGearAdded: (gear: Gear) => void;
  trigger?: React.ReactNode;
}

export const AddGearModal = ({ onGearAdded, trigger }: AddGearModalProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    type: '' as GearType | '',
    brand: '',
    model: '',
    purchaseDate: '',
    purchasePrice: '',
    customThreshold: '',
    notes: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleTypeChange = (type: GearType) => {
    setFormData(prev => ({
      ...prev,
      type,
      // Auto-set custom threshold to default for this type
      customThreshold: prev.customThreshold || (DEFAULT_GEAR_THRESHOLDS[type].distanceThreshold / 1000).toString()
    }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: '' as GearType | '',
      brand: '',
      model: '',
      purchaseDate: '',
      purchasePrice: '',
      customThreshold: '',
      notes: ''
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.type) {
      alert('Please fill in the required fields (Name and Type)');
      return;
    }

    setIsSubmitting(true);

    try {
      const gearData = {
        name: formData.name,
        type: formData.type,
        brand: formData.brand || undefined,
        model: formData.model || undefined,
        purchaseDate: formData.purchaseDate || undefined,
        purchasePrice: formData.purchasePrice ? parseFloat(formData.purchasePrice) : undefined,
        distanceThreshold: formData.customThreshold ? 
          parseFloat(formData.customThreshold) * 1000 : // Convert km to meters
          undefined,
        notes: formData.notes || undefined
      };

      const newGear = createGear(gearData);
      onGearAdded(newGear);
      
      resetForm();
      setIsOpen(false);
      
    } catch (error) {
      console.error('Failed to create gear:', error);
      alert('Failed to create gear. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatGearTypeName = (type: GearType): string => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };

  const getDefaultThreshold = (type: GearType): string => {
    return (DEFAULT_GEAR_THRESHOLDS[type].distanceThreshold / 1000).toString();
  };

  const defaultTrigger = (
    <Button>
      <Plus className="h-4 w-4 mr-2" />
      Add Gear
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Gear</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Required Fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="e.g., Nike Air Zoom Pegasus 40"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Type <span className="text-red-500">*</span>
              </label>
              <Select onValueChange={handleTypeChange} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select gear type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={GearType.RUNNING_SHOES}>
                    {formatGearTypeName(GearType.RUNNING_SHOES)}
                  </SelectItem>
                  <SelectItem value={GearType.TRAIL_SHOES}>
                    {formatGearTypeName(GearType.TRAIL_SHOES)}
                  </SelectItem>
                  <SelectItem value={GearType.ROAD_BIKE}>
                    {formatGearTypeName(GearType.ROAD_BIKE)}
                  </SelectItem>
                  <SelectItem value={GearType.MOUNTAIN_BIKE}>
                    {formatGearTypeName(GearType.MOUNTAIN_BIKE)}
                  </SelectItem>
                  <SelectItem value={GearType.GRAVEL_BIKE}>
                    {formatGearTypeName(GearType.GRAVEL_BIKE)}
                  </SelectItem>
                  <SelectItem value={GearType.BIKE_CHAIN}>
                    {formatGearTypeName(GearType.BIKE_CHAIN)}
                  </SelectItem>
                  <SelectItem value={GearType.BIKE_CASSETTE}>
                    {formatGearTypeName(GearType.BIKE_CASSETTE)}
                  </SelectItem>
                  <SelectItem value={GearType.BIKE_CHAINRING}>
                    {formatGearTypeName(GearType.BIKE_CHAINRING)}
                  </SelectItem>
                  <SelectItem value={GearType.BIKE_TIRES}>
                    {formatGearTypeName(GearType.BIKE_TIRES)}
                  </SelectItem>
                  <SelectItem value={GearType.OTHER}>
                    {formatGearTypeName(GearType.OTHER)}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Optional Details */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Brand</label>
                <Input
                  placeholder="e.g., Nike, Trek"
                  value={formData.brand}
                  onChange={(e) => handleInputChange('brand', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Model</label>
                <Input
                  placeholder="e.g., Air Zoom Pegasus"
                  value={formData.model}
                  onChange={(e) => handleInputChange('model', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Purchase Date</label>
                <Input
                  type="date"
                  value={formData.purchaseDate}
                  onChange={(e) => handleInputChange('purchaseDate', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Purchase Price ($)</label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="120.00"
                  value={formData.purchasePrice}
                  onChange={(e) => handleInputChange('purchasePrice', e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Maintenance Threshold (km)
              </label>
              <Input
                type="number"
                placeholder={formData.type ? getDefaultThreshold(formData.type) : '500'}
                value={formData.customThreshold}
                onChange={(e) => handleInputChange('customThreshold', e.target.value)}
              />
              {formData.type && (
                <p className="text-xs text-gray-600 mt-1">
                  Default for {formatGearTypeName(formData.type)}: {getDefaultThreshold(formData.type)}km
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Notes</label>
              <Input
                placeholder="Additional notes about this gear..."
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Adding...' : 'Add Gear'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};