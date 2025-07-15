import { render, screen, waitFor, within } from '@testing-library/react'
import { MockedProvider } from '@apollo/client/testing'
import SavedArticlesPage from '../page'
import { 
  SAVED_ARTICLES_QUERY,
  CREATE_TRAY_MUTATION,
  UPDATE_TRAY_MUTATION,
  DELETE_TRAY_MUTATION,
  ADD_TO_TRAY_MUTATION,
  REMOVE_FROM_TRAY_MUTATION,
  EXPORT_TRAY_MUTATION
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

// Mock file download
global.URL.createObjectURL = jest.fn(() => 'blob:mock-url')
global.URL.revokeObjectURL = jest.fn()

const mockTrays = [
  {
    id: '1',
    name: '技術系記事',
    description: 'プログラミング・開発関連の記事',
    color: '#3b82f6',
    articleCount: 15,
    articles: [
      {
        id: '1',
        title: 'Next.js 15の新機能まとめ',
        content: 'Next.js 15がリリースされました...',
        summary: 'Next.js 15の主要な新機能について解説',
        publishedAt: '2024-03-15T10:30:00Z',
        source: {
          id: '1',
          name: 'Tech Blog',
          tier: { level: 1 }
        }
      },
      {
        id: '2',
        title: 'TypeScript 5.4の型推論改善',
        content: 'TypeScript 5.4では型推論が大幅に改善...',
        summary: 'TypeScript 5.4の型システムの改善点',
        publishedAt: '2024-03-14T15:45:00Z',
        source: {
          id: '2',
          name: 'Dev.to',
          tier: { level: 2 }
        }
      }
    ],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-03-15T10:30:00Z'
  },
  {
    id: '2',
    name: 'ビジネスニュース',
    description: '経済・ビジネス関連のニュース',
    color: '#10b981',
    articleCount: 8,
    articles: [],
    createdAt: '2024-02-01T00:00:00Z',
    updatedAt: '2024-03-10T08:15:00Z'
  }
]

describe('SavedArticlesPage', () => {
  const mocks = [
    {
      request: {
        query: SAVED_ARTICLES_QUERY,
      },
      result: {
        data: {
          trays: {
            items: mockTrays,
            totalCount: 2,
          },
        },
      },
    },
  ]

  it('should render loading state initially', () => {
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <SavedArticlesPage />
      </MockedProvider>
    )

    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('should render trays and saved articles after loading', async () => {
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <SavedArticlesPage />
      </MockedProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('保存済み記事')).toBeInTheDocument()
    })

    // Check if trays are displayed
    expect(screen.getByText('技術系記事')).toBeInTheDocument()
    expect(screen.getByText('ビジネスニュース')).toBeInTheDocument()
    expect(screen.getByText('15 記事')).toBeInTheDocument()
    expect(screen.getByText('8 記事')).toBeInTheDocument()

    // Check if articles are displayed
    expect(screen.getByText('Next.js 15の新機能まとめ')).toBeInTheDocument()
    expect(screen.getByText('TypeScript 5.4の型推論改善')).toBeInTheDocument()
  })

  it('should create a new tray', async () => {
    const user = userEvent.setup()
    
    const createMock = {
      request: {
        query: CREATE_TRAY_MUTATION,
        variables: {
          input: {
            name: 'AI・機械学習',
            description: 'AI関連の記事を保存',
            color: '#8b5cf6'
          },
        },
      },
      result: {
        data: {
          createTray: {
            id: '3',
            name: 'AI・機械学習',
            description: 'AI関連の記事を保存',
            color: '#8b5cf6',
            articleCount: 0,
            articles: [],
            createdAt: '2024-03-16T00:00:00Z',
            updatedAt: '2024-03-16T00:00:00Z'
          },
        },
      },
    }

    render(
      <MockedProvider mocks={[...mocks, createMock]} addTypename={false}>
        <SavedArticlesPage />
      </MockedProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('保存済み記事')).toBeInTheDocument()
    })

    const createButton = screen.getByRole('button', { name: /新規トレイ/i })
    await user.click(createButton)

    // Modal should be open
    await waitFor(() => {
      expect(screen.getByText('新規トレイ作成')).toBeInTheDocument()
    })

    const nameInput = screen.getByLabelText('トレイ名')
    await user.type(nameInput, 'AI・機械学習')

    const descriptionInput = screen.getByLabelText('説明')
    await user.type(descriptionInput, 'AI関連の記事を保存')

    // Select color
    const purpleColor = screen.getByTestId('color-#8b5cf6')
    await user.click(purpleColor)

    const saveButton = screen.getByRole('button', { name: /作成/i })
    await user.click(saveButton)

    await waitFor(() => {
      expect(screen.getByText('トレイを作成しました')).toBeInTheDocument()
    })
  })

  it('should filter articles by search query', async () => {
    const user = userEvent.setup()

    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <SavedArticlesPage />
      </MockedProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('保存済み記事')).toBeInTheDocument()
    })

    const searchInput = screen.getByPlaceholderText('記事を検索...')
    await user.type(searchInput, 'TypeScript')

    await waitFor(() => {
      expect(screen.getByText('TypeScript 5.4の型推論改善')).toBeInTheDocument()
      expect(screen.queryByText('Next.js 15の新機能まとめ')).not.toBeInTheDocument()
    })
  })

  it('should switch between trays', async () => {
    const user = userEvent.setup()

    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <SavedArticlesPage />
      </MockedProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('保存済み記事')).toBeInTheDocument()
    })

    // Initially, tech articles should be visible
    expect(screen.getByText('Next.js 15の新機能まとめ')).toBeInTheDocument()

    // Click on business news tray
    const businessTray = screen.getByText('ビジネスニュース')
    await user.click(businessTray)

    // Tech articles should be hidden
    await waitFor(() => {
      expect(screen.queryByText('Next.js 15の新機能まとめ')).not.toBeInTheDocument()
      expect(screen.getByText('このトレイに記事がありません')).toBeInTheDocument()
    })
  })

  it('should remove article from tray', async () => {
    const user = userEvent.setup()
    
    const removeMock = {
      request: {
        query: REMOVE_FROM_TRAY_MUTATION,
        variables: {
          articleId: '1',
          trayId: '1',
        },
      },
      result: {
        data: {
          removeFromTray: {
            success: true,
          },
        },
      },
    }

    render(
      <MockedProvider mocks={[...mocks, removeMock]} addTypename={false}>
        <SavedArticlesPage />
      </MockedProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('保存済み記事')).toBeInTheDocument()
    })

    // Find the first article's remove button
    const articleCard = screen.getByText('Next.js 15の新機能まとめ').closest('div.bg-zinc-900')
    const removeButton = within(articleCard!).getByRole('button', { name: /削除/i })
    
    await user.click(removeButton)

    await waitFor(() => {
      expect(screen.getByText('記事を削除しました')).toBeInTheDocument()
    })
  })

  it('should export tray in different formats', async () => {
    const user = userEvent.setup()
    
    const exportMock = {
      request: {
        query: EXPORT_TRAY_MUTATION,
        variables: {
          trayId: '1',
          format: 'MARKDOWN',
        },
      },
      result: {
        data: {
          exportTray: {
            content: '# 技術系記事\n\n## Next.js 15の新機能まとめ\n...',
            filename: 'tech-articles-2024-03-16.md',
            mimeType: 'text/markdown',
          },
        },
      },
    }

    render(
      <MockedProvider mocks={[...mocks, exportMock]} addTypename={false}>
        <SavedArticlesPage />
      </MockedProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('保存済み記事')).toBeInTheDocument()
    })

    // Open export menu for the first tray
    const techTray = screen.getByText('技術系記事').closest('div.bg-zinc-900')
    const exportButton = within(techTray!).getByRole('button', { name: /エクスポート/i })
    
    await user.click(exportButton)

    // Export menu should be open
    await waitFor(() => {
      expect(screen.getByText('Markdown')).toBeInTheDocument()
    })

    const markdownOption = screen.getByText('Markdown')
    await user.click(markdownOption)

    await waitFor(() => {
      expect(screen.getByText('エクスポートが完了しました')).toBeInTheDocument()
    })
  })

  it('should update tray name and description', async () => {
    const user = userEvent.setup()
    
    const updateMock = {
      request: {
        query: UPDATE_TRAY_MUTATION,
        variables: {
          id: '1',
          input: {
            name: '開発技術記事',
            description: 'フロントエンド・バックエンド開発の記事'
          },
        },
      },
      result: {
        data: {
          updateTray: {
            id: '1',
            name: '開発技術記事',
            description: 'フロントエンド・バックエンド開発の記事',
            color: '#3b82f6',
            articleCount: 15,
            articles: mockTrays[0].articles,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-03-16T12:00:00Z'
          },
        },
      },
    }

    render(
      <MockedProvider mocks={[...mocks, updateMock]} addTypename={false}>
        <SavedArticlesPage />
      </MockedProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('保存済み記事')).toBeInTheDocument()
    })

    // Find edit button for the first tray
    const techTray = screen.getByText('技術系記事').closest('div.bg-zinc-900')
    const editButton = within(techTray!).getByRole('button', { name: /編集/i })
    
    await user.click(editButton)

    // Edit modal should be open
    await waitFor(() => {
      expect(screen.getByText('トレイを編集')).toBeInTheDocument()
    })

    const nameInput = screen.getByLabelText('トレイ名')
    await user.clear(nameInput)
    await user.type(nameInput, '開発技術記事')

    const descriptionInput = screen.getByLabelText('説明')
    await user.clear(descriptionInput)
    await user.type(descriptionInput, 'フロントエンド・バックエンド開発の記事')

    const saveButton = screen.getByRole('button', { name: /保存/i })
    await user.click(saveButton)

    await waitFor(() => {
      expect(screen.getByText('トレイを更新しました')).toBeInTheDocument()
    })
  })

  it('should delete tray with confirmation', async () => {
    const user = userEvent.setup()
    
    const deleteMock = {
      request: {
        query: DELETE_TRAY_MUTATION,
        variables: {
          id: '2',
        },
      },
      result: {
        data: {
          deleteTray: {
            success: true,
          },
        },
      },
    }

    render(
      <MockedProvider mocks={[...mocks, deleteMock]} addTypename={false}>
        <SavedArticlesPage />
      </MockedProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('保存済み記事')).toBeInTheDocument()
    })

    // Find delete button for the business news tray
    const businessTray = screen.getByText('ビジネスニュース').closest('div.bg-zinc-900')
    const deleteButton = within(businessTray!).getByRole('button', { name: /削除/i })
    
    await user.click(deleteButton)

    // Confirmation modal should be open
    await waitFor(() => {
      expect(screen.getByText('トレイを削除しますか？')).toBeInTheDocument()
      expect(screen.getByText(/このトレイと保存された8件の記事が削除されます/)).toBeInTheDocument()
    })

    const confirmButton = screen.getByRole('button', { name: /削除する/i })
    await user.click(confirmButton)

    await waitFor(() => {
      expect(screen.getByText('トレイを削除しました')).toBeInTheDocument()
    })
  })

  it('should display empty state when no trays exist', async () => {
    const emptyMocks = [
      {
        request: {
          query: SAVED_ARTICLES_QUERY,
        },
        result: {
          data: {
            trays: {
              items: [],
              totalCount: 0,
            },
          },
        },
      },
    ]

    render(
      <MockedProvider mocks={emptyMocks} addTypename={false}>
        <SavedArticlesPage />
      </MockedProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('保存済み記事')).toBeInTheDocument()
    })

    expect(screen.getByText('まだトレイがありません')).toBeInTheDocument()
    expect(screen.getByText('新規トレイを作成して、記事の整理を始めましょう')).toBeInTheDocument()
  })
})