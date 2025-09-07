'use client';

import { useState, useEffect } from 'react';
import { Search, X, Plus, Eye, Loader2 } from 'lucide-react';
import { Asset } from '@/lib/types';
import { useSearch, useWatchlist } from '@/lib/hooks';
import { Card } from './Card';
import { PrimaryButton } from './PrimaryButton';
import { formatCurrency, formatPercentage, getPercentageColor } from '@/lib/utils';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddToWatchlist?: (asset: Asset) => void;
  onAddToPortfolio?: (asset: Asset) => void;
  title?: string;
  mode?: 'watchlist' | 'portfolio';
}

export function SearchModal({ 
  isOpen, 
  onClose, 
  onAddToWatchlist, 
  onAddToPortfolio,
  title = 'Search Tokens',
  mode = 'watchlist'
}: SearchModalProps) {
  const { query, results, loading, error, search, clearSearch } = useSearch();
  const { isInWatchlist, addToWatchlist } = useWatchlist();
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  useEffect(() => {
    if (!isOpen) {
      clearSearch();
      setSelectedAsset(null);
    }
  }, [isOpen, clearSearch]);

  const handleAddToWatchlist = (asset: Asset) => {
    addToWatchlist(asset.assetId);
    onAddToWatchlist?.(asset);
  };

  const handleAddToPortfolio = (asset: Asset) => {
    setSelectedAsset(asset);
    onAddToPortfolio?.(asset);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <Card variant="glass" className="w-full max-w-2xl max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white border-opacity-10">
          <h2 className="text-xl font-bold text-white">{title}</h2>
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
              type="text"
              placeholder="Search for tokens (e.g., Bitcoin, ETH, DOGE)..."
              value={query}
              onChange={(e) => search(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white bg-opacity-5 border border-white border-opacity-10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-400 focus:bg-opacity-10 transition-all duration-200"
              autoFocus
            />
            {loading && (
              <Loader2 size={20} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-purple-400 animate-spin" />
            )}
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto">
          {error && (
            <div className="p-6 text-center">
              <p className="text-red-400 mb-4">Error: {error}</p>
              <PrimaryButton onClick={() => search(query)} variant="secondary">
                Try Again
              </PrimaryButton>
            </div>
          )}

          {!loading && !error && query && results.length === 0 && (
            <div className="p-6 text-center">
              <p className="text-gray-400 mb-4">No tokens found for "{query}"</p>
              <p className="text-sm text-gray-500">Try searching with different keywords</p>
            </div>
          )}

          {!query && !loading && (
            <div className="p-6 text-center">
              <Search size={48} className="mx-auto text-gray-600 mb-4" />
              <p className="text-gray-400 mb-2">Search for cryptocurrencies</p>
              <p className="text-sm text-gray-500">Start typing to find tokens to add to your {mode}</p>
            </div>
          )}

          {results.length > 0 && (
            <div className="p-6 space-y-3">
              {results.map((asset) => (
                <div
                  key={asset.assetId}
                  className="flex items-center justify-between p-4 bg-white bg-opacity-5 rounded-lg hover:bg-opacity-10 transition-all duration-200"
                >
                  <div className="flex items-center space-x-3">
                    {asset.image ? (
                      <img 
                        src={asset.image} 
                        alt={asset.name}
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">
                          {asset.symbol.charAt(0)}
                        </span>
                      </div>
                    )}
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-white">{asset.symbol}</span>
                        <span className="text-sm text-gray-400">{asset.name}</span>
                      </div>
                      <div className="flex items-center space-x-4 text-sm">
                        <span className="text-white">{formatCurrency(asset.currentPrice)}</span>
                        <span className={getPercentageColor(asset.priceChange24h)}>
                          {formatPercentage(asset.priceChange24h)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {mode === 'watchlist' && (
                      <button
                        onClick={() => handleAddToWatchlist(asset)}
                        disabled={isInWatchlist(asset.assetId)}
                        className={`p-2 rounded-lg transition-all duration-200 ${
                          isInWatchlist(asset.assetId)
                            ? 'bg-green-500 bg-opacity-20 text-green-400 cursor-not-allowed'
                            : 'bg-purple-500 bg-opacity-20 text-purple-400 hover:bg-opacity-30'
                        }`}
                        title={isInWatchlist(asset.assetId) ? 'Already in watchlist' : 'Add to watchlist'}
                      >
                        <Eye size={16} />
                      </button>
                    )}
                    
                    {mode === 'portfolio' && (
                      <button
                        onClick={() => handleAddToPortfolio(asset)}
                        className="p-2 bg-purple-500 bg-opacity-20 text-purple-400 hover:bg-opacity-30 rounded-lg transition-all duration-200"
                        title="Add to portfolio"
                      >
                        <Plus size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white border-opacity-10">
          <div className="flex items-center justify-between text-sm text-gray-400">
            <span>Powered by CoinGecko API</span>
            <span>{results.length} results</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
