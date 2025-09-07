'use client';

import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'glass' | 'gradient';
  onClick?: () => void;
}

export function Card({ 
  children, 
  className = '', 
  variant = 'default',
  onClick 
}: CardProps) {
  const baseClasses = 'rounded-lg transition-all duration-200';
  
  const variantClasses = {
    default: 'bg-white shadow-card',
    glass: 'glass-card',
    gradient: 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg',
  };

  const hoverClasses = onClick ? 'cursor-pointer hover:shadow-xl hover:scale-105' : '';

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${hoverClasses} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
