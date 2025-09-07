'use client';

import { useState, useEffect } from 'react';
import { useMiniKit } from '@coinbase/onchainkit/minikit';
import { ConnectWallet, Wallet } from '@coinbase/onchainkit/wallet';
import { Name } from '@coinbase/onchainkit/identity';
import { AppShell } from '@/components/AppShell';
import { MetricsGrid } from '@/components/MetricsGrid';
import { PortfolioChart } from '@/components/PortfolioChart';
import { AssetRow } from '@/components/AssetRow';
import { ScannerItem } from '@/components/ScannerItem';
import { AlertNotification } from '@/components/AlertNotification';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Card } from '@/components/Card';
import { ViewMode, DashboardMetrics, Alert } from '@/lib/types';
import { 
  generateMockPortfolioData, 
  generateMockTrendData, 
  generateMockChartData,
  formatCurrency 
} from '@/lib/utils';
import { Plus, Search, Filter, Bell } from 'lucide-react';

export default function TokenTracker() {
  const { setFrameReady } = useMiniKit();
  const [currentView, setCurrentView] = useState<ViewMode>('portfolio');
  const [portfolioData] = useState(generateMockPortfolioData());
  const [trendData] = useState(generateMockTrendData());
  const [chartData] = useState(generateMockChartData());
  const [watchlist, setWatchlist] = useState(portfolioData.slice(0, 2));
  const [alerts, setAlerts] = useState<Alert[]>([
    {
      alertId: '1',
      userId: 'user1',
      assetId: 'bitcoin',
      type: 'price_above',
      value: 50000,
      status: 'active',
      createdAt: Date.now() - 86400000,
    },
    {
      alertId: '2',
      userId: 'user1',
      assetId: 'ethereum',
      type: 'price_below',
      value: 2500,
      status: 'triggered',
      createdAt: Date.now() - 3600000,
    },
  ]);

  // Calculate dashboard metrics
  const metrics: DashboardMetrics = {
    totalValue: portfolioData.reduce((sum, asset) => sum + asset.currentValue, 0),
    totalPnL: portfolioData.reduce((sum, asset) => sum + asset.profitLoss, 0),
    totalPnLPercentage: portfolioData.reduce((sum, asset) => sum + asset.profitLossPercentage, 0) / portfolioData.length,
    topGainer: portfolioData.reduce((max, asset) => 
      asset.profitLossPercentage > max.change ? 
      { symbol: asset.symbol, change: asset.profitLossPercentage } : max, 
      { symbol: '', change: -Infinity }
    ),
    topLoser: portfolioData.reduce((min, asset) => 
      asset.profitLossPercentage < min.change ? 
      { symbol: asset.symbol, change: asset.profitLossPercentage } : min, 
      { symbol: '', change: Infinity }
    ),
  };

  useEffect(() => {
    setFrameReady();
  }, [setFrameReady]);

  const handleAddToWatchlist = (asset: any) => {
    if (!watchlist.find(item => item.symbol === asset.symbol)) {
      setWatchlist([...watchlist, asset]);
    }
  };

  const handleRemoveFromWatchlist = (symbol: string) => {
    setWatchlist(watchlist.filter(item => item.symbol !== symbol));
  };

  const handleDismissAlert = (alertId: string) => {
    setAlerts(alerts.filter(alert => alert.alertId !== alertId));
  };

  const renderPortfolioView = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text mb-2">Portfolio</h1>
          <p className="text-gray-400">Track your crypto investments</p>
        </div>
        <Wallet>
          <ConnectWallet>
            <Name />
          </ConnectWallet>
        </Wallet>
      </div>

      {/* Metrics Grid */}
      <MetricsGrid metrics={metrics} />

      {/* Portfolio Chart */}
      <Card variant="glass" className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Portfolio Performance</h2>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-400">24h</span>
            <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
          </div>
        </div>
        <PortfolioChart data={chartData} />
      </Card>

      {/* Assets List */}
      <Card variant="glass" className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Your Assets</h2>
          <PrimaryButton size="sm">
            <Plus size={16} className="mr-2" />
            Add Asset
          </PrimaryButton>
        </div>
        <div className="space-y-3">
          {portfolioData.map((asset) => (
            <AssetRow
              key={asset.symbol}
              asset={asset}
              variant="performance"
              onClick={() => console.log('Asset clicked:', asset.symbol)}
            />
          ))}
        </div>
      </Card>
    </div>
  );

  const renderWatchlistView = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text mb-2">Watchlist</h1>
          <p className="text-gray-400">Monitor potential investments</p>
        </div>
        <PrimaryButton>
          <Plus size={16} className="mr-2" />
          Add Token
        </PrimaryButton>
      </div>

      {/* Search Bar */}
      <Card variant="glass" className="p-4">
        <div className="flex items-center space-x-3">
          <Search size={20} className="text-gray-400" />
          <input
            type="text"
            placeholder="Search tokens..."
            className="flex-1 bg-transparent text-white placeholder-gray-400 focus:outline-none"
          />
          <Filter size={20} className="text-gray-400" />
        </div>
      </Card>

      {/* Watchlist Items */}
      <Card variant="glass" className="p-6">
        <h2 className="text-xl font-bold text-white mb-4">Watched Tokens</h2>
        <div className="space-y-3">
          {watchlist.map((asset) => (
            <AssetRow
              key={asset.symbol}
              asset={asset}
              variant="watchlist"
              onClick={() => console.log('Watchlist item clicked:', asset.symbol)}
            />
          ))}
        </div>
        {watchlist.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-400 mb-4">No tokens in your watchlist yet</p>
            <PrimaryButton>Add Your First Token</PrimaryButton>
          </div>
        )}
      </Card>
    </div>
  );

  const renderTrendsView = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text mb-2">Trends</h1>
          <p className="text-gray-400">Discover emerging opportunities</p>
        </div>
        <PrimaryButton variant="secondary">
          <Filter size={16} className="mr-2" />
          Filters
        </PrimaryButton>
      </div>

      {/* Trending Tokens */}
      <Card variant="glass" className="p-6">
        <h2 className="text-xl font-bold text-white mb-4">Trending Now</h2>
        <div className="space-y-3">
          {trendData.map((trend) => (
            <ScannerItem
              key={trend.scanId}
              trend={trend}
              onClick={() => console.log('Trend clicked:', trend.tokenSymbol)}
            />
          ))}
        </div>
      </Card>

      {/* Trend Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card variant="glass" className="p-4">
          <h3 className="font-bold text-white mb-2">Volume Spikes</h3>
          <p className="text-sm text-gray-400 mb-3">Tokens with unusual trading activity</p>
          <div className="text-2xl font-bold text-yellow-400">12</div>
        </Card>
        <Card variant="glass" className="p-4">
          <h3 className="font-bold text-white mb-2">Social Buzz</h3>
          <p className="text-sm text-gray-400 mb-3">Tokens trending on social media</p>
          <div className="text-2xl font-bold text-blue-400">8</div>
        </Card>
      </div>
    </div>
  );

  const renderAlertsView = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text mb-2">Alerts</h1>
          <p className="text-gray-400">Manage your notifications</p>
        </div>
        <PrimaryButton>
          <Bell size={16} className="mr-2" />
          New Alert
        </PrimaryButton>
      </div>

      {/* Active Alerts */}
      <Card variant="glass" className="p-6">
        <h2 className="text-xl font-bold text-white mb-4">Your Alerts</h2>
        <div className="space-y-3">
          {alerts.map((alert) => (
            <AlertNotification
              key={alert.alertId}
              alert={alert}
              onDismiss={() => handleDismissAlert(alert.alertId)}
            />
          ))}
        </div>
        {alerts.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-400 mb-4">No active alerts</p>
            <PrimaryButton>Create Your First Alert</PrimaryButton>
          </div>
        )}
      </Card>

      {/* Alert Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card variant="glass" className="p-4 text-center">
          <div className="text-2xl font-bold text-green-400 mb-1">5</div>
          <p className="text-sm text-gray-400">Active Alerts</p>
        </Card>
        <Card variant="glass" className="p-4 text-center">
          <div className="text-2xl font-bold text-yellow-400 mb-1">2</div>
          <p className="text-sm text-gray-400">Triggered Today</p>
        </Card>
        <Card variant="glass" className="p-4 text-center">
          <div className="text-2xl font-bold text-purple-400 mb-1">12</div>
          <p className="text-sm text-gray-400">Total This Week</p>
        </Card>
      </div>
    </div>
  );

  const renderCurrentView = () => {
    switch (currentView) {
      case 'portfolio':
        return renderPortfolioView();
      case 'watchlist':
        return renderWatchlistView();
      case 'trends':
        return renderTrendsView();
      case 'alerts':
        return renderAlertsView();
      default:
        return renderPortfolioView();
    }
  };

  return (
    <AppShell currentView={currentView} onViewChange={setCurrentView}>
      {renderCurrentView()}
    </AppShell>
  );
}
