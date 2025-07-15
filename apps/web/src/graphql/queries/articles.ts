import { gql } from '@apollo/client';

// Fragment for article fields
export const ARTICLE_FIELDS = gql`
  fragment ArticleFields on Article {
    id
    title
    content
    summary
    url
    publishedAt
    readTime
    viewCount
    trustScore
    tags {
      id
      name
    }
    source {
      id
      name
      url
      tier
      trustScore
    }
  }
`;

// Fragment for AI summary fields
export const AI_SUMMARY_FIELDS = gql`
  fragment AISummaryFields on AISummary {
    id
    summary
    keyPoints
    sentiment
    generatedAt
  }
`;

// Get single article with full details
export const GET_ARTICLE_QUERY = gql`
  ${ARTICLE_FIELDS}
  ${AI_SUMMARY_FIELDS}
  query GetArticle($id: String!) {
    article(id: $id) {
      ...ArticleFields
      aiSummary {
        ...AISummaryFields
      }
      bookmarks {
        id
        userId
        createdAt
      }
      reads {
        id
        userId
        readAt
        duration
      }
    }
  }
`;

// Get related articles
export const GET_RELATED_ARTICLES_QUERY = gql`
  query GetRelatedArticles($articleId: String!, $limit: Int = 5) {
    relatedArticles(articleId: $articleId, limit: $limit) {
      id
      title
      summary
      publishedAt
      source {
        id
        name
        tier
      }
      tags {
        id
        name
      }
    }
  }
`;

// Bookmark article mutation
export const BOOKMARK_ARTICLE_MUTATION = gql`
  mutation BookmarkArticle($articleId: String!) {
    bookmarkArticle(articleId: $articleId) {
      id
      articleId
      userId
      createdAt
    }
  }
`;

// Remove bookmark mutation
export const REMOVE_BOOKMARK_MUTATION = gql`
  mutation RemoveBookmark($articleId: String!) {
    removeBookmark(articleId: $articleId) {
      success
    }
  }
`;

// Track article read mutation
export const TRACK_READ_MUTATION = gql`
  mutation TrackRead($articleId: String!, $duration: Int!) {
    trackRead(articleId: $articleId, duration: $duration) {
      id
      articleId
      userId
      readAt
      duration
    }
  }
`;

// Get articles list
export const GET_ARTICLES_QUERY = gql`
  ${ARTICLE_FIELDS}
  query GetArticles(
    $limit: Int = 20
    $offset: Int = 0
    $filter: ArticleFilter
    $sort: ArticleSort
  ) {
    articles(limit: $limit, offset: $offset, filter: $filter, sort: $sort) {
      items {
        ...ArticleFields
        bookmarks {
          id
          userId
        }
        reads {
          id
          userId
        }
      }
      total
      hasMore
    }
  }
`;

// Search articles
export const SEARCH_ARTICLES_QUERY = gql`
  ${ARTICLE_FIELDS}
  query SearchArticles($query: String!, $limit: Int = 20, $offset: Int = 0) {
    searchArticles(query: $query, limit: $limit, offset: $offset) {
      items {
        ...ArticleFields
        bookmarks {
          id
          userId
        }
      }
      total
      hasMore
    }
  }
`;

// Get bookmarked articles
export const GET_BOOKMARKED_ARTICLES_QUERY = gql`
  ${ARTICLE_FIELDS}
  query GetBookmarkedArticles($limit: Int = 20, $offset: Int = 0) {
    bookmarkedArticles(limit: $limit, offset: $offset) {
      items {
        ...ArticleFields
        bookmarks {
          id
          userId
          createdAt
        }
      }
      total
      hasMore
    }
  }
`;

// Get read history
export const GET_READ_HISTORY_QUERY = gql`
  ${ARTICLE_FIELDS}
  query GetReadHistory($limit: Int = 20, $offset: Int = 0) {
    readHistory(limit: $limit, offset: $offset) {
      items {
        ...ArticleFields
        reads {
          id
          userId
          readAt
          duration
        }
      }
      total
      hasMore
    }
  }
`;