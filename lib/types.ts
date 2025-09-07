// User entity
export interface User {
  userId: string;
  farcasterId?: string;
  connectedWallets: string[];
  watchlist: string[];
  notificationSettings: NotificationSettings;
}

export interface NotificationSettings {
  priceAlerts: boolean;
  trendAlerts: boolean;
  portfolioUpdates: boolean;
}

// Asset entity
export interface Asset {
  assetId: string;
  symbol: string;
  name: string;
  currentPrice: number;
  priceChange24h: number;
  marketCap?: number;
  volume24h?: number;
  image?: string;
}

// Portfolio entry entity
export interface PortfolioEntry {
  userId: string;
  assetId: string;
  quantity: number;
  buyPrice: number;
  buyTimestamp: number;
  sellPrice?: number;
  sellTimestamp?: number;
  currentValue: number;
  profitLoss: number;
  profitLossPercentage: number;
}

// Alert entity
export interface Alert {
  alertId: string;
  userId: string;
  assetId: string;
  type: 'price_above' | 'price_below' | 'volume_spike' | 'trend_alert';
  value: number;
  status: 'active' | 'triggered' | 'disabled';
  createdAt: number;
}

// Trend scan entity
export interface TrendScan {
  scanId: string;
  tokenSymbol: string;
  trendType: 'volume_spike' | 'social_mentions' | 'dev_activity' | 'price_momentum';
  timestamp: number;
  score: number;
  metadata?: {
    volumeChange?: number;
    socialScore?: number;
    priceChange?: number;
  };
}

// UI component types
export interface DashboardMetrics {
  totalValue: number;
  totalPnL: number;
  totalPnLPercentage: number;
  topGainer: {
    symbol: string;
    change: number;
  };
  topLoser: {
    symbol: string;
    change: number;
  };
}

export interface ChartDataPoint {
  timestamp: number;
  value: number;
}

export type ViewMode = 'portfolio' | 'watchlist' | 'trends' | 'alerts';
