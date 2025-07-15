import { render, screen, waitFor, act, within, fireEvent } from '@testing-library/react'
import { MockedProvider } from '@apollo/client/testing'
import AISettingsPage from '../page'
import { 
  AI_SETTINGS_QUERY,
  UPDATE_AI_SETTINGS_MUTATION,
  AI_USAGE_STATS_QUERY,
  TEST_AI_PROMPT_MUTATION
} from '../queries'
import userEvent from '@testing-library/user-event'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
  })),
}))

// Mock auth provider
jest.mock('@/providers/auth-provider', () => ({
  useAuth: () => ({
    user: { id: '1', email: 'test@example.com' },
    isAuthenticated: true,
  }),
}))

const mockAISettings = {
  id: '1',
  userId: '1',
  aiModel: 'gpt-4',
  temperature: 0.7,
  maxTokens: 2000,
  summaryPrompt: 'Please summarize this article in 3 key points.',
  tagPrompt: 'Extract relevant tags from this article.',
  features: {
    autoSummarize: true,
    autoTag: true,
    sentimentAnalysis: false,
    keywordExtraction: true,
  },
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-03-15T10:30:00Z',
}

const mockUsageStats = {
  totalRequests: 1250,
  totalTokens: 850000,
  averageResponseTime: 2.3,
  successRate: 98.5,
  monthlyUsage: [
    { month: '2024-01', requests: 300, tokens: 200000 },
    { month: '2024-02', requests: 450, tokens: 300000 },
    { month: '2024-03', requests: 500, tokens: 350000 },
  ],
  featureUsage: {
    summarize: 600,
    tag: 400,
    sentiment: 150,
    keyword: 100,
  },
}

describe('AISettingsPage', () => {
  const mocks = [
    {
      request: {
        query: AI_SETTINGS_QUERY,
      },
      result: {
        data: {
          aiSettings: mockAISettings,
        },
      },
    },
    {
      request: {
        query: AI_USAGE_STATS_QUERY,
      },
      result: {
        data: {
          aiUsageStats: mockUsageStats,
        },
      },
    },
  ]

  it('should render loading state initially', () => {
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <AISettingsPage />
      </MockedProvider>
    )

    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('should render AI settings and usage stats after loading', async () => {
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <AISettingsPage />
      </MockedProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('AI設定')).toBeInTheDocument()
    })

    // Check usage stats
    expect(screen.getByText('1,250')).toBeInTheDocument() // Total requests
    expect(screen.getByText('850,000')).toBeInTheDocument() // Total tokens
    expect(screen.getByText('2.3秒')).toBeInTheDocument() // Average response time
    expect(screen.getByText('98.5%')).toBeInTheDocument() // Success rate

    // Check current settings are loaded
    const modelSelect = screen.getByLabelText('AIモデル')
    expect(modelSelect).toHaveValue('gpt-4')
    
    const maxTokensInput = screen.getByLabelText('最大トークン数')
    expect(maxTokensInput).toHaveValue(2000)
  })

  it('should update AI model selection', async () => {
    const user = userEvent.setup()
    
    const updateMock = {
      request: {
        query: UPDATE_AI_SETTINGS_MUTATION,
        variables: {
          input: {
            aiModel: 'gpt-3.5-turbo',
          },
        },
      },
      result: {
        data: {
          updateAISettings: {
            ...mockAISettings,
            aiModel: 'gpt-3.5-turbo',
          },
        },
      },
    }

    render(
      <MockedProvider mocks={[...mocks, updateMock]} addTypename={false}>
        <AISettingsPage />
      </MockedProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('AI設定')).toBeInTheDocument()
    })

    const modelSelect = screen.getByLabelText('AIモデル')
    await user.selectOptions(modelSelect, 'gpt-3.5-turbo')

    const saveButton = screen.getByRole('button', { name: /設定を保存/i })
    await user.click(saveButton)

    await waitFor(() => {
      expect(screen.getByText('設定を保存しました')).toBeInTheDocument()
    })
  })

  it('should update temperature setting', async () => {
    const user = userEvent.setup()
    
    const updateMock = {
      request: {
        query: UPDATE_AI_SETTINGS_MUTATION,
        variables: {
          input: {
            temperature: 0.5,
          },
        },
      },
      result: {
        data: {
          updateAISettings: {
            ...mockAISettings,
            temperature: 0.5,
          },
        },
      },
    }

    render(
      <MockedProvider mocks={[...mocks, updateMock]} addTypename={false}>
        <AISettingsPage />
      </MockedProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('AI設定')).toBeInTheDocument()
    })

    // Temperature is controlled by a range input, so we need to change it differently
    const temperatureInput = screen.getByLabelText(/Temperature/)
    fireEvent.change(temperatureInput, { target: { value: '0.5' } })

    const saveButton = screen.getByRole('button', { name: /設定を保存/i })
    await user.click(saveButton)

    await waitFor(() => {
      expect(screen.getByText('設定を保存しました')).toBeInTheDocument()
    })
  })

  it('should toggle feature settings', async () => {
    const user = userEvent.setup()
    
    const updateMock = {
      request: {
        query: UPDATE_AI_SETTINGS_MUTATION,
        variables: {
          input: {
            features: {
              autoSummarize: true,
              autoTag: true,
              sentimentAnalysis: true, // Changed from false to true
              keywordExtraction: true,
            },
          },
        },
      },
      result: {
        data: {
          updateAISettings: {
            ...mockAISettings,
            features: {
              ...mockAISettings.features,
              sentimentAnalysis: true,
            },
          },
        },
      },
    }

    render(
      <MockedProvider mocks={[...mocks, updateMock]} addTypename={false}>
        <AISettingsPage />
      </MockedProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('AI設定')).toBeInTheDocument()
    })

    const sentimentToggle = screen.getByLabelText('感情分析')
    await user.click(sentimentToggle)

    const saveButton = screen.getByRole('button', { name: /設定を保存/i })
    await user.click(saveButton)

    await waitFor(() => {
      expect(screen.getByText('設定を保存しました')).toBeInTheDocument()
    })
  })

  it('should update custom prompts', async () => {
    const user = userEvent.setup()
    
    const newSummaryPrompt = 'Summarize this article focusing on business impact.'
    
    const updateMock = {
      request: {
        query: UPDATE_AI_SETTINGS_MUTATION,
        variables: {
          input: {
            summaryPrompt: newSummaryPrompt,
          },
        },
      },
      result: {
        data: {
          updateAISettings: {
            ...mockAISettings,
            summaryPrompt: newSummaryPrompt,
          },
        },
      },
    }

    render(
      <MockedProvider mocks={[...mocks, updateMock]} addTypename={false}>
        <AISettingsPage />
      </MockedProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('AI設定')).toBeInTheDocument()
    })

    const summaryPromptTextarea = screen.getByLabelText('要約プロンプト')
    await user.clear(summaryPromptTextarea)
    await user.type(summaryPromptTextarea, newSummaryPrompt)

    const saveButton = screen.getByRole('button', { name: /設定を保存/i })
    await user.click(saveButton)

    await waitFor(() => {
      expect(screen.getByText('設定を保存しました')).toBeInTheDocument()
    })
  })

  it('should test AI prompt', async () => {
    const user = userEvent.setup()
    
    const testPromptMock = {
      request: {
        query: TEST_AI_PROMPT_MUTATION,
        variables: {
          prompt: 'Please summarize this article in 3 key points.',
          sampleText: 'This is a sample article text for testing.',
        },
      },
      result: {
        data: {
          testAIPrompt: {
            result: '1. First key point\n2. Second key point\n3. Third key point',
            tokensUsed: 150,
            responseTime: 1.5,
          },
        },
      },
    }

    render(
      <MockedProvider mocks={[...mocks, testPromptMock]} addTypename={false}>
        <AISettingsPage />
      </MockedProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('AI設定')).toBeInTheDocument()
    })

    // Click test button for summary prompt to open modal
    const summarySection = screen.getByLabelText('要約プロンプト').parentElement
    const testButton = within(summarySection!).getByRole('button', { name: /テスト実行/i })
    await user.click(testButton)

    // Modal should be open now
    await waitFor(() => {
      expect(screen.getByText('プロンプトテスト')).toBeInTheDocument()
    })

    // Enter sample text
    const sampleTextarea = screen.getByLabelText('テスト用サンプルテキスト')
    await user.type(sampleTextarea, 'This is a sample article text for testing.')

    // Click test execution button in modal
    // There are multiple buttons with the same text, so we need to be more specific
    const modalButtons = screen.getAllByRole('button', { name: /テスト実行/i })
    // The last one should be the button in the modal
    const executeButton = modalButtons[modalButtons.length - 1]
    await user.click(executeButton)

    // Check test results
    await waitFor(() => {
      expect(screen.getByText('テスト結果')).toBeInTheDocument()
      expect(screen.getByText(/1\. First key point/)).toBeInTheDocument()
      expect(screen.getByText('使用トークン数: 150')).toBeInTheDocument()
      expect(screen.getByText('応答時間: 1.5秒')).toBeInTheDocument()
    })
  })

  it('should display usage chart', async () => {
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <AISettingsPage />
      </MockedProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('AI設定')).toBeInTheDocument()
    })

    // Check if chart section exists
    expect(screen.getByText('月別使用状況')).toBeInTheDocument()
    
    // Check if feature usage is displayed
    expect(screen.getByText('要約生成')).toBeInTheDocument()
    expect(screen.getByText('600回')).toBeInTheDocument()
    expect(screen.getByText('タグ抽出')).toBeInTheDocument()
    expect(screen.getByText('400回')).toBeInTheDocument()
  })

  it('should handle settings update error', async () => {
    const user = userEvent.setup()
    
    const errorMock = {
      request: {
        query: UPDATE_AI_SETTINGS_MUTATION,
        variables: {
          input: {
            aiModel: 'gpt-3.5-turbo',
          },
        },
      },
      error: new Error('Failed to update settings'),
    }

    render(
      <MockedProvider mocks={[...mocks, errorMock]} addTypename={false}>
        <AISettingsPage />
      </MockedProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('AI設定')).toBeInTheDocument()
    })

    const modelSelect = screen.getByLabelText('AIモデル')
    await user.selectOptions(modelSelect, 'gpt-3.5-turbo')

    const saveButton = screen.getByRole('button', { name: /設定を保存/i })
    await user.click(saveButton)

    await waitFor(() => {
      expect(screen.getByText('設定の保存に失敗しました')).toBeInTheDocument()
    })
  })

  it('should reset settings to default', async () => {
    const user = userEvent.setup()
    
    const resetMock = {
      request: {
        query: UPDATE_AI_SETTINGS_MUTATION,
        variables: {
          input: {
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
          },
        },
      },
      result: {
        data: {
          updateAISettings: {
            ...mockAISettings,
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
          },
        },
      },
    }

    render(
      <MockedProvider mocks={[...mocks, resetMock]} addTypename={false}>
        <AISettingsPage />
      </MockedProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('AI設定')).toBeInTheDocument()
    })

    const resetButton = screen.getByRole('button', { name: /デフォルトに戻す/i })
    await user.click(resetButton)

    // Confirm reset
    await waitFor(() => {
      expect(screen.getByText('設定をデフォルトに戻しますか？')).toBeInTheDocument()
    })

    const confirmButton = screen.getByRole('button', { name: /確認/i })
    await user.click(confirmButton)

    await waitFor(() => {
      expect(screen.getByText('設定をデフォルトに戻しました')).toBeInTheDocument()
    })
  })
})