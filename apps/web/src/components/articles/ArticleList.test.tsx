import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MockedProvider } from '@apollo/client/testing';
import { ArticleList } from './ArticleList';
import { GET_ARTICLES } from '../../graphql/queries';

const mockArticles = [
  {
    id: '1',
    title: 'Apple announces new iPhone',
    url: 'https://www.apple.com/newsroom/iphone',
    summary: 'Apple unveiled its latest iPhone model...',
    publishedAt: '2024-01-07T10:00:00Z',
    source: {
      id: 'apple',
      name: 'Apple Inc.',
      tier: 1,
    },
    tags: [
      { id: 'tech', name: 'Technology' },
      { id: 'mobile', name: 'Mobile' },
    ],
  },
  {
    id: '2',
    title: 'Tech industry trends 2024',
    url: 'https://techcrunch.com/trends',
    summary: 'The latest trends in technology...',
    publishedAt: '2024-01-07T09:00:00Z',
    source: {
      id: 'techcrunch',
      name: 'TechCrunch',
      tier: 3,
    },
    tags: [
      { id: 'tech', name: 'Technology' },
    ],
  },
];

const mocks = [
  {
    request: {
      query: GET_ARTICLES,
      variables: {
        filter: {},
        limit: 20,
        offset: 0,
      },
    },
    result: {
      data: {
        articles: mockArticles,
      },
    },
  },
];

describe('ArticleList', () => {
  it('should render list of articles', async () => {
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <ArticleList />
      </MockedProvider>
    );

    expect(await screen.findByText('Apple announces new iPhone')).toBeInTheDocument();
    expect(screen.getByText('Tech industry trends 2024')).toBeInTheDocument();
  });

  it('should show tier badges for articles', async () => {
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <ArticleList />
      </MockedProvider>
    );

    expect(await screen.findByText('一次情報')).toBeInTheDocument();
    expect(screen.getByText('一般メディア')).toBeInTheDocument();
  });

  it('should filter articles by tier when tier filter is changed', async () => {
    const tierFilterMock = {
      request: {
        query: GET_ARTICLES,
        variables: {
          filter: { tiers: [1] },
          limit: 20,
          offset: 0,
        },
      },
      result: {
        data: {
          articles: [mockArticles[0]],
        },
      },
    };

    render(
      <MockedProvider mocks={[...mocks, tierFilterMock]} addTypename={false}>
        <ArticleList />
      </MockedProvider>
    );

    // Wait for initial load
    await screen.findByText('Apple announces new iPhone');

    // Click tier filter
    const tier1Checkbox = screen.getByRole('checkbox', { name: /一次情報/i });
    fireEvent.click(tier1Checkbox);

    // Should only show tier 1 articles
    expect(await screen.findByText('Apple announces new iPhone')).toBeInTheDocument();
    expect(screen.queryByText('Tech industry trends 2024')).not.toBeInTheDocument();
  });

  it('should show loading state', () => {
    render(
      <MockedProvider mocks={[]} addTypename={false}>
        <ArticleList />
      </MockedProvider>
    );

    expect(screen.getByText('読み込み中...')).toBeInTheDocument();
  });

  it('should show error state', async () => {
    const errorMock = {
      request: {
        query: GET_ARTICLES,
        variables: {
          filter: {},
          limit: 20,
          offset: 0,
        },
      },
      error: new Error('Failed to fetch articles'),
    };

    render(
      <MockedProvider mocks={[errorMock]} addTypename={false}>
        <ArticleList />
      </MockedProvider>
    );

    expect(await screen.findByText(/エラーが発生しました/)).toBeInTheDocument();
  });

  it('should show article tags', async () => {
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <ArticleList />
      </MockedProvider>
    );

    expect(await screen.findByText('Technology')).toBeInTheDocument();
    expect(screen.getByText('Mobile')).toBeInTheDocument();
  });

  it('should format publish date correctly', async () => {
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <ArticleList />
      </MockedProvider>
    );

    // Check that date is formatted (exact format may vary)
    expect(await screen.findByText(/2024/)).toBeInTheDocument();
  });
});