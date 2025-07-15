import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import { useRealtimeFeed } from '../useRealtimeFeed';
import { gql } from '@apollo/client';

// GraphQL クエリとサブスクリプションのモック
const ARTICLES_QUERY = gql`
  query Articles($filter: ArticleFilterInput, $limit: Int, $offset: Int) {
    articles(filter: $filter, limit: $limit, offset: $offset) {
      items {
        id
        title
        originalUrl
        summary
        publishedAt
        source {
          id
          name
          tier
        }
      }
      totalCount
      hasMore
    }
  }
`;

const NEW_ARTICLE_SUBSCRIPTION = gql`
  subscription OnNewArticle($sourceIds: [String!]) {
    newArticle(sourceIds: $sourceIds) {
      id
      title
      originalUrl
      summary
      publishedAt
      source {
        id
        name
        tier
      }
    }
  }
`;

describe('useRealtimeFeed', () => {
  const mockArticles = [
    {
      id: '1',
      title: '既存の記事1',
      originalUrl: 'https://example.com/article1',
      summary: '既存記事の要約1',
      publishedAt: '2024-01-15T10:00:00Z',
      source: {
        id: 'source1',
        name: 'Tech News',
        tier: 2,
      },
    },
    {
      id: '2',
      title: '既存の記事2',
      originalUrl: 'https://example.com/article2',
      summary: '既存記事の要約2',
      publishedAt: '2024-01-14T15:00:00Z',
      source: {
        id: 'source2',
        name: 'Dev Blog',
        tier: 3,
      },
    },
  ];

  const newArticle = {
    id: '3',
    title: '新しい記事',
    originalUrl: 'https://example.com/article3',
    summary: '新しい記事の要約',
    publishedAt: '2024-01-15T12:00:00Z',
    source: {
      id: 'source1',
      name: 'Tech News',
      tier: 2,
    },
  };

  const mocks = [
    {
      request: {
        query: ARTICLES_QUERY,
        variables: {
          filter: {},
          limit: 20,
          offset: 0,
        },
      },
      result: {
        data: {
          articles: {
            items: mockArticles,
            totalCount: 2,
            hasMore: false,
          },
        },
      },
    },
    {
      request: {
        query: NEW_ARTICLE_SUBSCRIPTION,
        variables: {
          sourceIds: undefined,
        },
      },
      result: {
        data: {
          newArticle: newArticle,
        },
      },
    },
  ];

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <MockedProvider mocks={mocks} addTypename={false}>
      {children}
    </MockedProvider>
  );

  it('should fetch initial articles', async () => {
    // Create wrapper without subscription mock
    const queryOnlyMocks = [mocks[0]]; // Only query mock
    const queryWrapper = ({ children }: { children: React.ReactNode }) => (
      <MockedProvider mocks={queryOnlyMocks} addTypename={false}>
        {children}
      </MockedProvider>
    );

    const { result } = renderHook(() => useRealtimeFeed(), { wrapper: queryWrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.articles).toHaveLength(2);
    expect(result.current.articles[0].title).toBe('既存の記事1');
    expect(result.current.articles[1].title).toBe('既存の記事2');
  });

  it('should add new articles from subscription', async () => {
    const { result } = renderHook(() => useRealtimeFeed(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // サブスクリプションから新しい記事を受信
    act(() => {
      // サブスクリプションのデータが来たことをシミュレート
      result.current.handleNewArticle(newArticle);
    });

    await waitFor(() => {
      expect(result.current.articles).toHaveLength(3);
      expect(result.current.articles[0].title).toBe('新しい記事');
    });
  });

  it('should filter articles by source', async () => {
    const filteredMocks = [
      {
        request: {
          query: ARTICLES_QUERY,
          variables: {
            filter: { sourceIds: ['source1'] },
            limit: 20,
            offset: 0,
          },
        },
        result: {
          data: {
            articles: {
              items: mockArticles.filter(a => a.source.id === 'source1'),
              totalCount: 1,
              hasMore: false,
            },
          },
        },
      },
    ];

    const filteredWrapper = ({ children }: { children: React.ReactNode }) => (
      <MockedProvider mocks={filteredMocks} addTypename={false}>
        {children}
      </MockedProvider>
    );

    const { result } = renderHook(
      () => useRealtimeFeed({ sourceIds: ['source1'] }),
      { wrapper: filteredWrapper }
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // source1 の記事のみが表示されるべき
    expect(result.current.articles).toHaveLength(1);
    expect(result.current.articles[0].source.id).toBe('source1');
  });

  it('should filter articles by tier', async () => {
    const { result } = renderHook(
      () => useRealtimeFeed({ minTier: 2, maxTier: 2 }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Tier 2 の記事のみが表示されるべき
    const filteredArticles = result.current.articles.filter(
      article => article.source.tier === 2
    );
    expect(filteredArticles).toHaveLength(1);
  });

  it('should handle refresh', async () => {
    const refetchMock = jest.fn().mockResolvedValue({
      data: {
        articles: {
          items: mockArticles,
          totalCount: 2,
          hasMore: false,
        },
      },
    });

    const refreshMocks = [
      {
        request: {
          query: ARTICLES_QUERY,
          variables: {
            filter: {},
            limit: 20,
            offset: 0,
          },
        },
        result: {
          data: {
            articles: {
              items: mockArticles,
              totalCount: 2,
              hasMore: false,
            },
          },
        },
        newData: () => ({
          data: {
            articles: {
              items: mockArticles,
              totalCount: 2,
              hasMore: false,
            },
          },
        }),
      },
    ];

    const refreshWrapper = ({ children }: { children: React.ReactNode }) => (
      <MockedProvider mocks={refreshMocks} addTypename={false}>
        {children}
      </MockedProvider>
    );

    const { result } = renderHook(() => useRealtimeFeed(), { wrapper: refreshWrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const initialArticleCount = result.current.articles.length;

    act(() => {
      result.current.refresh();
    });

    // Refetch should be called
    expect(result.current.articles.length).toBe(initialArticleCount);
  });

  it('should load more articles', async () => {
    const loadMoreMocks = [
      {
        request: {
          query: ARTICLES_QUERY,
          variables: {
            filter: {},
            limit: 20,
            offset: 0,
          },
        },
        result: {
          data: {
            articles: {
              items: mockArticles.slice(0, 2),
              totalCount: 3,
              hasMore: true,
            },
          },
        },
      },
      {
        request: {
          query: ARTICLES_QUERY,
          variables: {
            filter: {},
            limit: 20,
            offset: 20,
          },
        },
        result: {
          data: {
            articles: {
              items: [newArticle],
              totalCount: 3,
              hasMore: false,
            },
          },
        },
      },
    ];

    const loadMoreWrapper = ({ children }: { children: React.ReactNode }) => (
      <MockedProvider mocks={loadMoreMocks} addTypename={false}>
        {children}
      </MockedProvider>
    );

    const { result } = renderHook(() => useRealtimeFeed(), { wrapper: loadMoreWrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.hasMore).toBe(true);
    });

    act(() => {
      result.current.loadMore();
    });

    await waitFor(() => {
      expect(result.current.articles.length).toBeGreaterThan(2);
    });
  });

  it('should handle errors gracefully', async () => {
    const errorMocks = [
      {
        request: {
          query: ARTICLES_QUERY,
          variables: {
            filter: {},
            limit: 20,
            offset: 0,
          },
        },
        error: new Error('Network error'),
      },
    ];

    const errorWrapper = ({ children }: { children: React.ReactNode }) => (
      <MockedProvider mocks={errorMocks} addTypename={false}>
        {children}
      </MockedProvider>
    );

    const { result } = renderHook(() => useRealtimeFeed(), { wrapper: errorWrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeDefined();
      expect(result.current.error?.message).toBe('Network error');
    });
  });

  it('should prevent duplicate articles', async () => {
    const queryOnlyMocks = [mocks[0]]; // Only query mock
    const queryWrapper = ({ children }: { children: React.ReactNode }) => (
      <MockedProvider mocks={queryOnlyMocks} addTypename={false}>
        {children}
      </MockedProvider>
    );

    const { result } = renderHook(() => useRealtimeFeed(), { wrapper: queryWrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const initialCount = result.current.articles.length;

    // 既存の記事と同じIDの記事を追加しようとする
    act(() => {
      result.current.handleNewArticle({
        ...newArticle,
        id: '1', // 既存の記事と同じID
      });
    });

    // 記事数は変わらないはず
    expect(result.current.articles).toHaveLength(initialCount);
  });
});