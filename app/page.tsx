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
import { SearchModal } from '@/components/SearchModal';
import { AlertModal } from '@/components/AlertModal';
import { ViewMode, Asset } from '@/lib/types';
import { 
  useMarketData,
  useWatchlist,
  useTrends,
  useAlerts,
  usePortfolio,
  useNotifications
} from '@/lib/hooks';
import { 
  generateMockChartData,
  formatCurrency 
} from '@/lib/utils';
import { Plus, Search, Filter, Bell, RefreshCw, Settings, X } from 'lucide-react';

export default function TokenTracker() {
  const { setFrameReady } = useMiniKit();
  const [currentView, setCurrentView] = useState<ViewMode>('portfolio');
  const [chartData] = useState(generateMockChartData());
  
  // Modal states
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [searchMode, setSearchMode] = useState<'watchlist' | 'portfolio'>('watchlist');

  // Custom hooks for data management
  const { assets: marketData, loading: marketLoading, refreshData } = useMarketData();
  const { watchlistAssets, addToWatchlist, removeFromWatchlist, isInWatchlist } = useWatchlist();
  const { trends, loading: trendsLoading, refreshTrends } = useTrends();
  const { alerts, dismissAlert } = useAlerts();
  const { portfolio, metrics } = usePortfolio();
  const { requestPermission } = useNotifications();

  useEffect(() => {
    setFrameReady();
    // Request notification permission on app start
    requestPermission();
  }, [setFrameReady, requestPermission]);

  const handleOpenSearchModal = (mode: 'watchlist' | 'portfolio') => {
    setSearchMode(mode);
    setSearchModalOpen(true);
  };

  const handleAddToWatchlistFromSearch = (asset: Asset) => {
    addToWatchlist(asset.assetId);
  };

  const renderPortfolioView = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text mb-2">Portfolio</h1>
          <p className="text-gray-400">Track your crypto investments</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={refreshData}
            disabled={marketLoading}
            className="p-2 hover:bg-white hover:bg-opacity-10 rounded-lg transition-colors duration-200"
            title="Refresh data"
          >
            <RefreshCw size={20} className={`text-gray-400 ${marketLoading ? 'animate-spin' : ''}`} />
          </button>
          <Wallet>
            <ConnectWallet>
              <Name />
            </ConnectWallet>
          </Wallet>
        </div>
      </div>

      {/* Metrics Grid */}
      {metrics && <MetricsGrid metrics={metrics} />}

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
          <PrimaryButton size="sm" onClick={() => handleOpenSearchModal('portfolio')}>
            <Plus size={16} className="mr-2" />
            Add Asset
          </PrimaryButton>
        </div>
        <div className="space-y-3">
          {portfolio.length > 0 ? (
            portfolio.map((entry) => (
              <AssetRow
                key={`${entry.userId}-${entry.assetId}`}
                asset={{
                  symbol: entry.assetId.toUpperCase(),
                  name: entry.assetId,
                  currentPrice: entry.currentValue / entry.quantity,
                  profitLoss: entry.profitLoss,
                  profitLossPercentage: entry.profitLossPercentage,
                  currentValue: entry.currentValue,
                  quantity: entry.quantity,
                }}
                variant="performance"
                onClick={() => console.log('Asset clicked:', entry.assetId)}
              />
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-400 mb-4">No assets in your portfolio yet</p>
              <PrimaryButton onClick={() => handleOpenSearchModal('portfolio')}>
                Add Your First Asset
              </PrimaryButton>
            </div>
          )}
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
        <PrimaryButton onClick={() => handleOpenSearchModal('watchlist')}>
          <Plus size={16} className="mr-2" />
          Add Token
        </PrimaryButton>
      </div>

      {/* Quick Actions */}
      <Card variant="glass" className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Search size={20} className="text-gray-400" />
            <span className="text-gray-400">Quick add tokens to your watchlist</span>
          </div>
          <button
            onClick={() => handleOpenSearchModal('watchlist')}
            className="text-purple-400 hover:text-purple-300 transition-colors duration-200"
          >
            Search Tokens
          </button>
        </div>
      </Card>

      {/* Watchlist Items */}
      <Card variant="glass" className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Watched Tokens</h2>
          <span className="text-sm text-gray-400">{watchlistAssets.length} tokens</span>
        </div>
        <div className="space-y-3">
          {watchlistAssets.length > 0 ? (
            watchlistAssets.map((asset) => (
              <div key={asset.assetId} className="relative">
                <AssetRow
                  asset={{
                    symbol: asset.symbol,
                    name: asset.name,
                    currentPrice: asset.currentPrice,
                    priceChange24h: asset.priceChange24h,
                    image: asset.image,
                  }}
                  variant="watchlist"
                  onClick={() => console.log('Watchlist item clicked:', asset.symbol)}
                />
                <button
                  onClick={() => removeFromWatchlist(asset.assetId)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-red-400 transition-colors duration-200"
                  title="Remove from watchlist"
                >
                  <X size={16} />
                </button>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <Search size={48} className="mx-auto text-gray-600 mb-4" />
              <p className="text-gray-400 mb-4">No tokens in your watchlist yet</p>
              <PrimaryButton onClick={() => handleOpenSearchModal('watchlist')}>
                Add Your First Token
              </PrimaryButton>
            </div>
          )}
        </div>
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
        <div className="flex items-center space-x-3">
          <button
            onClick={refreshTrends}
            disabled={trendsLoading}
            className="p-2 hover:bg-white hover:bg-opacity-10 rounded-lg transition-colors duration-200"
            title="Refresh trends"
          >
            <RefreshCw size={20} className={`text-gray-400 ${trendsLoading ? 'animate-spin' : ''}`} />
          </button>
          <PrimaryButton variant="secondary">
            <Filter size={16} className="mr-2" />
            Filters
          </PrimaryButton>
        </div>
      </div>

      {/* Trending Tokens */}
      <Card variant="glass" className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Trending Now</h2>
          {trendsLoading && (
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <RefreshCw size={16} className="animate-spin" />
              <span>Updating trends...</span>
            </div>
          )}
        </div>
        <div className="space-y-3">
          {trends.length > 0 ? (
            trends.map((trend) => (
              <div key={trend.scanId} className="relative">
                <ScannerItem
                  trend={trend}
                  onClick={() => console.log('Trend clicked:', trend.tokenSymbol)}
                />
                <button
                  onClick={() => addToWatchlist(trend.tokenSymbol.toLowerCase())}
                  disabled={isInWatchlist(trend.tokenSymbol.toLowerCase())}
                  className={`absolute right-4 top-1/2 transform -translate-y-1/2 p-2 rounded-lg transition-all duration-200 ${
                    isInWatchlist(trend.tokenSymbol.toLowerCase())
                      ? 'bg-green-500 bg-opacity-20 text-green-400 cursor-not-allowed'
                      : 'bg-purple-500 bg-opacity-20 text-purple-400 hover:bg-opacity-30'
                  }`}
                  title={isInWatchlist(trend.tokenSymbol.toLowerCase()) ? 'Already in watchlist' : 'Add to watchlist'}
                >
                  <Plus size={16} />
                </button>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bell size={24} className="text-white" />
              </div>
              <p className="text-gray-400 mb-4">
                {trendsLoading ? 'Loading trends...' : 'No trends available'}
              </p>
              {!trendsLoading && (
                <PrimaryButton onClick={refreshTrends} variant="secondary">
                  Refresh Trends
                </PrimaryButton>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Trend Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card variant="glass" className="p-4">
          <h3 className="font-bold text-white mb-2">Volume Spikes</h3>
          <p className="text-sm text-gray-400 mb-3">Tokens with unusual trading activity</p>
          <div className="text-2xl font-bold text-yellow-400">
            {trends.filter(t => t.trendType === 'volume_spike').length}
          </div>
        </Card>
        <Card variant="glass" className="p-4">
          <h3 className="font-bold text-white mb-2">Social Buzz</h3>
          <p className="text-sm text-gray-400 mb-3">Tokens trending on social media</p>
          <div className="text-2xl font-bold text-blue-400">
            {trends.filter(t => t.trendType === 'social_mentions').length}
          </div>
        </Card>
      </div>
    </div>
  );

  const renderAlertsView = () => {
    const activeAlerts = alerts.filter(alert => alert.status === 'active');
    const triggeredAlerts = alerts.filter(alert => alert.status === 'triggered');
    const todayTriggered = triggeredAlerts.filter(alert => 
      Date.now() - alert.createdAt < 86400000
    );

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-text mb-2">Alerts</h1>
            <p className="text-gray-400">Manage your notifications</p>
          </div>
          <PrimaryButton onClick={() => setAlertModalOpen(true)}>
            <Bell size={16} className="mr-2" />
            New Alert
          </PrimaryButton>
        </div>

        {/* Active Alerts */}
        <Card variant="glass" className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Your Alerts</h2>
            <span className="text-sm text-gray-400">{alerts.length} total</span>
          </div>
          <div className="space-y-3">
            {alerts.length > 0 ? (
              alerts.map((alert) => (
                <AlertNotification
                  key={alert.alertId}
                  alert={alert}
                  onDismiss={() => dismissAlert(alert.alertId)}
                />
              ))
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bell size={24} className="text-white" />
                </div>
                <p className="text-gray-400 mb-4">No alerts created yet</p>
                <PrimaryButton onClick={() => setAlertModalOpen(true)}>
                  Create Your First Alert
                </PrimaryButton>
              </div>
            )}
          </div>
        </Card>

        {/* Alert Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card variant="glass" className="p-4 text-center">
            <div className="text-2xl font-bold text-green-400 mb-1">{activeAlerts.length}</div>
            <p className="text-sm text-gray-400">Active Alerts</p>
          </Card>
          <Card variant="glass" className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-400 mb-1">{todayTriggered.length}</div>
            <p className="text-sm text-gray-400">Triggered Today</p>
          </Card>
          <Card variant="glass" className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-400 mb-1">{triggeredAlerts.length}</div>
            <p className="text-sm text-gray-400">Total Triggered</p>
          </Card>
        </div>
      </div>
    );
  };

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
    <>
      <AppShell currentView={currentView} onViewChange={setCurrentView}>
        {renderCurrentView()}
      </AppShell>

      {/* Modals */}
      <SearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        onAddToWatchlist={handleAddToWatchlistFromSearch}
        mode={searchMode}
        title={searchMode === 'watchlist' ? 'Add to Watchlist' : 'Add to Portfolio'}
      />

      <AlertModal
        isOpen={alertModalOpen}
        onClose={() => setAlertModalOpen(false)}
      />
    </>
  );
}
