import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SourceDetail } from './SourceDetail';

const mockSource = {
  id: '1',
  name: 'Apple Inc.',
  url: 'https://www.apple.com',
  tier: 1,
  category: 'corporate',
  isActive: true,
  createdAt: '2024-01-01T00:00:00Z',
  tierInfo: {
    confidence: 0.95,
    verificationStatus: 'VERIFIED',
    reasoning: ['公式企業ドメイン', '信頼性の高い組織'],
    verifiedAt: '2024-01-01T00:00:00Z',
  },
};

describe('SourceDetail', () => {
  it('should render source basic information', () => {
    render(<SourceDetail source={mockSource} />);
    
    expect(screen.getByText('Apple Inc.')).toBeInTheDocument();
    expect(screen.getByText('https://www.apple.com')).toBeInTheDocument();
    expect(screen.getByText('corporate')).toBeInTheDocument();
  });

  it('should render tier badge', () => {
    render(<SourceDetail source={mockSource} />);
    
    expect(screen.getByText('一次情報')).toBeInTheDocument();
  });

  it('should render verification status', () => {
    render(<SourceDetail source={mockSource} />);
    
    expect(screen.getByText('検証済み')).toBeInTheDocument();
    expect(screen.getByText('信頼度: 95%')).toBeInTheDocument();
  });

  it('should render reasoning points', () => {
    render(<SourceDetail source={mockSource} />);
    
    expect(screen.getByText('公式企業ドメイン')).toBeInTheDocument();
    expect(screen.getByText('信頼性の高い組織')).toBeInTheDocument();
  });

  it('should show inactive status when source is inactive', () => {
    const inactiveSource = { ...mockSource, isActive: false };
    render(<SourceDetail source={inactiveSource} />);
    
    expect(screen.getByText('無効')).toBeInTheDocument();
  });

  it('should show unverified status when not verified', () => {
    const unverifiedSource = {
      ...mockSource,
      tierInfo: {
        ...mockSource.tierInfo,
        verificationStatus: 'UNVERIFIED',
      },
    };
    render(<SourceDetail source={unverifiedSource} />);
    
    expect(screen.getByText('未検証')).toBeInTheDocument();
  });

  it('should handle missing tier info gracefully', () => {
    const sourceWithoutTierInfo = {
      ...mockSource,
      tierInfo: undefined,
    };
    render(<SourceDetail source={sourceWithoutTierInfo} />);
    
    expect(screen.getByText('Apple Inc.')).toBeInTheDocument();
    expect(screen.queryByText('検証済み')).not.toBeInTheDocument();
  });

  it('should format dates correctly', () => {
    render(<SourceDetail source={mockSource} />);
    
    // Check that dates are formatted (exact format may vary based on locale)
    const dateElements = screen.getAllByText(/2024/);
    expect(dateElements.length).toBeGreaterThan(0);
  });

  it('should render trust domains section when provided', () => {
    const sourceWithTrustedDomains = {
      ...mockSource,
      trustedDomains: [
        { domain: 'apple.com', verified: true },
        { domain: 'www.apple.com', verified: true },
      ],
    };
    render(<SourceDetail source={sourceWithTrustedDomains} />);
    
    expect(screen.getByText('信頼ドメイン')).toBeInTheDocument();
    expect(screen.getByText('apple.com')).toBeInTheDocument();
    expect(screen.getByText('www.apple.com')).toBeInTheDocument();
  });
});