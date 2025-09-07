'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Asset, TrendScan, Alert, PortfolioEntry } from './types';
import { coinGeckoAPI, trendAnalysisService } from './api';
import { storageService, alertService } from './storage';

// Hook for managing real-time asset data
export function useAssetData(refreshInterval: number = 60000) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchAssets = useCallback(async () => {
    try {
      setError(null);
      const data = await coinGeckoAPI.getMarketData(100);
      setAssets(data);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch asset data');
      console.error('Error fetching assets:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial fetch
    fetchAssets();

    // Set up interval for periodic updates
    if (refreshInterval > 0) {
      intervalRef.current = setInterval(fetchAssets, refreshInterval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchAssets, refreshInterval]);

  const refreshData = useCallback(() => {
    setLoading(true);
    fetchAssets();
  }, [fetchAssets]);

  return {
    assets,
    loading,
    error,
    lastUpdated,
    refreshData,
  };
}

// Hook for managing trend data
export function useTrendData(refreshInterval: number = 300000) { // 5 minutes
  const [trends, setTrends] = useState<TrendScan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchTrends = useCallback(async () => {
    try {
      setError(null);
      const data = await trendAnalysisService.getCombinedTrends();
      setTrends(data);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch trend data');
      console.error('Error fetching trends:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial fetch
    fetchTrends();

    // Set up interval for periodic updates
    if (refreshInterval > 0) {
      intervalRef.current = setInterval(fetchTrends, refreshInterval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchTrends, refreshInterval]);

  const refreshData = useCallback(() => {
    setLoading(true);
    fetchTrends();
  }, [fetchTrends]);

  return {
    trends,
    loading,
    error,
    lastUpdated,
    refreshData,
  };
}

// Hook for managing watchlist
export function useWatchlist() {
  const [watchlist, setWatchlist] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load watchlist from storage
    const savedWatchlist = storageService.getWatchlist();
    setWatchlist(savedWatchlist);
  }, []);

  const addToWatchlist = useCallback(async (asset: Asset) => {
    try {
      setLoading(true);
      storageService.addToWatchlist(asset);
      setWatchlist(storageService.getWatchlist());
    } catch (error) {
      console.error('Error adding to watchlist:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const removeFromWatchlist = useCallback(async (assetId: string) => {
    try {
      setLoading(true);
      storageService.removeFromWatchlist(assetId);
      setWatchlist(storageService.getWatchlist());
    } catch (error) {
      console.error('Error removing from watchlist:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const isInWatchlist = useCallback((assetId: string) => {
    return storageService.isInWatchlist(assetId);
  }, []);

  const updateWatchlistPrices = useCallback(async (assets: Asset[]) => {
    const currentWatchlist = storageService.getWatchlist();
    const updatedWatchlist = currentWatchlist.map(watchlistItem => {
      const updatedAsset = assets.find(asset => asset.assetId === watchlistItem.assetId);
      return updatedAsset || watchlistItem;
    });
    
    // Update storage with new prices
    updatedWatchlist.forEach(asset => {
      storageService.addToWatchlist(asset); // This will update existing entries
    });
    
    setWatchlist(updatedWatchlist);
  }, []);

  return {
    watchlist,
    loading,
    addToWatchlist,
    removeFromWatchlist,
    isInWatchlist,
    updateWatchlistPrices,
  };
}

// Hook for managing alerts
export function useAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load alerts from storage
    const savedAlerts = storageService.getAlerts();
    setAlerts(savedAlerts);
  }, []);

  const addAlert = useCallback(async (alertData: Omit<Alert, 'alertId' | 'createdAt'>) => {
    try {
      setLoading(true);
      const newAlert = storageService.addAlert(alertData);
      setAlerts(storageService.getAlerts());
      return newAlert;
    } catch (error) {
      console.error('Error adding alert:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const removeAlert = useCallback(async (alertId: string) => {
    try {
      setLoading(true);
      storageService.removeAlert(alertId);
      setAlerts(storageService.getAlerts());
    } catch (error) {
      console.error('Error removing alert:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateAlert = useCallback(async (alertId: string, updates: Partial<Alert>) => {
    try {
      setLoading(true);
      storageService.updateAlert(alertId, updates);
      setAlerts(storageService.getAlerts());
    } catch (error) {
      console.error('Error updating alert:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const checkAlerts = useCallback(async (assets: Asset[]) => {
    try {
      const triggeredAlerts = alertService.checkPriceAlerts(assets);
      
      // Send notifications for triggered alerts
      for (const alert of triggeredAlerts) {
        const asset = assets.find(a => a.assetId === alert.assetId);
        if (asset) {
          await alertService.sendNotification(alert, asset);
        }
      }
      
      // Refresh alerts state
      setAlerts(storageService.getAlerts());
      
      return triggeredAlerts;
    } catch (error) {
      console.error('Error checking alerts:', error);
      return [];
    }
  }, []);

  const getActiveAlerts = useCallback(() => {
    return alerts.filter(alert => alert.status === 'active');
  }, [alerts]);

  const getTriggeredAlerts = useCallback(() => {
    return alerts.filter(alert => alert.status === 'triggered');
  }, [alerts]);

  return {
    alerts,
    loading,
    addAlert,
    removeAlert,
    updateAlert,
    checkAlerts,
    getActiveAlerts,
    getTriggeredAlerts,
  };
}

// Hook for managing portfolio
export function usePortfolio(userId: string = 'current_user') {
  const [portfolio, setPortfolio] = useState<PortfolioEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load portfolio from storage
    const savedPortfolio = storageService.getUserPortfolio(userId);
    setPortfolio(savedPortfolio);
  }, [userId]);

  const addPortfolioEntry = useCallback(async (entry: Omit<PortfolioEntry, 'currentValue' | 'profitLoss' | 'profitLossPercentage'>) => {
    try {
      setLoading(true);
      storageService.addPortfolioEntry(entry);
      setPortfolio(storageService.getUserPortfolio(userId));
    } catch (error) {
      console.error('Error adding portfolio entry:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const removePortfolioEntry = useCallback(async (assetId: string) => {
    try {
      setLoading(true);
      storageService.removePortfolioEntry(userId, assetId);
      setPortfolio(storageService.getUserPortfolio(userId));
    } catch (error) {
      console.error('Error removing portfolio entry:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const updatePortfolioWithPrices = useCallback(async (assets: Asset[]) => {
    const currentPortfolio = storageService.getUserPortfolio(userId);
    
    // Update portfolio entries with current prices
    currentPortfolio.forEach(entry => {
      const asset = assets.find(a => a.assetId === entry.assetId);
      if (asset) {
        const currentValue = entry.quantity * asset.currentPrice;
        const profitLoss = currentValue - (entry.quantity * entry.buyPrice);
        const profitLossPercentage = ((asset.currentPrice - entry.buyPrice) / entry.buyPrice) * 100;
        
        storageService.updatePortfolioEntry(userId, entry.assetId, {
          currentValue,
          profitLoss,
          profitLossPercentage,
        });
      }
    });
    
    setPortfolio(storageService.getUserPortfolio(userId));
  }, [userId]);

  const getTotalValue = useCallback(() => {
    return portfolio.reduce((sum, entry) => sum + entry.currentValue, 0);
  }, [portfolio]);

  const getTotalPnL = useCallback(() => {
    return portfolio.reduce((sum, entry) => sum + entry.profitLoss, 0);
  }, [portfolio]);

  const getTotalPnLPercentage = useCallback(() => {
    const totalInvested = portfolio.reduce((sum, entry) => sum + (entry.quantity * entry.buyPrice), 0);
    const totalCurrent = portfolio.reduce((sum, entry) => sum + entry.currentValue, 0);
    
    if (totalInvested === 0) return 0;
    return ((totalCurrent - totalInvested) / totalInvested) * 100;
  }, [portfolio]);

  return {
    portfolio,
    loading,
    addPortfolioEntry,
    removePortfolioEntry,
    updatePortfolioWithPrices,
    getTotalValue,
    getTotalPnL,
    getTotalPnLPercentage,
  };
}

// Hook for managing notification permissions
export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    if ('Notification' in window) {
      setSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!supported) return false;
    
    try {
      const result = await alertService.requestNotificationPermission();
      setPermission(Notification.permission);
      return result;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }, [supported]);

  return {
    permission,
    supported,
    requestPermission,
  };
}
