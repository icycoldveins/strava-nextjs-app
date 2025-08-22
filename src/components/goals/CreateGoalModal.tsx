"use client";

import { useState, useEffect } from "react";
import { Goal, GoalType, GoalPeriod } from "@/lib/types/goals";
import { createGoal, updateGoal, formatGoalValue } from "@/lib/goals";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Target, MapPin, Calendar, TrendingUp, X } from "lucide-react";

interface CreateGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoalCreated: () => void;
  editingGoal?: Goal | null;
  measurementPref: 'metric' | 'imperial';
}

const ACTIVITY_TYPES = [
  'Run', 'Ride', 'Swim', 'Hike', 'Walk', 'Workout', 'CrossTrain',
  'EBikeRide', 'VirtualRide', 'VirtualRun', 'Ski', 'Snowboard',
  'Kayaking', 'Canoeing', 'Rowing', 'StandUpPaddling', 'Surfing'
];

const GOAL_TYPES: { value: GoalType; label: string; icon: JSX.Element; description: string }[] = [
  {
    value: 'distance',
    label: 'Distance',
    icon: <MapPin className="h-4 w-4" />,
    description: 'Track total distance covered'
  },
  {
    value: 'time',
    label: 'Time',
    icon: <Calendar className="h-4 w-4" />,
    description: 'Track total activity time'
  },
  {
    value: 'elevation',
    label: 'Elevation',
    icon: <TrendingUp className="h-4 w-4" />,
    description: 'Track total elevation gain'
  }
];

const GOAL_PERIODS: { value: GoalPeriod; label: string; description: string }[] = [
  { value: 'weekly', label: 'Weekly', description: 'Current week (Monday-Sunday)' },
  { value: 'monthly', label: 'Monthly', description: 'Current month' },
  { value: 'yearly', label: 'Yearly', description: 'Current year' },
  { value: 'custom', label: 'Custom', description: 'Choose custom date range' }
];

export function CreateGoalModal({ 
  isOpen, 
  onClose, 
  onGoalCreated, 
  editingGoal,
  measurementPref 
}: CreateGoalModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    type: 'distance' as GoalType,
    target: '',
    period: 'weekly' as GoalPeriod,
    activityTypes: [] as string[],
    customStartDate: '',
    customEndDate: ''
  });
  
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when modal opens/closes or editing goal changes
  useEffect(() => {
    if (isOpen) {
      if (editingGoal) {
        setFormData({
          name: editingGoal.name,
          type: editingGoal.type,
          target: editingGoal.target.toString(),
          period: editingGoal.period,
          activityTypes: editingGoal.activityTypes || [],
          customStartDate: editingGoal.period === 'custom' ? editingGoal.startDate : '',
          customEndDate: editingGoal.period === 'custom' ? editingGoal.endDate : ''
        });
      } else {
        setFormData({
          name: '',
          type: 'distance',
          target: '',
          period: 'weekly',
          activityTypes: [],
          customStartDate: '',
          customEndDate: ''
        });
      }
      setErrors({});
    }
  }, [isOpen, editingGoal]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Goal name is required';
    }

    const targetValue = parseFloat(formData.target);
    if (!formData.target || isNaN(targetValue) || targetValue <= 0) {
      newErrors.target = 'Target must be a positive number';
    }

    if (formData.period === 'custom') {
      if (!formData.customStartDate) {
        newErrors.customStartDate = 'Start date is required for custom period';
      }
      if (!formData.customEndDate) {
        newErrors.customEndDate = 'End date is required for custom period';
      }
      if (formData.customStartDate && formData.customEndDate && 
          new Date(formData.customStartDate) >= new Date(formData.customEndDate)) {
        newErrors.customEndDate = 'End date must be after start date';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      const targetValue = convertTargetValue(parseFloat(formData.target), formData.type, measurementPref);
      
      const goalData = {
        name: formData.name.trim(),
        type: formData.type,
        target: targetValue,
        period: formData.period,
        activityTypes: formData.activityTypes.length > 0 ? formData.activityTypes : undefined,
        customStartDate: formData.period === 'custom' ? formData.customStartDate : undefined,
        customEndDate: formData.period === 'custom' ? formData.customEndDate : undefined,
      };

      if (editingGoal) {
        updateGoal(editingGoal.id, goalData);
      } else {
        createGoal(goalData);
      }
      
      onGoalCreated();
      onClose();
    } catch (error) {
      console.error('Error saving goal:', error);
      setErrors({ submit: 'Failed to save goal. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Convert target value from display units to internal units (meters/seconds)
  const convertTargetValue = (value: number, type: GoalType, unit: 'metric' | 'imperial'): number => {
    switch (type) {
      case 'distance':
        return unit === 'imperial' ? value * 1609.34 : value * 1000; // miles to meters or km to meters
      case 'time':
        return value * 3600; // hours to seconds
      case 'elevation':
        return unit === 'imperial' ? value * 0.3048 : value; // feet to meters or meters
      default:
        return value;
    }
  };

  const getTargetInputLabel = (type: GoalType) => {
    switch (type) {
      case 'distance':
        return measurementPref === 'imperial' ? 'Target (miles)' : 'Target (km)';
      case 'time':
        return 'Target (hours)';
      case 'elevation':
        return measurementPref === 'imperial' ? 'Target (feet)' : 'Target (meters)';
      default:
        return 'Target';
    }
  };

  const toggleActivityType = (activityType: string) => {
    setFormData(prev => ({
      ...prev,
      activityTypes: prev.activityTypes.includes(activityType)
        ? prev.activityTypes.filter(t => t !== activityType)
        : [...prev.activityTypes, activityType]
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5 text-orange-500" />
            <span>{editingGoal ? 'Edit Goal' : 'Create New Goal'}</span>
          </DialogTitle>
          <DialogDescription>
            {editingGoal 
              ? 'Update your fitness goal details below.'
              : 'Set up a new fitness goal to track your progress.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Goal Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Goal Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="e.g., Monthly Running Distance"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
          </div>

          {/* Goal Type */}
          <div className="space-y-2">
            <Label>Goal Type</Label>
            <Select 
              value={formData.type} 
              onValueChange={(value: GoalType) => setFormData(prev => ({ ...prev, type: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select goal type" />
              </SelectTrigger>
              <SelectContent>
                {GOAL_TYPES.map((goalType) => (
                  <SelectItem key={goalType.value} value={goalType.value}>
                    <div className="flex items-center space-x-2">
                      {goalType.icon}
                      <div>
                        <div className="font-medium">{goalType.label}</div>
                        <div className="text-xs text-muted-foreground">{goalType.description}</div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Target Value */}
          <div className="space-y-2">
            <Label htmlFor="target">{getTargetInputLabel(formData.type)}</Label>
            <Input
              id="target"
              type="number"
              step="0.1"
              min="0"
              placeholder="Enter target value"
              value={formData.target}
              onChange={(e) => setFormData(prev => ({ ...prev, target: e.target.value }))}
              className={errors.target ? 'border-red-500' : ''}
            />
            {errors.target && <p className="text-sm text-red-500">{errors.target}</p>}
          </div>

          {/* Goal Period */}
          <div className="space-y-2">
            <Label>Time Period</Label>
            <Select 
              value={formData.period} 
              onValueChange={(value: GoalPeriod) => setFormData(prev => ({ ...prev, period: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select time period" />
              </SelectTrigger>
              <SelectContent>
                {GOAL_PERIODS.map((period) => (
                  <SelectItem key={period.value} value={period.value}>
                    <div>
                      <div className="font-medium">{period.label}</div>
                      <div className="text-xs text-muted-foreground">{period.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Custom Date Range */}
          {formData.period === 'custom' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customStartDate">Start Date</Label>
                <Input
                  id="customStartDate"
                  type="date"
                  value={formData.customStartDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, customStartDate: e.target.value }))}
                  className={errors.customStartDate ? 'border-red-500' : ''}
                />
                {errors.customStartDate && <p className="text-sm text-red-500">{errors.customStartDate}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="customEndDate">End Date</Label>
                <Input
                  id="customEndDate"
                  type="date"
                  value={formData.customEndDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, customEndDate: e.target.value }))}
                  className={errors.customEndDate ? 'border-red-500' : ''}
                />
                {errors.customEndDate && <p className="text-sm text-red-500">{errors.customEndDate}</p>}
              </div>
            </div>
          )}

          {/* Activity Types Filter */}
          <div className="space-y-2">
            <Label>Activity Types (Optional)</Label>
            <p className="text-sm text-muted-foreground mb-3">
              Select specific activity types to include in this goal, or leave empty to include all activities.
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-32 overflow-y-auto border rounded-lg p-3 bg-gray-50 dark:bg-gray-800/50">
              {ACTIVITY_TYPES.map((activityType) => (
                <button
                  key={activityType}
                  type="button"
                  onClick={() => toggleActivityType(activityType)}
                  className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                    formData.activityTypes.includes(activityType)
                      ? 'bg-orange-500 text-white border-orange-500'
                      : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-orange-50 dark:hover:bg-orange-900/20'
                  }`}
                >
                  {activityType}
                </button>
              ))}
            </div>
            {formData.activityTypes.length > 0 && (
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{formData.activityTypes.length} activity type(s) selected</span>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, activityTypes: [] }))}
                  className="text-orange-500 hover:text-orange-600 flex items-center space-x-1"
                >
                  <X className="h-3 w-3" />
                  <span>Clear all</span>
                </button>
              </div>
            )}
          </div>

          {errors.submit && (
            <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
              {errors.submit}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
            >
              {isSubmitting ? 'Saving...' : editingGoal ? 'Update Goal' : 'Create Goal'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

