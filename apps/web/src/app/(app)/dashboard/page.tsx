'use client';

import { useQuery, gql } from '@apollo/client';
import { useAuth } from '@/providers/auth-provider';
import Link from 'next/link';
import { Header } from '@/components/layout/header';

const DASHBOARD_QUERY = gql`
  query DashboardData($userId: ID!) {
    me(id: $userId) {
      id
      email
      name
    }
    
    recentArticles: articles(
      pagination: { limit: 5 }
      filter: { orderBy: publishedAt, order: DESC }
    ) {
      edges {
        node {
          id
          title
          summary
          publishedAt
          source {
            name
            tier
          }
          tags {
            id
            name
          }
        }
      }
    }
    
    bookmarkedArticles: articles(
      filter: { bookmarked: true }
      pagination: { limit: 5 }
    ) {
      totalCount
    }
    
    sources {
      totalCount
    }
  }
`;

export default function DashboardPage() {
  const { user } = useAuth();
  const { data, loading, error } = useQuery(DASHBOARD_QUERY, {
    variables: { userId: user?.id },
    skip: !user,
  });

  if (!user) {
    return null;
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              こんにちは、{user.name}さん
            </h1>
            <p className="mt-2 text-gray-600">
              今日も価値ある情報を見つけましょう
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">今日の新着記事</p>
                  <p className="text-2xl font-semibold text-gray-900 mt-2">
                    {data?.recentArticles?.edges?.length || 0}
                  </p>
                </div>
                <div className="bg-blue-100 rounded-lg p-3">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">ブックマーク</p>
                  <p className="text-2xl font-semibold text-gray-900 mt-2">
                    {data?.bookmarkedArticles?.totalCount || 0}
                  </p>
                </div>
                <div className="bg-green-100 rounded-lg p-3">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">情報源</p>
                  <p className="text-2xl font-semibold text-gray-900 mt-2">
                    {data?.sources?.totalCount || 0}
                  </p>
                </div>
                <div className="bg-purple-100 rounded-lg p-3">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Articles */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium text-gray-900">最新記事</h2>
                <Link href="/articles" className="text-sm text-blue-600 hover:text-blue-700">
                  すべて見る →
                </Link>
              </div>
            </div>
            
            <div className="divide-y divide-gray-200">
              {loading ? (
                <div className="p-6 text-center text-gray-500">読み込み中...</div>
              ) : error ? (
                <div className="p-6 text-center text-red-600">エラーが発生しました</div>
              ) : data?.recentArticles?.edges?.length > 0 ? (
                data.recentArticles.edges.map(({ node }: any) => (
                  <article key={node.id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            node.source.tier === 1 ? 'bg-blue-100 text-blue-800' :
                            node.source.tier === 2 ? 'bg-green-100 text-green-800' :
                            node.source.tier === 3 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            Tier {node.source.tier}
                          </span>
                          <span className="text-sm text-gray-500">{node.source.name}</span>
                        </div>
                        
                        <Link href={`/articles/${node.id}`} className="block group">
                          <h3 className="text-lg font-medium text-gray-900 group-hover:text-blue-600">
                            {node.title}
                          </h3>
                          <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                            {node.summary}
                          </p>
                        </Link>
                        
                        <div className="mt-2 flex items-center space-x-4">
                          <time className="text-sm text-gray-500">
                            {new Date(node.publishedAt).toLocaleDateString('ja-JP')}
                          </time>
                          {node.tags.length > 0 && (
                            <div className="flex items-center space-x-2">
                              {node.tags.slice(0, 3).map((tag: any) => (
                                <span key={tag.id} className="text-xs text-gray-500">
                                  #{tag.name}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                ))
              ) : (
                <div className="p-6 text-center text-gray-500">
                  まだ記事がありません
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              href="/articles"
              className="flex items-center p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <div className="bg-blue-100 rounded-lg p-3 mr-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">記事を読む</h3>
                <p className="text-sm text-gray-600">最新の記事をチェック</p>
              </div>
            </Link>

            <Link
              href="/settings"
              className="flex items-center p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <div className="bg-purple-100 rounded-lg p-3 mr-4">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">設定</h3>
                <p className="text-sm text-gray-600">プリファレンスを管理</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}