'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import Link from 'next/link';
import { useAuth } from '@/providers/auth-provider';
import {
  SOURCES_QUERY,
  CREATE_SOURCE_MUTATION,
  UPDATE_SOURCE_MUTATION,
  DELETE_SOURCE_MUTATION,
  EVALUATE_SOURCE_MUTATION
} from './queries';
import { 
  MagnifyingGlassIcon as Search,
  PlusIcon as Plus,
  ArrowDownTrayIcon as Download,
  PencilSquareIcon as Edit2,
  ChartBarIcon as BarChart2,
  TrashIcon as Trash2,
  XMarkIcon as X,
  ExclamationTriangleIcon as AlertCircle
} from '@heroicons/react/24/outline';

interface Source {
  id: string;
  name: string;
  url: string;
  rssUrl?: string | null;
  category: string;
  status: 'ACTIVE' | 'WARNING' | 'ERROR';
  articleCount: number;
  errorRate: number;
  lastFetchedAt?: string | null;
  tier: {
    level: number;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface CreateSourceInput {
  name: string;
  url: string;
  rssUrl?: string;
  category: string;
}

interface UpdateSourceInput {
  name?: string;
  url?: string;
  rssUrl?: string;
  category?: string;
}

interface EvaluationResult {
  tier: number;
  trustScore: number;
  criteria: string[];
}

const getTierStyle = (tier: number) => {
  switch (tier) {
    case 1:
      return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30';
    case 2:
      return 'bg-gray-300/10 text-gray-300 border-gray-300/30';
    case 3:
      return 'bg-orange-600/10 text-orange-600 border-orange-600/30';
    case 4:
      return 'bg-gray-500/10 text-gray-500 border-gray-500/30';
    default:
      return 'bg-gray-500/10 text-gray-500 border-gray-500/30';
  }
};

const getStatusStyle = (status: string) => {
  switch (status) {
    case 'ACTIVE':
      return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30';
    case 'WARNING':
      return 'bg-amber-500/10 text-amber-500 border-amber-500/30';
    case 'ERROR':
      return 'bg-red-500/10 text-red-500 border-red-500/30';
    default:
      return 'bg-gray-500/10 text-gray-500 border-gray-500/30';
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'ACTIVE':
      return 'アクティブ';
    case 'WARNING':
      return '警告';
    case 'ERROR':
      return 'エラー';
    default:
      return status;
  }
};

const formatRelativeTime = (dateString: string | null | undefined) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 60) return `${minutes}分前`;
  if (hours < 24) return `${hours}時間前`;
  return `${days}日前`;
};

export default function SourcesPage() {
  const { user } = useAuth();
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedSource, setSelectedSource] = useState<Source | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState({
    tier: null as number | null,
    status: null as string | null,
  });
  const [formData, setFormData] = useState<CreateSourceInput>({
    name: '',
    url: '',
    rssUrl: '',
    category: ''
  });
  const [evaluationResult, setEvaluationResult] = useState<EvaluationResult | null>(null);

  const { data, loading, error, refetch } = useQuery(SOURCES_QUERY, {
    variables: {},
  });

  const [createSource, { loading: createLoading }] = useMutation(CREATE_SOURCE_MUTATION);
  const [updateSource, { loading: updateLoading }] = useMutation(UPDATE_SOURCE_MUTATION);
  const [deleteSource, { loading: deleteLoading }] = useMutation(DELETE_SOURCE_MUTATION);
  const [evaluateSource, { loading: evaluateLoading }] = useMutation(EVALUATE_SOURCE_MUTATION);

  const sources = data?.sources?.items || [];
  
  const stats = {
    total: sources.length,
    active: sources.filter((s: Source) => s.status === 'ACTIVE').length,
    errors: sources.filter((s: Source) => s.status === 'ERROR').length,
  };

  const filteredSources = sources.filter((source: Source) => {
    const matchesSearch = source.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         source.url.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTier = !activeFilters.tier || source.tier.level === activeFilters.tier;
    const matchesStatus = !activeFilters.status || source.status === activeFilters.status;
    return matchesSearch && matchesTier && matchesStatus;
  });

  const toggleSourceSelection = (id: string) => {
    setSelectedSources(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const toggleAllSelection = () => {
    if (selectedSources.length === filteredSources.length) {
      setSelectedSources([]);
    } else {
      setSelectedSources(filteredSources.map((s: Source) => s.id));
    }
  };

  const handleCreateSource = async () => {
    try {
      await createSource({
        variables: { input: formData },
        refetchQueries: [{ query: SOURCES_QUERY }],
      });
      setShowAddModal(false);
      setFormData({ name: '', url: '', rssUrl: '', category: '' });
      setEvaluationResult(null);
    } catch (error) {
      console.error('Error creating source:', error);
    }
  };

  const handleUpdateSource = async () => {
    if (!selectedSource) return;
    
    try {
      await updateSource({
        variables: {
          id: selectedSource.id,
          input: {
            name: formData.name !== selectedSource.name ? formData.name : undefined,
            url: formData.url !== selectedSource.url ? formData.url : undefined,
            rssUrl: formData.rssUrl !== selectedSource.rssUrl ? formData.rssUrl : undefined,
            category: formData.category !== selectedSource.category ? formData.category : undefined,
          },
        },
        refetchQueries: [{ query: SOURCES_QUERY }],
      });
      setShowEditModal(false);
      setSelectedSource(null);
      setFormData({ name: '', url: '', rssUrl: '', category: '' });
    } catch (error) {
      console.error('Error updating source:', error);
    }
  };

  const handleDeleteSource = async () => {
    if (!selectedSource) return;
    
    try {
      await deleteSource({
        variables: { id: selectedSource.id },
        refetchQueries: [{ query: SOURCES_QUERY }],
      });
      setShowDeleteModal(false);
      setSelectedSource(null);
    } catch (error) {
      console.error('Error deleting source:', error);
    }
  };

  const handleEvaluateUrl = async () => {
    if (!formData.url) return;
    
    try {
      const { data } = await evaluateSource({
        variables: { url: formData.url },
      });
      setEvaluationResult(data.evaluateSource);
    } catch (error) {
      console.error('Error evaluating source:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-red-500">Error loading sources</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 w-[280px] h-screen bg-zinc-900 border-r border-zinc-800 overflow-y-auto z-50">
        <div className="p-6 border-b border-zinc-800">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center font-bold text-xl">
              F
            </div>
            <span className="text-2xl font-bold">Filterie</span>
          </Link>
        </div>
        
        <nav className="py-4">
          <Link href="/" className="flex items-center gap-3 px-6 py-3 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors">
            <span>🏠</span>
            <span>ダッシュボード</span>
          </Link>
          <Link href="/articles" className="flex items-center gap-3 px-6 py-3 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors">
            <span>📰</span>
            <span>最新記事</span>
          </Link>
          <Link href="/trends" className="flex items-center gap-3 px-6 py-3 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors">
            <span>🔥</span>
            <span>トレンド</span>
          </Link>
          <Link href="/ai" className="flex items-center gap-3 px-6 py-3 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors">
            <span>🤖</span>
            <span>AI推薦</span>
          </Link>
          <Link href="/sources" className="flex items-center gap-3 px-6 py-3 text-emerald-400 bg-zinc-800 relative before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-emerald-400">
            <span>📑</span>
            <span>情報源管理</span>
          </Link>
          <Link href="/saved" className="flex items-center gap-3 px-6 py-3 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors">
            <span>🔖</span>
            <span>保存済み</span>
          </Link>
          <Link href="/settings" className="flex items-center gap-3 px-6 py-3 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors">
            <span>⚙️</span>
            <span>設定</span>
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="ml-[280px] min-h-screen">
        {/* Header */}
        <header className="bg-zinc-900 border-b border-zinc-800 px-8 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <h1 className="text-3xl font-bold">情報源管理</h1>
              <div className="flex gap-6 text-sm text-zinc-400">
                <div className="flex items-center gap-2">
                  <span>総情報源数:</span>
                  <span className="text-white font-semibold">{stats.total}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>アクティブ:</span>
                  <span className="text-white font-semibold">{stats.active}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>エラー:</span>
                  <span className="text-red-500 font-semibold">{stats.errors}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg flex items-center gap-2 transition-colors">
                <Download className="w-4 h-4" />
                <span>インポート</span>
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-black font-medium rounded-lg flex items-center gap-2 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>新規追加</span>
              </button>
            </div>
          </div>
        </header>

        {/* Filter Bar */}
        <div className="bg-zinc-900 border-b border-zinc-800 px-8 py-5">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
              <input
                type="text"
                placeholder="情報源を検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:bg-zinc-700/50 transition-colors"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setActiveFilters({ tier: null, status: null })}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  !activeFilters.tier && !activeFilters.status
                    ? 'bg-zinc-700 text-white'
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                }`}
              >
                すべて
              </button>
              {[1, 2, 3, 4].map(tier => (
                <button
                  key={tier}
                  onClick={() => setActiveFilters({ ...activeFilters, tier: tier === activeFilters.tier ? null : tier })}
                  className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                    activeFilters.tier === tier ? getTierStyle(tier) : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700'
                  }`}
                >
                  ⭐ Tier {tier}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              {['ACTIVE', 'WARNING', 'ERROR'].map(status => (
                <button
                  key={status}
                  onClick={() => setActiveFilters({ ...activeFilters, status: status === activeFilters.status ? null : status })}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    activeFilters.status === status
                      ? 'bg-zinc-700 text-white'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                  }`}
                >
                  {status === 'ACTIVE' && '✅'} {status === 'WARNING' && '⚠️'} {status === 'ERROR' && '❌'} {getStatusLabel(status)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="m-6">
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
            {selectedSources.length > 0 && (
              <div className="px-6 py-4 border-b border-zinc-800 flex items-center gap-4">
                <span className="text-sm text-zinc-400">{selectedSources.length}件選択中</span>
                <button className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-sm rounded-lg transition-colors">
                  一括編集
                </button>
                <button className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-red-500 text-sm rounded-lg transition-colors">
                  削除
                </button>
              </div>
            )}
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-zinc-800/50">
                    <th className="w-10 p-4">
                      <input
                        type="checkbox"
                        checked={selectedSources.length === filteredSources.length && filteredSources.length > 0}
                        onChange={toggleAllSelection}
                        className="w-4 h-4 bg-zinc-700 border-zinc-600 rounded"
                      />
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                      情報源
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                      Tier
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                      カテゴリ
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                      ステータス
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                      統計
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                      最終更新
                    </th>
                    <th className="px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {filteredSources.map((source: Source) => (
                    <tr key={source.id} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="p-4">
                        <input
                          type="checkbox"
                          checked={selectedSources.includes(source.id)}
                          onChange={() => toggleSourceSelection(source.id)}
                          className="w-4 h-4 bg-zinc-700 border-zinc-600 rounded"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-zinc-800 rounded-lg flex items-center justify-center text-lg">
                            {source.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-semibold text-white">{source.name}</div>
                            <div className="text-xs text-zinc-500">{source.url}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${getTierStyle(source.tier.level)}`}>
                          ⭐ Tier {source.tier.level}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-zinc-300">
                        {source.category}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${getStatusStyle(source.status)}`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                          {getStatusLabel(source.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs space-y-1">
                          <div className="text-zinc-500">
                            記事数: <span className="text-zinc-300">{source.articleCount.toLocaleString()}</span>
                          </div>
                          <div className="text-zinc-500">
                            エラー率: <span className="text-zinc-300">{source.errorRate}%</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-zinc-400">
                        {formatRelativeTime(source.lastFetchedAt)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          <button 
                            data-testid="edit-source-button"
                            onClick={() => {
                              setSelectedSource(source);
                              setFormData({
                                name: source.name,
                                url: source.url,
                                rssUrl: source.rssUrl || '',
                                category: source.category
                              });
                              setShowEditModal(true);
                            }}
                            className="p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-700 rounded transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button className="p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-700 rounded transition-colors">
                            <BarChart2 className="w-4 h-4" />
                          </button>
                          <button 
                            data-testid="delete-source-button"
                            onClick={() => {
                              setSelectedSource(source);
                              setShowDeleteModal(true);
                            }}
                            className="p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-700 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* Add Source Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4">
          <div className="bg-zinc-900 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-zinc-800">
            <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
              <h2 className="text-xl font-semibold">新規情報源を追加</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-5">
              <div>
                <label htmlFor="add-name" className="block text-sm font-medium text-white mb-2">
                  名前 *
                </label>
                <input
                  id="add-name"
                  type="text"
                  placeholder="例: 日経新聞、TechCrunch Japan"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:bg-zinc-700/50 transition-colors"
                />
              </div>
              
              <div>
                <label htmlFor="add-url" className="block text-sm font-medium text-white mb-2">
                  URL *
                </label>
                <input
                  id="add-url"
                  type="url"
                  placeholder="例: https://www.nikkei.com"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:bg-zinc-700/50 transition-colors"
                />
                <p className="mt-1 text-xs text-zinc-500">WebサイトのトップページURLを入力してください</p>
              </div>
              
              <div>
                <label htmlFor="add-rss" className="block text-sm font-medium text-white mb-2">
                  RSSフィードURL（オプション）
                </label>
                <input
                  id="add-rss"
                  type="url"
                  placeholder="例: https://www.nikkei.com/rss/news.rdf"
                  value={formData.rssUrl}
                  onChange={(e) => setFormData({ ...formData, rssUrl: e.target.value })}
                  className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:bg-zinc-700/50 transition-colors"
                />
                <p className="mt-1 text-xs text-zinc-500">RSSフィードがある場合は入力してください</p>
              </div>
              
              <div>
                <label htmlFor="add-category" className="block text-sm font-medium text-white mb-2">
                  カテゴリ *
                </label>
                <select
                  id="add-category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-emerald-500 transition-colors"
                >
                  <option value="">選択してください</option>
                  <option value="ニュース">ニュース</option>
                  <option value="テクノロジー">テクノロジー</option>
                  <option value="ビジネス">ビジネス</option>
                  <option value="サイエンス">サイエンス</option>
                  <option value="エンタメ">エンタメ</option>
                  <option value="その他">その他</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Tier評価
                </label>
                <button
                  type="button"
                  onClick={handleEvaluateUrl}
                  disabled={!formData.url || evaluateLoading}
                  className="w-full px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  <Search className="w-4 h-4" />
                  <span>{evaluateLoading ? '評価中...' : 'URLを評価'}</span>
                </button>
                {evaluationResult && (
                  <div className="mt-3 p-4 bg-zinc-800 border border-zinc-700 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${getTierStyle(evaluationResult.tier)}`}>
                          ⭐ Tier {evaluationResult.tier}
                        </span>
                        <span className="text-sm text-zinc-400">推定評価</span>
                      </div>
                      <div className="text-2xl font-bold text-emerald-400">{evaluationResult.trustScore}%</div>
                    </div>
                    <div className="text-sm text-zinc-400 space-y-1">
                      {evaluationResult.criteria.map((criterion, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>{criterion}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-6 border-t border-zinc-800 flex justify-end gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={handleCreateSource}
                disabled={!formData.name || !formData.url || !formData.category || createLoading}
                className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-black font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                {createLoading ? '追加中...' : '保存して追加'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Source Modal */}
      {showEditModal && selectedSource && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4">
          <div className="bg-zinc-900 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-zinc-800">
            <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
              <h2 className="text-xl font-semibold">情報源を編集</h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedSource(null);
                  setFormData({ name: '', url: '', rssUrl: '', category: '' });
                }}
                className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-5">
              <div>
                <label htmlFor="edit-name" className="block text-sm font-medium text-white mb-2">
                  名前 *
                </label>
                <input
                  id="edit-name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:bg-zinc-700/50 transition-colors"
                />
              </div>
              
              <div>
                <label htmlFor="edit-url" className="block text-sm font-medium text-white mb-2">
                  URL *
                </label>
                <input
                  id="edit-url"
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:bg-zinc-700/50 transition-colors"
                />
              </div>
              
              <div>
                <label htmlFor="edit-rss" className="block text-sm font-medium text-white mb-2">
                  RSSフィードURL（オプション）
                </label>
                <input
                  id="edit-rss"
                  type="url"
                  value={formData.rssUrl}
                  onChange={(e) => setFormData({ ...formData, rssUrl: e.target.value })}
                  className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:bg-zinc-700/50 transition-colors"
                />
              </div>
              
              <div>
                <label htmlFor="edit-category" className="block text-sm font-medium text-white mb-2">
                  カテゴリ *
                </label>
                <select
                  id="edit-category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-emerald-500 transition-colors"
                >
                  <option value="">選択してください</option>
                  <option value="ニュース">ニュース</option>
                  <option value="テクノロジー">テクノロジー</option>
                  <option value="ビジネス">ビジネス</option>
                  <option value="サイエンス">サイエンス</option>
                  <option value="エンタメ">エンタメ</option>
                  <option value="その他">その他</option>
                </select>
              </div>
            </div>
            
            <div className="p-6 border-t border-zinc-800 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedSource(null);
                  setFormData({ name: '', url: '', rssUrl: '', category: '' });
                }}
                className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={handleUpdateSource}
                disabled={!formData.name || !formData.url || !formData.category || updateLoading}
                className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-black font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                {updateLoading ? '更新中...' : '更新'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedSource && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4">
          <div className="bg-zinc-900 rounded-xl w-full max-w-md border border-zinc-800">
            <div className="p-6 border-b border-zinc-800">
              <h2 className="text-xl font-semibold">削除の確認</h2>
            </div>
            
            <div className="p-6">
              <p className="text-zinc-300 mb-4">
                「{selectedSource.name}」を削除してもよろしいですか？
              </p>
              <p className="text-sm text-zinc-500">
                この操作は取り消すことができません。関連する記事データは保持されます。
              </p>
            </div>
            
            <div className="p-6 border-t border-zinc-800 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedSource(null);
                }}
                className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={handleDeleteSource}
                disabled={deleteLoading}
                className="px-5 py-2.5 bg-red-500 hover:bg-red-600 text-black font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                {deleteLoading ? '削除中...' : '削除する'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}