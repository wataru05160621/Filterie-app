'use client';

import { useQuery, useMutation, gql } from '@apollo/client';
import { useParams, useRouter } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { useEffect, useState } from 'react';

const ARTICLE_QUERY = gql`
  query GetArticle($id: ID!) {
    article(id: $id) {
      id
      title
      content
      summary
      aiSummary
      publishedAt
      originalUrl
      imageUrl
      author
      source {
        id
        name
        tier
        url
      }
      tags {
        id
        name
      }
      readArticles {
        readAt
        readDuration
      }
      bookmarks {
        id
        note
      }
    }
  }
`;

const MARK_AS_READ_MUTATION = gql`
  mutation MarkArticleAsRead($articleId: ID!, $readDuration: Int) {
    markArticleAsRead(articleId: $articleId, readDuration: $readDuration)
  }
`;

const TOGGLE_BOOKMARK_MUTATION = gql`
  mutation ToggleBookmark($articleId: ID!, $note: String) {
    bookmarkArticle(articleId: $articleId, note: $note)
  }
`;

const REMOVE_BOOKMARK_MUTATION = gql`
  mutation RemoveBookmark($articleId: ID!) {
    removeBookmark(articleId: $articleId)
  }
`;

export default function ArticleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [readStartTime] = useState(Date.now());
  const [isBookmarked, setIsBookmarked] = useState(false);

  const { data, loading, error } = useQuery(ARTICLE_QUERY, {
    variables: { id: params.id },
  });

  const [markAsRead] = useMutation(MARK_AS_READ_MUTATION);
  const [toggleBookmark] = useMutation(TOGGLE_BOOKMARK_MUTATION);
  const [removeBookmark] = useMutation(REMOVE_BOOKMARK_MUTATION);

  useEffect(() => {
    if (data?.article) {
      setIsBookmarked(data.article.bookmarks?.length > 0);
      
      // 記事を既読にする
      const markRead = async () => {
        const readDuration = Math.floor((Date.now() - readStartTime) / 1000);
        await markAsRead({
          variables: {
            articleId: data.article.id,
            readDuration,
          },
        });
      };

      // ページを離れる時に既読にする
      return () => {
        markRead();
      };
    }
  }, [data, readStartTime, markAsRead]);

  const handleBookmarkToggle = async () => {
    try {
      if (isBookmarked) {
        await removeBookmark({
          variables: { articleId: data.article.id },
        });
      } else {
        await toggleBookmark({
          variables: { articleId: data.article.id },
        });
      }
      setIsBookmarked(!isBookmarked);
    } catch (error) {
      console.error('Failed to toggle bookmark:', error);
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-gray-500">読み込み中...</div>
        </div>
      </>
    );
  }

  if (error || !data?.article) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-red-600">
            記事が見つかりませんでした
          </div>
        </div>
      </>
    );
  }

  const article = data.article;

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50">
        <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="mb-6 text-gray-600 hover:text-gray-900 flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            戻る
          </button>

          {/* Article Header */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            {article.imageUrl && (
              <img
                src={article.imageUrl}
                alt=""
                className="w-full h-64 object-cover"
              />
            )}
            
            <div className="p-8">
              {/* Meta Information */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                      article.source.tier === 1
                        ? 'bg-blue-100 text-blue-800'
                        : article.source.tier === 2
                        ? 'bg-green-100 text-green-800'
                        : article.source.tier === 3
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    Tier {article.source.tier}
                  </span>
                  <a
                    href={article.source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    {article.source.name}
                  </a>
                  <time className="text-sm text-gray-500">
                    {new Date(article.publishedAt).toLocaleDateString('ja-JP', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </time>
                </div>
                
                <button
                  onClick={handleBookmarkToggle}
                  className={`p-2 rounded-lg hover:bg-gray-100 ${
                    isBookmarked ? 'text-yellow-600' : 'text-gray-400'
                  }`}
                >
                  <svg
                    className="w-6 h-6"
                    fill={isBookmarked ? 'currentColor' : 'none'}
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

              {/* Title */}
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {article.title}
              </h1>

              {/* Author */}
              {article.author && (
                <p className="text-sm text-gray-600 mb-6">
                  著者: {article.author}
                </p>
              )}

              {/* Tags */}
              {article.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {article.tags.map((tag: any) => (
                    <span
                      key={tag.id}
                      className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                    >
                      #{tag.name}
                    </span>
                  ))}
                </div>
              )}

              {/* AI Summary */}
              {article.aiSummary && (
                <div className="mb-8 p-4 bg-blue-50 rounded-lg">
                  <h2 className="text-lg font-medium text-blue-900 mb-2">
                    AI要約
                  </h2>
                  <p className="text-blue-800 whitespace-pre-wrap">
                    {article.aiSummary}
                  </p>
                </div>
              )}

              {/* Content */}
              <div 
                className="prose prose-lg max-w-none"
                data-testid="article-content"
              >
                {article.content ? (
                  <div dangerouslySetInnerHTML={{ __html: article.content }} />
                ) : (
                  <p className="text-gray-600">{article.summary}</p>
                )}
              </div>

              {/* Actions */}
              <div className="mt-8 pt-8 border-t flex items-center justify-between">
                <a
                  href={article.originalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 flex items-center"
                >
                  元記事を読む
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>

                <div className="flex items-center space-x-4">
                  <button className="text-gray-600 hover:text-gray-900">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </article>
      </div>
    </>
  );
}