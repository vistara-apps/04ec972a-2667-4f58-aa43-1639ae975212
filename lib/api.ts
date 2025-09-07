import { Asset, TrendScan } from './types';
import { COINGECKO_API_BASE } from './constants';

// CoinGecko API integration
export class CoinGeckoAPI {
  private baseUrl = COINGECKO_API_BASE;
  private cache = new Map<string, { data: any; timestamp: number }>();
  private cacheTimeout = 60000; // 1 minute cache

  private async fetchWithCache(url: string): Promise<any> {
    const cached = this.cache.get(url);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      this.cache.set(url, { data, timestamp: Date.now() });
      return data;
    } catch (error) {
      console.error('API fetch error:', error);
      throw error;
    }
  }

  async getMarketData(limit: number = 250): Promise<Asset[]> {
    const url = `${this.baseUrl}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${limit}&page=1&sparkline=false&price_change_percentage=24h`;
    const data = await this.fetchWithCache(url);
    
    return data.map((coin: any): Asset => ({
      assetId: coin.id,
      symbol: coin.symbol.toUpperCase(),
      name: coin.name,
      currentPrice: coin.current_price,
      priceChange24h: coin.price_change_percentage_24h || 0,
      marketCap: coin.market_cap,
      volume24h: coin.total_volume,
      image: coin.image,
    }));
  }

  async searchCoins(query: string): Promise<Asset[]> {
    const url = `${this.baseUrl}/search?query=${encodeURIComponent(query)}`;
    const data = await this.fetchWithCache(url);
    
    // Get detailed data for search results
    const coinIds = data.coins.slice(0, 10).map((coin: any) => coin.id).join(',');
    if (!coinIds) return [];
    
    const detailUrl = `${this.baseUrl}/coins/markets?vs_currency=usd&ids=${coinIds}&order=market_cap_desc&per_page=10&page=1&sparkline=false&price_change_percentage=24h`;
    const detailData = await this.fetchWithCache(detailUrl);
    
    return detailData.map((coin: any): Asset => ({
      assetId: coin.id,
      symbol: coin.symbol.toUpperCase(),
      name: coin.name,
      currentPrice: coin.current_price,
      priceChange24h: coin.price_change_percentage_24h || 0,
      marketCap: coin.market_cap,
      volume24h: coin.total_volume,
      image: coin.image,
    }));
  }

  async getCoinById(coinId: string): Promise<Asset | null> {
    try {
      const url = `${this.baseUrl}/coins/markets?vs_currency=usd&ids=${coinId}&order=market_cap_desc&per_page=1&page=1&sparkline=false&price_change_percentage=24h`;
      const data = await this.fetchWithCache(url);
      
      if (!data || data.length === 0) return null;
      
      const coin = data[0];
      return {
        assetId: coin.id,
        symbol: coin.symbol.toUpperCase(),
        name: coin.name,
        currentPrice: coin.current_price,
        priceChange24h: coin.price_change_percentage_24h || 0,
        marketCap: coin.market_cap,
        volume24h: coin.total_volume,
        image: coin.image,
      };
    } catch (error) {
      console.error('Error fetching coin by ID:', error);
      return null;
    }
  }

  async getTrendingCoins(): Promise<TrendScan[]> {
    try {
      const url = `${this.baseUrl}/search/trending`;
      const data = await this.fetchWithCache(url);
      
      return data.coins.slice(0, 10).map((item: any, index: number): TrendScan => ({
        scanId: `trending-${index}`,
        tokenSymbol: item.item.symbol.toUpperCase(),
        trendType: 'social_mentions',
        timestamp: Date.now(),
        score: Math.max(90 - index * 5, 50), // Decreasing score based on ranking
        metadata: {
          socialScore: item.item.market_cap_rank || 0,
          priceChange: 0, // Would need additional API call for price data
        },
      }));
    } catch (error) {
      console.error('Error fetching trending coins:', error);
      return [];
    }
  }
}

// Base Network integration for wallet balances
export class BaseNetworkAPI {
  private rpcUrl = 'https://mainnet.base.org';
  
  async getTokenBalance(walletAddress: string, tokenAddress?: string): Promise<number> {
    try {
      // For ETH balance
      if (!tokenAddress) {
        const response = await fetch(this.rpcUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_getBalance',
            params: [walletAddress, 'latest'],
            id: 1,
          }),
        });
        
        const data = await response.json();
        if (data.result) {
          return parseInt(data.result, 16) / 1e18; // Convert from wei to ETH
        }
      }
      
      // For ERC-20 tokens, would need to call balanceOf function
      // This is a simplified implementation
      return 0;
    } catch (error) {
      console.error('Error fetching balance:', error);
      return 0;
    }
  }

  async getTransactionHistory(walletAddress: string): Promise<any[]> {
    // This would typically use a service like Alchemy or Infura
    // For now, return empty array
    return [];
  }
}

// Trend analysis service
export class TrendAnalysisService {
  private coinGeckoAPI = new CoinGeckoAPI();

  async analyzeTrends(): Promise<TrendScan[]> {
    try {
      // Get trending coins from CoinGecko
      const trendingCoins = await this.coinGeckoAPI.getTrendingCoins();
      
      // Get market data for volume analysis
      const marketData = await this.coinGeckoAPI.getMarketData(100);
      
      // Analyze volume spikes (simplified algorithm)
      const volumeSpikes = marketData
        .filter(coin => coin.volume24h && coin.volume24h > 100000000) // $100M+ volume
        .slice(0, 5)
        .map((coin, index): TrendScan => ({
          scanId: `volume-${index}`,
          tokenSymbol: coin.symbol,
          trendType: 'volume_spike',
          timestamp: Date.now(),
          score: Math.max(85 - index * 5, 60),
          metadata: {
            volumeChange: Math.random() * 200 + 50, // Simulated volume change %
            priceChange: coin.priceChange24h,
          },
        }));

      // Combine trending and volume spike data
      return [...trendingCoins.slice(0, 5), ...volumeSpikes];
    } catch (error) {
      console.error('Error analyzing trends:', error);
      return [];
    }
  }

  async getTokenTrendScore(symbol: string): Promise<number> {
    // Simplified trend scoring algorithm
    try {
      const marketData = await this.coinGeckoAPI.getMarketData(250);
      const token = marketData.find(coin => coin.symbol === symbol);
      
      if (!token) return 0;
      
      let score = 50; // Base score
      
      // Price momentum factor
      if (token.priceChange24h > 10) score += 20;
      else if (token.priceChange24h > 5) score += 10;
      else if (token.priceChange24h < -10) score -= 20;
      
      // Volume factor
      if (token.volume24h && token.volume24h > 50000000) score += 15;
      
      // Market cap factor
      if (token.marketCap && token.marketCap > 1000000000) score += 10;
      
      return Math.min(Math.max(score, 0), 100);
    } catch (error) {
      console.error('Error calculating trend score:', error);
      return 0;
    }
  }
}

// Export singleton instances
export const coinGeckoAPI = new CoinGeckoAPI();
export const baseNetworkAPI = new BaseNetworkAPI();
export const trendAnalysisService = new TrendAnalysisService();
