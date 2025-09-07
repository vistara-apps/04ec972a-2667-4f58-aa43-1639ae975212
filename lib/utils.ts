import { TrendScan, ChartDataPoint } from './types';

export function formatCurrency(value: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatPercentage(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

export function formatNumber(value: number): string {
  if (value >= 1e9) {
    return `${(value / 1e9).toFixed(2)}B`;
  }
  if (value >= 1e6) {
    return `${(value / 1e6).toFixed(2)}M`;
  }
  if (value >= 1e3) {
    return `${(value / 1e3).toFixed(2)}K`;
  }
  return value.toFixed(2);
}

export function getPercentageColor(percentage: number): string {
  if (percentage > 0) return 'text-green-400';
  if (percentage < 0) return 'text-red-400';
  return 'text-gray-400';
}

export function truncateAddress(address: string, chars: number = 4): string {
  if (!address) return '';
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

export function generateMockPortfolioData(): any[] {
  return [
    {
      assetId: 'bitcoin',
      symbol: 'BTC',
      name: 'Bitcoin',
      quantity: 0.5,
      currentPrice: 45000,
      buyPrice: 42000,
      currentValue: 22500,
      profitLoss: 1500,
      profitLossPercentage: 7.14,
      image: '🟠'
    },
    {
      assetId: 'ethereum',
      symbol: 'ETH',
      name: 'Ethereum',
      quantity: 5,
      currentPrice: 2800,
      buyPrice: 3000,
      currentValue: 14000,
      profitLoss: -1000,
      profitLossPercentage: -6.67,
      image: '🔷'
    },
    {
      assetId: 'base',
      symbol: 'BASE',
      name: 'Base Token',
      quantity: 1000,
      currentPrice: 1.25,
      buyPrice: 1.00,
      currentValue: 1250,
      profitLoss: 250,
      profitLossPercentage: 25.0,
      image: '🔵'
    },
    {
      assetId: 'uniswap',
      symbol: 'UNI',
      name: 'Uniswap',
      quantity: 100,
      currentPrice: 8.50,
      buyPrice: 10.00,
      currentValue: 850,
      profitLoss: -150,
      profitLossPercentage: -15.0,
      image: '🦄'
    }
  ];
}

export function generateMockTrendData(): TrendScan[] {
  return [
    {
      scanId: '1',
      tokenSymbol: 'DEGEN',
      trendType: 'volume_spike',
      timestamp: Date.now(),
      score: 95,
      metadata: { volumeChange: 340 }
    },
    {
      scanId: '2',
      tokenSymbol: 'HIGHER',
      trendType: 'social_mentions',
      timestamp: Date.now() - 3600000,
      score: 88,
      metadata: { socialScore: 78 }
    },
    {
      scanId: '3',
      tokenSymbol: 'BALD',
      trendType: 'price_momentum',
      timestamp: Date.now() - 7200000,
      score: 82,
      metadata: { priceChange: 45 }
    }
  ];
}

export function generateMockChartData(): ChartDataPoint[] {
  const data: ChartDataPoint[] = [];
  const now = Date.now();
  const oneHour = 3600000;
  
  for (let i = 23; i >= 0; i--) {
    data.push({
      timestamp: now - (i * oneHour),
      value: 38000 + Math.random() * 4000 + Math.sin(i * 0.5) * 2000
    });
  }
  
  return data;
}
