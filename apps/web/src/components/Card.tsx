import React from 'react';
import { cn } from '@/lib/utils';

interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'bordered' | 'elevated';
  padding?: 'small' | 'medium' | 'large';
  hoverable?: boolean;
  onClick?: () => void;
  loading?: boolean;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'medium',
  hoverable = false,
  onClick,
  loading = false,
  header,
  footer,
  className,
}) => {
  const baseStyles = 'rounded-lg';
  
  const variantStyles = {
    default: 'bg-white',
    bordered: 'bg-white border border-gray-200',
    elevated: 'bg-white shadow-lg',
  };

  const paddingStyles = {
    small: 'p-4',
    medium: 'p-6',
    large: 'p-8',
  };

  const hoverableStyles = hoverable ? 'hover:shadow-md transition-shadow' : '';
  const clickableStyles = onClick ? 'cursor-pointer' : '';

  if (loading) {
    return (
      <div
        data-testid="card-skeleton"
        className={cn(
          baseStyles,
          variantStyles[variant],
          paddingStyles[padding],
          'animate-pulse',
          className
        )}
      >
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
      </div>
    );
  }

  return (
    <div
      data-testid="card"
      className={cn(
        baseStyles,
        variantStyles[variant],
        paddingStyles[padding],
        hoverableStyles,
        clickableStyles,
        className
      )}
      onClick={onClick}
    >
      {header && (
        <div className="border-b border-gray-200 pb-4 mb-4">
          {header}
        </div>
      )}
      
      {children}
      
      {footer && (
        <div className="border-t border-gray-200 pt-4 mt-4">
          {footer}
        </div>
      )}
    </div>
  );
};