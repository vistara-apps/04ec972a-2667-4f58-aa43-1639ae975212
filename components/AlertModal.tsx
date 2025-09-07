'use client';

import { useState, useEffect } from 'react';
import { Bell, X, TrendingUp, Volume2, DollarSign } from 'lucide-react';
import { Asset, Alert } from '@/lib/types';
import { storageService } from '@/lib/storage';
import { Card } from './Card';
import { PrimaryButton } from './PrimaryButton';
import { formatCurrency } from '@/lib/utils';

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset?: Asset;
  onAlertCreated?: (alert: Alert) => void;
}

type AlertType = 'price_above' | 'price_below' | 'volume_spike' | 'trend_alert';

const ALERT_TYPES: { value: AlertType; label: string; icon: React.ReactNode; description: string }[] = [
  {
    value: 'price_above',
    label: 'Price Above',
    icon: <TrendingUp size={20} className="text-green-400" />,
    description: 'Alert when price goes above target'
  },
  {
    value: 'price_below',
    label: 'Price Below',
    icon: <TrendingUp size={20} className="text-red-400 rotate-180" />,
    description: 'Alert when price goes below target'
  },
  {
    value: 'volume_spike',
    label: 'Volume Spike',
    icon: <Volume2 size={20} className="text-blue-400" />,
    description: 'Alert on unusual trading volume'
  },
  {
    value: 'trend_alert',
    label: 'Trend Alert',
    icon: <DollarSign size={20} className="text-purple-400" />,
    description: 'Alert on trending activity'
  },
];

export function AlertModal({ isOpen, onClose, asset, onAlertCreated }: AlertModalProps) {
  const [selectedType, setSelectedType] = useState<AlertType>('price_above');
  const [targetValue, setTargetValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && asset) {
      // Set default target value based on current price
      if (selectedType === 'price_above') {
        setTargetValue((asset.currentPrice * 1.1).toFixed(2));
      } else if (selectedType === 'price_below') {
        setTargetValue((asset.currentPrice * 0.9).toFixed(2));
      } else {
        setTargetValue('');
      }
    }
  }, [isOpen, asset, selectedType]);

  useEffect(() => {
    if (isOpen) {
      setError('');
      setLoading(false);
    }
  }, [isOpen]);

  const handleCreateAlert = async () => {
    if (!asset) return;

    setError('');
    setLoading(true);

    try {
      // Validate input
      const value = parseFloat(targetValue);
      if (isNaN(value) || value <= 0) {
        throw new Error('Please enter a valid target value');
      }

      // Additional validation based on alert type
      if (selectedType === 'price_above' && value <= asset.currentPrice) {
        throw new Error('Target price must be above current price');
      }
      if (selectedType === 'price_below' && value >= asset.currentPrice) {
        throw new Error('Target price must be below current price');
      }

      // Create alert
      const newAlert = storageService.addAlert({
        userId: 'current_user', // In a real app, this would be the actual user ID
        assetId: asset.assetId,
        type: selectedType,
        value,
        status: 'active',
      });

      onAlertCreated?.(newAlert);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create alert');
    } finally {
      setLoading(false);
    }
  };

  const getTargetValuePlaceholder = () => {
    switch (selectedType) {
      case 'price_above':
      case 'price_below':
        return 'Enter target price (USD)';
      case 'volume_spike':
        return 'Enter volume threshold (%)';
      case 'trend_alert':
        return 'Enter trend score threshold';
      default:
        return 'Enter target value';
    }
  };

  const getTargetValuePrefix = () => {
    switch (selectedType) {
      case 'price_above':
      case 'price_below':
        return '$';
      case 'volume_spike':
        return '';
      case 'trend_alert':
        return '';
      default:
        return '';
    }
  };

  const getTargetValueSuffix = () => {
    switch (selectedType) {
      case 'volume_spike':
        return '%';
      case 'trend_alert':
        return ' pts';
      default:
        return '';
    }
  };

  if (!isOpen || !asset) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <Card variant="glass" className="w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white border-opacity-10">
          <div className="flex items-center space-x-3">
            <Bell size={24} className="text-purple-400" />
            <h2 className="text-xl font-bold text-white">Create Alert</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white hover:bg-opacity-10 rounded-lg transition-colors duration-200"
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Asset Info */}
          <div className="flex items-center space-x-3 p-4 bg-white bg-opacity-5 rounded-lg">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
              {asset.image ? (
                <img src={asset.image} alt={asset.symbol} className="w-8 h-8 rounded-full" />
              ) : (
                asset.symbol.charAt(0)
              )}
            </div>
            <div>
              <div className="font-bold text-white">{asset.symbol}</div>
              <div className="text-sm text-gray-400">{asset.name}</div>
            </div>
            <div className="ml-auto text-right">
              <div className="font-bold text-white">{formatCurrency(asset.currentPrice)}</div>
              <div className="text-sm text-gray-400">Current Price</div>
            </div>
          </div>

          {/* Alert Type Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-3">
              Alert Type
            </label>
            <div className="grid grid-cols-1 gap-2">
              {ALERT_TYPES.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setSelectedType(type.value)}
                  className={`flex items-center space-x-3 p-3 rounded-lg border transition-all duration-200 ${
                    selectedType === type.value
                      ? 'border-purple-400 bg-purple-500 bg-opacity-20'
                      : 'border-white border-opacity-10 hover:border-opacity-20 hover:bg-white hover:bg-opacity-5'
                  }`}
                >
                  {type.icon}
                  <div className="flex-1 text-left">
                    <div className="font-medium text-white">{type.label}</div>
                    <div className="text-sm text-gray-400">{type.description}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Target Value Input */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-2">
              Target Value
            </label>
            <div className="relative">
              {getTargetValuePrefix() && (
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  {getTargetValuePrefix()}
                </span>
              )}
              <input
                type="number"
                step="0.01"
                placeholder={getTargetValuePlaceholder()}
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                className={`w-full py-3 bg-white bg-opacity-5 border border-white border-opacity-10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:bg-opacity-10 transition-all duration-200 ${
                  getTargetValuePrefix() ? 'pl-8 pr-4' : 'px-4'
                }`}
              />
              {getTargetValueSuffix() && (
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  {getTargetValueSuffix()}
                </span>
              )}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-500 bg-opacity-20 border border-red-500 border-opacity-30 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Alert Preview */}
          {targetValue && !error && (
            <div className="p-4 bg-blue-500 bg-opacity-10 border border-blue-500 border-opacity-20 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Bell size={16} className="text-blue-400" />
                <span className="text-sm font-semibold text-blue-400">Alert Preview</span>
              </div>
              <p className="text-sm text-gray-300">
                You'll be notified when {asset.symbol} {
                  selectedType === 'price_above' ? 'goes above' :
                  selectedType === 'price_below' ? 'goes below' :
                  selectedType === 'volume_spike' ? 'has volume spike of' :
                  'has trend score above'
                } {getTargetValuePrefix()}{targetValue}{getTargetValueSuffix()}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-white border-opacity-10">
          <PrimaryButton variant="secondary" onClick={onClose}>
            Cancel
          </PrimaryButton>
          <PrimaryButton
            onClick={handleCreateAlert}
            disabled={!targetValue || loading}
            className="min-w-[120px]"
          >
            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Creating...</span>
              </div>
            ) : (
              'Create Alert'
            )}
          </PrimaryButton>
        </div>
      </Card>
    </div>
  );
}
