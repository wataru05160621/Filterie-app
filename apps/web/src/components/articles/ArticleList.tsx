import React, { useState } from 'react';
import { useQuery } from '@apollo/client';
import { GET_ARTICLES } from '../../graphql/queries';
import { TierBadge, TierFilter } from '../tier';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';

interface Article {
  id: string;
  title: string;
  url: string;
  summary: string;
  publishedAt: string;
  source: {
    id: string;
    name: string;
    tier: number;
  };
  tags: {
    id: string;
    name: string;
  }[];
}

export const ArticleList: React.FC = () => {
  const [selectedTiers, setSelectedTiers] = useState<number[]>([]);
  
  const { loading, error, data } = useQuery<{ articles: Article[] }>(GET_ARTICLES, {
    variables: {
      filter: selectedTiers.length > 0 ? { tiers: selectedTiers } : {},
      limit: 20,
      offset: 0,
    },
  });

  if (loading) return <div className="text-center py-8">読み込み中...</div>;
  if (error) return <div className="text-center py-8 text-red-600">エラーが発生しました: {error.message}</div>;

  const articles = data?.articles || [];

  // Count articles by tier
  const tierCounts = articles.reduce((acc, article) => {
    acc[article.source.tier] = (acc[article.source.tier] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex gap-8">
        {/* Sidebar with filters */}
        <aside className="w-64 flex-shrink-0">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">フィルター</h3>
            <TierFilter
              selectedTiers={selectedTiers}
              onChange={setSelectedTiers}
              counts={tierCounts}
              showSelectAll
            />
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1">
          <h1 className="text-2xl font-bold mb-6">最新記事</h1>
          
          {articles.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              記事が見つかりませんでした
            </div>
          ) : (
            <div className="space-y-4">
              {articles.map((article) => (
                <article
                  key={article.id}
                  className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h2 className="text-xl font-semibold flex-1">
                      <a
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-900 hover:text-blue-600"
                      >
                        {article.title}
                      </a>
                    </h2>
                    <TierBadge tier={article.source.tier} />
                  </div>
                  
                  <div className="text-sm text-gray-600 mb-2">
                    {article.source.name} • {formatDistanceToNow(new Date(article.publishedAt), {
                      addSuffix: true,
                      locale: ja,
                    })}
                  </div>
                  
                  <p className="text-gray-700 mb-3">{article.summary}</p>
                  
                  {article.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {article.tags.map((tag) => (
                        <span
                          key={tag.id}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                        >
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};