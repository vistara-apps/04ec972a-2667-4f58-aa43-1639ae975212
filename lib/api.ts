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

  async getAssetById(id: string): Promise<Asset | null> {
    try {
      const url = `${this.baseUrl}/coins/${id}`;
      const data = await this.fetchWithCache(url);
      
      return {
        assetId: data.id,
        symbol: data.symbol.toUpperCase(),
        name: data.name,
        currentPrice: data.market_data.current_price.usd,
        priceChange24h: data.market_data.price_change_percentage_24h || 0,
        marketCap: data.market_data.market_cap.usd,
        volume24h: data.market_data.total_volume.usd,
        image: data.image.small,
      };
    } catch (error) {
      console.error(`Error fetching asset ${id}:`, error);
      return null;
    }
  }

  async searchAssets(query: string): Promise<Asset[]> {
    const url = `${this.baseUrl}/search?query=${encodeURIComponent(query)}`;
    const data = await this.fetchWithCache(url);
    
    // Get detailed data for top 10 results
    const coinIds = data.coins.slice(0, 10).map((coin: any) => coin.id);
    const detailedData = await Promise.all(
      coinIds.map((id: string) => this.getAssetById(id))
    );
    
    return detailedData.filter((asset): asset is Asset => asset !== null);
  }

  async getTrendingAssets(): Promise<TrendScan[]> {
    const url = `${this.baseUrl}/search/trending`;
    const data = await this.fetchWithCache(url);
    
    return data.coins.slice(0, 10).map((coin: any, index: number): TrendScan => ({
      scanId: `trending-${coin.item.id}-${Date.now()}`,
      tokenSymbol: coin.item.symbol.toUpperCase(),
      trendType: 'social_mentions',
      timestamp: Date.now(),
      score: Math.max(100 - index * 10, 50), // Decreasing score based on ranking
      metadata: {
        socialScore: coin.item.market_cap_rank || 0,
        priceChange: 0, // CoinGecko trending doesn't provide price change
      },
    }));
  }
}

// Base Network integration for wallet balances
export class BaseNetworkAPI {
  private rpcUrl = 'https://mainnet.base.org';

  async getTokenBalance(walletAddress: string, tokenAddress: string): Promise<number> {
    try {
      // This is a simplified implementation
      // In a real app, you'd use a proper Web3 library like viem or ethers
      const response = await fetch(this.rpcUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_call',
          params: [
            {
              to: tokenAddress,
              data: `0x70a08231000000000000000000000000${walletAddress.slice(2)}`, // balanceOf(address)
            },
            'latest',
          ],
          id: 1,
        }),
      });

      const data = await response.json();
      if (data.result) {
        // Convert hex to decimal and adjust for token decimals (assuming 18)
        return parseInt(data.result, 16) / Math.pow(10, 18);
      }
      return 0;
    } catch (error) {
      console.error('Error fetching token balance:', error);
      return 0;
    }
  }

  async getETHBalance(walletAddress: string): Promise<number> {
    try {
      const response = await fetch(this.rpcUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_getBalance',
          params: [walletAddress, 'latest'],
          id: 1,
        }),
      });

      const data = await response.json();
      if (data.result) {
        // Convert hex to decimal and adjust for ETH decimals
        return parseInt(data.result, 16) / Math.pow(10, 18);
      }
      return 0;
    } catch (error) {
      console.error('Error fetching ETH balance:', error);
      return 0;
    }
  }
}

// Trend analysis service
export class TrendAnalysisService {
  private coinGeckoAPI = new CoinGeckoAPI();

  async analyzeVolumeSpikes(): Promise<TrendScan[]> {
    try {
      const marketData = await this.coinGeckoAPI.getMarketData(100);
      const volumeSpikes: TrendScan[] = [];

      marketData.forEach((asset, index) => {
        // Simple volume spike detection (in a real app, you'd compare with historical data)
        if (asset.volume24h && asset.marketCap) {
          const volumeToMarketCapRatio = asset.volume24h / asset.marketCap;
          
          if (volumeToMarketCapRatio > 0.1) { // 10% volume to market cap ratio threshold
            volumeSpikes.push({
              scanId: `volume-${asset.assetId}-${Date.now()}`,
              tokenSymbol: asset.symbol,
              trendType: 'volume_spike',
              timestamp: Date.now(),
              score: Math.min(volumeToMarketCapRatio * 1000, 100),
              metadata: {
                volumeChange: volumeToMarketCapRatio * 100,
              },
            });
          }
        }
      });

      return volumeSpikes.slice(0, 10); // Return top 10
    } catch (error) {
      console.error('Error analyzing volume spikes:', error);
      return [];
    }
  }

  async analyzePriceMomentum(): Promise<TrendScan[]> {
    try {
      const marketData = await this.coinGeckoAPI.getMarketData(100);
      const momentumTrends: TrendScan[] = [];

      marketData.forEach((asset) => {
        if (Math.abs(asset.priceChange24h) > 10) { // 10% price change threshold
          momentumTrends.push({
            scanId: `momentum-${asset.assetId}-${Date.now()}`,
            tokenSymbol: asset.symbol,
            trendType: 'price_momentum',
            timestamp: Date.now(),
            score: Math.min(Math.abs(asset.priceChange24h) * 2, 100),
            metadata: {
              priceChange: asset.priceChange24h,
            },
          });
        }
      });

      return momentumTrends
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);
    } catch (error) {
      console.error('Error analyzing price momentum:', error);
      return [];
    }
  }

  async getCombinedTrends(): Promise<TrendScan[]> {
    try {
      const [trending, volumeSpikes, momentum] = await Promise.all([
        this.coinGeckoAPI.getTrendingAssets(),
        this.analyzeVolumeSpikes(),
        this.analyzePriceMomentum(),
      ]);

      // Combine and deduplicate trends
      const allTrends = [...trending, ...volumeSpikes, ...momentum];
      const uniqueTrends = allTrends.filter((trend, index, self) => 
        index === self.findIndex(t => t.tokenSymbol === trend.tokenSymbol)
      );

      return uniqueTrends
        .sort((a, b) => b.score - a.score)
        .slice(0, 15);
    } catch (error) {
      console.error('Error getting combined trends:', error);
      return [];
    }
  }
}

// Export singleton instances
export const coinGeckoAPI = new CoinGeckoAPI();
export const baseNetworkAPI = new BaseNetworkAPI();
export const trendAnalysisService = new TrendAnalysisService();
