'use client';

import { AlertTriangle, Clock, Wrench, XCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { MaintenanceAlert as MaintenanceAlertType, MaintenanceAlertLevel } from '@/lib/types/gear';
import { formatDistance } from '@/lib/gear';

interface MaintenanceAlertProps {
  alert: MaintenanceAlertType;
  onDismiss?: (alertId: string) => void;
  onTakeAction?: (alert: MaintenanceAlertType) => void;
  className?: string;
}

export const MaintenanceAlert = ({ 
  alert, 
  onDismiss, 
  onTakeAction, 
  className = '' 
}: MaintenanceAlertProps) => {
  const getAlertConfig = (level: MaintenanceAlertLevel) => {
    switch (level) {
      case MaintenanceAlertLevel.INFO:
        return {
          icon: Clock,
          colorClass: 'border-blue-200 bg-blue-50',
          iconColorClass: 'text-blue-600',
          titleColorClass: 'text-blue-800',
          textColorClass: 'text-blue-700',
          buttonColorClass: 'text-blue-600 hover:text-blue-700 hover:bg-blue-100',
          urgencyText: 'Info'
        };
      case MaintenanceAlertLevel.WARNING:
        return {
          icon: AlertTriangle,
          colorClass: 'border-yellow-200 bg-yellow-50',
          iconColorClass: 'text-yellow-600',
          titleColorClass: 'text-yellow-800',
          textColorClass: 'text-yellow-700',
          buttonColorClass: 'text-yellow-600 hover:text-yellow-700 hover:bg-yellow-100',
          urgencyText: 'Warning'
        };
      case MaintenanceAlertLevel.URGENT:
        return {
          icon: AlertTriangle,
          colorClass: 'border-orange-200 bg-orange-50',
          iconColorClass: 'text-orange-600',
          titleColorClass: 'text-orange-800',
          textColorClass: 'text-orange-700',
          buttonColorClass: 'text-orange-600 hover:text-orange-700 hover:bg-orange-100',
          urgencyText: 'Urgent'
        };
      case MaintenanceAlertLevel.CRITICAL:
        return {
          icon: XCircle,
          colorClass: 'border-red-200 bg-red-50',
          iconColorClass: 'text-red-600',
          titleColorClass: 'text-red-800',
          textColorClass: 'text-red-700',
          buttonColorClass: 'text-red-600 hover:text-red-700 hover:bg-red-100',
          urgencyText: 'Critical'
        };
      default:
        return {
          icon: AlertTriangle,
          colorClass: 'border-gray-200 bg-gray-50',
          iconColorClass: 'text-gray-600',
          titleColorClass: 'text-gray-800',
          textColorClass: 'text-gray-700',
          buttonColorClass: 'text-gray-600 hover:text-gray-700 hover:bg-gray-100',
          urgencyText: 'Unknown'
        };
    }
  };

  const config = getAlertConfig(alert.level);
  const IconComponent = config.icon;

  return (
    <div className={`rounded-lg border p-4 ${config.colorClass} ${className}`}>
      <div className="flex items-start space-x-3">
        <IconComponent className={`h-5 w-5 mt-0.5 flex-shrink-0 ${config.iconColorClass}`} />
        
        <div className="flex-1 min-w-0">
          {/* Alert Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className={`font-semibold ${config.titleColorClass}`}>
                  {alert.gearName}
                </h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.colorClass.replace('bg-', 'bg-').replace('-50', '-100')} ${config.titleColorClass}`}>
                  {config.urgencyText}
                </span>
              </div>
              
              <p className={`text-sm ${config.textColorClass} mb-2`}>
                {alert.message}
              </p>
            </div>

            {onDismiss && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDismiss(alert.gearId)}
                className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
              >
                ×
              </Button>
            )}
          </div>

          {/* Alert Details */}
          <div className={`text-sm ${config.textColorClass} space-y-1`}>
            <div className="flex justify-between items-center">
              <span>Current Distance:</span>
              <span className="font-medium">{formatDistance(alert.currentDistance)}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span>Threshold:</span>
              <span className="font-medium">{formatDistance(alert.threshold)}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span>Usage:</span>
              <span className="font-medium">{alert.percentageUsed}%</span>
            </div>

            {alert.daysOverdue && alert.daysOverdue > 0 && (
              <div className="flex justify-between items-center">
                <span>Days Overdue:</span>
                <span className="font-medium text-red-600">{alert.daysOverdue}</span>
              </div>
            )}
          </div>

          {/* Progress Bar */}
          <div className="mt-3 w-full bg-white bg-opacity-50 rounded-full h-2 overflow-hidden">
            <div 
              className={`h-full transition-all duration-300 ${
                alert.level === MaintenanceAlertLevel.CRITICAL ? 'bg-red-500' :
                alert.level === MaintenanceAlertLevel.URGENT ? 'bg-orange-500' :
                alert.level === MaintenanceAlertLevel.WARNING ? 'bg-yellow-500' :
                'bg-blue-500'
              }`}
              style={{ width: `${Math.min(alert.percentageUsed, 100)}%` }}
            />
          </div>

          {/* Recommended Action */}
          <div className={`mt-3 text-sm ${config.textColorClass}`}>
            <p className="font-medium mb-1">Recommended Action:</p>
            <p className="italic">{alert.recommendedAction}</p>
          </div>

          {/* Action Button */}
          {onTakeAction && (
            <div className="mt-4 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onTakeAction(alert)}
                className={`${config.buttonColorClass} border-current`}
              >
                <Wrench className="h-4 w-4 mr-2" />
                Take Action
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Component for displaying multiple alerts
interface MaintenanceAlertsListProps {
  alerts: MaintenanceAlertType[];
  onDismiss?: (alertId: string) => void;
  onTakeAction?: (alert: MaintenanceAlertType) => void;
  maxDisplayed?: number;
  className?: string;
}

export const MaintenanceAlertsList = ({ 
  alerts, 
  onDismiss, 
  onTakeAction, 
  maxDisplayed,
  className = '' 
}: MaintenanceAlertsListProps) => {
  if (alerts.length === 0) {
    return null;
  }

  const displayedAlerts = maxDisplayed ? alerts.slice(0, maxDisplayed) : alerts;
  const remainingCount = maxDisplayed && alerts.length > maxDisplayed 
    ? alerts.length - maxDisplayed 
    : 0;

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Maintenance Alerts
        </h3>
        {alerts.length > 0 && (
          <span className="text-sm text-gray-600">
            {alerts.length} alert{alerts.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      <div className="space-y-3">
        {displayedAlerts.map((alert) => (
          <MaintenanceAlert
            key={alert.gearId}
            alert={alert}
            onDismiss={onDismiss}
            onTakeAction={onTakeAction}
          />
        ))}
      </div>

      {remainingCount > 0 && (
        <div className="text-center">
          <p className="text-sm text-gray-600">
            ... and {remainingCount} more alert{remainingCount !== 1 ? 's' : ''}
          </p>
        </div>
      )}
    </div>
  );
};