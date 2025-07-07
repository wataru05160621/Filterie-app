import React from 'react';
import { TierBadge } from './TierBadge';

interface TierFilterProps {
  selectedTiers: number[];
  onChange: (tiers: number[]) => void;
  counts?: Record<number, number>;
  hideEmpty?: boolean;
  layout?: 'vertical' | 'horizontal';
  showSelectAll?: boolean;
}

const tiers = [
  { value: 1, label: '一次情報' },
  { value: 2, label: '信頼メディア' },
  { value: 3, label: '一般メディア' },
  { value: 4, label: 'UGC' },
];

export const TierFilter: React.FC<TierFilterProps> = ({
  selectedTiers,
  onChange,
  counts,
  hideEmpty = false,
  layout = 'vertical',
  showSelectAll = false,
}) => {
  const handleTierToggle = (tier: number) => {
    if (selectedTiers.includes(tier)) {
      onChange(selectedTiers.filter(t => t !== tier));
    } else {
      onChange([...selectedTiers, tier]);
    }
  };

  const handleSelectAll = () => {
    onChange([1, 2, 3, 4]);
  };

  const handleClearAll = () => {
    onChange([]);
  };

  const isDisabled = (tier: number) => {
    return hideEmpty && counts && counts[tier] === 0;
  };

  return (
    <div className={`flex ${layout === 'horizontal' ? 'flex-row gap-4' : 'flex-col gap-2'}`}>
      {showSelectAll && (
        <div className="flex gap-2 mb-2">
          <button
            onClick={handleSelectAll}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            すべて選択
          </button>
          <span className="text-gray-400">|</span>
          <button
            onClick={handleClearAll}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            クリア
          </button>
        </div>
      )}
      
      {tiers.map(({ value, label }) => {
        const disabled = isDisabled(value);
        const checked = selectedTiers.includes(value);
        
        return (
          <label
            key={value}
            className={`
              flex items-center gap-2 cursor-pointer
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={() => handleTierToggle(value)}
              disabled={disabled}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              aria-label={label}
            />
            <TierBadge tier={value} size="sm" />
            {counts && (
              <span className="text-sm text-gray-600">
                ({counts[value] || 0})
              </span>
            )}
          </label>
        );
      })}
    </div>
  );
};