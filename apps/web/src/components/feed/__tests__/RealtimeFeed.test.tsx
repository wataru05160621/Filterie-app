import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import { RealtimeFeed } from '../RealtimeFeed';
import { gql } from '@apollo/client';

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

describe('RealtimeFeed', () => {
  const mockArticles = [
    {
      id: '1',
      title: 'テスト記事1',
      originalUrl: 'https://example.com/article1',
      summary: 'これはテスト記事1の要約です',
      publishedAt: '2024-01-15T10:00:00Z',
      source: {
        id: 'source1',
        name: 'Tech News',
        tier: 1,
      },
    },
    {
      id: '2',
      title: 'テスト記事2',
      originalUrl: 'https://example.com/article2',
      summary: 'これはテスト記事2の要約です',
      publishedAt: '2024-01-14T15:00:00Z',
      source: {
        id: 'source2',
        name: 'Dev Blog',
        tier: 2,
      },
    },
  ];

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
  ];

  const renderWithProvider = (ui: React.ReactElement, customMocks = mocks) => {
    return render(
      <MockedProvider mocks={customMocks} addTypename={false}>
        {ui}
      </MockedProvider>
    );
  };

  it('should render feed with articles', async () => {
    renderWithProvider(<RealtimeFeed />);

    // ローディング状態の確認
    expect(screen.getByTestId('feed-loading')).toBeInTheDocument();

    // 記事が表示されるまで待つ
    await waitFor(() => {
      expect(screen.getByText('テスト記事1')).toBeInTheDocument();
      expect(screen.getByText('テスト記事2')).toBeInTheDocument();
    });

    // Tier バッジの確認
    expect(screen.getByText('Tier 1')).toBeInTheDocument();
    expect(screen.getByText('Tier 2')).toBeInTheDocument();
  });

  it('should show new article notification', async () => {
    const subscriptionMock = {
      request: {
        query: NEW_ARTICLE_SUBSCRIPTION,
        variables: {
          sourceIds: undefined,
        },
      },
      result: {
        data: {
          newArticle: {
            id: '3',
            title: '新着記事',
            originalUrl: 'https://example.com/article3',
            summary: '新着記事の要約',
            publishedAt: '2024-01-15T12:00:00Z',
            source: {
              id: 'source1',
              name: 'Tech News',
              tier: 1,
            },
          },
        },
      },
    };

    renderWithProvider(<RealtimeFeed />, [...mocks, subscriptionMock]);

    await waitFor(() => {
      expect(screen.getByText('テスト記事1')).toBeInTheDocument();
    });

    // 新着通知が表示されることを確認
    await waitFor(() => {
      expect(screen.getByText('新着記事があります')).toBeInTheDocument();
    });

    // 新着記事を表示ボタンをクリック
    fireEvent.click(screen.getByRole('button', { name: '新着記事を表示' }));

    // 新着記事が表示されることを確認
    await waitFor(() => {
      expect(screen.getByText('新着記事')).toBeInTheDocument();
    });
  });

  it('should filter articles by tier', async () => {
    renderWithProvider(<RealtimeFeed />);

    await waitFor(() => {
      expect(screen.getByText('テスト記事1')).toBeInTheDocument();
    });

    // Tier フィルターボタンをクリック
    fireEvent.click(screen.getByRole('button', { name: 'Tier フィルター' }));

    // Tier 1 のみを選択
    fireEvent.click(screen.getByLabelText('Tier 1'));

    // フィルターを適用
    fireEvent.click(screen.getByRole('button', { name: 'フィルターを適用' }));

    // Tier 1 の記事のみが表示されることを確認
    await waitFor(() => {
      expect(screen.getByText('テスト記事1')).toBeInTheDocument();
      expect(screen.queryByText('テスト記事2')).not.toBeInTheDocument();
    });
  });

  it('should handle pull to refresh', async () => {
    const refetchMock = jest.fn().mockResolvedValue({
      data: {
        articles: {
          items: [...mockArticles],
          totalCount: 2,
          hasMore: false,
        },
      },
    });

    renderWithProvider(<RealtimeFeed />);

    await waitFor(() => {
      expect(screen.getByText('テスト記事1')).toBeInTheDocument();
    });

    // プルリフレッシュのシミュレート
    const feedContainer = screen.getByTestId('feed-container');
    fireEvent.touchStart(feedContainer, { touches: [{ clientY: 100 }] });
    fireEvent.touchMove(feedContainer, { touches: [{ clientY: 200 }] });
    fireEvent.touchEnd(feedContainer);

    // リフレッシュインジケーターが表示されることを確認
    expect(screen.getByTestId('refresh-indicator')).toBeInTheDocument();
  });

  it('should handle infinite scroll', async () => {
    const infiniteScrollMocks = [
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
              totalCount: 10,
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
            offset: 2,
          },
        },
        result: {
          data: {
            articles: {
              items: [
                {
                  id: '3',
                  title: 'テスト記事3',
                  originalUrl: 'https://example.com/article3',
                  summary: 'これはテスト記事3の要約です',
                  publishedAt: '2024-01-13T10:00:00Z',
                  source: {
                    id: 'source3',
                    name: 'News Site',
                    tier: 3,
                  },
                },
              ],
              totalCount: 10,
              hasMore: true,
            },
          },
        },
      },
    ];

    renderWithProvider(<RealtimeFeed />, infiniteScrollMocks);

    await waitFor(() => {
      expect(screen.getByText('テスト記事1')).toBeInTheDocument();
    });

    // スクロールして最下部に到達
    const feedContainer = screen.getByTestId('feed-container');
    fireEvent.scroll(feedContainer, {
      target: { scrollTop: 1000, clientHeight: 600, scrollHeight: 1000 },
    });

    // 新しい記事がロードされることを確認
    await waitFor(() => {
      expect(screen.getByText('テスト記事3')).toBeInTheDocument();
    });
  });

  it('should show empty state when no articles', async () => {
    const emptyMocks = [
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
              items: [],
              totalCount: 0,
              hasMore: false,
            },
          },
        },
      },
    ];

    renderWithProvider(<RealtimeFeed />, emptyMocks);

    await waitFor(() => {
      expect(screen.getByText('記事がありません')).toBeInTheDocument();
      expect(screen.getByText('情報源を追加して、最新の記事を取得しましょう')).toBeInTheDocument();
    });
  });

  it('should handle error state', async () => {
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
        error: new Error('ネットワークエラー'),
      },
    ];

    renderWithProvider(<RealtimeFeed />, errorMocks);

    await waitFor(() => {
      expect(screen.getByText('エラーが発生しました')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '再試行' })).toBeInTheDocument();
    });

    // 再試行ボタンをクリック
    fireEvent.click(screen.getByRole('button', { name: '再試行' }));

    // ローディング状態に戻ることを確認
    expect(screen.getByTestId('feed-loading')).toBeInTheDocument();
  });

  it('should update article read status on click', async () => {
    renderWithProvider(<RealtimeFeed />);

    await waitFor(() => {
      expect(screen.getByText('テスト記事1')).toBeInTheDocument();
    });

    // 記事をクリック
    const articleLink = screen.getByRole('link', { name: /テスト記事1/ });
    fireEvent.click(articleLink);

    // 既読スタイルが適用されることを確認
    await waitFor(() => {
      expect(articleLink).toHaveClass('visited');
    });
  });
});