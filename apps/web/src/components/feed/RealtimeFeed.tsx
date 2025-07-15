"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRealtimeFeed } from '@/hooks/useRealtimeFeed';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';
import { 
  ArrowPathIcon, 
  FunnelIcon,
  ExclamationTriangleIcon 
} from '@heroicons/react/24/outline';

interface RealtimeFeedProps {
  sourceIds?: string[];
  minTier?: number;
  maxTier?: number;
}

export function RealtimeFeed({ sourceIds, minTier, maxTier }: RealtimeFeedProps) {
  const { 
    articles, 
    loading, 
    error, 
    hasMore, 
    refresh, 
    loadMore 
  } = useRealtimeFeed({ sourceIds, minTier, maxTier });

  const [showNewArticleNotification, setShowNewArticleNotification] = useState(false);
  const [newArticleCount, setNewArticleCount] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const feedContainerRef = useRef<HTMLDivElement>(null);
  const [pullToRefreshStart, setPullToRefreshStart] = useState<number | null>(null);

  // Infinite scroll handler
  const handleScroll = useCallback(() => {
    if (!feedContainerRef.current || !hasMore || loading) return;

    const { scrollTop, scrollHeight, clientHeight } = feedContainerRef.current;
    if (scrollTop + clientHeight >= scrollHeight - 100) {
      loadMore();
    }
  }, [hasMore, loading, loadMore]);

  // Pull to refresh handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setPullToRefreshStart(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!pullToRefreshStart) return;
    
    const currentY = e.touches[0].clientY;
    const pullDistance = currentY - pullToRefreshStart;
    
    if (pullDistance > 100 && feedContainerRef.current?.scrollTop === 0) {
      setIsRefreshing(true);
    }
  };

  const handleTouchEnd = async () => {
    if (isRefreshing) {
      await refresh();
      setIsRefreshing(false);
    }
    setPullToRefreshStart(null);
  };

  // Show new article notification
  const handleShowNewArticles = () => {
    setShowNewArticleNotification(false);
    setNewArticleCount(0);
    refresh();
  };

  // Loading state
  if (loading && articles.length === 0) {
    return (
      <div data-testid="feed-loading" className="flex items-center justify-center py-12">
        <ArrowPathIcon className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mb-4" />
        <p className="text-gray-700 dark:text-gray-300 mb-4">エラーが発生しました</p>
        <button
          onClick={refresh}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          再試行
        </button>
      </div>
    );
  }

  // Empty state
  if (articles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-gray-700 dark:text-gray-300 mb-2">記事がありません</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          情報源を追加して、最新の記事を取得しましょう
        </p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* New article notification */}
      {showNewArticleNotification && (
        <div className="sticky top-0 z-10 bg-blue-500 text-white p-4 flex items-center justify-between">
          <span>新着記事があります（{newArticleCount}件）</span>
          <button
            onClick={handleShowNewArticles}
            className="px-4 py-2 bg-white text-blue-500 rounded-lg hover:bg-gray-100"
          >
            新着記事を表示
          </button>
        </div>
      )}

      {/* Filter button */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-4">
        <button
          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
        >
          <FunnelIcon className="h-4 w-4" />
          <span>Tier フィルター</span>
        </button>
      </div>

      {/* Refresh indicator */}
      {isRefreshing && (
        <div data-testid="refresh-indicator" className="absolute top-16 left-1/2 transform -translate-x-1/2">
          <ArrowPathIcon className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      )}

      {/* Feed container */}
      <div
        ref={feedContainerRef}
        data-testid="feed-container"
        onScroll={handleScroll}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="h-[calc(100vh-8rem)] overflow-y-auto"
      >
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {articles.map((article) => (
            <Link
              key={article.id}
              href={`/articles/${article.id}`}
              className="block p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {article.source.name}
                  </span>
                  <span className={`px-2 py-0.5 text-xs rounded-full ${
                    article.source.tier === 1 ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                    article.source.tier === 2 ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                    article.source.tier === 3 ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                    'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                  }`}>
                    Tier {article.source.tier}
                  </span>
                </div>
                <time className="text-sm text-gray-500 dark:text-gray-400">
                  {formatDistanceToNow(new Date(article.publishedAt), {
                    addSuffix: true,
                    locale: ja,
                  })}
                </time>
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                {article.title}
              </h3>
              
              {article.summary && (
                <p className="text-gray-600 dark:text-gray-400 line-clamp-2">
                  {article.summary}
                </p>
              )}
            </Link>
          ))}
        </div>

        {/* Load more indicator */}
        {hasMore && (
          <div className="flex items-center justify-center py-8">
            <ArrowPathIcon className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        )}
      </div>
    </div>
  );
}