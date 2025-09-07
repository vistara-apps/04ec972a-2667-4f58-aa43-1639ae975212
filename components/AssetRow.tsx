'use client';

import { formatCurrency, formatPercentage, getPercentageColor } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';

interface AssetRowProps {
  asset: {
    symbol: string;
    name: string;
    currentValue: number;
    profitLoss: number;
    profitLossPercentage: number;
    image?: string;
    quantity?: number;
    currentPrice?: number;
  };
  variant?: 'default' | 'watchlist' | 'performance';
  onClick?: () => void;
}

export function AssetRow({ asset, variant = 'default', onClick }: AssetRowProps) {
  const percentageColor = getPercentageColor(asset.profitLossPercentage);

  return (
    <div className="asset-row" onClick={onClick}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-lg">
            {asset.image || asset.symbol.charAt(0)}
          </div>
          <div>
            <h3 className="font-semibold text-white">{asset.symbol}</h3>
            <p className="text-sm text-gray-400">{asset.name}</p>
            {variant === 'performance' && asset.quantity && (
              <p className="text-xs text-gray-500">{asset.quantity} tokens</p>
            )}
          </div>
        </div>

        <div className="text-right">
          <p className="font-semibold text-white">
            {formatCurrency(asset.currentValue)}
          </p>
          <div className="flex items-center space-x-2">
            <span className={`text-sm font-medium ${percentageColor}`}>
              {formatPercentage(asset.profitLossPercentage)}
            </span>
            <span className={`text-xs ${percentageColor}`}>
              {formatCurrency(asset.profitLoss)}
            </span>
          </div>
          {variant === 'performance' && asset.currentPrice && (
            <p className="text-xs text-gray-500">
              @ {formatCurrency(asset.currentPrice)}
            </p>
          )}
        </div>

        {onClick && (
          <ChevronRight size={16} className="text-gray-400 ml-2" />
        )}
      </div>
    </div>
  );
}
