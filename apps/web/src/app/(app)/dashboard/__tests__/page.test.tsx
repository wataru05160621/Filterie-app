import { render, screen } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import DashboardPage from '../page';
import { useAuth } from '@/providers/auth-provider';
import { gql } from '@apollo/client';

// Mock the auth provider
jest.mock('@/providers/auth-provider');

// Mock the Header component
jest.mock('@/components/layout/header', () => ({
  Header: () => <div>Header</div>,
}));

const DASHBOARD_QUERY = gql`
  query DashboardData {
    me {
      id
      email
      name
    }
    
    recentArticles: articles(
      pagination: { limit: 5 }
    ) {
      edges {
        node {
          id
          title
          summary
          publishedAt
          url
          source {
            name
            tier
          }
          tags {
            id
            name
          }
          aiSummary
        }
      }
      totalCount
    }
    
    sources {
      totalCount
    }
  }
`;

const mockData = {
  me: {
    id: '1',
    email: 'test@example.com',
    name: 'Test User',
  },
  recentArticles: {
    edges: [
      {
        node: {
          id: '1',
          title: 'Test Article',
          summary: 'Test summary',
          publishedAt: new Date().toISOString(),
          url: 'https://example.com',
          source: {
            name: 'Test Source',
            tier: 1,
          },
          tags: [],
          aiSummary: 'AI generated summary',
        },
      },
    ],
    totalCount: 1,
  },
  sources: {
    totalCount: 10,
  },
};

const mocks = [
  {
    request: {
      query: DASHBOARD_QUERY,
    },
    result: {
      data: mockData,
    },
  },
];

describe('DashboardPage', () => {
  beforeEach(() => {
    (useAuth as jest.Mock).mockReturnValue({
      user: { id: '1', email: 'test@example.com', name: 'Test User' },
    });
  });

  it('renders dashboard header', async () => {
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <DashboardPage />
      </MockedProvider>
    );

    expect(await screen.findByText('ダッシュボード')).toBeInTheDocument();
  });

  it('renders stats cards', async () => {
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <DashboardPage />
      </MockedProvider>
    );

    expect(await screen.findByText('本日の新着記事')).toBeInTheDocument();
    expect(await screen.findByText('AI要約生成数')).toBeInTheDocument();
    expect(await screen.findByText('保存した記事')).toBeInTheDocument();
    expect(await screen.findByText('アクティブソース')).toBeInTheDocument();
  });

  it('renders tier filters', async () => {
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <DashboardPage />
      </MockedProvider>
    );

    expect(await screen.findByText('⭐ Tier 1')).toBeInTheDocument();
    expect(await screen.findByText('⭐ Tier 2')).toBeInTheDocument();
    expect(await screen.findByText('⭐ Tier 3')).toBeInTheDocument();
    expect(await screen.findByText('⭐ Tier 4')).toBeInTheDocument();
  });

  it('renders AI selected articles section', async () => {
    render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <DashboardPage />
      </MockedProvider>
    );

    expect(await screen.findByText('AI厳選記事')).toBeInTheDocument();
    expect(await screen.findByText('あなたの興味に基づいて選ばれた最重要記事')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(
      <MockedProvider mocks={[]} addTypename={false}>
        <DashboardPage />
      </MockedProvider>
    );

    expect(screen.getByText('読み込み中...')).toBeInTheDocument();
  });

  it('returns null when user is not authenticated', () => {
    (useAuth as jest.Mock).mockReturnValue({ user: null });

    const { container } = render(
      <MockedProvider mocks={mocks} addTypename={false}>
        <DashboardPage />
      </MockedProvider>
    );

    expect(container.firstChild).toBeNull();
  });
});