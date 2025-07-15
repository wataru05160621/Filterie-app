'use client';

import { useState } from 'react';
import { useQuery, gql } from '@apollo/client';
import Link from 'next/link';

const ARTICLES_QUERY = gql`
  query GetArticles($filter: ArticleFilterInput, $pagination: PaginationInput) {
    articles(filter: $filter, pagination: $pagination) {
      edges {
        node {
          id
          title
          summary
          publishedAt
          imageUrl
          source {
            id
            name
            tier
          }
          tags {
            id
            name
          }
          readArticles {
            readAt
          }
          bookmarks {
            id
          }
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
      totalCount
    }
  }
`;

export default function ArticlesPage() {
  const [selectedTier, setSelectedTier] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('publishedAt');

  const { data, loading, error, fetchMore } = useQuery(ARTICLES_QUERY, {
    variables: {
      filter: {
        ...(selectedTier && { tier: selectedTier }),
        ...(searchQuery && { searchQuery }),
        orderBy: sortBy,
        order: 'DESC',
      },
      pagination: {
        limit: 20,
      },
    },
  });

  const handleLoadMore = () => {
    if (data?.articles?.pageInfo?.hasNextPage) {
      fetchMore({
        variables: {
          pagination: {
            limit: 20,
            after: data.articles.pageInfo.endCursor,
          },
        },
      });
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white">記事一覧</h1>
            <p className="mt-2 text-gray-400">
              信頼できる情報源からの最新記事
            </p>
          </div>

          {/* Filters */}
          <div className="mb-6 space-y-4">
            {/* Search */}
            <div className="flex gap-4">
              <input
                type="text"
                placeholder="記事を検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-4 py-2 bg-gray-900 border border-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500"
              />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 bg-gray-900 border border-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="publishedAt">公開日順</option>
                <option value="createdAt">追加日順</option>
                <option value="title">タイトル順</option>
              </select>
            </div>

            {/* Tier Filter */}
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-400">Tier:</span>
              <div className="flex space-x-2">
                <button
                  onClick={() => setSelectedTier(null)}
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    selectedTier === null
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  すべて
                </button>
                {[1, 2, 3, 4].map((tier) => (
                  <button
                    key={tier}
                    onClick={() => setSelectedTier(tier)}
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      selectedTier === tier
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    Tier {tier}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Articles List */}
          <div className="bg-gray-900 rounded-lg border border-gray-800">
            {loading && !data ? (
              <div className="p-8 text-center text-gray-400">読み込み中...</div>
            ) : error ? (
              <div className="p-8 text-center text-red-500">
                エラーが発生しました: {error.message}
              </div>
            ) : data?.articles?.edges?.length > 0 ? (
              <>
                <div className="divide-y divide-gray-800">
                  {data.articles.edges.map(({ node }: any) => (
                    <article
                      key={node.id}
                      className="p-6 hover:bg-gray-800/50 transition-colors"
                      data-testid="article-card"
                    >
                      <div className="flex items-start space-x-4">
                        {node.imageUrl && (
                          <img
                            src={node.imageUrl}
                            alt=""
                            className="w-24 h-24 object-cover rounded-lg"
                          />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  node.source.tier === 1
                                    ? 'bg-blue-100 text-blue-800'
                                    : node.source.tier === 2
                                    ? 'bg-green-100 text-green-800'
                                    : node.source.tier === 3
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}
                                data-testid="tier-badge"
                              >
                                Tier {node.source.tier}
                              </span>
                              <span className="text-sm text-gray-400">
                                {node.source.name}
                              </span>
                              {node.readArticles?.length > 0 && (
                                <span
                                  className="text-xs text-green-600"
                                  data-testid="read-badge"
                                >
                                  既読
                                </span>
                              )}
                            </div>
                            <button
                              className={`p-2 rounded-lg hover:bg-gray-800 transition-colors ${
                                node.bookmarks?.length > 0
                                  ? 'text-yellow-600'
                                  : 'text-gray-400'
                              }`}
                              data-testid="bookmark-button"
                              data-bookmarked={node.bookmarks?.length > 0}
                            >
                              <svg
                                className="w-5 h-5"
                                fill={node.bookmarks?.length > 0 ? 'currentColor' : 'none'}
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                                />
                              </svg>
                            </button>
                          </div>

                          <Link href={`/articles/${node.id}`} className="block group">
                            <h2
                              className="text-lg font-medium text-white group-hover:text-blue-400 transition-colors"
                              data-testid="article-title"
                            >
                              {node.title}
                            </h2>
                            <p className="mt-1 text-sm text-gray-400 line-clamp-2">
                              {node.summary}
                            </p>
                          </Link>

                          <div className="mt-3 flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <time className="text-sm text-gray-400">
                                {new Date(node.publishedAt).toLocaleDateString('ja-JP', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                })}
                              </time>
                              {node.tags.length > 0 && (
                                <div className="flex items-center space-x-2">
                                  {node.tags.slice(0, 3).map((tag: any) => (
                                    <span
                                      key={tag.id}
                                      className="text-xs text-gray-500 hover:text-gray-300 cursor-pointer transition-colors"
                                    >
                                      #{tag.name}
                                    </span>
                                  ))}
                                  {node.tags.length > 3 && (
                                    <span className="text-xs text-gray-400">
                                      +{node.tags.length - 3}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>

                {/* Load More */}
                {data.articles.pageInfo.hasNextPage && (
                  <div className="p-4 text-center border-t border-gray-800">
                    <button
                      onClick={handleLoadMore}
                      disabled={loading}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {loading ? '読み込み中...' : 'もっと見る'}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="p-8 text-center text-gray-400">
                記事が見つかりませんでした
              </div>
            )}
          </div>

          {/* Total Count */}
          {data?.articles?.totalCount > 0 && (
            <p className="mt-4 text-sm text-gray-400 text-center">
              全 {data.articles.totalCount} 件の記事
            </p>
          )}
        </div>
      </div>
  );
}