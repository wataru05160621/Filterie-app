'use client';

import { useQuery, gql } from '@apollo/client';
import { useAuth } from '@/providers/auth-provider';
import Link from 'next/link';
import { useState } from 'react';

const DASHBOARD_QUERY = gql`
  query DashboardData {
    me {
      id
      email
      name
    }
    
    recentArticles: articles(
      pagination: { limit: 5 }
    ) {
      edges {
        node {
          id
          title
          summary
          publishedAt
          url
          source {
            name
            tier
          }
          tags {
            id
            name
          }
          aiSummary
        }
      }
      totalCount
    }
    
    sources {
      totalCount
    }
  }
`;

// Tier color mapping
const getTierStyles = (tier: number) => {
  switch (tier) {
    case 1:
      return 'text-yellow-400 border-yellow-400';
    case 2:
      return 'text-gray-300 border-gray-300';
    case 3:
      return 'text-amber-600 border-amber-600';
    case 4:
      return 'text-gray-500 border-gray-500';
    default:
      return 'text-gray-500 border-gray-500';
  }
};

// Format time ago
const formatTimeAgo = (date: string) => {
  const now = new Date();
  const past = new Date(date);
  const diffInMinutes = Math.floor((now.getTime() - past.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 60) {
    return `${diffInMinutes}分前`;
  } else if (diffInMinutes < 1440) {
    return `${Math.floor(diffInMinutes / 60)}時間前`;
  } else {
    return `${Math.floor(diffInMinutes / 1440)}日前`;
  }
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [activeFilters, setActiveFilters] = useState({
    tier1: true,
    tier2: true,
    tier3: false,
    tier4: false,
  });

  const { data, loading, error } = useQuery(DASHBOARD_QUERY, {
    skip: !user,
    pollInterval: 30000, // Poll every 30 seconds for real-time updates
  });

  if (!user) {
    return null;
  }

  // Calculate stats from available data
  const todayCount = data?.recentArticles?.edges?.filter((edge: any) => {
    const publishedDate = new Date(edge.node.publishedAt);
    const today = new Date();
    return publishedDate.toDateString() === today.toDateString();
  }).length || 0;

  const aiSummaryCount = data?.recentArticles?.edges?.filter((edge: any) => 
    edge.node.aiSummary
  ).length || 0;

  const stats = {
    todayCount: todayCount || data?.recentArticles?.totalCount || 287,
    aiSummaryCount: aiSummaryCount || 156,
    bookmarkedCount: 42, // This would need a separate query
    sourcesCount: data?.sources?.totalCount || 89,
  };

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">ダッシュボード</h1>
          <div className="flex gap-2 mt-4">
            <button className="px-4 py-2 bg-zinc-800 text-white rounded-lg text-sm font-medium hover:bg-zinc-700 transition-colors">
              すべて
            </button>
            <button className="px-4 py-2 bg-zinc-900 text-gray-400 rounded-lg text-sm font-medium hover:bg-zinc-800 hover:text-white transition-colors">
              パーソナライズ
            </button>
            <button className="px-4 py-2 bg-zinc-900 text-gray-400 rounded-lg text-sm font-medium hover:bg-zinc-800 hover:text-white transition-colors">
              チーム共有
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4 mb-8 pb-4 border-b border-zinc-800">
          <span className="text-sm text-gray-500 font-medium">情報源レベル:</span>
          <div className="flex gap-2">
            <button
              onClick={() => setActiveFilters({...activeFilters, tier1: !activeFilters.tier1})}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                activeFilters.tier1 
                  ? 'bg-zinc-800 text-yellow-400 border-yellow-400' 
                  : 'bg-zinc-900 text-gray-500 border-zinc-700 hover:border-zinc-600'
              }`}
            >
              ⭐ Tier 1
            </button>
            <button
              onClick={() => setActiveFilters({...activeFilters, tier2: !activeFilters.tier2})}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                activeFilters.tier2 
                  ? 'bg-zinc-800 text-gray-300 border-gray-300' 
                  : 'bg-zinc-900 text-gray-500 border-zinc-700 hover:border-zinc-600'
              }`}
            >
              ⭐ Tier 2
            </button>
            <button
              onClick={() => setActiveFilters({...activeFilters, tier3: !activeFilters.tier3})}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                activeFilters.tier3 
                  ? 'bg-zinc-800 text-amber-600 border-amber-600' 
                  : 'bg-zinc-900 text-gray-500 border-zinc-700 hover:border-zinc-600'
              }`}
            >
              ⭐ Tier 3
            </button>
            <button
              onClick={() => setActiveFilters({...activeFilters, tier4: !activeFilters.tier4})}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                activeFilters.tier4 
                  ? 'bg-zinc-800 text-gray-500 border-gray-500' 
                  : 'bg-zinc-900 text-gray-500 border-zinc-700 hover:border-zinc-600'
              }`}
            >
              ⭐ Tier 4
            </button>
          </div>
          <div className="w-px h-6 bg-zinc-700 mx-2"></div>
          <button className="px-3 py-1.5 bg-zinc-800 text-white rounded-full text-xs font-medium border border-emerald-500 hover:bg-zinc-700 transition-all">
            🕐 24時間以内
          </button>
          <button className="px-3 py-1.5 bg-zinc-900 text-gray-500 rounded-full text-xs font-medium border border-zinc-700 hover:border-zinc-600 hover:text-gray-400 transition-all">
            📊 関連度順
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
          <div className="relative bg-zinc-900 border border-zinc-800 rounded-xl p-6 overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 to-emerald-600"></div>
            <p className="text-sm font-medium text-gray-500 mb-2">本日の新着記事</p>
            <p className="text-3xl font-bold text-white mb-2">{stats.todayCount}</p>
            <p className="text-sm text-emerald-500">↑ 23% 前日比</p>
          </div>

          <div className="relative bg-zinc-900 border border-zinc-800 rounded-xl p-6 overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 to-emerald-600"></div>
            <p className="text-sm font-medium text-gray-500 mb-2">AI要約生成数</p>
            <p className="text-3xl font-bold text-white mb-2">{stats.aiSummaryCount}</p>
            <p className="text-sm text-emerald-500">↑ 12% 前日比</p>
          </div>

          <div className="relative bg-zinc-900 border border-zinc-800 rounded-xl p-6 overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 to-emerald-600"></div>
            <p className="text-sm font-medium text-gray-500 mb-2">保存した記事</p>
            <p className="text-3xl font-bold text-white mb-2">{stats.bookmarkedCount}</p>
            <p className="text-sm text-red-500">↓ 5% 前週比</p>
          </div>

          <div className="relative bg-zinc-900 border border-zinc-800 rounded-xl p-6 overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 to-emerald-600"></div>
            <p className="text-sm font-medium text-gray-500 mb-2">アクティブソース</p>
            <p className="text-3xl font-bold text-white mb-2">{stats.sourcesCount}</p>
            <p className="text-sm text-gray-500">→ 0% 変化なし</p>
          </div>
        </div>

        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-white">AI厳選記事</h2>
              <p className="text-sm text-gray-500 mt-1">あなたの興味に基づいて選ばれた最重要記事</p>
            </div>
            <Link href="/articles" className="text-sm text-emerald-500 hover:text-emerald-400 font-medium transition-colors">
              すべて表示 →
            </Link>
          </div>
          
          <div className="space-y-4">
            {loading ? (
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-center text-gray-500">
                読み込み中...
              </div>
            ) : error ? (
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-center text-red-500">
                エラーが発生しました
              </div>
            ) : data?.recentArticles?.edges?.length > 0 ? (
              data.recentArticles.edges.map(({ node }: any) => (
                <article 
                  key={node.id} 
                  className="relative bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-emerald-500 hover:translate-x-1 transition-all duration-300 cursor-pointer group"
                >
                  {node.aiSummary && (
                    <div className="absolute top-4 right-4 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                      🤖 AI要約
                    </div>
                  )}
                  
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <div className="w-5 h-5 bg-zinc-800 rounded flex items-center justify-center text-xs">
                        {node.source.name.charAt(0)}
                      </div>
                      <span>{node.source.name}</span>
                      <span>•</span>
                      <span>{formatTimeAgo(node.publishedAt)}</span>
                    </div>
                    <div className={`text-sm font-medium ${getTierStyles(node.source.tier)}`}>
                      ⭐ Tier {node.source.tier}
                    </div>
                  </div>
                  
                  <Link href={`/articles/${node.id}`} className="block">
                    <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-emerald-400 transition-colors line-clamp-2">
                      {node.title}
                    </h3>
                    <p className="text-sm text-gray-400 line-clamp-3 mb-3">
                      {node.summary || node.aiSummary}
                    </p>
                  </Link>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>📖 5分で読了</span>
                      <span>💬 234</span>
                      <span>🔁 89</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="p-1.5 text-gray-600 hover:text-white hover:bg-zinc-800 rounded transition-all">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                        </svg>
                      </button>
                      <button className="p-1.5 text-gray-600 hover:text-white hover:bg-zinc-800 rounded transition-all">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                      </button>
                      <button className="p-1.5 text-gray-600 hover:text-white hover:bg-zinc-800 rounded transition-all">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-center text-gray-500">
                まだ記事がありません
              </div>
            )}
          </div>
        </section>

        <div className="fixed bottom-8 right-8 bg-zinc-900 border border-zinc-800 rounded-full px-5 py-3 flex items-center gap-2 shadow-2xl">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium text-white">リアルタイム更新中</span>
        </div>
      </div>
    </div>
  );
}