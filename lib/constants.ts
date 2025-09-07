export const APP_CONFIG = {
  name: 'TokenTracker',
  tagline: 'Your all-in-one crypto portfolio tracker and trend scanner',
  version: '1.0.0',
};

export const NAVIGATION_ITEMS = [
  { id: 'portfolio', label: 'Portfolio', icon: 'Wallet' },
  { id: 'watchlist', label: 'Watchlist', icon: 'Eye' },
  { id: 'trends', label: 'Trends', icon: 'TrendingUp' },
  { id: 'alerts', label: 'Alerts', icon: 'Bell' },
] as const;

export const TREND_TYPES = {
  volume_spike: 'Volume Spike',
  social_mentions: 'Social Buzz',
  dev_activity: 'Dev Activity',
  price_momentum: 'Price Momentum',
} as const;

export const ALERT_TYPES = {
  price_above: 'Price Above',
  price_below: 'Price Below',
  volume_spike: 'Volume Spike',
  trend_alert: 'Trend Alert',
} as const;

export const MOCK_WALLET_ADDRESS = '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b7';

export const COINGECKO_API_BASE = 'https://api.coingecko.com/api/v3';
