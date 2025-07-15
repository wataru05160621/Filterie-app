'use client'

import { useEffect, useState, useRef } from 'react'
import { useQuery, useMutation } from '@apollo/client'
import { useParams, notFound } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/providers/auth-provider'
import { 
  ARTICLE_DETAIL_QUERY, 
  BOOKMARK_MUTATION, 
  UNBOOKMARK_MUTATION,
  TRACK_READ_MUTATION 
} from './queries'
import {
  ArrowLeftIcon,
  BookmarkIcon,
  ShareIcon,
  SpeakerWaveIcon,
  PrinterIcon,
  EnvelopeIcon,
  LinkIcon,
} from '@heroicons/react/24/outline'
import {
  BookmarkIcon as BookmarkSolidIcon,
} from '@heroicons/react/24/solid'

interface Article {
  id: string
  title: string
  content: string
  summary: string
  url: string
  publishedAt: string
  readTime: number
  viewCount: number
  source: {
    id: string
    name: string
    url: string
    tier: {
      level: number
      name: string
    }
  }
  tags: Array<{
    id: string
    name: string
  }>
  aiSummary?: {
    id: string
    content: string
    keyPoints: string[]
    generatedAt: string
  }
  bookmarks: Array<{
    id: string
    userId: string
  }>
  relatedArticles: Array<{
    id: string
    title: string
    summary: string
    publishedAt: string
    source: {
      name: string
      tier: {
        level: number
      }
    }
  }>
}

const fontSizeClasses = ['text-base', 'text-lg', 'text-xl', 'text-2xl']

export default function ArticleDetailPage() {
  const params = useParams()
  const { user } = useAuth()
  const articleId = params?.id as string

  const [scrollProgress, setScrollProgress] = useState(0)
  const [fontSize, setFontSize] = useState(1) // Index for fontSizeClasses
  const [nightMode, setNightMode] = useState(true)
  const [readStartTime] = useState(Date.now())
  const hasTrackedRead = useRef(false)

  const { data, loading, error } = useQuery<{ article: Article }>(
    ARTICLE_DETAIL_QUERY,
    {
      variables: { id: articleId },
      skip: !articleId,
    }
  )

  const [bookmarkArticle] = useMutation(BOOKMARK_MUTATION)
  const [unbookmarkArticle] = useMutation(UNBOOKMARK_MUTATION)
  const [trackRead] = useMutation(TRACK_READ_MUTATION)

  const article = data?.article

  const isBookmarked = article?.bookmarks.some(
    bookmark => bookmark.userId === user?.id
  )

  // Calculate trust score based on tier
  const getTrustScore = (tier: number) => {
    const scores = { 1: 98, 2: 85, 3: 70, 4: 50 }
    return scores[tier as keyof typeof scores] || 50
  }

  // Track scroll progress
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.body.scrollHeight - window.innerHeight
      const progress = (window.scrollY / totalHeight) * 100
      setScrollProgress(Math.min(progress, 100))
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Track read time on unmount
  useEffect(() => {
    return () => {
      if (article && !hasTrackedRead.current) {
        const duration = Math.floor((Date.now() - readStartTime) / 1000)
        if (duration > 5) { // Only track if read for more than 5 seconds
          hasTrackedRead.current = true
          trackRead({
            variables: { articleId: article.id, readDuration: duration },
          }).catch(console.error)
        }
      }
    }
  }, [article, readStartTime, trackRead])

  const handleBookmarkToggle = async () => {
    if (!article) return

    try {
      if (isBookmarked) {
        await unbookmarkArticle({
          variables: { articleId: article.id },
          refetchQueries: [{ query: ARTICLE_DETAIL_QUERY, variables: { id: articleId } }],
        })
      } else {
        await bookmarkArticle({
          variables: { articleId: article.id },
          refetchQueries: [{ query: ARTICLE_DETAIL_QUERY, variables: { id: articleId } }],
        })
      }
    } catch (error) {
      console.error('Bookmark error:', error)
    }
  }

  const increaseFontSize = () => {
    setFontSize((prev) => Math.min(prev + 1, fontSizeClasses.length - 1))
  }

  const decreaseFontSize = () => {
    setFontSize((prev) => Math.max(prev - 1, 0))
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatRelativeTime = (date: string) => {
    const now = new Date()
    const published = new Date(date)
    const diffHours = Math.floor((now.getTime() - published.getTime()) / (1000 * 60 * 60))
    
    if (diffHours < 1) return '1時間以内'
    if (diffHours < 24) return `${diffHours}時間前`
    if (diffHours < 48) return '1日前'
    return `${Math.floor(diffHours / 24)}日前`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-400">Loading...</div>
      </div>
    )
  }

  if (error || !article) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">Error loading article</div>
      </div>
    )
  }

  const tierColors = {
    1: 'text-yellow-500',
    2: 'text-gray-300',
    3: 'text-orange-600',
    4: 'text-gray-500',
  }

  return (
    <>
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-gray-800 z-50">
        <div
          data-testid="progress-bar"
          className="h-full bg-gradient-to-r from-emerald-500 to-blue-500 transition-all duration-300"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Header */}
      <header className="sticky top-1 z-40 bg-gray-900/95 backdrop-blur border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-gray-400 hover:text-emerald-400 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            <span>ダッシュボードに戻る</span>
          </Link>
          <div className="flex items-center gap-3">
            <button className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-700 text-gray-300 transition-all">
              <SpeakerWaveIcon className="w-5 h-5" />
              <span className="ml-2">読み上げ</span>
            </button>
            <button className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-700 text-gray-300 transition-all">
              <ShareIcon className="w-5 h-5" />
              <span className="ml-2">共有</span>
            </button>
            <button
              onClick={handleBookmarkToggle}
              className={`p-2 rounded-lg border transition-all ${
                isBookmarked
                  ? 'bg-emerald-500 text-gray-900 border-emerald-500'
                  : 'bg-emerald-500 text-gray-900 border-emerald-500 hover:opacity-90'
              }`}
            >
              {isBookmarked ? (
                <>
                  <BookmarkSolidIcon className="w-5 h-5" />
                  <span className="ml-2">保存済み</span>
                </>
              ) : (
                <>
                  <BookmarkIcon className="w-5 h-5" />
                  <span className="ml-2">保存</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 p-8">
        {/* Article Container */}
        <main className="lg:col-span-2 bg-gray-900 rounded-xl overflow-hidden border border-gray-800">
          <div className="p-8 border-b border-gray-800">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-gray-700 flex items-center justify-center text-2xl">
                  {article.source.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-base">{article.source.name}</span>
                    <span className={`text-sm ${tierColors[article.source.tier.level as keyof typeof tierColors]}`}>
                      ⭐ {article.source.tier.name}
                    </span>
                  </div>
                  <div className="text-sm text-gray-400">
                    {formatDate(article.publishedAt)} • 更新: {formatRelativeTime(article.publishedAt)}
                  </div>
                </div>
              </div>
              <div className="bg-gray-800 px-4 py-3 rounded-lg border border-gray-700">
                <div className="text-xs text-gray-500">信頼度スコア</div>
                <div className="text-xl font-bold text-emerald-400">
                  {getTrustScore(article.source.tier.level)}%
                </div>
              </div>
            </div>
            <h1 className="text-3xl font-bold mb-4">{article.title}</h1>
            <div className="flex gap-6 text-sm text-gray-400">
              <span>📖 {article.readTime}分で読了</span>
              <span>👁 {article.viewCount}回閲覧</span>
              <span>💬 156コメント</span>
              <span>🔁 892シェア</span>
            </div>
          </div>

          {/* AI Summary Section */}
          {article.aiSummary && (
            <div className="bg-gradient-to-br from-blue-900/20 to-gray-800/20 p-6 border-b border-gray-800 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-emerald-500" />
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-blue-500 text-white rounded-lg flex items-center justify-center text-lg">
                  🤖
                </div>
                <h2 className="text-lg font-semibold">AI要約 - 重要な3つのポイント</h2>
                <span className="ml-auto text-sm text-gray-400">精度: 94%</span>
              </div>
              <div className="space-y-3">
                {article.aiSummary.keyPoints.map((point, index) => (
                  <div key={index} className="flex gap-3 p-3 bg-black/30 rounded-lg border border-gray-700">
                    <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0">
                      {index + 1}
                    </span>
                    <span className="text-base">{point}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Article Content */}
          <article 
            className={`article-content p-8 prose prose-invert max-w-none ${fontSizeClasses[fontSize]}`}
            dangerouslySetInnerHTML={{ __html: article.content }}
          />

          {/* Tags */}
          <div className="p-6 border-t border-gray-800 flex gap-2 flex-wrap">
            {article.tags.map((tag) => (
              <Link
                key={tag.id}
                href={`/tags/${tag.id}`}
                className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-full text-sm text-gray-300 hover:text-emerald-400 hover:border-emerald-400 transition-all"
              >
                {tag.name}
              </Link>
            ))}
          </div>
        </main>

        {/* Sidebar */}
        <aside className="space-y-6">
          {/* Actions Card */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <div className="space-y-3">
              <button
                onClick={handleBookmarkToggle}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all ${
                  isBookmarked
                    ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    : 'bg-emerald-500 text-gray-900 hover:opacity-90'
                }`}
              >
                {isBookmarked ? (
                  <>
                    <BookmarkSolidIcon className="w-5 h-5" />
                    <span>保存済み</span>
                  </>
                ) : (
                  <>
                    <BookmarkIcon className="w-5 h-5" />
                    <span>記事を保存</span>
                  </>
                )}
              </button>
              <button className="w-full flex items-center justify-center gap-2 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg border border-gray-700 font-medium transition-all">
                <ShareIcon className="w-5 h-5" />
                <span>共有する</span>
              </button>
              <button className="w-full flex items-center justify-center gap-2 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg border border-gray-700 font-medium transition-all">
                <PrinterIcon className="w-5 h-5" />
                <span>印刷</span>
              </button>
              <button className="w-full flex items-center justify-center gap-2 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg border border-gray-700 font-medium transition-all">
                <EnvelopeIcon className="w-5 h-5" />
                <span>メールで送信</span>
              </button>
            </div>
          </div>

          {/* Reading Options */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h3 className="text-base font-semibold mb-4">読書設定</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-gray-800">
                <span className="text-sm text-gray-300">文字サイズ</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={decreaseFontSize}
                    className="px-2 py-1 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded text-gray-300 transition-all"
                  >
                    A-
                  </button>
                  <button
                    onClick={increaseFontSize}
                    className="px-2 py-1 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded text-gray-300 transition-all"
                  >
                    A+
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-gray-800">
                <span className="text-sm text-gray-300">ナイトモード</span>
                <button
                  onClick={() => setNightMode(!nightMode)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    nightMode ? 'bg-emerald-500' : 'bg-gray-700'
                  }`}
                >
                  <div
                    className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                      nightMode ? 'translate-x-5' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-sm text-gray-300">読み上げ</span>
                <button className="relative w-11 h-6 bg-gray-700 rounded-full">
                  <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full" />
                </button>
              </div>
            </div>
          </div>

          {/* Related Articles */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h3 className="text-base font-semibold mb-4">関連記事</h3>
            <div className="space-y-3">
              {article.relatedArticles.map((related) => (
                <Link
                  key={related.id}
                  href={`/articles/${related.id}`}
                  className="block p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-all hover:translate-x-1"
                >
                  <h4 className="font-medium text-sm mb-1 line-clamp-2">
                    {related.title}
                  </h4>
                  <div className="text-xs text-gray-500">
                    {related.source.name} • {formatRelativeTime(related.publishedAt)}
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Original Link */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h3 className="text-base font-semibold mb-4">元記事</h3>
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              <LinkIcon className="w-5 h-5" />
              <span className="text-sm">元記事を読む</span>
            </a>
          </div>
        </aside>
      </div>
    </>
  )
}