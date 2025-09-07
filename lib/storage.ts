import { User, Alert, PortfolioEntry } from './types';

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

  // Generic storage methods
  private setItem(key: string, value: any): void {
    if (!this.isClient) return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }

  private getItem<T>(key: string, defaultValue: T): T {
    if (!this.isClient) return defaultValue;
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return defaultValue;
    }
  }

  private removeItem(key: string): void {
    if (!this.isClient) return;
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing from localStorage:', error);
    }
  }

  // User data management
  saveUserData(userData: Partial<User>): void {
    const existingData = this.getUserData();
    const updatedData = { ...existingData, ...userData };
    this.setItem(STORAGE_KEYS.USER_DATA, updatedData);
  }

  getUserData(): Partial<User> {
    return this.getItem(STORAGE_KEYS.USER_DATA, {
      connectedWallets: [],
      watchlist: [],
      notificationSettings: {
        priceAlerts: true,
        trendAlerts: true,
        portfolioUpdates: true,
      },
    });
  }

  // Watchlist management
  getWatchlist(): string[] {
    return this.getItem(STORAGE_KEYS.WATCHLIST, []);
  }

  addToWatchlist(assetId: string): void {
    const watchlist = this.getWatchlist();
    if (!watchlist.includes(assetId)) {
      watchlist.push(assetId);
      this.setItem(STORAGE_KEYS.WATCHLIST, watchlist);
    }
  }

  removeFromWatchlist(assetId: string): void {
    const watchlist = this.getWatchlist();
    const updatedWatchlist = watchlist.filter(id => id !== assetId);
    this.setItem(STORAGE_KEYS.WATCHLIST, updatedWatchlist);
  }

  isInWatchlist(assetId: string): boolean {
    return this.getWatchlist().includes(assetId);
  }

  // Alerts management
  getAlerts(): Alert[] {
    return this.getItem(STORAGE_KEYS.ALERTS, []);
  }

  saveAlert(alert: Alert): void {
    const alerts = this.getAlerts();
    const existingIndex = alerts.findIndex(a => a.alertId === alert.alertId);
    
    if (existingIndex >= 0) {
      alerts[existingIndex] = alert;
    } else {
      alerts.push(alert);
    }
    
    this.setItem(STORAGE_KEYS.ALERTS, alerts);
  }

  removeAlert(alertId: string): void {
    const alerts = this.getAlerts();
    const updatedAlerts = alerts.filter(alert => alert.alertId !== alertId);
    this.setItem(STORAGE_KEYS.ALERTS, updatedAlerts);
  }

  updateAlertStatus(alertId: string, status: Alert['status']): void {
    const alerts = this.getAlerts();
    const alert = alerts.find(a => a.alertId === alertId);
    if (alert) {
      alert.status = status;
      this.setItem(STORAGE_KEYS.ALERTS, alerts);
    }
  }

  // Portfolio management
  getPortfolio(): PortfolioEntry[] {
    return this.getItem(STORAGE_KEYS.PORTFOLIO, []);
  }

  savePortfolioEntry(entry: PortfolioEntry): void {
    const portfolio = this.getPortfolio();
    const existingIndex = portfolio.findIndex(
      p => p.userId === entry.userId && p.assetId === entry.assetId
    );
    
    if (existingIndex >= 0) {
      portfolio[existingIndex] = entry;
    } else {
      portfolio.push(entry);
    }
    
    this.setItem(STORAGE_KEYS.PORTFOLIO, portfolio);
  }

  removePortfolioEntry(userId: string, assetId: string): void {
    const portfolio = this.getPortfolio();
    const updatedPortfolio = portfolio.filter(
      entry => !(entry.userId === userId && entry.assetId === assetId)
    );
    this.setItem(STORAGE_KEYS.PORTFOLIO, updatedPortfolio);
  }

  // Settings management
  getSettings(): any {
    return this.getItem(STORAGE_KEYS.SETTINGS, {
      theme: 'dark',
      currency: 'USD',
      notifications: true,
      autoRefresh: true,
      refreshInterval: 30000, // 30 seconds
    });
  }

  saveSettings(settings: any): void {
    const existingSettings = this.getSettings();
    const updatedSettings = { ...existingSettings, ...settings };
    this.setItem(STORAGE_KEYS.SETTINGS, updatedSettings);
  }

  // Clear all data
  clearAllData(): void {
    Object.values(STORAGE_KEYS).forEach(key => {
      this.removeItem(key);
    });
  }

  // Export/Import functionality
  exportData(): string {
    const data = {
      userData: this.getUserData(),
      watchlist: this.getWatchlist(),
      alerts: this.getAlerts(),
      portfolio: this.getPortfolio(),
      settings: this.getSettings(),
      exportDate: new Date().toISOString(),
    };
    return JSON.stringify(data, null, 2);
  }

  importData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      
      if (data.userData) this.saveUserData(data.userData);
      if (data.watchlist) this.setItem(STORAGE_KEYS.WATCHLIST, data.watchlist);
      if (data.alerts) this.setItem(STORAGE_KEYS.ALERTS, data.alerts);
      if (data.portfolio) this.setItem(STORAGE_KEYS.PORTFOLIO, data.portfolio);
      if (data.settings) this.saveSettings(data.settings);
      
      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      return false;
    }
  }
}

// Alert monitoring service
export class AlertService {
  private storageService = new StorageService();
  private checkInterval: NodeJS.Timeout | null = null;
  private isMonitoring = false;

  startMonitoring(): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.checkInterval = setInterval(() => {
      this.checkAlerts();
    }, 30000); // Check every 30 seconds
  }

  stopMonitoring(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    this.isMonitoring = false;
  }

  private async checkAlerts(): Promise<void> {
    const alerts = this.storageService.getAlerts();
    const activeAlerts = alerts.filter(alert => alert.status === 'active');
    
    // This would typically fetch current prices and check against alert conditions
    // For now, we'll simulate alert triggering
    for (const alert of activeAlerts) {
      // Simulate random alert triggering for demo purposes
      if (Math.random() < 0.1) { // 10% chance per check
        this.triggerAlert(alert);
      }
    }
  }

  private triggerAlert(alert: Alert): void {
    // Update alert status
    this.storageService.updateAlertStatus(alert.alertId, 'triggered');
    
    // Show notification if supported
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('TokenTracker Alert', {
        body: `${alert.type.replace('_', ' ')} alert triggered for ${alert.assetId}`,
        icon: '/favicon.ico',
      });
    }
    
    // Dispatch custom event for UI updates
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('alertTriggered', { 
        detail: alert 
      }));
    }
  }

  async requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      return false;
    }
    
    if (Notification.permission === 'granted') {
      return true;
    }
    
    if (Notification.permission === 'denied') {
      return false;
    }
    
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
}

// Export singleton instances
export const storageService = new StorageService();
export const alertService = new AlertService();
