import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TierFilter } from './TierFilter';

describe('TierFilter', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render all tier options', () => {
    render(<TierFilter selectedTiers={[]} onChange={mockOnChange} />);
    
    expect(screen.getByText('一次情報')).toBeInTheDocument();
    expect(screen.getByText('信頼メディア')).toBeInTheDocument();
    expect(screen.getByText('一般メディア')).toBeInTheDocument();
    expect(screen.getByText('UGC')).toBeInTheDocument();
  });

  it('should show selected tiers as checked', () => {
    render(<TierFilter selectedTiers={[1, 2]} onChange={mockOnChange} />);
    
    const tier1Checkbox = screen.getByRole('checkbox', { name: /一次情報/i });
    const tier2Checkbox = screen.getByRole('checkbox', { name: /信頼メディア/i });
    const tier3Checkbox = screen.getByRole('checkbox', { name: /一般メディア/i });
    
    expect(tier1Checkbox).toBeChecked();
    expect(tier2Checkbox).toBeChecked();
    expect(tier3Checkbox).not.toBeChecked();
  });

  it('should call onChange when tier is selected', () => {
    render(<TierFilter selectedTiers={[1]} onChange={mockOnChange} />);
    
    const tier2Checkbox = screen.getByRole('checkbox', { name: /信頼メディア/i });
    fireEvent.click(tier2Checkbox);
    
    expect(mockOnChange).toHaveBeenCalledWith([1, 2]);
  });

  it('should call onChange when tier is deselected', () => {
    render(<TierFilter selectedTiers={[1, 2]} onChange={mockOnChange} />);
    
    const tier1Checkbox = screen.getByRole('checkbox', { name: /一次情報/i });
    fireEvent.click(tier1Checkbox);
    
    expect(mockOnChange).toHaveBeenCalledWith([2]);
  });

  it('should show counts when provided', () => {
    const counts = { 1: 10, 2: 25, 3: 50, 4: 15 };
    render(<TierFilter selectedTiers={[]} onChange={mockOnChange} counts={counts} />);
    
    expect(screen.getByText('(10)')).toBeInTheDocument();
    expect(screen.getByText('(25)')).toBeInTheDocument();
    expect(screen.getByText('(50)')).toBeInTheDocument();
    expect(screen.getByText('(15)')).toBeInTheDocument();
  });

  it('should disable tiers with zero count when hideEmpty is true', () => {
    const counts = { 1: 10, 2: 0, 3: 50, 4: 15 };
    render(
      <TierFilter 
        selectedTiers={[]} 
        onChange={mockOnChange} 
        counts={counts} 
        hideEmpty 
      />
    );
    
    const tier2Checkbox = screen.getByRole('checkbox', { name: /信頼メディア/i });
    expect(tier2Checkbox).toBeDisabled();
  });

  it('should render in horizontal layout when specified', () => {
    const { container } = render(
      <TierFilter 
        selectedTiers={[]} 
        onChange={mockOnChange} 
        layout="horizontal" 
      />
    );
    
    const filterContainer = container.firstChild;
    expect(filterContainer).toHaveClass('flex-row');
  });

  it('should select all tiers when "すべて選択" is clicked', () => {
    render(<TierFilter selectedTiers={[1]} onChange={mockOnChange} showSelectAll />);
    
    const selectAllButton = screen.getByText('すべて選択');
    fireEvent.click(selectAllButton);
    
    expect(mockOnChange).toHaveBeenCalledWith([1, 2, 3, 4]);
  });

  it('should clear all tiers when "クリア" is clicked', () => {
    render(<TierFilter selectedTiers={[1, 2, 3]} onChange={mockOnChange} showSelectAll />);
    
    const clearButton = screen.getByText('クリア');
    fireEvent.click(clearButton);
    
    expect(mockOnChange).toHaveBeenCalledWith([]);
  });
});