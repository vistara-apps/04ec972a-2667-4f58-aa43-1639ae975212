'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, X, Plus, Star, TrendingUp } from 'lucide-react';
import { Asset } from '@/lib/types';
import { coinGeckoAPI } from '@/lib/api';
import { storageService } from '@/lib/storage';
import { Card } from './Card';
import { PrimaryButton } from './PrimaryButton';
import { formatCurrency, formatPercentage, getPercentageColor } from '@/lib/utils';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddToWatchlist?: (asset: Asset) => void;
  onAddToPortfolio?: (asset: Asset) => void;
  mode?: 'watchlist' | 'portfolio';
}

export function SearchModal({ 
  isOpen, 
  onClose, 
  onAddToWatchlist, 
  onAddToPortfolio,
  mode = 'watchlist' 
}: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(false);
  const [popularAssets, setPopularAssets] = useState<Asset[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Focus search input when modal opens
      setTimeout(() => searchInputRef.current?.focus(), 100);
      
      // Load popular assets if no query
      if (!query) {
        loadPopularAssets();
      }
    }
  }, [isOpen, query]);

  useEffect(() => {
    if (query.length > 2) {
      const debounceTimer = setTimeout(() => {
        searchAssets(query);
      }, 300);

      return () => clearTimeout(debounceTimer);
    } else {
      setResults([]);
    }
  }, [query]);

  const loadPopularAssets = async () => {
    try {
      setLoading(true);
      const assets = await coinGeckoAPI.getMarketData(20);
      setPopularAssets(assets);
    } catch (error) {
      console.error('Error loading popular assets:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchAssets = async (searchQuery: string) => {
    try {
      setLoading(true);
      const assets = await coinGeckoAPI.searchAssets(searchQuery);
      setResults(assets);
    } catch (error) {
      console.error('Error searching assets:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToWatchlist = (asset: Asset) => {
    storageService.addToWatchlist(asset);
    onAddToWatchlist?.(asset);
    onClose();
  };

  const handleAddToPortfolio = (asset: Asset) => {
    onAddToPortfolio?.(asset);
    onClose();
  };

  const isInWatchlist = (assetId: string) => {
    return storageService.isInWatchlist(assetId);
  };

  const renderAssetItem = (asset: Asset) => (
    <div
      key={asset.assetId}
      className="flex items-center justify-between p-4 hover:bg-white hover:bg-opacity-5 rounded-lg transition-colors duration-200"
    >
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
          {asset.image ? (
            <img src={asset.image} alt={asset.symbol} className="w-8 h-8 rounded-full" />
          ) : (
            asset.symbol.charAt(0)
          )}
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-bold text-white">{asset.symbol}</span>
            {isInWatchlist(asset.assetId) && (
              <Star size={14} className="text-yellow-400 fill-current" />
            )}
          </div>
          <p className="text-sm text-gray-400">{asset.name}</p>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="text-right">
          <div className="font-bold text-white">
            {formatCurrency(asset.currentPrice)}
          </div>
          <div className={`text-sm ${getPercentageColor(asset.priceChange24h)}`}>
            {formatPercentage(asset.priceChange24h)}
          </div>
        </div>

        <div className="flex space-x-2">
          {mode === 'watchlist' && (
            <button
              onClick={() => handleAddToWatchlist(asset)}
              disabled={isInWatchlist(asset.assetId)}
              className={`p-2 rounded-lg transition-colors duration-200 ${
                isInWatchlist(asset.assetId)
                  ? 'bg-yellow-500 bg-opacity-20 text-yellow-400 cursor-not-allowed'
                  : 'bg-purple-500 bg-opacity-20 text-purple-400 hover:bg-opacity-30'
              }`}
              title={isInWatchlist(asset.assetId) ? 'Already in watchlist' : 'Add to watchlist'}
            >
              <Star size={16} className={isInWatchlist(asset.assetId) ? 'fill-current' : ''} />
            </button>
          )}
          
          {mode === 'portfolio' && (
            <button
              onClick={() => handleAddToPortfolio(asset)}
              className="p-2 rounded-lg bg-green-500 bg-opacity-20 text-green-400 hover:bg-opacity-30 transition-colors duration-200"
              title="Add to portfolio"
            >
              <Plus size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <Card variant="glass" className="w-full max-w-2xl max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white border-opacity-10">
          <div className="flex items-center space-x-3">
            <Search size={24} className="text-purple-400" />
            <h2 className="text-xl font-bold text-white">
              {mode === 'watchlist' ? 'Add to Watchlist' : 'Add to Portfolio'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white hover:bg-opacity-10 rounded-lg transition-colors duration-200"
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-6 border-b border-white border-opacity-10">
          <div className="relative">
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search cryptocurrencies..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white bg-opacity-5 border border-white border-opacity-10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:bg-opacity-10 transition-all duration-200"
            />
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
            </div>
          )}

          {!loading && query.length > 2 && results.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-400">No results found for "{query}"</p>
            </div>
          )}

          {!loading && query.length > 2 && results.length > 0 && (
            <div className="p-4">
              <h3 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wide">
                Search Results
              </h3>
              <div className="space-y-1">
                {results.map(renderAssetItem)}
              </div>
            </div>
          )}

          {!loading && query.length <= 2 && popularAssets.length > 0 && (
            <div className="p-4">
              <div className="flex items-center space-x-2 mb-3">
                <TrendingUp size={16} className="text-purple-400" />
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
                  Popular Cryptocurrencies
                </h3>
              </div>
              <div className="space-y-1">
                {popularAssets.map(renderAssetItem)}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white border-opacity-10">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-400">
              {mode === 'watchlist' 
                ? 'Add tokens to track their performance' 
                : 'Add tokens to your portfolio'
              }
            </p>
            <PrimaryButton variant="secondary" onClick={onClose}>
              Cancel
            </PrimaryButton>
          </div>
        </div>
      </Card>
    </div>
  );
}
