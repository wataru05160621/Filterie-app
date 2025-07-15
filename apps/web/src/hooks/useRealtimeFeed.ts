import { useState, useEffect, useCallback } from 'react';
import { useQuery, useSubscription, gql } from '@apollo/client';

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

export interface Article {
  id: string;
  title: string;
  originalUrl: string;
  summary?: string;
  publishedAt: string;
  source: {
    id: string;
    name: string;
    tier: number;
  };
}

export interface UseRealtimeFeedOptions {
  sourceIds?: string[];
  minTier?: number;
  maxTier?: number;
  limit?: number;
}

export interface UseRealtimeFeedResult {
  articles: Article[];
  loading: boolean;
  error?: Error;
  hasMore: boolean;
  totalCount: number;
  refetch: () => void;
  refresh: () => void;
  loadMore: () => void;
  handleNewArticle: (article: Article) => void;
}

export function useRealtimeFeed(options: UseRealtimeFeedOptions = {}): UseRealtimeFeedResult {
  const { sourceIds, minTier, maxTier, limit = 20 } = options;
  const [articles, setArticles] = useState<Article[]>([]);
  const [offset, setOffset] = useState(0);

  // Build filter
  const filter: any = {};
  if (sourceIds?.length) {
    filter.sourceIds = sourceIds;
  }
  if (minTier !== undefined || maxTier !== undefined) {
    filter.minTier = minTier;
    filter.maxTier = maxTier;
  }

  // Query for initial articles
  const { data, loading, error, refetch, fetchMore } = useQuery(ARTICLES_QUERY, {
    variables: {
      filter,
      limit,
      offset: 0,
    },
    notifyOnNetworkStatusChange: true,
  });

  // Subscribe to new articles
  const { data: subscriptionData } = useSubscription(NEW_ARTICLE_SUBSCRIPTION, {
    variables: {
      sourceIds,
    },
  });

  // Update articles when query data changes
  useEffect(() => {
    if (data?.articles?.items) {
      setArticles(data.articles.items);
    }
  }, [data]);

  // Handle new articles from subscription
  const handleNewArticle = useCallback((newArticle: Article) => {
    setArticles(prev => {
      // Check if article already exists
      const exists = prev.some(article => article.id === newArticle.id);
      if (exists) return prev;

      // Filter by tier if specified
      if (minTier !== undefined && newArticle.source.tier < minTier) return prev;
      if (maxTier !== undefined && newArticle.source.tier > maxTier) return prev;

      // Add new article at the beginning
      return [newArticle, ...prev];
    });
  }, [minTier, maxTier]);

  // Add new articles from subscription
  useEffect(() => {
    if (subscriptionData?.newArticle) {
      handleNewArticle(subscriptionData.newArticle);
    }
  }, [subscriptionData, handleNewArticle]);

  // Refresh function
  const refresh = useCallback(() => {
    setOffset(0);
    refetch();
  }, [refetch]);

  // Load more function
  const loadMore = useCallback(() => {
    if (!data?.articles?.hasMore) return;

    const newOffset = offset + limit;
    setOffset(newOffset);

    fetchMore({
      variables: {
        offset: newOffset,
      },
      updateQuery: (prev, { fetchMoreResult }) => {
        if (!fetchMoreResult) return prev;

        return {
          articles: {
            ...fetchMoreResult.articles,
            items: [...prev.articles.items, ...fetchMoreResult.articles.items],
          },
        };
      },
    });
  }, [data, offset, limit, fetchMore]);

  // Filter articles based on source and tier
  const filteredArticles = articles.filter(article => {
    if (sourceIds?.length && !sourceIds.includes(article.source.id)) {
      return false;
    }
    if (minTier !== undefined && article.source.tier < minTier) {
      return false;
    }
    if (maxTier !== undefined && article.source.tier > maxTier) {
      return false;
    }
    return true;
  });

  return {
    articles: filteredArticles,
    loading,
    error: error || undefined,
    hasMore: data?.articles?.hasMore || false,
    totalCount: data?.articles?.totalCount || 0,
    refetch,
    refresh,
    loadMore,
    handleNewArticle,
  };
}