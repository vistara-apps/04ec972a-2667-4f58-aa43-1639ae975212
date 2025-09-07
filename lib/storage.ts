import { User, Alert, PortfolioEntry, Asset } from './types';

// Local storage keys
const STORAGE_KEYS = {
  USER_DATA: 'tokentracker_user_data',
  WATCHLIST: 'tokentracker_watchlist',
  ALERTS: 'tokentracker_alerts',
  PORTFOLIO: 'tokentracker_portfolio',
  SETTINGS: 'tokentracker_settings',
} as const;

// Storage service for client-side data persistence
export class StorageService {
  private isClient = typeof window !== 'undefined';

  private getItem<T>(key: string, defaultValue: T): T {
    if (!this.isClient) return defaultValue;
    
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error(`Error reading from localStorage key ${key}:`, error);
      return defaultValue;
    }
  }

  private setItem<T>(key: string, value: T): void {
    if (!this.isClient) return;
    
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error writing to localStorage key ${key}:`, error);
    }
  }

  // User data management
  getUserData(): Partial<User> {
    return this.getItem(STORAGE_KEYS.USER_DATA, {
      userId: '',
      connectedWallets: [],
      watchlist: [],
      notificationSettings: {
        priceAlerts: true,
        trendAlerts: true,
        portfolioUpdates: true,
      },
    });
  }

  setUserData(userData: Partial<User>): void {
    this.setItem(STORAGE_KEYS.USER_DATA, userData);
  }

  // Watchlist management
  getWatchlist(): Asset[] {
    return this.getItem(STORAGE_KEYS.WATCHLIST, []);
  }

  addToWatchlist(asset: Asset): void {
    const watchlist = this.getWatchlist();
    const exists = watchlist.find(item => item.assetId === asset.assetId);
    
    if (!exists) {
      watchlist.push(asset);
      this.setItem(STORAGE_KEYS.WATCHLIST, watchlist);
    }
  }

  removeFromWatchlist(assetId: string): void {
    const watchlist = this.getWatchlist();
    const filtered = watchlist.filter(item => item.assetId !== assetId);
    this.setItem(STORAGE_KEYS.WATCHLIST, filtered);
  }

  isInWatchlist(assetId: string): boolean {
    const watchlist = this.getWatchlist();
    return watchlist.some(item => item.assetId === assetId);
  }

  // Alerts management
  getAlerts(): Alert[] {
    return this.getItem(STORAGE_KEYS.ALERTS, []);
  }

  addAlert(alert: Omit<Alert, 'alertId' | 'createdAt'>): Alert {
    const alerts = this.getAlerts();
    const newAlert: Alert = {
      ...alert,
      alertId: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
    };
    
    alerts.push(newAlert);
    this.setItem(STORAGE_KEYS.ALERTS, alerts);
    return newAlert;
  }

  updateAlert(alertId: string, updates: Partial<Alert>): void {
    const alerts = this.getAlerts();
    const index = alerts.findIndex(alert => alert.alertId === alertId);
    
    if (index !== -1) {
      alerts[index] = { ...alerts[index], ...updates };
      this.setItem(STORAGE_KEYS.ALERTS, alerts);
    }
  }

  removeAlert(alertId: string): void {
    const alerts = this.getAlerts();
    const filtered = alerts.filter(alert => alert.alertId !== alertId);
    this.setItem(STORAGE_KEYS.ALERTS, filtered);
  }

  getActiveAlerts(): Alert[] {
    return this.getAlerts().filter(alert => alert.status === 'active');
  }

  // Portfolio management
  getPortfolio(): PortfolioEntry[] {
    return this.getItem(STORAGE_KEYS.PORTFOLIO, []);
  }

  addPortfolioEntry(entry: Omit<PortfolioEntry, 'currentValue' | 'profitLoss' | 'profitLossPercentage'>): void {
    const portfolio = this.getPortfolio();
    const newEntry: PortfolioEntry = {
      ...entry,
      currentValue: entry.quantity * entry.buyPrice, // Will be updated with real prices
      profitLoss: 0,
      profitLossPercentage: 0,
    };
    
    portfolio.push(newEntry);
    this.setItem(STORAGE_KEYS.PORTFOLIO, portfolio);
  }

  updatePortfolioEntry(userId: string, assetId: string, updates: Partial<PortfolioEntry>): void {
    const portfolio = this.getPortfolio();
    const index = portfolio.findIndex(entry => 
      entry.userId === userId && entry.assetId === assetId
    );
    
    if (index !== -1) {
      portfolio[index] = { ...portfolio[index], ...updates };
      this.setItem(STORAGE_KEYS.PORTFOLIO, portfolio);
    }
  }

  removePortfolioEntry(userId: string, assetId: string): void {
    const portfolio = this.getPortfolio();
    const filtered = portfolio.filter(entry => 
      !(entry.userId === userId && entry.assetId === assetId)
    );
    this.setItem(STORAGE_KEYS.PORTFOLIO, filtered);
  }

  getUserPortfolio(userId: string): PortfolioEntry[] {
    return this.getPortfolio().filter(entry => entry.userId === userId);
  }

  // Settings management
  getSettings(): Record<string, any> {
    return this.getItem(STORAGE_KEYS.SETTINGS, {
      theme: 'dark',
      currency: 'USD',
      refreshInterval: 60000, // 1 minute
      notifications: {
        desktop: true,
        sound: false,
      },
    });
  }

  updateSettings(settings: Record<string, any>): void {
    const currentSettings = this.getSettings();
    const updatedSettings = { ...currentSettings, ...settings };
    this.setItem(STORAGE_KEYS.SETTINGS, updatedSettings);
  }

  // Utility methods
  clearAllData(): void {
    if (!this.isClient) return;
    
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  }

  exportData(): string {
    const data = {
      userData: this.getUserData(),
      watchlist: this.getWatchlist(),
      alerts: this.getAlerts(),
      portfolio: this.getPortfolio(),
      settings: this.getSettings(),
      exportedAt: new Date().toISOString(),
    };
    
    return JSON.stringify(data, null, 2);
  }

  importData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      
      if (data.userData) this.setUserData(data.userData);
      if (data.watchlist) this.setItem(STORAGE_KEYS.WATCHLIST, data.watchlist);
      if (data.alerts) this.setItem(STORAGE_KEYS.ALERTS, data.alerts);
      if (data.portfolio) this.setItem(STORAGE_KEYS.PORTFOLIO, data.portfolio);
      if (data.settings) this.setItem(STORAGE_KEYS.SETTINGS, data.settings);
      
      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      return false;
    }
  }
}

// Alert checking service
export class AlertService {
  private storageService = new StorageService();

  checkPriceAlerts(assets: Asset[]): Alert[] {
    const alerts = this.storageService.getActiveAlerts();
    const triggeredAlerts: Alert[] = [];

    alerts.forEach(alert => {
      const asset = assets.find(a => a.assetId === alert.assetId);
      if (!asset) return;

      let triggered = false;

      switch (alert.type) {
        case 'price_above':
          triggered = asset.currentPrice >= alert.value;
          break;
        case 'price_below':
          triggered = asset.currentPrice <= alert.value;
          break;
        case 'volume_spike':
          // Volume spike detection would need historical data
          // For now, we'll use a simple threshold
          if (asset.volume24h && asset.marketCap) {
            const volumeRatio = asset.volume24h / asset.marketCap;
            triggered = volumeRatio >= alert.value;
          }
          break;
      }

      if (triggered) {
        this.storageService.updateAlert(alert.alertId, { status: 'triggered' });
        triggeredAlerts.push({ ...alert, status: 'triggered' });
      }
    });

    return triggeredAlerts;
  }

  async sendNotification(alert: Alert, asset: Asset): Promise<void> {
    if (!('Notification' in window)) return;

    if (Notification.permission === 'granted') {
      const notification = new Notification(`TokenTracker Alert`, {
        body: `${asset.symbol} has ${alert.type.replace('_', ' ')} $${alert.value}. Current price: $${asset.currentPrice}`,
        icon: asset.image || '/favicon.ico',
        tag: alert.alertId,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      // Auto-close after 5 seconds
      setTimeout(() => notification.close(), 5000);
    }
  }

  async requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) return false;

    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return Notification.permission === 'granted';
  }
}

// Export singleton instances
export const storageService = new StorageService();
export const alertService = new AlertService();
