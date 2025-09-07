'use client';

import { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

interface PrimaryButtonProps {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'default' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function PrimaryButton({
  children,
  onClick,
  disabled = false,
  loading = false,
  variant = 'default',
  size = 'md',
  className = '',
}: PrimaryButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2';
  
  const variantClasses = {
    default: 'btn-primary',
    secondary: 'btn-secondary',
    outline: 'border-2 border-purple-500 text-purple-400 hover:bg-purple-500 hover:text-white',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg',
  };

  const disabledClasses = disabled || loading ? 'opacity-50 cursor-not-allowed' : '';

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabledClasses} ${className}`}
    >
      {loading && <Loader2 size={16} className="animate-spin mr-2" />}
      {children}
    </button>
  );
}
