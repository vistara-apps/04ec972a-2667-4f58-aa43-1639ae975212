'use client';

import { Alert } from '@/lib/types';
import { ALERT_TYPES } from '@/lib/constants';
import { Bell, TrendingUp, Volume2, DollarSign, X } from 'lucide-react';

interface AlertNotificationProps {
  alert: Alert;
  onDismiss?: () => void;
}

const alertIcons = {
  price_above: DollarSign,
  price_below: DollarSign,
  volume_spike: Volume2,
  trend_alert: TrendingUp,
};

const alertColors = {
  price_above: 'text-green-400',
  price_below: 'text-red-400',
  volume_spike: 'text-yellow-400',
  trend_alert: 'text-purple-400',
};

export function AlertNotification({ alert, onDismiss }: AlertNotificationProps) {
  const Icon = alertIcons[alert.type];
  const colorClass = alertColors[alert.type];
  const isActive = alert.status === 'active';
  const isTriggered = alert.status === 'triggered';

  return (
    <div className={`asset-row ${isTriggered ? 'border-l-4 border-yellow-400' : ''}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className={`w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center ${colorClass}`}>
            <Icon size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-white">{alert.assetId.toUpperCase()}</h3>
            <p className="text-sm text-gray-400">{ALERT_TYPES[alert.type]}</p>
            <p className="text-xs text-gray-500">
              Target: ${alert.value.toFixed(2)}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="text-right">
            <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              isActive ? 'bg-green-900 text-green-400' :
              isTriggered ? 'bg-yellow-900 text-yellow-400' :
              'bg-gray-900 text-gray-400'
            }`}>
              {alert.status}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {new Date(alert.createdAt).toLocaleDateString()}
            </p>
          </div>

          {onDismiss && (
            <button
              onClick={onDismiss}
              className="p-1 hover:bg-white hover:bg-opacity-10 rounded-full transition-colors duration-200"
            >
              <X size={16} className="text-gray-400" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
