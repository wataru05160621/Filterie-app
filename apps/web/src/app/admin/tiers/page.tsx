'use client';

import React from 'react';
import { useQuery } from '@apollo/client';
import { TIER_STATS } from '@/graphql/queries';
import { TierBadge } from '@/components/tier';

interface TierStats {
  tierCounts: {
    tier: number;
    count: number;
  }[];
  verifiedSourceCount: number;
  totalSourceCount: number;
}

export default function TierDashboard() {
  const { loading, error, data } = useQuery<{ tierStats: TierStats }>(TIER_STATS);

  if (loading) return <div className="text-center py-8">読み込み中...</div>;
  if (error) return <div className="text-center py-8 text-red-600">エラーが発生しました: {error.message}</div>;

  const stats = data?.tierStats;
  if (!stats) return null;

  const verificationRate = stats.totalSourceCount > 0 
    ? Math.round((stats.verifiedSourceCount / stats.totalSourceCount) * 100)
    : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-8">情報源Tier管理</h1>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-600 mb-2">総情報源数</h3>
          <p className="text-3xl font-bold text-gray-900">{stats.totalSourceCount}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-600 mb-2">検証済み情報源</h3>
          <p className="text-3xl font-bold text-green-600">{stats.verifiedSourceCount}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-600 mb-2">検証率</h3>
          <p className="text-3xl font-bold text-blue-600">{verificationRate}%</p>
        </div>
      </div>

      {/* Tier Distribution */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-6">Tier分布</h2>
        <div className="space-y-4">
          {[1, 2, 3, 4].map((tier) => {
            const tierCount = stats.tierCounts.find(tc => tc.tier === tier)?.count || 0;
            const percentage = stats.totalSourceCount > 0 
              ? Math.round((tierCount / stats.totalSourceCount) * 100)
              : 0;

            return (
              <div key={tier} className="flex items-center gap-4">
                <TierBadge tier={tier} size="lg" />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">
                      {tierCount} 情報源
                    </span>
                    <span className="text-sm text-gray-500">
                      {percentage}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}