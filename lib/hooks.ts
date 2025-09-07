import { useState, useEffect, useCallback, useRef } from 'react';
import { Asset, TrendScan, Alert, PortfolioEntry, DashboardMetrics } from './types';
import { coinGeckoAPI, trendAnalysisService } from './api';
import { storageService, alertService } from './storage';
import { formatCurrency } from './utils';

// Hook for managing market data
export function useMarketData(autoRefresh = true, refreshInterval = 30000) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchMarketData = useCallback(async () => {
    try {
      setError(null);
      const data = await coinGeckoAPI.getMarketData(250);
      setAssets(data);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch market data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMarketData();

    if (autoRefresh) {
      intervalRef.current = setInterval(fetchMarketData, refreshInterval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchMarketData, autoRefresh, refreshInterval]);

  const refreshData = useCallback(() => {
    setLoading(true);
    fetchMarketData();
  }, [fetchMarketData]);

  return {
    assets,
    loading,
    error,
    lastUpdated,
    refreshData,
  };
}

// Hook for managing watchlist
export function useWatchlist() {
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [watchlistAssets, setWatchlistAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load watchlist from storage
    const savedWatchlist = storageService.getWatchlist();
    setWatchlist(savedWatchlist);
    setLoading(false);
  }, []);

  useEffect(() => {
    // Fetch asset data for watchlist items
    const fetchWatchlistAssets = async () => {
      if (watchlist.length === 0) {
        setWatchlistAssets([]);
        return;
      }

      try {
        const assets = await Promise.all(
          watchlist.map(assetId => coinGeckoAPI.getCoinById(assetId))
        );
        setWatchlistAssets(assets.filter(Boolean) as Asset[]);
      } catch (error) {
        console.error('Error fetching watchlist assets:', error);
      }
    };

    fetchWatchlistAssets();
  }, [watchlist]);

  const addToWatchlist = useCallback((assetId: string) => {
    if (!watchlist.includes(assetId)) {
      const newWatchlist = [...watchlist, assetId];
      setWatchlist(newWatchlist);
      storageService.addToWatchlist(assetId);
    }
  }, [watchlist]);

  const removeFromWatchlist = useCallback((assetId: string) => {
    const newWatchlist = watchlist.filter(id => id !== assetId);
    setWatchlist(newWatchlist);
    storageService.removeFromWatchlist(assetId);
  }, [watchlist]);

  const isInWatchlist = useCallback((assetId: string) => {
    return watchlist.includes(assetId);
  }, [watchlist]);

  return {
    watchlist,
    watchlistAssets,
    loading,
    addToWatchlist,
    removeFromWatchlist,
    isInWatchlist,
  };
}

// Hook for managing trends
export function useTrends(autoRefresh = true, refreshInterval = 60000) {
  const [trends, setTrends] = useState<TrendScan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchTrends = useCallback(async () => {
    try {
      setError(null);
      const data = await trendAnalysisService.analyzeTrends();
      setTrends(data);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch trends');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrends();

    if (autoRefresh) {
      intervalRef.current = setInterval(fetchTrends, refreshInterval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchTrends, autoRefresh, refreshInterval]);

  const refreshTrends = useCallback(() => {
    setLoading(true);
    fetchTrends();
  }, [fetchTrends]);

  return {
    trends,
    loading,
    error,
    lastUpdated,
    refreshTrends,
  };
}

// Hook for managing alerts
export function useAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load alerts from storage
    const savedAlerts = storageService.getAlerts();
    setAlerts(savedAlerts);
    setLoading(false);

    // Listen for alert triggers
    const handleAlertTriggered = (event: CustomEvent) => {
      const triggeredAlert = event.detail as Alert;
      setAlerts(prev => 
        prev.map(alert => 
          alert.alertId === triggeredAlert.alertId 
            ? { ...alert, status: 'triggered' }
            : alert
        )
      );
    };

    window.addEventListener('alertTriggered', handleAlertTriggered as EventListener);

    return () => {
      window.removeEventListener('alertTriggered', handleAlertTriggered as EventListener);
    };
  }, []);

  const createAlert = useCallback((alert: Omit<Alert, 'alertId' | 'createdAt'>) => {
    const newAlert: Alert = {
      ...alert,
      alertId: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
    };
    
    const updatedAlerts = [...alerts, newAlert];
    setAlerts(updatedAlerts);
    storageService.saveAlert(newAlert);
    
    return newAlert;
  }, [alerts]);

  const updateAlert = useCallback((alertId: string, updates: Partial<Alert>) => {
    const updatedAlerts = alerts.map(alert =>
      alert.alertId === alertId ? { ...alert, ...updates } : alert
    );
    setAlerts(updatedAlerts);
    
    const updatedAlert = updatedAlerts.find(a => a.alertId === alertId);
    if (updatedAlert) {
      storageService.saveAlert(updatedAlert);
    }
  }, [alerts]);

  const removeAlert = useCallback((alertId: string) => {
    const updatedAlerts = alerts.filter(alert => alert.alertId !== alertId);
    setAlerts(updatedAlerts);
    storageService.removeAlert(alertId);
  }, [alerts]);

  const dismissAlert = useCallback((alertId: string) => {
    updateAlert(alertId, { status: 'disabled' });
  }, [updateAlert]);

  return {
    alerts,
    loading,
    createAlert,
    updateAlert,
    removeAlert,
    dismissAlert,
  };
}

// Hook for managing portfolio
export function usePortfolio() {
  const [portfolio, setPortfolio] = useState<PortfolioEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);

  useEffect(() => {
    // Load portfolio from storage
    const savedPortfolio = storageService.getPortfolio();
    setPortfolio(savedPortfolio);
    setLoading(false);
  }, []);

  useEffect(() => {
    // Calculate metrics when portfolio changes
    if (portfolio.length > 0) {
      const totalValue = portfolio.reduce((sum, entry) => sum + entry.currentValue, 0);
      const totalPnL = portfolio.reduce((sum, entry) => sum + entry.profitLoss, 0);
      const totalPnLPercentage = totalPnL / (totalValue - totalPnL) * 100;
      
      const topGainer = portfolio.reduce((max, entry) => 
        entry.profitLossPercentage > max.change ? 
        { symbol: entry.assetId, change: entry.profitLossPercentage } : max, 
        { symbol: '', change: -Infinity }
      );
      
      const topLoser = portfolio.reduce((min, entry) => 
        entry.profitLossPercentage < min.change ? 
        { symbol: entry.assetId, change: entry.profitLossPercentage } : min, 
        { symbol: '', change: Infinity }
      );

      setMetrics({
        totalValue,
        totalPnL,
        totalPnLPercentage,
        topGainer,
        topLoser,
      });
    } else {
      setMetrics(null);
    }
  }, [portfolio]);

  const addPortfolioEntry = useCallback((entry: Omit<PortfolioEntry, 'currentValue' | 'profitLoss' | 'profitLossPercentage'>) => {
    // Calculate current values (would typically fetch current price)
    const currentValue = entry.quantity * entry.buyPrice; // Simplified
    const profitLoss = currentValue - (entry.quantity * entry.buyPrice);
    const profitLossPercentage = (profitLoss / (entry.quantity * entry.buyPrice)) * 100;

    const newEntry: PortfolioEntry = {
      ...entry,
      currentValue,
      profitLoss,
      profitLossPercentage,
    };

    const updatedPortfolio = [...portfolio, newEntry];
    setPortfolio(updatedPortfolio);
    storageService.savePortfolioEntry(newEntry);
  }, [portfolio]);

  const updatePortfolioEntry = useCallback((userId: string, assetId: string, updates: Partial<PortfolioEntry>) => {
    const updatedPortfolio = portfolio.map(entry =>
      entry.userId === userId && entry.assetId === assetId 
        ? { ...entry, ...updates }
        : entry
    );
    setPortfolio(updatedPortfolio);
    
    const updatedEntry = updatedPortfolio.find(e => e.userId === userId && e.assetId === assetId);
    if (updatedEntry) {
      storageService.savePortfolioEntry(updatedEntry);
    }
  }, [portfolio]);

  const removePortfolioEntry = useCallback((userId: string, assetId: string) => {
    const updatedPortfolio = portfolio.filter(
      entry => !(entry.userId === userId && entry.assetId === assetId)
    );
    setPortfolio(updatedPortfolio);
    storageService.removePortfolioEntry(userId, assetId);
  }, [portfolio]);

  return {
    portfolio,
    metrics,
    loading,
    addPortfolioEntry,
    updatePortfolioEntry,
    removePortfolioEntry,
  };
}

// Hook for search functionality
export function useSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const search = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const searchResults = await coinGeckoAPI.searchCoins(searchQuery);
      setResults(searchResults);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const debouncedSearch = useCallback((searchQuery: string) => {
    setQuery(searchQuery);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      search(searchQuery);
    }, 300); // 300ms debounce
  }, [search]);

  const clearSearch = useCallback(() => {
    setQuery('');
    setResults([]);
    setError(null);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
  }, []);

  return {
    query,
    results,
    loading,
    error,
    search: debouncedSearch,
    clearSearch,
  };
}

// Hook for notification management
export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    setSupported('Notification' in window);
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!supported) return false;
    
    const result = await alertService.requestNotificationPermission();
    setPermission(Notification.permission);
    return result;
  }, [supported]);

  const showNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (permission === 'granted') {
      return new Notification(title, {
        icon: '/favicon.ico',
        ...options,
      });
    }
    return null;
  }, [permission]);

  return {
    supported,
    permission,
    requestPermission,
    showNotification,
  };
}
