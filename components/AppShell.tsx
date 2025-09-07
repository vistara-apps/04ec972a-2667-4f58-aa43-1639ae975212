'use client';

import { useState } from 'react';
import { Wallet, Eye, TrendingUp, Bell, Menu, X } from 'lucide-react';
import { ViewMode } from '@/lib/types';

interface AppShellProps {
  children: React.ReactNode;
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
}

const navigationItems = [
  { id: 'portfolio' as ViewMode, label: 'Portfolio', icon: Wallet },
  { id: 'watchlist' as ViewMode, label: 'Watchlist', icon: Eye },
  { id: 'trends' as ViewMode, label: 'Trends', icon: TrendingUp },
  { id: 'alerts' as ViewMode, label: 'Alerts', icon: Bell },
];

export function AppShell({ children, currentView, onViewChange }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between p-4 glass-card m-4 mb-0">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">T</span>
          </div>
          <h1 className="text-xl font-bold gradient-text">TokenTracker</h1>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 hover:bg-white hover:bg-opacity-10 rounded-lg transition-colors duration-200"
        >
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <div className={`
          fixed lg:static inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          <div className="h-full glass-card m-4 p-6">
            {/* Desktop Logo */}
            <div className="hidden lg:flex items-center space-x-3 mb-8">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">T</span>
              </div>
              <div>
                <h1 className="text-xl font-bold gradient-text">TokenTracker</h1>
                <p className="text-sm text-gray-400">Crypto Tracker</p>
              </div>
            </div>

            {/* Navigation */}
            <nav className="space-y-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onViewChange(item.id);
                      setSidebarOpen(false);
                    }}
                    className={`sidebar-item w-full ${isActive ? 'active' : ''}`}
                  >
                    <Icon size={20} />
                    <span className="font-medium">{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Settings Button */}
            <div className="absolute bottom-6 left-6 right-6">
              <button className="btn-primary w-full">
                Settings
              </button>
            </div>
          </div>
        </div>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <div className="flex-1 lg:ml-0">
          <main className="p-4">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
