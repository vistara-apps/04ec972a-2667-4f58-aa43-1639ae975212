'use client';

import { formatCurrency, formatPercentage, getPercentageColor } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';

interface AssetRowProps {
  asset: {
    symbol: string;
    name: string;
    currentValue?: number;
    profitLoss?: number;
    profitLossPercentage?: number;
    priceChange24h?: number;
    image?: string;
    quantity?: number;
    currentPrice?: number;
  };
  variant?: 'default' | 'watchlist' | 'performance';
  onClick?: () => void;
}

export function AssetRow({ asset, variant = 'default', onClick }: AssetRowProps) {
  const changeValue = variant === 'watchlist' ? asset.priceChange24h : asset.profitLossPercentage;
  const percentageColor = getPercentageColor(changeValue || 0);

  return (
    <div className="asset-row" onClick={onClick}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {asset.image ? (
            <img src={asset.image} alt={asset.name} className="w-10 h-10 rounded-full" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-lg font-bold text-white">
              {asset.symbol.charAt(0)}
            </div>
          )}
          <div>
            <h3 className="font-semibold text-white">{asset.symbol}</h3>
            <p className="text-sm text-gray-400">{asset.name}</p>
            {variant === 'performance' && asset.quantity && (
              <p className="text-xs text-gray-500">{asset.quantity} tokens</p>
            )}
          </div>
        </div>

        <div className="text-right">
          {variant === 'watchlist' ? (
            <>
              <p className="font-semibold text-white">
                {asset.currentPrice ? formatCurrency(asset.currentPrice) : 'N/A'}
              </p>
              <span className={`text-sm font-medium ${percentageColor}`}>
                {formatPercentage(asset.priceChange24h || 0)}
              </span>
            </>
          ) : (
            <>
              <p className="font-semibold text-white">
                {formatCurrency(asset.currentValue || 0)}
              </p>
              <div className="flex items-center space-x-2">
                <span className={`text-sm font-medium ${percentageColor}`}>
                  {formatPercentage(asset.profitLossPercentage || 0)}
                </span>
                <span className={`text-xs ${percentageColor}`}>
                  {formatCurrency(asset.profitLoss || 0)}
                </span>
              </div>
              {variant === 'performance' && asset.currentPrice && (
                <p className="text-xs text-gray-500">
                  @ {formatCurrency(asset.currentPrice)}
                </p>
              )}
            </>
          )}
        </div>

        {onClick && (
          <ChevronRight size={16} className="text-gray-400 ml-2" />
        )}
      </div>
    </div>
  );
}
