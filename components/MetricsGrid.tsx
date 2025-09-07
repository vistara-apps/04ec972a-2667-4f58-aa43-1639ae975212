'use client';

import { DashboardMetrics } from '@/lib/types';
import { formatCurrency, formatPercentage, getPercentageColor } from '@/lib/utils';
import { TrendingUp, TrendingDown, Wallet, Target } from 'lucide-react';

interface MetricsGridProps {
  metrics: DashboardMetrics;
}

export function MetricsGrid({ metrics }: MetricsGridProps) {
  const pnlColor = getPercentageColor(metrics.totalPnLPercentage);
  const PnLIcon = metrics.totalPnL >= 0 ? TrendingUp : TrendingDown;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Total Portfolio Value */}
      <div className="metric-card">
        <div className="flex items-center justify-between mb-2">
          <Wallet size={20} className="text-purple-400" />
          <span className="text-xs text-gray-400">Portfolio</span>
        </div>
        <h3 className="text-2xl font-bold text-white mb-1">
          {formatCurrency(metrics.totalValue)}
        </h3>
        <p className="text-sm text-gray-400">Total Value</p>
      </div>

      {/* Total P&L */}
      <div className="metric-card">
        <div className="flex items-center justify-between mb-2">
          <PnLIcon size={20} className={pnlColor.replace('text-', 'text-')} />
          <span className="text-xs text-gray-400">P&L</span>
        </div>
        <h3 className={`text-2xl font-bold mb-1 ${pnlColor}`}>
          {formatCurrency(metrics.totalPnL)}
        </h3>
        <p className={`text-sm ${pnlColor}`}>
          {formatPercentage(metrics.totalPnLPercentage)}
        </p>
      </div>

      {/* Top Gainer */}
      <div className="metric-card">
        <div className="flex items-center justify-between mb-2">
          <TrendingUp size={20} className="text-green-400" />
          <span className="text-xs text-gray-400">Best</span>
        </div>
        <h3 className="text-2xl font-bold text-white mb-1">
          {metrics.topGainer.symbol}
        </h3>
        <p className="text-sm text-green-400">
          +{formatPercentage(metrics.topGainer.change)}
        </p>
      </div>

      {/* Top Loser */}
      <div className="metric-card">
        <div className="flex items-center justify-between mb-2">
          <TrendingDown size={20} className="text-red-400" />
          <span className="text-xs text-gray-400">Worst</span>
        </div>
        <h3 className="text-2xl font-bold text-white mb-1">
          {metrics.topLoser.symbol}
        </h3>
        <p className="text-sm text-red-400">
          {formatPercentage(metrics.topLoser.change)}
        </p>
      </div>
    </div>
  );
}
