'use client';

import { useState, useEffect } from 'react';
import { X, Bell, TrendingUp, Volume2, DollarSign } from 'lucide-react';
import { Alert } from '@/lib/types';
import { useAlerts, useSearch } from '@/lib/hooks';
import { Card } from './Card';
import { PrimaryButton } from './PrimaryButton';
import { formatCurrency } from '@/lib/utils';

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  editAlert?: Alert | null;
}

const ALERT_TYPES = [
  {
    type: 'price_above' as const,
    label: 'Price Above',
    description: 'Alert when price goes above target',
    icon: TrendingUp,
    color: 'text-green-400',
  },
  {
    type: 'price_below' as const,
    label: 'Price Below',
    description: 'Alert when price goes below target',
    icon: TrendingUp,
    color: 'text-red-400',
  },
  {
    type: 'volume_spike' as const,
    label: 'Volume Spike',
    description: 'Alert on unusual trading volume',
    icon: Volume2,
    color: 'text-blue-400',
  },
  {
    type: 'trend_alert' as const,
    label: 'Trend Alert',
    description: 'Alert on trending activity',
    icon: Bell,
    color: 'text-purple-400',
  },
];

export function AlertModal({ isOpen, onClose, editAlert }: AlertModalProps) {
  const { createAlert, updateAlert } = useAlerts();
  const { query, results, search } = useSearch();
  
  const [formData, setFormData] = useState({
    assetId: '',
    assetSymbol: '',
    type: 'price_above' as Alert['type'],
    value: '',
    userId: 'user1', // This would come from auth context
  });
  
  const [showAssetSearch, setShowAssetSearch] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (editAlert) {
      setFormData({
        assetId: editAlert.assetId,
        assetSymbol: editAlert.assetId.toUpperCase(),
        type: editAlert.type,
        value: editAlert.value.toString(),
        userId: editAlert.userId,
      });
    } else {
      setFormData({
        assetId: '',
        assetSymbol: '',
        type: 'price_above',
        value: '',
        userId: 'user1',
      });
    }
    setErrors({});
  }, [editAlert, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.assetId) {
      newErrors.assetId = 'Please select a token';
    }

    if (!formData.value) {
      newErrors.value = 'Please enter a value';
    } else {
      const numValue = parseFloat(formData.value);
      if (isNaN(numValue) || numValue <= 0) {
        newErrors.value = 'Please enter a valid positive number';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    const alertData = {
      userId: formData.userId,
      assetId: formData.assetId,
      type: formData.type,
      value: parseFloat(formData.value),
      status: 'active' as const,
    };

    if (editAlert) {
      updateAlert(editAlert.alertId, alertData);
    } else {
      createAlert(alertData);
    }

    onClose();
  };

  const handleAssetSelect = (asset: any) => {
    setFormData(prev => ({
      ...prev,
      assetId: asset.assetId,
      assetSymbol: asset.symbol,
    }));
    setShowAssetSearch(false);
    setErrors(prev => ({ ...prev, assetId: '' }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <Card variant="glass" className="w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white border-opacity-10">
          <h2 className="text-xl font-bold text-white">
            {editAlert ? 'Edit Alert' : 'Create Alert'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white hover:bg-opacity-10 rounded-lg transition-colors duration-200"
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Asset Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Token
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search for a token..."
                value={formData.assetSymbol}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, assetSymbol: e.target.value }));
                  search(e.target.value);
                  setShowAssetSearch(true);
                }}
                onFocus={() => setShowAssetSearch(true)}
                className="w-full px-4 py-3 bg-white bg-opacity-5 border border-white border-opacity-10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:bg-opacity-10 transition-all duration-200"
              />
              
              {showAssetSearch && results.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-gray-900 border border-white border-opacity-10 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                  {results.slice(0, 5).map((asset) => (
                    <button
                      key={asset.assetId}
                      type="button"
                      onClick={() => handleAssetSelect(asset)}
                      className="w-full flex items-center space-x-3 p-3 hover:bg-white hover:bg-opacity-5 transition-colors duration-200"
                    >
                      {asset.image ? (
                        <img src={asset.image} alt={asset.name} className="w-6 h-6 rounded-full" />
                      ) : (
                        <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">
                            {asset.symbol.charAt(0)}
                          </span>
                        </div>
                      )}
                      <div className="text-left">
                        <div className="text-white font-medium">{asset.symbol}</div>
                        <div className="text-gray-400 text-sm">{asset.name}</div>
                      </div>
                      <div className="ml-auto text-white text-sm">
                        {formatCurrency(asset.currentPrice)}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {errors.assetId && (
              <p className="mt-1 text-sm text-red-400">{errors.assetId}</p>
            )}
          </div>

          {/* Alert Type */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Alert Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              {ALERT_TYPES.map((alertType) => {
                const Icon = alertType.icon;
                const isSelected = formData.type === alertType.type;
                
                return (
                  <button
                    key={alertType.type}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, type: alertType.type }))}
                    className={`p-3 rounded-lg border transition-all duration-200 ${
                      isSelected
                        ? 'border-purple-400 bg-purple-500 bg-opacity-20'
                        : 'border-white border-opacity-10 bg-white bg-opacity-5 hover:bg-opacity-10'
                    }`}
                  >
                    <Icon size={20} className={`mx-auto mb-2 ${alertType.color}`} />
                    <div className="text-white text-sm font-medium">{alertType.label}</div>
                    <div className="text-gray-400 text-xs mt-1">{alertType.description}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Alert Value */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {formData.type.includes('price') ? 'Target Price' : 'Threshold Value'}
            </label>
            <div className="relative">
              {formData.type.includes('price') && (
                <DollarSign size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              )}
              <input
                type="number"
                step="0.000001"
                placeholder={formData.type.includes('price') ? '0.00' : '100'}
                value={formData.value}
                onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                className={`w-full px-4 py-3 bg-white bg-opacity-5 border border-white border-opacity-10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:bg-opacity-10 transition-all duration-200 ${
                  formData.type.includes('price') ? 'pl-10' : ''
                }`}
              />
            </div>
            {errors.value && (
              <p className="mt-1 text-sm text-red-400">{errors.value}</p>
            )}
            {formData.type.includes('price') && (
              <p className="mt-1 text-xs text-gray-400">
                Current price will be fetched when creating the alert
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-white bg-opacity-5 border border-white border-opacity-10 rounded-lg text-gray-300 hover:bg-opacity-10 transition-all duration-200"
            >
              Cancel
            </button>
            <PrimaryButton type="submit" className="flex-1">
              {editAlert ? 'Update Alert' : 'Create Alert'}
            </PrimaryButton>
          </div>
        </form>
      </Card>
    </div>
  );
}
