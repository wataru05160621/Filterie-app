import { render, screen, waitFor, act, within } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import SourcesPage from '../page';
import { 
  SOURCES_QUERY,
  CREATE_SOURCE_MUTATION,
  UPDATE_SOURCE_MUTATION,
  DELETE_SOURCE_MUTATION,
  EVALUATE_SOURCE_MUTATION
} from '../queries';
import userEvent from '@testing-library/user-event';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
  })),
}));

// Mock auth provider
jest.mock('@/providers/auth-provider', () => ({
  useAuth: () => ({
    user: { id: '1', email: 'test@example.com' },
    isAuthenticated: true,
  }),
}));

describe('SourcesPage', () => {

  const mockSources = [
    {
      id: '1',
      name: 'Apple Newsroom',
      url: 'https://apple.com/newsroom',
      rssUrl: 'https://apple.com/newsroom/rss',
      category: 'テクノロジー',
      status: 'ACTIVE',
      articleCount: 1234,
      errorRate: 0,
      lastFetchedAt: '2024-03-15T10:30:00Z',
      tier: {
        level: 1,
        name: 'Tier 1',
      },
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-03-15T10:30:00Z',
    },
    {
      id: '2',
      name: '日本経済新聞',
      url: 'https://nikkei.com',
      rssUrl: null,
      category: 'ニュース',
      status: 'ACTIVE',
      articleCount: 3456,
      errorRate: 0.1,
      lastFetchedAt: '2024-03-15T10:15:00Z',
      tier: {
        level: 1,
        name: 'Tier 1',
      },
      createdAt: '2024-01-02T00:00:00Z',
      updatedAt: '2024-03-15T10:15:00Z',
    },
    {
      id: '3',
      name: 'TechCrunch Japan',
      url: 'https://jp.techcrunch.com',
      rssUrl: 'https://jp.techcrunch.com/feed',
      category: 'テクノロジー',
      status: 'WARNING',
      articleCount: 892,
      errorRate: 2.3,
      lastFetchedAt: '2024-03-15T09:30:00Z',
      tier: {
        level: 2,
        name: 'Tier 2',
      },
      createdAt: '2024-01-03T00:00:00Z',
      updatedAt: '2024-03-15T09:30:00Z',
    },
  ];

  const mocks = [
    {
      request: {
        query: SOURCES_QUERY,
        variables: {},
      },
      result: {
        data: {
          sources: {
            items: mockSources,
            total: 3,
            hasMore: false,
          },
        },
      },
    },
  ];

  it('should render loading state initially', () => {
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <SourcesPage />
      </MockedProvider>
    );

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('should render sources list after loading', async () => {
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <SourcesPage />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Apple Newsroom')).toBeInTheDocument();
    });

    // Check sources are displayed
    expect(screen.getByText('日本経済新聞')).toBeInTheDocument();
    expect(screen.getByText('TechCrunch Japan')).toBeInTheDocument();

    // Check tier badges in the table
    const sourcesTable = screen.getByRole('table');
    const tier1Badges = within(sourcesTable).getAllByText('⭐ Tier 1');
    expect(tier1Badges).toHaveLength(2);
    const tier2Badge = within(sourcesTable).getByText('⭐ Tier 2');
    expect(tier2Badge).toBeInTheDocument();

    // Check statistics
    expect(screen.getByText('総情報源数:')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument(); // Total count
  });

  it('should filter sources by search query', async () => {
    const user = userEvent.setup();

    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <SourcesPage />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Apple Newsroom')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('情報源を検索...');
    await user.type(searchInput, 'Apple');

    // Only Apple Newsroom should be visible
    expect(screen.getByText('Apple Newsroom')).toBeInTheDocument();
    expect(screen.queryByText('日本経済新聞')).not.toBeInTheDocument();
    expect(screen.queryByText('TechCrunch Japan')).not.toBeInTheDocument();
  });

  it('should filter sources by tier', async () => {
    const user = userEvent.setup();

    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <SourcesPage />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Apple Newsroom')).toBeInTheDocument();
    });

    // Click Tier 2 filter button
    const tier2Button = screen.getByRole('button', { name: /⭐ Tier 2/i });
    await user.click(tier2Button);

    // Only TechCrunch Japan (Tier 2) should be visible
    expect(screen.queryByText('Apple Newsroom')).not.toBeInTheDocument();
    expect(screen.queryByText('日本経済新聞')).not.toBeInTheDocument();
    expect(screen.getByText('TechCrunch Japan')).toBeInTheDocument();
  });

  it('should open add source modal', async () => {
    const user = userEvent.setup();

    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <SourcesPage />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Apple Newsroom')).toBeInTheDocument();
    });

    const addButton = screen.getByRole('button', { name: /新規追加/i });
    await user.click(addButton);

    // Modal should be visible
    expect(screen.getByText('新規情報源を追加')).toBeInTheDocument();
    expect(screen.getByLabelText('名前 *')).toBeInTheDocument();
    expect(screen.getByLabelText('URL *')).toBeInTheDocument();
  });

  it('should create a new source', async () => {
    const user = userEvent.setup();
    
    const createSourceMock = {
      request: {
        query: CREATE_SOURCE_MUTATION,
        variables: {
          input: {
            name: 'New Source',
            url: 'https://example.com',
            rssUrl: 'https://example.com/feed',
            category: 'テクノロジー',
          },
        },
      },
      result: {
        data: {
          createSource: {
            id: '4',
            name: 'New Source',
            url: 'https://example.com',
            rssUrl: 'https://example.com/feed',
            category: 'テクノロジー',
            status: 'ACTIVE',
            articleCount: 0,
            errorRate: 0,
            lastFetchedAt: null,
            tier: {
              level: 3,
              name: 'Tier 3',
            },
            createdAt: '2024-03-15T11:00:00Z',
            updatedAt: '2024-03-15T11:00:00Z',
          },
        },
      },
    };

    const refetchMock = {
      ...mocks[0],
      result: {
        data: {
          sources: {
            items: [...mockSources, createSourceMock.result.data.createSource],
            total: 4,
            hasMore: false,
          },
        },
      },
    };

    render(
      <MockedProvider mocks={[...mocks, createSourceMock, refetchMock]} addTypename={false}>
        <SourcesPage />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Apple Newsroom')).toBeInTheDocument();
    });

    // Open modal
    const addButton = screen.getByRole('button', { name: /新規追加/i });
    await user.click(addButton);

    // Fill form
    await user.type(screen.getByLabelText('名前 *'), 'New Source');
    await user.type(screen.getByLabelText('URL *'), 'https://example.com');
    await user.type(screen.getByLabelText('RSSフィードURL（オプション）'), 'https://example.com/feed');
    
    const categorySelect = screen.getByLabelText('カテゴリ *');
    await user.selectOptions(categorySelect, 'テクノロジー');

    // Submit
    const saveButton = screen.getByRole('button', { name: /保存して追加/i });
    await user.click(saveButton);

    // Check new source is added
    await waitFor(() => {
      expect(screen.getByText('New Source')).toBeInTheDocument();
    });
  });

  it('should update a source', async () => {
    const user = userEvent.setup();
    
    const updateMock = {
      request: {
        query: UPDATE_SOURCE_MUTATION,
        variables: {
          id: '1',
          input: {
            name: 'Apple News Updated',
            category: 'ニュース',
          },
        },
      },
      result: {
        data: {
          updateSource: {
            ...mockSources[0],
            name: 'Apple News Updated',
            category: 'ニュース',
          },
        },
      },
    };

    render(
      <MockedProvider mocks={[...mocks, updateMock]} addTypename={false}>
        <SourcesPage />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Apple Newsroom')).toBeInTheDocument();
    });

    // Click edit button for first source
    const editButtons = screen.getAllByTestId('edit-source-button');
    await user.click(editButtons[0]);

    // Update form should be visible
    await waitFor(() => {
      expect(screen.getByText('情報源を編集')).toBeInTheDocument();
    });

    // Update name
    const nameInput = screen.getByLabelText('名前 *');
    await user.clear(nameInput);
    await user.type(nameInput, 'Apple News Updated');

    // Update category
    const categorySelect = screen.getByLabelText('カテゴリ *');
    await user.selectOptions(categorySelect, 'ニュース');

    // Submit
    const saveButton = screen.getByRole('button', { name: /更新/i });
    await user.click(saveButton);

    // Check source is updated
    await waitFor(() => {
      expect(screen.getByText('Apple News Updated')).toBeInTheDocument();
    });
  });

  it('should delete a source', async () => {
    const user = userEvent.setup();
    
    const deleteMock = {
      request: {
        query: DELETE_SOURCE_MUTATION,
        variables: {
          id: '3',
        },
      },
      result: {
        data: {
          deleteSource: true,
        },
      },
    };

    const refetchMock = {
      ...mocks[0],
      result: {
        data: {
          sources: {
            items: mockSources.filter(s => s.id !== '3'),
            total: 2,
            hasMore: false,
          },
        },
      },
    };

    render(
      <MockedProvider mocks={[...mocks, deleteMock, refetchMock]} addTypename={false}>
        <SourcesPage />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('TechCrunch Japan')).toBeInTheDocument();
    });

    // Find delete button for TechCrunch Japan (3rd row)
    const deleteButtons = screen.getAllByTestId('delete-source-button');
    await user.click(deleteButtons[2]); // 3rd source

    // Confirm deletion
    await waitFor(() => {
      expect(screen.getByText('削除の確認')).toBeInTheDocument();
    });

    const confirmButton = screen.getByRole('button', { name: /削除する/i });
    await user.click(confirmButton);

    // Check source is removed
    await waitFor(() => {
      expect(screen.queryByText('TechCrunch Japan')).not.toBeInTheDocument();
    });
  });

  it('should evaluate source URL', async () => {
    const user = userEvent.setup();
    
    const evaluateMock = {
      request: {
        query: EVALUATE_SOURCE_MUTATION,
        variables: {
          url: 'https://example.com',
        },
      },
      result: {
        data: {
          evaluateSource: {
            tier: 2,
            trustScore: 85,
            criteria: [
              '大手メディアのドメイン',
              'HTTPSプロトコル使用',
              '定期的な更新履歴あり',
              '著者情報の明記',
            ],
          },
        },
      },
    };

    render(
      <MockedProvider mocks={[...mocks, evaluateMock]} addTypename={false}>
        <SourcesPage />
      </MockedProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Apple Newsroom')).toBeInTheDocument();
    });

    // Open modal
    const addButton = screen.getByRole('button', { name: /新規追加/i });
    await user.click(addButton);

    // Enter URL
    await user.type(screen.getByLabelText('URL *'), 'https://example.com');

    // Click evaluate button
    const evaluateButton = screen.getByRole('button', { name: /URLを評価/i });
    await user.click(evaluateButton);

    // Check evaluation results
    await waitFor(() => {
      expect(screen.getByText('85%')).toBeInTheDocument();
      expect(screen.getByText('大手メディアのドメイン')).toBeInTheDocument();
    });
  });
});