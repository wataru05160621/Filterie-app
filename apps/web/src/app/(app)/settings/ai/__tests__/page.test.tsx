import { render, screen, fireEvent } from '@testing-library/react'
import AISettingsPage from '../page'

// Mock Next.js Link component
jest.mock('next/link', () => {
  return ({ children, href }: any) => <a href={href}>{children}</a>
})

describe('AISettingsPage', () => {
  it('should render the page title and description', () => {
    render(<AISettingsPage />)
    
    expect(screen.getByText('AI設定')).toBeInTheDocument()
    expect(screen.getByText('FilterieのAI機能をカスタマイズして、あなたに最適な情報体験を作りましょう')).toBeInTheDocument()
  })

  it('should display usage statistics', () => {
    render(<AISettingsPage />)
    
    expect(screen.getByText('今月のAI使用状況')).toBeInTheDocument()
    expect(screen.getByText('1,234')).toBeInTheDocument()
    expect(screen.getByText('要約生成数')).toBeInTheDocument()
    expect(screen.getByText('5,678')).toBeInTheDocument()
    expect(screen.getByText('記事分析数')).toBeInTheDocument()
    expect(screen.getByText('892')).toBeInTheDocument()
    expect(screen.getByText('タグ生成数')).toBeInTheDocument()
  })

  it('should toggle AI features on/off', () => {
    render(<AISettingsPage />)
    
    const aiToggle = screen.getByText('AI機能を有効化').closest('div')?.querySelector('button')
    expect(aiToggle).toHaveClass('bg-green-500')
    
    fireEvent.click(aiToggle!)
    expect(aiToggle).toHaveClass('bg-gray-700')
    
    fireEvent.click(aiToggle!)
    expect(aiToggle).toHaveClass('bg-green-500')
  })

  it('should toggle auto summary generation', () => {
    render(<AISettingsPage />)
    
    const autoSummaryToggle = screen.getByText('自動要約生成').closest('div')?.querySelector('button')
    expect(autoSummaryToggle).toHaveClass('bg-green-500')
    
    fireEvent.click(autoSummaryToggle!)
    expect(autoSummaryToggle).toHaveClass('bg-gray-700')
  })

  it('should update processing priority slider', () => {
    render(<AISettingsPage />)
    
    const slider = screen.getByRole('slider')
    expect(slider).toHaveValue('60')
    
    fireEvent.change(slider, { target: { value: '80' } })
    expect(slider).toHaveValue('80')
  })

  it('should select AI model', () => {
    render(<AISettingsPage />)
    
    const modelSelect = screen.getByDisplayValue('GPT-4 Turbo (推奨)')
    expect(modelSelect).toBeInTheDocument()
    
    fireEvent.change(modelSelect, { target: { value: 'claude-3-opus' } })
    expect(screen.getByDisplayValue('Claude 3 Opus (高精度)')).toBeInTheDocument()
  })

  it('should update summary length setting', () => {
    render(<AISettingsPage />)
    
    const summaryLengthSelect = screen.getByDisplayValue('標準 (5つのポイント)')
    
    fireEvent.change(summaryLengthSelect, { target: { value: 'short' } })
    expect(screen.getByDisplayValue('短い (3つのポイント)')).toBeInTheDocument()
  })

  it('should update summary style setting', () => {
    render(<AISettingsPage />)
    
    const summaryStyleSelect = screen.getByDisplayValue('標準（バランス）')
    
    fireEvent.change(summaryStyleSelect, { target: { value: 'technical' } })
    expect(screen.getByDisplayValue('技術的（専門用語を含む）')).toBeInTheDocument()
  })

  it('should toggle keyword extraction', () => {
    render(<AISettingsPage />)
    
    const keywordToggle = screen.getByText('キーワード抽出').closest('div')?.querySelector('button')
    expect(keywordToggle).toHaveClass('bg-green-500')
    
    fireEvent.click(keywordToggle!)
    expect(keywordToggle).toHaveClass('bg-gray-700')
  })

  it('should toggle sentiment analysis', () => {
    render(<AISettingsPage />)
    
    const sentimentToggle = screen.getByText('感情分析').closest('div')?.querySelector('button')
    expect(sentimentToggle).toHaveClass('bg-gray-700')
    
    fireEvent.click(sentimentToggle!)
    expect(sentimentToggle).toHaveClass('bg-green-500')
  })

  it('should update custom prompt', () => {
    render(<AISettingsPage />)
    
    const promptTextarea = screen.getByRole('textbox')
    expect(promptTextarea).toHaveValue(expect.stringContaining('以下の記事を読んで'))
    
    const newPrompt = 'Custom prompt text'
    fireEvent.change(promptTextarea, { target: { value: newPrompt } })
    expect(promptTextarea).toHaveValue(newPrompt)
  })

  it('should display variable chips for custom prompt', () => {
    render(<AISettingsPage />)
    
    expect(screen.getByText('{TITLE}')).toBeInTheDocument()
    expect(screen.getByText('{CONTENT}')).toBeInTheDocument()
    expect(screen.getByText('{POINT_COUNT}')).toBeInTheDocument()
    expect(screen.getByText('{STYLE}')).toBeInTheDocument()
    expect(screen.getByText('{LANGUAGE}')).toBeInTheDocument()
    expect(screen.getByText('{CATEGORY}')).toBeInTheDocument()
  })

  it('should call save handler when save button is clicked', () => {
    const consoleSpy = jest.spyOn(console, 'log')
    render(<AISettingsPage />)
    
    const saveButton = screen.getByText('変更を保存').closest('button')
    fireEvent.click(saveButton!)
    
    expect(consoleSpy).toHaveBeenCalledWith('Settings saved')
    consoleSpy.mockRestore()
  })

  it('should call reset handler when reset button is clicked', () => {
    const consoleSpy = jest.spyOn(console, 'log')
    render(<AISettingsPage />)
    
    const resetButton = screen.getByText('リセット').closest('button')
    fireEvent.click(resetButton!)
    
    expect(consoleSpy).toHaveBeenCalledWith('Settings reset')
    consoleSpy.mockRestore()
  })
})