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
import { ViewMode, DashboardMetrics, Asset } from '@/lib/types';
import { 
  useAssetData,
  useTrendData,
  useWatchlist,
  useAlerts,
  usePortfolio,
  useNotifications
} from '@/lib/hooks';
import { 
  generateMockChartData,
  formatCurrency 
} from '@/lib/utils';
import { Plus, Search, Filter, Bell, RefreshCw, Settings } from 'lucide-react';

export default function TokenTracker() {
  const { setFrameReady } = useMiniKit();
  const [currentView, setCurrentView] = useState<ViewMode>('portfolio');
  const [chartData] = useState(generateMockChartData());
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [selectedAssetForAlert, setSelectedAssetForAlert] = useState<Asset | undefined>();

  // Use custom hooks for data management
  const { assets, loading: assetsLoading, error: assetsError, refreshData: refreshAssets } = useAssetData();
  const { trends, loading: trendsLoading, refreshData: refreshTrends } = useTrendData();
  const { watchlist, addToWatchlist, removeFromWatchlist, updateWatchlistPrices } = useWatchlist();
  const { alerts, addAlert, removeAlert, checkAlerts, getActiveAlerts, getTriggeredAlerts } = useAlerts();
  const { portfolio, getTotalValue, getTotalPnL, getTotalPnLPercentage, updatePortfolioWithPrices } = usePortfolio();
  const { requestPermission: requestNotificationPermission } = useNotifications();

  // Calculate dashboard metrics
  const metrics: DashboardMetrics = {
    totalValue: getTotalValue(),
    totalPnL: getTotalPnL(),
    totalPnLPercentage: getTotalPnLPercentage(),
    topGainer: portfolio.reduce((max, entry) => 
      entry.profitLossPercentage > max.change ? 
      { symbol: entry.assetId, change: entry.profitLossPercentage } : max, 
      { symbol: '', change: -Infinity }
    ),
    topLoser: portfolio.reduce((min, entry) => 
      entry.profitLossPercentage < min.change ? 
      { symbol: entry.assetId, change: entry.profitLossPercentage } : min, 
      { symbol: '', change: Infinity }
    ),
  };

  useEffect(() => {
    setFrameReady();
    // Request notification permission on app start
    requestNotificationPermission();
  }, [setFrameReady, requestNotificationPermission]);

  // Update watchlist and portfolio prices when assets data changes
  useEffect(() => {
    if (assets.length > 0) {
      updateWatchlistPrices(assets);
      updatePortfolioWithPrices(assets);
      // Check for triggered alerts
      checkAlerts(assets);
    }
  }, [assets, updateWatchlistPrices, updatePortfolioWithPrices, checkAlerts]);

  const handleAddToWatchlist = (asset: Asset) => {
    addToWatchlist(asset);
  };

  const handleRemoveFromWatchlist = (assetId: string) => {
    removeFromWatchlist(assetId);
  };

  const handleDismissAlert = (alertId: string) => {
    removeAlert(alertId);
  };

  const handleCreateAlert = (asset: Asset) => {
    setSelectedAssetForAlert(asset);
    setAlertModalOpen(true);
  };

  const handleRefreshData = () => {
    refreshAssets();
    refreshTrends();
  };

  const openSearchModal = (mode: 'watchlist' | 'portfolio' = 'watchlist') => {
    setSearchModalOpen(true);
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
            onClick={handleRefreshData}
            disabled={assetsLoading}
            className="p-2 hover:bg-white hover:bg-opacity-10 rounded-lg transition-colors duration-200"
            title="Refresh data"
          >
            <RefreshCw size={20} className={`text-gray-400 ${assetsLoading ? 'animate-spin' : ''}`} />
          </button>
          <Wallet>
            <ConnectWallet>
              <Name />
            </ConnectWallet>
          </Wallet>
        </div>
      </div>

      {/* Error State */}
      {assetsError && (
        <Card variant="glass" className="p-4">
          <div className="flex items-center space-x-3 text-red-400">
            <span className="text-sm">⚠️ {assetsError}</span>
            <button
              onClick={handleRefreshData}
              className="text-sm underline hover:no-underline"
            >
              Retry
            </button>
          </div>
        </Card>
      )}

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
          <PrimaryButton size="sm" onClick={() => openSearchModal('portfolio')}>
            <Plus size={16} className="mr-2" />
            Add Asset
          </PrimaryButton>
        </div>
        
        {portfolio.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-xl font-bold text-white mb-2">No Assets Yet</h3>
            <p className="text-gray-400 mb-6">Start building your portfolio by adding your first crypto asset</p>
            <PrimaryButton onClick={() => openSearchModal('portfolio')}>
              <Plus size={16} className="mr-2" />
              Add Your First Asset
            </PrimaryButton>
          </div>
        ) : (
          <div className="space-y-3">
            {portfolio.map((entry) => {
              const asset = assets.find(a => a.assetId === entry.assetId);
              if (!asset) return null;
              
              return (
                <AssetRow
                  key={entry.assetId}
                  asset={{
                    ...asset,
                    quantity: entry.quantity,
                    currentValue: entry.currentValue,
                    profitLoss: entry.profitLoss,
                    profitLossPercentage: entry.profitLossPercentage,
                  }}
                  variant="performance"
                  onClick={() => handleCreateAlert(asset)}
                />
              );
            })}
          </div>
        )}
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
        <PrimaryButton onClick={() => openSearchModal('watchlist')}>
          <Plus size={16} className="mr-2" />
          Add Token
        </PrimaryButton>
      </div>

      {/* Search Bar */}
      <Card variant="glass" className="p-4">
        <div className="flex items-center space-x-3">
          <Search size={20} className="text-gray-400" />
          <button
            onClick={() => openSearchModal('watchlist')}
            className="flex-1 text-left text-gray-400 hover:text-white transition-colors duration-200"
          >
            Search tokens...
          </button>
          <button
            onClick={handleRefreshData}
            disabled={assetsLoading}
            className="p-1 hover:bg-white hover:bg-opacity-10 rounded transition-colors duration-200"
          >
            <RefreshCw size={16} className={`text-gray-400 ${assetsLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </Card>

      {/* Watchlist Items */}
      <Card variant="glass" className="p-6">
        <h2 className="text-xl font-bold text-white mb-4">Watched Tokens</h2>
        
        {watchlist.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">👀</div>
            <h3 className="text-xl font-bold text-white mb-2">No Tokens Watched</h3>
            <p className="text-gray-400 mb-6">Add tokens to your watchlist to track their performance</p>
            <PrimaryButton onClick={() => openSearchModal('watchlist')}>
              <Plus size={16} className="mr-2" />
              Add Your First Token
            </PrimaryButton>
          </div>
        ) : (
          <div className="space-y-3">
            {watchlist.map((asset) => (
              <AssetRow
                key={asset.assetId}
                asset={asset}
                variant="watchlist"
                onClick={() => handleCreateAlert(asset)}
                onRemove={() => handleRemoveFromWatchlist(asset.assetId)}
              />
            ))}
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
        <div className="flex items-center space-x-2">
          <button
            onClick={handleRefreshData}
            disabled={trendsLoading}
            className="p-2 hover:bg-white hover:bg-opacity-10 rounded-lg transition-colors duration-200"
            title="Refresh trends"
          >
            <RefreshCw size={16} className={`text-gray-400 ${trendsLoading ? 'animate-spin' : ''}`} />
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
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-400"></div>
          )}
        </div>
        
        {trends.length === 0 && !trendsLoading ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📈</div>
            <h3 className="text-xl font-bold text-white mb-2">No Trends Available</h3>
            <p className="text-gray-400 mb-6">Check back later for trending tokens and market insights</p>
            <PrimaryButton onClick={handleRefreshData}>
              <RefreshCw size={16} className="mr-2" />
              Refresh Trends
            </PrimaryButton>
          </div>
        ) : (
          <div className="space-y-3">
            {trends.map((trend) => (
              <ScannerItem
                key={trend.scanId}
                trend={trend}
                onClick={() => {
                  const asset = assets.find(a => a.symbol === trend.tokenSymbol);
                  if (asset) {
                    handleCreateAlert(asset);
                  }
                }}
              />
            ))}
          </div>
        )}
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
        <Card variant="glass" className="p-4">
          <h3 className="font-bold text-white mb-2">Price Momentum</h3>
          <p className="text-sm text-gray-400 mb-3">Tokens with strong price movements</p>
          <div className="text-2xl font-bold text-green-400">
            {trends.filter(t => t.trendType === 'price_momentum').length}
          </div>
        </Card>
        <Card variant="glass" className="p-4">
          <h3 className="font-bold text-white mb-2">Dev Activity</h3>
          <p className="text-sm text-gray-400 mb-3">Tokens with high development activity</p>
          <div className="text-2xl font-bold text-purple-400">
            {trends.filter(t => t.trendType === 'dev_activity').length}
          </div>
        </Card>
      </div>
    </div>
  );

  const renderAlertsView = () => {
    const activeAlerts = getActiveAlerts();
    const triggeredAlerts = getTriggeredAlerts();
    
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-text mb-2">Alerts</h1>
            <p className="text-gray-400">Manage your notifications</p>
          </div>
          <PrimaryButton onClick={() => openSearchModal('watchlist')}>
            <Bell size={16} className="mr-2" />
            New Alert
          </PrimaryButton>
        </div>

        {/* Active Alerts */}
        <Card variant="glass" className="p-6">
          <h2 className="text-xl font-bold text-white mb-4">Your Alerts</h2>
          
          {alerts.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔔</div>
              <h3 className="text-xl font-bold text-white mb-2">No Alerts Set</h3>
              <p className="text-gray-400 mb-6">Create alerts to get notified about price changes and trends</p>
              <PrimaryButton onClick={() => openSearchModal('watchlist')}>
                <Bell size={16} className="mr-2" />
                Create Your First Alert
              </PrimaryButton>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert) => {
                const asset = assets.find(a => a.assetId === alert.assetId);
                return (
                  <AlertNotification
                    key={alert.alertId}
                    alert={alert}
                    asset={asset}
                    onDismiss={() => handleDismissAlert(alert.alertId)}
                  />
                );
              })}
            </div>
          )}
        </Card>

        {/* Alert Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card variant="glass" className="p-4 text-center">
            <div className="text-2xl font-bold text-green-400 mb-1">{activeAlerts.length}</div>
            <p className="text-sm text-gray-400">Active Alerts</p>
          </Card>
          <Card variant="glass" className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-400 mb-1">{triggeredAlerts.length}</div>
            <p className="text-sm text-gray-400">Triggered Alerts</p>
          </Card>
          <Card variant="glass" className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-400 mb-1">{alerts.length}</div>
            <p className="text-sm text-gray-400">Total Alerts</p>
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
        onAddToWatchlist={handleAddToWatchlist}
        mode="watchlist"
      />

      <AlertModal
        isOpen={alertModalOpen}
        onClose={() => {
          setAlertModalOpen(false);
          setSelectedAssetForAlert(undefined);
        }}
        asset={selectedAssetForAlert}
        onAlertCreated={(alert) => {
          console.log('Alert created:', alert);
          setAlertModalOpen(false);
          setSelectedAssetForAlert(undefined);
        }}
      />
    </>
  );
}
