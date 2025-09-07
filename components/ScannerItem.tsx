'use client';

import { TrendScan } from '@/lib/types';
import { TREND_TYPES } from '@/lib/constants';
import { TrendingUp, Users, Activity, Zap } from 'lucide-react';

interface ScannerItemProps {
  trend: TrendScan;
  onClick?: () => void;
}

const trendIcons = {
  volume_spike: Zap,
  social_mentions: Users,
  dev_activity: Activity,
  price_momentum: TrendingUp,
};

const trendColors = {
  volume_spike: 'text-yellow-400',
  social_mentions: 'text-blue-400',
  dev_activity: 'text-green-400',
  price_momentum: 'text-purple-400',
};

export function ScannerItem({ trend, onClick }: ScannerItemProps) {
  const Icon = trendIcons[trend.trendType];
  const colorClass = trendColors[trend.trendType];
  const timeAgo = Math.floor((Date.now() - trend.timestamp) / 60000);

  return (
    <div className="asset-row" onClick={onClick}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className={`w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center ${colorClass}`}>
            <Icon size={20} />
          </div>
          <div>
            <h3 className="font-semibold text-white">{trend.tokenSymbol}</h3>
            <p className="text-sm text-gray-400">{TREND_TYPES[trend.trendType]}</p>
            <p className="text-xs text-gray-500">{timeAgo}m ago</p>
          </div>
        </div>

        <div className="text-right">
          <div className="flex items-center space-x-2">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">{trend.score}</span>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-1">Trend Score</p>
          
          {trend.metadata && (
            <div className="mt-2 text-xs text-gray-500">
              {trend.metadata.volumeChange && (
                <span className="text-yellow-400">+{trend.metadata.volumeChange}% vol</span>
              )}
              {trend.metadata.socialScore && (
                <span className="text-blue-400">{trend.metadata.socialScore} mentions</span>
              )}
              {trend.metadata.priceChange && (
                <span className="text-green-400">+{trend.metadata.priceChange}% price</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
