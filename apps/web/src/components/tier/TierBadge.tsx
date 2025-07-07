import React from 'react';
import { CheckBadgeIcon, NewspaperIcon, GlobeAltIcon, UserGroupIcon } from '@heroicons/react/24/solid';

interface TierBadgeProps {
  tier: number;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
  confidence?: number;
}

const tierConfig = {
  1: {
    label: '一次情報',
    description: '公式発表・要人発信',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-800',
    borderColor: 'border-yellow-300',
    iconColor: 'text-yellow-600',
    Icon: CheckBadgeIcon,
  },
  2: {
    label: '信頼メディア',
    description: '大手報道機関・専門アナリスト',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-800',
    borderColor: 'border-blue-300',
    iconColor: 'text-blue-600',
    Icon: NewspaperIcon,
  },
  3: {
    label: '一般メディア',
    description: 'オンラインメディア・ブログ',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-800',
    borderColor: 'border-gray-300',
    iconColor: 'text-gray-600',
    Icon: GlobeAltIcon,
  },
  4: {
    label: 'UGC',
    description: 'ユーザー生成コンテンツ',
    bgColor: 'bg-orange-100',
    textColor: 'text-orange-800',
    borderColor: 'border-orange-300',
    iconColor: 'text-orange-600',
    Icon: UserGroupIcon,
  },
};

const sizeConfig = {
  sm: 'text-xs px-2 py-1',
  md: 'text-sm px-2.5 py-1',
  lg: 'text-base px-3 py-1.5',
};

export const TierBadge: React.FC<TierBadgeProps> = ({
  tier,
  size = 'md',
  showTooltip = false,
  confidence,
}) => {
  const config = tierConfig[tier as keyof typeof tierConfig] || tierConfig[4];
  const { label, description, bgColor, textColor, borderColor, iconColor, Icon } = config;

  return (
    <span
      className={`
        inline-flex items-center gap-1 rounded-full border font-medium
        ${bgColor} ${textColor} ${borderColor} ${sizeConfig[size]}
      `}
      data-tooltip={showTooltip ? description : undefined}
    >
      <Icon 
        className={`${size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'} ${iconColor}`}
        data-testid="tier-icon"
      />
      <span>{label}</span>
      {confidence !== undefined && (
        <span className="ml-1 text-xs opacity-75">
          {Math.round(confidence * 100)}%
        </span>
      )}
    </span>
  );
};