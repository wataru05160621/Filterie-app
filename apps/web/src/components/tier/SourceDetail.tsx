import React from 'react';
import { TierBadge } from './TierBadge';
import { CheckCircleIcon, XCircleIcon, ClockIcon } from '@heroicons/react/24/solid';

interface SourceDetailProps {
  source: {
    id: string;
    name: string;
    url: string;
    tier: number;
    category: string;
    isActive: boolean;
    createdAt: string;
    tierInfo?: {
      confidence: number;
      verificationStatus: string;
      reasoning: string[];
      verifiedAt?: string;
    };
    trustedDomains?: {
      domain: string;
      verified: boolean;
    }[];
  };
}

export const SourceDetail: React.FC<SourceDetailProps> = ({ source }) => {
  const getVerificationIcon = () => {
    switch (source.tierInfo?.verificationStatus) {
      case 'VERIFIED':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'UNVERIFIED':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getVerificationText = () => {
    switch (source.tierInfo?.verificationStatus) {
      case 'VERIFIED':
        return '検証済み';
      case 'UNVERIFIED':
        return '未検証';
      default:
        return '検証中';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{source.name}</h2>
          <a
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            {source.url}
          </a>
        </div>
        <TierBadge tier={source.tier} size="lg" />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <span className="text-sm text-gray-500">カテゴリ</span>
          <p className="font-medium">{source.category}</p>
        </div>
        <div>
          <span className="text-sm text-gray-500">ステータス</span>
          <p className={`font-medium ${source.isActive ? 'text-green-600' : 'text-red-600'}`}>
            {source.isActive ? '有効' : '無効'}
          </p>
        </div>
        <div>
          <span className="text-sm text-gray-500">登録日</span>
          <p className="font-medium">{formatDate(source.createdAt)}</p>
        </div>
        {source.tierInfo?.verifiedAt && (
          <div>
            <span className="text-sm text-gray-500">検証日</span>
            <p className="font-medium">{formatDate(source.tierInfo.verifiedAt)}</p>
          </div>
        )}
      </div>

      {source.tierInfo && (
        <div className="border-t pt-4">
          <h3 className="text-lg font-semibold mb-3">Tier検証情報</h3>
          
          <div className="flex items-center gap-2 mb-4">
            {getVerificationIcon()}
            <span className="font-medium">{getVerificationText()}</span>
            <span className="text-sm text-gray-600">
              信頼度: {Math.round(source.tierInfo.confidence * 100)}%
            </span>
          </div>

          {source.tierInfo.reasoning.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">判定理由</h4>
              <ul className="list-disc list-inside space-y-1">
                {source.tierInfo.reasoning.map((reason, index) => (
                  <li key={index} className="text-sm text-gray-600">
                    {reason}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {source.trustedDomains && source.trustedDomains.length > 0 && (
        <div className="border-t pt-4">
          <h3 className="text-lg font-semibold mb-3">信頼ドメイン</h3>
          <div className="space-y-2">
            {source.trustedDomains.map((domain, index) => (
              <div key={index} className="flex items-center gap-2">
                {domain.verified ? (
                  <CheckCircleIcon className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircleIcon className="h-4 w-4 text-gray-400" />
                )}
                <span className="text-sm">{domain.domain}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};