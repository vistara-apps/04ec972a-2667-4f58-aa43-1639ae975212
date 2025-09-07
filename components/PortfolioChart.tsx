'use client';

import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { ChartDataPoint } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';

interface PortfolioChartProps {
  data: ChartDataPoint[];
  className?: string;
}

export function PortfolioChart({ data, className = '' }: PortfolioChartProps) {
  const formatXAxis = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-card p-3 border border-white border-opacity-20">
          <p className="text-white text-sm">
            {new Date(label).toLocaleString()}
          </p>
          <p className="text-purple-400 font-semibold">
            {formatCurrency(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`h-64 ${className}`}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <XAxis 
            dataKey="timestamp"
            tickFormatter={formatXAxis}
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#9CA3AF', fontSize: 12 }}
          />
          <YAxis 
            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#9CA3AF', fontSize: 12 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="value"
            stroke="url(#gradient)"
            strokeWidth={3}
            dot={false}
            activeDot={{ r: 6, fill: '#8B5CF6' }}
          />
          <defs>
            <linearGradient id="gradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#8B5CF6" />
              <stop offset="100%" stopColor="#EC4899" />
            </linearGradient>
          </defs>
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
