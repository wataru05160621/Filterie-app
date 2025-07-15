import { render, screen, waitFor, act } from '@testing-library/react'
import { MockedProvider } from '@apollo/client/testing'
import { useParams } from 'next/navigation'
import ArticleDetailPage from '../page'
import { 
  ARTICLE_DETAIL_QUERY,
  BOOKMARK_MUTATION,
  UNBOOKMARK_MUTATION,
  TRACK_READ_MUTATION
} from '../queries'
import userEvent from '@testing-library/user-event'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useParams: jest.fn(),
  notFound: jest.fn(),
}))

// Mock auth provider
jest.mock('@/providers/auth-provider', () => ({
  useAuth: () => ({
    user: { id: '1', email: 'test@example.com' },
    isAuthenticated: true,
  }),
}))

const mockArticle = {
  id: '1',
  title: 'Test Article Title',
  content: '<p>This is the test article content.</p>',
  summary: 'This is a test summary',
  url: 'https://example.com/article',
  publishedAt: '2024-03-15T10:30:00Z',
  readTime: 5,
  viewCount: 100,
  source: {
    id: '1',
    name: 'Example News',
    url: 'https://example.com',
    tier: {
      level: 1,
      name: 'Tier 1',
    },
  },
  tags: [
    { id: '1', name: 'Technology' },
    { id: '2', name: 'AI' },
  ],
  aiSummary: {
    id: '1',
    content: 'AI generated summary content',
    keyPoints: [
      'First key point from the article',
      'Second important insight',
      'Third crucial finding',
    ],
    generatedAt: '2024-03-15T10:35:00Z',
  },
  bookmarks: [],
  relatedArticles: [
    {
      id: '2',
      title: 'Related Article 1',
      summary: 'Summary of related article',
      publishedAt: '2024-03-14T10:00:00Z',
      source: {
        name: 'Tech Blog',
        tier: { level: 2 },
      },
    },
  ],
}

const mocks = [
  {
    request: {
      query: ARTICLE_DETAIL_QUERY,
      variables: { id: '1' },
    },
    result: {
      data: {
        article: mockArticle,
      },
    },
  },
]

describe('ArticleDetailPage', () => {
  beforeEach(() => {
    (useParams as jest.Mock).mockReturnValue({ id: '1' })
  })

  it('should render loading state initially', () => {
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <ArticleDetailPage />
      </MockedProvider>
    )

    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('should render article details after loading', async () => {
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <ArticleDetailPage />
      </MockedProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('Test Article Title')).toBeInTheDocument()
    })

    // Check source and tier information
    expect(screen.getByText('Example News')).toBeInTheDocument()
    expect(screen.getByText('⭐ Tier 1')).toBeInTheDocument()

    // Check AI summary section
    expect(screen.getByText('AI要約 - 重要な3つのポイント')).toBeInTheDocument()
    expect(screen.getByText('First key point from the article')).toBeInTheDocument()
    expect(screen.getByText('Second important insight')).toBeInTheDocument()
    expect(screen.getByText('Third crucial finding')).toBeInTheDocument()

    // Check article content
    expect(screen.getByText('This is the test article content.')).toBeInTheDocument()

    // Check tags
    expect(screen.getByText('Technology')).toBeInTheDocument()
    expect(screen.getByText('AI')).toBeInTheDocument()

    // Check related articles
    expect(screen.getByText('Related Article 1')).toBeInTheDocument()
  })

  it('should handle bookmark toggle', async () => {
    const user = userEvent.setup()
    const bookmarkMock = {
      request: {
        query: BOOKMARK_MUTATION,
        variables: { articleId: '1' },
      },
      result: {
        data: {
          bookmarkArticle: true,
        },
      },
    }

    const refetchMock = {
      ...mocks[0],
      result: {
        data: {
          article: {
            ...mockArticle,
            bookmarks: [
              { id: 'bookmark-1', userId: '1' }
            ],
          },
        },
      },
    }

    render(
      <MockedProvider mocks={[...mocks, bookmarkMock, refetchMock]} addTypename={false}>
        <ArticleDetailPage />
      </MockedProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('Test Article Title')).toBeInTheDocument()
    })

    const saveButtons = screen.getAllByRole('button', { name: /保存/i })
    await user.click(saveButtons[0]) // Click the first save button (in header)

    await waitFor(() => {
      const savedButtons = screen.getAllByRole('button', { name: /保存済み/i })
      expect(savedButtons.length).toBeGreaterThan(0)
    })
  })

  it('should track reading time', async () => {
    const readTrackingMock = {
      request: {
        query: TRACK_READ_MUTATION,
        variables: { 
          articleId: '1',
          readDuration: expect.any(Number),
        },
      },
      result: {
        data: {
          markArticleAsRead: true,
        },
      },
    }

    render(
      <MockedProvider mocks={[...mocks, readTrackingMock]} addTypename={false}>
        <ArticleDetailPage />
      </MockedProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('Test Article Title')).toBeInTheDocument()
    })

    // Simulate page unload/unmount which should trigger read tracking
    // The component should track time spent on page
  })

  it('should update font size when buttons are clicked', async () => {
    const user = userEvent.setup()

    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <ArticleDetailPage />
      </MockedProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('Test Article Title')).toBeInTheDocument()
    })

    const increaseFontButton = screen.getByRole('button', { name: 'A+' })
    const decreaseFontButton = screen.getByRole('button', { name: 'A-' })

    // Get article content element
    const articleContent = screen.getByText('This is the test article content.')
      .closest('.article-content')

    // Check initial font size
    expect(articleContent).toHaveClass('text-lg')

    // Increase font size
    await user.click(increaseFontButton)
    expect(articleContent).toHaveClass('text-xl')

    // Increase again
    await user.click(increaseFontButton)
    expect(articleContent).toHaveClass('text-2xl')

    // Decrease font size
    await user.click(decreaseFontButton)
    expect(articleContent).toHaveClass('text-xl')
  })

  it('should show trust score', async () => {
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <ArticleDetailPage />
      </MockedProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('信頼度スコア')).toBeInTheDocument()
      // Trust score should be calculated based on tier
      expect(screen.getByText('98%')).toBeInTheDocument() // Tier 1 = 98%
    })
  })

  it('should handle error state', async () => {
    const errorMock = {
      request: {
        query: ARTICLE_DETAIL_QUERY,
        variables: { id: '1' },
      },
      error: new Error('Article not found'),
    }

    render(
      <MockedProvider mocks={[errorMock]} addTypename={false}>
        <ArticleDetailPage />
      </MockedProvider>
    )

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument()
    })
  })

  it('should update progress bar on scroll', async () => {
    // Mock window properties
    Object.defineProperty(window, 'scrollY', {
      writable: true,
      configurable: true,
      value: 0,
    })
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 800,
    })
    Object.defineProperty(document.body, 'scrollHeight', {
      writable: true,
      configurable: true,
      value: 2000,
    })

    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <ArticleDetailPage />
      </MockedProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('Test Article Title')).toBeInTheDocument()
    })

    const progressBar = screen.getByTestId('progress-bar')
    expect(progressBar).toHaveStyle({ width: '0%' })

    // Update scroll position and trigger scroll event within act
    await act(async () => {
      window.scrollY = 500
      window.dispatchEvent(new Event('scroll'))
    })

    // Check progress bar updated
    await waitFor(() => {
      const expectedProgress = (500 / (2000 - 800)) * 100
      expect(progressBar).toHaveStyle({ width: `${expectedProgress}%` })
    })
  })
})