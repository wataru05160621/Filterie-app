'use client'

import { useState, useEffect, useMemo } from 'react'
import { useQuery, useMutation } from '@apollo/client'
import { useAuth } from '@/providers/auth-provider'
import {
  SAVED_ARTICLES_QUERY,
  CREATE_TRAY_MUTATION,
  UPDATE_TRAY_MUTATION,
  DELETE_TRAY_MUTATION,
  ADD_TO_TRAY_MUTATION,
  REMOVE_FROM_TRAY_MUTATION,
  EXPORT_TRAY_MUTATION
} from './queries'
import {
  MagnifyingGlassIcon,
  PlusIcon,
  FolderIcon,
  TrashIcon,
  PencilSquareIcon,
  ArrowDownTrayIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  FolderPlusIcon,
  StarIcon,
} from '@heroicons/react/24/outline'
import { formatDistanceToNow } from 'date-fns'
import { ja } from 'date-fns/locale'

interface Article {
  id: string
  title: string
  content: string
  summary: string
  publishedAt: string
  source: {
    id: string
    name: string
    tier: {
      level: number
    }
  }
}

interface Tray {
  id: string
  name: string
  description: string
  color: string
  articleCount: number
  articles: Article[]
  createdAt: string
  updatedAt: string
}

interface CreateTrayInput {
  name: string
  description: string
  color: string
}

interface UpdateTrayInput {
  name?: string
  description?: string
  color?: string
}

const trayColors = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#8b5cf6', // violet
  '#f59e0b', // amber
  '#ef4444', // red
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16', // lime
]

const exportFormats = [
  { value: 'MARKDOWN', label: 'Markdown', icon: '📝' },
  { value: 'HTML', label: 'HTML', icon: '🌐' },
  { value: 'PDF', label: 'PDF', icon: '📄' },
  { value: 'CSV', label: 'CSV', icon: '📊' },
  { value: 'OPML', label: 'OPML', icon: '📡' },
]

export default function SavedArticlesPage() {
  const { user } = useAuth()
  const [selectedTray, setSelectedTray] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState<string | null>(null)
  const [editingTray, setEditingTray] = useState<Tray | null>(null)
  const [deletingTray, setDeletingTray] = useState<Tray | null>(null)
  const [formData, setFormData] = useState<CreateTrayInput>({
    name: '',
    description: '',
    color: trayColors[0],
  })
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const { data, loading, error, refetch } = useQuery<{ trays: { items: Tray[]; totalCount: number } }>(SAVED_ARTICLES_QUERY)
  
  const [createTray] = useMutation(CREATE_TRAY_MUTATION)
  const [updateTray] = useMutation(UPDATE_TRAY_MUTATION)
  const [deleteTray] = useMutation(DELETE_TRAY_MUTATION)
  const [removeFromTray] = useMutation(REMOVE_FROM_TRAY_MUTATION)
  const [exportTray] = useMutation(EXPORT_TRAY_MUTATION)

  const trays = data?.trays.items || []
  const currentTray = trays.find(t => t.id === selectedTray) || trays[0]

  // Filter articles based on search query
  const filteredArticles = useMemo(() => {
    if (!currentTray) return []
    if (!searchQuery) return currentTray.articles

    const query = searchQuery.toLowerCase()
    return currentTray.articles.filter(article =>
      article.title.toLowerCase().includes(query) ||
      article.summary.toLowerCase().includes(query) ||
      article.source.name.toLowerCase().includes(query)
    )
  }, [currentTray, searchQuery])

  useEffect(() => {
    if (trays.length > 0 && !selectedTray) {
      setSelectedTray(trays[0].id)
    }
  }, [trays, selectedTray])

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [notification])

  const handleCreateTray = async () => {
    try {
      await createTray({
        variables: { input: formData },
        refetchQueries: [{ query: SAVED_ARTICLES_QUERY }],
      })
      setShowCreateModal(false)
      setFormData({ name: '', description: '', color: trayColors[0] })
      setNotification({ type: 'success', message: 'トレイを作成しました' })
    } catch (error) {
      console.error('Error creating tray:', error)
      setNotification({ type: 'error', message: 'トレイの作成に失敗しました' })
    }
  }

  const handleUpdateTray = async () => {
    if (!editingTray) return

    try {
      const input: UpdateTrayInput = {}
      if (formData.name !== editingTray.name) input.name = formData.name
      if (formData.description !== editingTray.description) input.description = formData.description
      if (formData.color !== editingTray.color) input.color = formData.color

      await updateTray({
        variables: { id: editingTray.id, input },
        refetchQueries: [{ query: SAVED_ARTICLES_QUERY }],
      })
      setShowEditModal(false)
      setEditingTray(null)
      setNotification({ type: 'success', message: 'トレイを更新しました' })
    } catch (error) {
      console.error('Error updating tray:', error)
      setNotification({ type: 'error', message: 'トレイの更新に失敗しました' })
    }
  }

  const handleDeleteTray = async () => {
    if (!deletingTray) return

    try {
      await deleteTray({
        variables: { id: deletingTray.id },
        refetchQueries: [{ query: SAVED_ARTICLES_QUERY }],
      })
      setShowDeleteModal(false)
      setDeletingTray(null)
      if (selectedTray === deletingTray.id) {
        setSelectedTray(null)
      }
      setNotification({ type: 'success', message: 'トレイを削除しました' })
    } catch (error) {
      console.error('Error deleting tray:', error)
      setNotification({ type: 'error', message: 'トレイの削除に失敗しました' })
    }
  }

  const handleRemoveArticle = async (articleId: string) => {
    if (!currentTray) return

    try {
      await removeFromTray({
        variables: { articleId, trayId: currentTray.id },
        refetchQueries: [{ query: SAVED_ARTICLES_QUERY }],
      })
      setNotification({ type: 'success', message: '記事を削除しました' })
    } catch (error) {
      console.error('Error removing article:', error)
      setNotification({ type: 'error', message: '記事の削除に失敗しました' })
    }
  }

  const handleExport = async (format: string) => {
    if (!currentTray) return

    try {
      const { data } = await exportTray({
        variables: { trayId: currentTray.id, format },
      })

      // Download the exported file
      const blob = new Blob([data.exportTray.content], { type: data.exportTray.mimeType })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = data.exportTray.filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      setShowExportMenu(null)
      setNotification({ type: 'success', message: 'エクスポートが完了しました' })
    } catch (error) {
      console.error('Error exporting tray:', error)
      setNotification({ type: 'error', message: 'エクスポートに失敗しました' })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-red-500">Error loading saved articles</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg flex items-center gap-2 ${
          notification.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'
        }`}>
          {notification.type === 'success' ? (
            <CheckCircleIcon className="w-5 h-5" />
          ) : (
            <ExclamationCircleIcon className="w-5 h-5" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      <div className="flex h-screen">
        {/* Sidebar */}
        <div className="w-80 bg-zinc-900 border-r border-zinc-800 flex flex-col">
          <div className="p-6 border-b border-zinc-800">
            <h1 className="text-2xl font-bold mb-2">保存済み記事</h1>
            <p className="text-sm text-zinc-400">{trays.reduce((sum, t) => sum + t.articleCount, 0)} 件の記事</p>
          </div>

          {/* Tray List */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-zinc-400">トレイ</h2>
              <button
                onClick={() => setShowCreateModal(true)}
                className="p-1.5 hover:bg-zinc-800 rounded transition-colors"
                title="新規トレイ"
              >
                <PlusIcon className="w-4 h-4" />
              </button>
            </div>

            {trays.length === 0 ? (
              <div className="text-center py-8">
                <FolderPlusIcon className="w-12 h-12 mx-auto mb-3 text-zinc-600" />
                <p className="text-sm text-zinc-400 mb-2">まだトレイがありません</p>
                <p className="text-xs text-zinc-500">新規トレイを作成して、記事の整理を始めましょう</p>
              </div>
            ) : (
              <div className="space-y-2">
                {trays.map((tray) => (
                  <div
                    key={tray.id}
                    onClick={() => setSelectedTray(tray.id)}
                    className={`p-3 rounded-lg cursor-pointer transition-all ${
                      selectedTray === tray.id
                        ? 'bg-zinc-800 border border-zinc-700'
                        : 'hover:bg-zinc-800/50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center mt-0.5"
                        style={{ backgroundColor: tray.color + '20', color: tray.color }}
                      >
                        <FolderIcon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">{tray.name}</h3>
                        <p className="text-xs text-zinc-400 truncate">{tray.description}</p>
                        <p className="text-xs text-zinc-500 mt-1">{tray.articleCount} 記事</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-zinc-800">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                {currentTray && (
                  <>
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: currentTray.color + '20', color: currentTray.color }}
                    >
                      <FolderIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">{currentTray.name}</h2>
                      <p className="text-sm text-zinc-400">{currentTray.description}</p>
                    </div>
                  </>
                )}
              </div>
              
              {currentTray && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setEditingTray(currentTray)
                      setFormData({
                        name: currentTray.name,
                        description: currentTray.description,
                        color: currentTray.color,
                      })
                      setShowEditModal(true)
                    }}
                    className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                    title="編集"
                  >
                    <PencilSquareIcon className="w-5 h-5" />
                  </button>
                  <div className="relative">
                    <button
                      onClick={() => setShowExportMenu(showExportMenu === currentTray.id ? null : currentTray.id)}
                      className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                      title="エクスポート"
                    >
                      <ArrowDownTrayIcon className="w-5 h-5" />
                    </button>
                    {showExportMenu === currentTray.id && (
                      <div className="absolute right-0 mt-2 w-48 bg-zinc-800 rounded-lg shadow-lg border border-zinc-700 py-1 z-10">
                        {exportFormats.map((format) => (
                          <button
                            key={format.value}
                            onClick={() => handleExport(format.value)}
                            className="w-full px-4 py-2 text-left hover:bg-zinc-700 transition-colors flex items-center gap-2"
                          >
                            <span>{format.icon}</span>
                            <span>{format.label}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setDeletingTray(currentTray)
                      setShowDeleteModal(true)
                    }}
                    className="p-2 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors"
                    title="削除"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>

            {/* Search */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-zinc-400" />
              <input
                type="text"
                placeholder="記事を検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-400 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>

          {/* Articles */}
          <div className="flex-1 overflow-y-auto p-6">
            {!currentTray || filteredArticles.length === 0 ? (
              <div className="text-center py-12">
                <FolderIcon className="w-16 h-16 mx-auto mb-4 text-zinc-600" />
                <p className="text-zinc-400">
                  {searchQuery ? '検索結果がありません' : 'このトレイに記事がありません'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredArticles.map((article) => (
                  <div key={article.id} className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold mb-2">{article.title}</h3>
                        <p className="text-sm text-zinc-400 line-clamp-2">{article.summary}</p>
                      </div>
                      <button
                        onClick={() => handleRemoveArticle(article.id)}
                        className="p-2 ml-4 hover:bg-zinc-800 rounded-lg transition-colors text-zinc-400 hover:text-red-500"
                        title="削除"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs text-zinc-500">
                      <span className="flex items-center gap-1">
                        <span>{article.source.name}</span>
                        <div className="flex">
                          {[...Array(article.source.tier.level)].map((_, i) => (
                            <StarIcon key={i} className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                          ))}
                        </div>
                      </span>
                      <span>
                        {formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true, locale: ja })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Tray Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 rounded-xl w-full max-w-md border border-zinc-800">
            <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
              <h2 className="text-xl font-semibold">新規トレイ作成</h2>
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  setFormData({ name: '', description: '', color: trayColors[0] })
                }}
                className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label htmlFor="tray-name" className="block text-sm font-medium text-zinc-300 mb-2">
                  トレイ名
                </label>
                <input
                  id="tray-name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-emerald-500 transition-colors"
                  placeholder="例: 技術系記事"
                />
              </div>

              <div>
                <label htmlFor="tray-description" className="block text-sm font-medium text-zinc-300 mb-2">
                  説明
                </label>
                <textarea
                  id="tray-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-emerald-500 transition-colors"
                  placeholder="例: プログラミング・開発関連の記事"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  色
                </label>
                <div className="flex gap-2">
                  {trayColors.map((color) => (
                    <button
                      key={color}
                      data-testid={`color-${color}`}
                      onClick={() => setFormData({ ...formData, color })}
                      className={`w-10 h-10 rounded-lg border-2 transition-all ${
                        formData.color === color
                          ? 'border-white scale-110'
                          : 'border-transparent hover:border-zinc-600'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-zinc-800 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  setFormData({ name: '', description: '', color: trayColors[0] })
                }}
                className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={handleCreateTray}
                disabled={!formData.name}
                className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-black font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                作成
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Tray Modal */}
      {showEditModal && editingTray && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 rounded-xl w-full max-w-md border border-zinc-800">
            <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
              <h2 className="text-xl font-semibold">トレイを編集</h2>
              <button
                onClick={() => {
                  setShowEditModal(false)
                  setEditingTray(null)
                }}
                className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label htmlFor="edit-tray-name" className="block text-sm font-medium text-zinc-300 mb-2">
                  トレイ名
                </label>
                <input
                  id="edit-tray-name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              <div>
                <label htmlFor="edit-tray-description" className="block text-sm font-medium text-zinc-300 mb-2">
                  説明
                </label>
                <textarea
                  id="edit-tray-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  色
                </label>
                <div className="flex gap-2">
                  {trayColors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setFormData({ ...formData, color })}
                      className={`w-10 h-10 rounded-lg border-2 transition-all ${
                        formData.color === color
                          ? 'border-white scale-110'
                          : 'border-transparent hover:border-zinc-600'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-zinc-800 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowEditModal(false)
                  setEditingTray(null)
                }}
                className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={handleUpdateTray}
                disabled={!formData.name}
                className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-black font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deletingTray && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 rounded-xl w-full max-w-md border border-zinc-800">
            <div className="p-6 border-b border-zinc-800">
              <h2 className="text-xl font-semibold">トレイを削除しますか？</h2>
            </div>
            
            <div className="p-6">
              <p className="text-zinc-300 mb-4">
                「{deletingTray.name}」を削除しますか？
              </p>
              <p className="text-sm text-zinc-400">
                このトレイと保存された{deletingTray.articleCount}件の記事が削除されます。この操作は元に戻すことができません。
              </p>
            </div>
            
            <div className="p-6 border-t border-zinc-800 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  setDeletingTray(null)
                }}
                className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={handleDeleteTray}
                className="px-5 py-2.5 bg-red-500 hover:bg-red-600 text-black font-medium rounded-lg transition-colors"
              >
                削除する
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}