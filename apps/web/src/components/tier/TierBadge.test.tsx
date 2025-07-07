import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TierBadge } from './TierBadge';

describe('TierBadge', () => {
  it('should render Tier 1 badge correctly', () => {
    const { container } = render(<TierBadge tier={1} />);
    
    const badgeText = screen.getByText('一次情報');
    expect(badgeText).toBeInTheDocument();
    
    // Find the badge element by its container structure
    const badge = container.querySelector('.bg-yellow-100');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-yellow-100');
    expect(badge).toHaveClass('text-yellow-800');
    expect(badge).toHaveClass('border-yellow-300');
    
    const icon = screen.getByTestId('tier-icon');
    expect(icon).toHaveClass('text-yellow-600');
  });

  it('should render Tier 2 badge correctly', () => {
    const { container } = render(<TierBadge tier={2} />);
    
    const badgeText = screen.getByText('信頼メディア');
    expect(badgeText).toBeInTheDocument();
    
    const badge = container.querySelector('.bg-blue-100');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-blue-100');
    expect(badge).toHaveClass('text-blue-800');
    expect(badge).toHaveClass('border-blue-300');
    
    const icon = screen.getByTestId('tier-icon');
    expect(icon).toHaveClass('text-blue-600');
  });

  it('should render Tier 3 badge correctly', () => {
    const { container } = render(<TierBadge tier={3} />);
    
    const badgeText = screen.getByText('一般メディア');
    expect(badgeText).toBeInTheDocument();
    
    const badge = container.querySelector('.bg-gray-100');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-gray-100');
    expect(badge).toHaveClass('text-gray-800');
    expect(badge).toHaveClass('border-gray-300');
    
    const icon = screen.getByTestId('tier-icon');
    expect(icon).toHaveClass('text-gray-600');
  });

  it('should render Tier 4 badge correctly', () => {
    const { container } = render(<TierBadge tier={4} />);
    
    const badgeText = screen.getByText('UGC');
    expect(badgeText).toBeInTheDocument();
    
    const badge = container.querySelector('.bg-orange-100');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-orange-100');
    expect(badge).toHaveClass('text-orange-800');
    expect(badge).toHaveClass('border-orange-300');
    
    const icon = screen.getByTestId('tier-icon');
    expect(icon).toHaveClass('text-orange-600');
  });

  it('should show tooltip on hover', async () => {
    const { container } = render(<TierBadge tier={1} showTooltip />);
    
    const badge = container.querySelector('[data-tooltip]');
    expect(badge).toHaveAttribute('data-tooltip', '公式発表・要人発信');
  });

  it('should render with custom size', () => {
    render(<TierBadge tier={1} size="lg" />);
    
    const badge = screen.getByText('一次情報').parentElement;
    expect(badge).toHaveClass('text-base');
    expect(badge).toHaveClass('px-3');
    expect(badge).toHaveClass('py-1.5');
  });

  it('should handle invalid tier gracefully', () => {
    render(<TierBadge tier={5 as any} />);
    
    const badge = screen.getByText('UGC');
    expect(badge).toBeInTheDocument();
  });

  it('should render with confidence indicator when provided', () => {
    render(<TierBadge tier={1} confidence={0.95} />);
    
    expect(screen.getByText('95%')).toBeInTheDocument();
  });
});