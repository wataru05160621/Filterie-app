'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation } from '@apollo/client'
import { useAuth } from '@/providers/auth-provider'
import {
  AI_SETTINGS_QUERY,
  UPDATE_AI_SETTINGS_MUTATION,
  AI_USAGE_STATS_QUERY,
  TEST_AI_PROMPT_MUTATION
} from './queries'
import {
  CogIcon,
  SparklesIcon,
  ChartBarIcon,
  BeakerIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline'
// TODO: Install react-chartjs-2 and chart.js
// import { Line } from 'react-chartjs-2'
// import {
//   Chart as ChartJS,
//   CategoryScale,
//   LinearScale,
//   PointElement,
//   LineElement,
//   Title,
//   Tooltip,
//   Legend,
//   Filler,
// } from 'chart.js'

// ChartJS.register(
//   CategoryScale,
//   LinearScale,
//   PointElement,
//   LineElement,
//   Title,
//   Tooltip,
//   Legend,
//   Filler
// )

interface AISettings {
  id: string
  userId: string
  aiModel: string
  temperature: number
  maxTokens: number
  summaryPrompt: string
  tagPrompt: string
  features: {
    autoSummarize: boolean
    autoTag: boolean
    sentimentAnalysis: boolean
    keywordExtraction: boolean
  }
  createdAt: string
  updatedAt: string
}

interface UsageStats {
  totalRequests: number
  totalTokens: number
  averageResponseTime: number
  successRate: number
  monthlyUsage: Array<{
    month: string
    requests: number
    tokens: number
  }>
  featureUsage: {
    summarize: number
    tag: number
    sentiment: number
    keyword: number
  }
}

interface TestResult {
  result: string
  tokensUsed: number
  responseTime: number
}

const defaultSettings = {
  aiModel: 'gpt-4',
  temperature: 0.7,
  maxTokens: 2000,
  summaryPrompt: 'Please provide a concise summary of the following article.',
  tagPrompt: 'Extract relevant tags from the following article.',
  features: {
    autoSummarize: true,
    autoTag: true,
    sentimentAnalysis: false,
    keywordExtraction: false,
  },
}

export default function AISettingsPage() {
  const { user } = useAuth()
  const [formData, setFormData] = useState<Partial<AISettings>>(defaultSettings)
  const [sampleText, setSampleText] = useState('')
  const [testResult, setTestResult] = useState<TestResult | null>(null)
  const [showTestModal, setShowTestModal] = useState(false)
  const [currentTestType, setCurrentTestType] = useState<'summary' | 'tag'>('summary')
  const [showResetModal, setShowResetModal] = useState(false)
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const { data, loading, error } = useQuery<{ aiSettings: AISettings }>(AI_SETTINGS_QUERY)
  const { data: statsData, loading: statsLoading } = useQuery<{ aiUsageStats: UsageStats }>(AI_USAGE_STATS_QUERY)
  
  const [updateSettings, { loading: updateLoading }] = useMutation(UPDATE_AI_SETTINGS_MUTATION)
  const [testPrompt, { loading: testLoading }] = useMutation(TEST_AI_PROMPT_MUTATION)

  useEffect(() => {
    if (data?.aiSettings) {
      setFormData(data.aiSettings)
    }
  }, [data])

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [notification])

  const handleSaveSettings = async () => {
    try {
      const input: any = {}
      
      if (formData.aiModel !== data?.aiSettings.aiModel) input.aiModel = formData.aiModel
      if (formData.temperature !== data?.aiSettings.temperature) input.temperature = formData.temperature
      if (formData.maxTokens !== data?.aiSettings.maxTokens) input.maxTokens = formData.maxTokens
      if (formData.summaryPrompt !== data?.aiSettings.summaryPrompt) input.summaryPrompt = formData.summaryPrompt
      if (formData.tagPrompt !== data?.aiSettings.tagPrompt) input.tagPrompt = formData.tagPrompt
      
      if (JSON.stringify(formData.features) !== JSON.stringify(data?.aiSettings.features)) {
        input.features = formData.features
      }

      await updateSettings({
        variables: { input },
        refetchQueries: [{ query: AI_SETTINGS_QUERY }],
      })
      
      setNotification({ type: 'success', message: '設定を保存しました' })
    } catch (error) {
      console.error('Error saving settings:', error)
      setNotification({ type: 'error', message: '設定の保存に失敗しました' })
    }
  }

  const handleTestPrompt = async () => {
    if (!sampleText) return

    try {
      const prompt = currentTestType === 'summary' ? formData.summaryPrompt : formData.tagPrompt
      const { data } = await testPrompt({
        variables: { prompt, sampleText },
      })
      setTestResult(data.testAIPrompt)
    } catch (error) {
      console.error('Error testing prompt:', error)
      setNotification({ type: 'error', message: 'テストの実行に失敗しました' })
    }
  }

  const handleResetToDefault = async () => {
    try {
      await updateSettings({
        variables: { input: defaultSettings },
        refetchQueries: [{ query: AI_SETTINGS_QUERY }],
      })
      setFormData(defaultSettings)
      setShowResetModal(false)
      setNotification({ type: 'success', message: '設定をデフォルトに戻しました' })
    } catch (error) {
      console.error('Error resetting settings:', error)
      setNotification({ type: 'error', message: '設定のリセットに失敗しました' })
    }
  }

  // TODO: Add chart configuration when react-chartjs-2 is installed

  if (loading || statsLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-red-500">Error loading settings</div>
      </div>
    )
  }

  const stats = statsData?.aiUsageStats

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Main Content */}
      <main className="p-8">
        <h1 className="text-3xl font-bold mb-8">AI設定</h1>

        {/* Notification */}
        {notification && (
          <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg flex items-center gap-2 ${
            notification.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'
          }`}>
            {notification.type === 'success' ? (
              <CheckCircleIcon className="w-5 h-5" />
            ) : (
              <XCircleIcon className="w-5 h-5" />
            )}
            <span>{notification.message}</span>
          </div>
        )}

        {/* Usage Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
            <div className="flex items-center justify-between mb-4">
              <SparklesIcon className="w-8 h-8 text-emerald-400" />
              <span className="text-xs text-zinc-500">総リクエスト</span>
            </div>
            <div className="text-2xl font-bold">{stats?.totalRequests.toLocaleString()}</div>
          </div>

          <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
            <div className="flex items-center justify-between mb-4">
              <CogIcon className="w-8 h-8 text-blue-400" />
              <span className="text-xs text-zinc-500">使用トークン</span>
            </div>
            <div className="text-2xl font-bold">{stats?.totalTokens.toLocaleString()}</div>
          </div>

          <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
            <div className="flex items-center justify-between mb-4">
              <ChartBarIcon className="w-8 h-8 text-purple-400" />
              <span className="text-xs text-zinc-500">平均応答時間</span>
            </div>
            <div className="text-2xl font-bold">{stats?.averageResponseTime}秒</div>
          </div>

          <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
            <div className="flex items-center justify-between mb-4">
              <CheckCircleIcon className="w-8 h-8 text-green-400" />
              <span className="text-xs text-zinc-500">成功率</span>
            </div>
            <div className="text-2xl font-bold">{stats?.successRate}%</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Settings Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Model Settings */}
            <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
              <h2 className="text-xl font-semibold mb-6">モデル設定</h2>
              
              <div className="space-y-6">
                <div>
                  <label htmlFor="ai-model" className="block text-sm font-medium text-zinc-300 mb-2">
                    AIモデル
                  </label>
                  <select
                    id="ai-model"
                    value={formData.aiModel}
                    onChange={(e) => setFormData({ ...formData, aiModel: e.target.value })}
                    className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-emerald-500 transition-colors"
                  >
                    <option value="gpt-4">GPT-4 (高精度)</option>
                    <option value="gpt-3.5-turbo">GPT-3.5 Turbo (高速)</option>
                    <option value="claude-3">Claude 3 (バランス)</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="temperature" className="block text-sm font-medium text-zinc-300 mb-2">
                    Temperature
                    <span className="ml-2 text-xs text-zinc-500">({formData.temperature})</span>
                  </label>
                  <input
                    id="temperature"
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={formData.temperature}
                    onChange={(e) => setFormData({ ...formData, temperature: parseFloat(e.target.value) })}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-zinc-500 mt-1">
                    <span>厳密</span>
                    <span>創造的</span>
                  </div>
                </div>

                <div>
                  <label htmlFor="max-tokens" className="block text-sm font-medium text-zinc-300 mb-2">
                    最大トークン数
                  </label>
                  <input
                    id="max-tokens"
                    type="number"
                    value={formData.maxTokens}
                    onChange={(e) => setFormData({ ...formData, maxTokens: parseInt(e.target.value) })}
                    className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Feature Settings */}
            <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
              <h2 className="text-xl font-semibold mb-6">機能設定</h2>
              
              <div className="space-y-4">
                <label className="flex items-center justify-between py-3 border-b border-zinc-800">
                  <span className="text-zinc-300">自動要約</span>
                  <input
                    id="auto-summarize"
                    type="checkbox"
                    checked={formData.features?.autoSummarize}
                    onChange={(e) => setFormData({
                      ...formData,
                      features: { ...formData.features!, autoSummarize: e.target.checked }
                    })}
                    className="w-5 h-5"
                  />
                </label>

                <label className="flex items-center justify-between py-3 border-b border-zinc-800">
                  <span className="text-zinc-300">自動タグ生成</span>
                  <input
                    id="auto-tag"
                    type="checkbox"
                    checked={formData.features?.autoTag}
                    onChange={(e) => setFormData({
                      ...formData,
                      features: { ...formData.features!, autoTag: e.target.checked }
                    })}
                    className="w-5 h-5"
                  />
                </label>

                <label htmlFor="sentiment-analysis" className="flex items-center justify-between py-3 border-b border-zinc-800">
                  <span className="text-zinc-300">感情分析</span>
                  <input
                    id="sentiment-analysis"
                    type="checkbox"
                    checked={formData.features?.sentimentAnalysis}
                    onChange={(e) => setFormData({
                      ...formData,
                      features: { ...formData.features!, sentimentAnalysis: e.target.checked }
                    })}
                    className="w-5 h-5"
                  />
                </label>

                <label className="flex items-center justify-between py-3">
                  <span className="text-zinc-300">キーワード抽出</span>
                  <input
                    id="keyword-extraction"
                    type="checkbox"
                    checked={formData.features?.keywordExtraction}
                    onChange={(e) => setFormData({
                      ...formData,
                      features: { ...formData.features!, keywordExtraction: e.target.checked }
                    })}
                    className="w-5 h-5"
                  />
                </label>
              </div>
            </div>

            {/* Custom Prompts */}
            <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
              <h2 className="text-xl font-semibold mb-6">カスタムプロンプト</h2>
              
              <div className="space-y-6">
                <div>
                  <label htmlFor="summary-prompt" className="block text-sm font-medium text-zinc-300 mb-2">
                    要約プロンプト
                  </label>
                  <textarea
                    id="summary-prompt"
                    value={formData.summaryPrompt}
                    onChange={(e) => setFormData({ ...formData, summaryPrompt: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                  <button
                    onClick={() => {
                      setCurrentTestType('summary')
                      setShowTestModal(true)
                    }}
                    className="mt-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-sm transition-colors"
                  >
                    テスト実行
                  </button>
                </div>

                <div>
                  <label htmlFor="tag-prompt" className="block text-sm font-medium text-zinc-300 mb-2">
                    タグ生成プロンプト
                  </label>
                  <textarea
                    id="tag-prompt"
                    value={formData.tagPrompt}
                    onChange={(e) => setFormData({ ...formData, tagPrompt: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                  <button
                    onClick={() => {
                      setCurrentTestType('tag')
                      setShowTestModal(true)
                    }}
                    className="mt-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-sm transition-colors"
                  >
                    テスト実行
                  </button>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={handleSaveSettings}
                disabled={updateLoading}
                className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-black font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                {updateLoading ? '保存中...' : '設定を保存'}
              </button>
              <button
                onClick={() => setShowResetModal(true)}
                className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg transition-colors"
              >
                デフォルトに戻す
              </button>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Usage Chart */}
            <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
              <h3 className="text-lg font-semibold mb-4">月別使用状況</h3>
              <div className="h-48 flex items-center justify-center">
                <div className="text-zinc-500 text-sm">
                  {/* TODO: Add chart visualization */}
                  <div className="space-y-2">
                    {statsData?.aiUsageStats.monthlyUsage.map((month) => (
                      <div key={month.month} className="flex justify-between">
                        <span>{month.month}</span>
                        <span className="font-semibold">{month.requests}回</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Feature Usage */}
            <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
              <h3 className="text-lg font-semibold mb-4">機能別使用回数</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400">要約生成</span>
                  <span className="font-semibold">{stats?.featureUsage.summarize}回</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400">タグ抽出</span>
                  <span className="font-semibold">{stats?.featureUsage.tag}回</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400">感情分析</span>
                  <span className="font-semibold">{stats?.featureUsage.sentiment}回</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400">キーワード</span>
                  <span className="font-semibold">{stats?.featureUsage.keyword}回</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Test Modal */}
      {showTestModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-zinc-800">
            <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
              <h2 className="text-xl font-semibold">プロンプトテスト</h2>
              <button
                onClick={() => {
                  setShowTestModal(false)
                  setTestResult(null)
                  setSampleText('')
                }}
                className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <XCircleIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label htmlFor="sample-text" className="block text-sm font-medium text-zinc-300 mb-2">
                  テスト用サンプルテキスト
                </label>
                <textarea
                  id="sample-text"
                  value={sampleText}
                  onChange={(e) => setSampleText(e.target.value)}
                  rows={5}
                  placeholder="記事のサンプルテキストを入力してください..."
                  className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              <button
                onClick={handleTestPrompt}
                disabled={!sampleText || testLoading}
                className="w-full px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-black font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                {testLoading ? 'テスト中...' : 'テスト実行'}
              </button>

              {testResult && (
                <div className="mt-6 space-y-4">
                  <h3 className="text-lg font-semibold">テスト結果</h3>
                  <div className="p-4 bg-zinc-800 rounded-lg">
                    <pre className="whitespace-pre-wrap text-sm">{testResult.result}</pre>
                  </div>
                  <div className="flex gap-4 text-sm text-zinc-400">
                    <span>使用トークン数: {testResult.tokensUsed}</span>
                    <span>応答時間: {testResult.responseTime}秒</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 rounded-xl w-full max-w-md border border-zinc-800">
            <div className="p-6 border-b border-zinc-800">
              <h2 className="text-xl font-semibold">設定をデフォルトに戻しますか？</h2>
            </div>
            
            <div className="p-6">
              <p className="text-zinc-300 mb-4">
                すべての設定がデフォルト値にリセットされます。この操作は元に戻すことができません。
              </p>
            </div>
            
            <div className="p-6 border-t border-zinc-800 flex justify-end gap-3">
              <button
                onClick={() => setShowResetModal(false)}
                className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={handleResetToDefault}
                className="px-5 py-2.5 bg-red-500 hover:bg-red-600 text-black font-medium rounded-lg transition-colors"
              >
                確認
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}