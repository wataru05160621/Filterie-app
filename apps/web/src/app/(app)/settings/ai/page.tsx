'use client'

import { useState } from 'react'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { CpuChipIcon } from '@heroicons/react/24/outline' // Using CpuChipIcon instead of RobotIcon
import Link from 'next/link'

export default function AISettingsPage() {
  const [aiEnabled, setAiEnabled] = useState(true)
  const [autoSummary, setAutoSummary] = useState(true)
  const [keywordExtraction, setKeywordExtraction] = useState(true)
  const [sentimentAnalysis, setSentimentAnalysis] = useState(false)
  const [processingPriority, setProcessingPriority] = useState(60)
  const [aiModel, setAiModel] = useState('gpt-4-turbo')
  const [summaryLength, setSummaryLength] = useState('standard')
  const [summaryStyle, setSummaryStyle] = useState('standard')
  const [customPrompt, setCustomPrompt] = useState(`以下の記事を読んで、最も重要な{POINT_COUNT}つのポイントを{STYLE}な文体で要約してください。

記事タイトル: {TITLE}
記事本文: {CONTENT}

要約は以下の形式で出力してください：
1. [ポイント1]
2. [ポイント2]
3. [ポイント3]`)

  const handleSave = () => {
    // TODO: Implement save logic
    console.log('Settings saved')
  }

  const handleReset = () => {
    // TODO: Implement reset logic
    console.log('Settings reset')
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-gray-400 hover:text-white transition-colors">
              <ArrowLeftIcon className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-white">AI設定</h1>
              <p className="text-gray-400 mt-1">FilterieのAI機能をカスタマイズして、あなたに最適な情報体験を作りましょう</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-8">
          {/* Settings Navigation */}
          <nav className="hidden lg:block">
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
              <a href="#basic" className="block px-4 py-3 text-blue-500 bg-gray-800 rounded-lg mb-1">基本設定</a>
              <a href="#summary" className="block px-4 py-3 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg mb-1 transition-colors">要約設定</a>
              <a href="#filtering" className="block px-4 py-3 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg mb-1 transition-colors">フィルタリング</a>
              <a href="#recommendation" className="block px-4 py-3 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg mb-1 transition-colors">推薦アルゴリズム</a>
              <a href="#privacy" className="block px-4 py-3 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg mb-1 transition-colors">プライバシー</a>
              <a href="#advanced" className="block px-4 py-3 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg mb-1 transition-colors">詳細設定</a>
              <a href="#usage" className="block px-4 py-3 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">API使用状況</a>
            </div>
          </nav>

          {/* Settings Content */}
          <div className="space-y-6">
            {/* Usage Statistics */}
            <div className="bg-gradient-to-br from-blue-900/20 to-gray-900 rounded-xl border border-gray-800 p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-white">今月のAI使用状況</h3>
                <span className="text-sm text-gray-400">2024年3月1日 - 3月15日</span>
              </div>
              
              <div className="grid grid-cols-3 gap-6 mb-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-500">1,234</div>
                  <div className="text-sm text-gray-400 mt-1">要約生成数</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-500">5,678</div>
                  <div className="text-sm text-gray-400 mt-1">記事分析数</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-500">892</div>
                  <div className="text-sm text-gray-400 mt-1">タグ生成数</div>
                </div>
              </div>

              <div className="border-t border-gray-800 pt-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">月間利用量</span>
                  <span className="text-white">7,500 / 10,000 (75%)</span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full" style={{ width: '75%' }}></div>
                </div>
              </div>
            </div>

            {/* Basic Settings */}
            <div id="basic" className="bg-gray-900 rounded-xl border border-gray-800 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                  <CpuChipIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">基本設定</h2>
                  <p className="text-sm text-gray-400">AIの基本的な動作を設定します</p>
                </div>
              </div>

              <div className="space-y-6">
                {/* AI Enable Toggle */}
                <div className="border-b border-gray-800 pb-6">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-white font-medium">AI機能を有効化</label>
                    <button
                      onClick={() => setAiEnabled(!aiEnabled)}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        aiEnabled ? 'bg-green-500' : 'bg-gray-700'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                          aiEnabled ? 'translate-x-6' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                  <p className="text-sm text-gray-400">すべてのAI機能のオン/オフを切り替えます</p>
                </div>

                {/* Auto Summary Toggle */}
                <div className="border-b border-gray-800 pb-6">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-white font-medium">自動要約生成</label>
                    <button
                      onClick={() => setAutoSummary(!autoSummary)}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        autoSummary ? 'bg-green-500' : 'bg-gray-700'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                          autoSummary ? 'translate-x-6' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                  <p className="text-sm text-gray-400">新しい記事に対して自動的にAI要約を生成します</p>
                </div>

                {/* Processing Priority Slider */}
                <div className="border-b border-gray-800 pb-6">
                  <label className="text-white font-medium block mb-2">処理速度の優先度</label>
                  <p className="text-sm text-gray-400 mb-4">速度と精度のバランスを調整します</p>
                  <div>
                    <div className="flex justify-between text-xs text-gray-400 mb-2">
                      <span>速度優先</span>
                      <span>バランス</span>
                      <span>精度優先</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={processingPriority}
                      onChange={(e) => setProcessingPriority(Number(e.target.value))}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                    />
                  </div>
                </div>

                {/* AI Model Selection */}
                <div className="pb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <label className="text-white font-medium">AIモデル</label>
                    <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded-full font-semibold">PRO</span>
                  </div>
                  <p className="text-sm text-gray-400 mb-3">使用するAIモデルを選択します</p>
                  <select
                    value={aiModel}
                    onChange={(e) => setAiModel(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
                  >
                    <option value="gpt-4-turbo">GPT-4 Turbo (推奨)</option>
                    <option value="gpt-3.5-turbo">GPT-3.5 Turbo (高速)</option>
                    <option value="claude-3-opus">Claude 3 Opus (高精度)</option>
                    <option value="gemini-pro">Gemini Pro (バランス)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Summary Settings */}
            <div id="summary" className="bg-gray-900 rounded-xl border border-gray-800 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                  <span className="text-white">📝</span>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">要約設定</h2>
                  <p className="text-sm text-gray-400">AI要約の生成方法をカスタマイズします</p>
                </div>
              </div>

              <div className="space-y-6">
                {/* Summary Length */}
                <div className="border-b border-gray-800 pb-6">
                  <label className="text-white font-medium block mb-2">要約の長さ</label>
                  <p className="text-sm text-gray-400 mb-3">生成される要約の詳細度を設定します</p>
                  <select
                    value={summaryLength}
                    onChange={(e) => setSummaryLength(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
                  >
                    <option value="short">短い (3つのポイント)</option>
                    <option value="standard">標準 (5つのポイント)</option>
                    <option value="detailed">詳細 (7つのポイント)</option>
                    <option value="custom">カスタム</option>
                  </select>
                </div>

                {/* Summary Style */}
                <div className="border-b border-gray-800 pb-6">
                  <label className="text-white font-medium block mb-2">要約スタイル</label>
                  <p className="text-sm text-gray-400 mb-3">要約の文体を選択します</p>
                  <select
                    value={summaryStyle}
                    onChange={(e) => setSummaryStyle(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
                  >
                    <option value="business">ビジネス向け（フォーマル）</option>
                    <option value="standard">標準（バランス）</option>
                    <option value="casual">カジュアル（親しみやすい）</option>
                    <option value="technical">技術的（専門用語を含む）</option>
                  </select>
                </div>

                {/* Keyword Extraction Toggle */}
                <div className="border-b border-gray-800 pb-6">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-white font-medium">キーワード抽出</label>
                    <button
                      onClick={() => setKeywordExtraction(!keywordExtraction)}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        keywordExtraction ? 'bg-green-500' : 'bg-gray-700'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                          keywordExtraction ? 'translate-x-6' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                  <p className="text-sm text-gray-400">記事から重要なキーワードを自動抽出します</p>
                </div>

                {/* Sentiment Analysis Toggle */}
                <div className="pb-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-white font-medium">感情分析</label>
                    <button
                      onClick={() => setSentimentAnalysis(!sentimentAnalysis)}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        sentimentAnalysis ? 'bg-green-500' : 'bg-gray-700'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                          sentimentAnalysis ? 'translate-x-6' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                  <p className="text-sm text-gray-400">記事のトーンや感情を分析して表示します</p>
                </div>
              </div>
            </div>

            {/* Custom Prompts */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                  <span className="text-white">✏️</span>
                </div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-semibold text-white">カスタムプロンプト</h2>
                  <span className="text-xs bg-purple-500 text-white px-2 py-1 rounded-full font-semibold">ADVANCED</span>
                </div>
              </div>
              <p className="text-sm text-gray-400 mb-6">AI要約生成のプロンプトをカスタマイズします</p>

              <div>
                <label className="text-white font-medium block mb-2">要約生成プロンプト</label>
                <p className="text-sm text-gray-400 mb-3">以下の変数が使用できます</p>
                <textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  className="w-full min-h-[200px] px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-blue-500 transition-colors resize-y"
                />
                <div className="flex flex-wrap gap-2 mt-3">
                  {['{TITLE}', '{CONTENT}', '{POINT_COUNT}', '{STYLE}', '{LANGUAGE}', '{CATEGORY}'].map((variable) => (
                    <button
                      key={variable}
                      className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-full text-xs text-gray-400 hover:text-blue-500 hover:border-blue-500 transition-colors"
                    >
                      {variable}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Save/Reset Buttons */}
            <div className="flex justify-end gap-3 pt-6 border-t border-gray-800">
              <button
                onClick={handleReset}
                className="px-6 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors flex items-center gap-2"
              >
                <span>↺</span>
                <span>リセット</span>
              </button>
              <button
                onClick={handleSave}
                className="px-6 py-2.5 bg-green-500 hover:bg-green-600 text-black font-medium rounded-lg transition-colors flex items-center gap-2"
              >
                <span>✓</span>
                <span>変更を保存</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          background: white;
          cursor: pointer;
          border-radius: 50%;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }

        .slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          background: white;
          cursor: pointer;
          border-radius: 50%;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
          border: none;
        }
      `}</style>
    </div>
  )
}