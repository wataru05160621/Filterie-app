export type SourceTier = 'TIER_1' | 'TIER_2' | 'TIER_3' | 'TIER_4';
export type AISentiment = 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL' | 'MIXED';

export interface Tag {
  id: string;
  name: string;
}

export interface Source {
  id: string;
  name: string;
  url: string;
  tier: SourceTier;
  trustScore: number;
}

export interface AISummary {
  id: string;
  summary: string;
  keyPoints: string[];
  sentiment: AISentiment;
  generatedAt: string;
}

export interface Bookmark {
  id: string;
  userId: string;
  articleId?: string;
  createdAt: string;
}

export interface Read {
  id: string;
  userId: string;
  articleId?: string;
  readAt: string;
  duration: number;
}

export interface Article {
  id: string;
  title: string;
  content: string;
  summary: string;
  url: string;
  publishedAt: string;
  readTime: number;
  viewCount: number;
  trustScore: number;
  tags: Tag[];
  source: Source;
  aiSummary?: AISummary;
  bookmarks: Bookmark[];
  reads: Read[];
}

export interface ArticleListItem {
  id: string;
  title: string;
  summary: string;
  url: string;
  publishedAt: string;
  readTime: number;
  viewCount: number;
  trustScore: number;
  tags: Tag[];
  source: Source;
  bookmarks: Bookmark[];
  reads: Read[];
}

export interface ArticleConnection {
  items: ArticleListItem[];
  total: number;
  hasMore: boolean;
}

export interface ArticleFilter {
  sourceId?: string;
  sourceTier?: SourceTier;
  tagIds?: string[];
  startDate?: string;
  endDate?: string;
  minTrustScore?: number;
  isBookmarked?: boolean;
  isRead?: boolean;
}

export type ArticleSortField = 'publishedAt' | 'trustScore' | 'viewCount' | 'readTime';
export type SortOrder = 'ASC' | 'DESC';

export interface ArticleSort {
  field: ArticleSortField;
  order: SortOrder;
}

// Mutation response types
export interface BookmarkArticleResponse {
  bookmarkArticle: Bookmark;
}

export interface RemoveBookmarkResponse {
  removeBookmark: {
    success: boolean;
  };
}

export interface TrackReadResponse {
  trackRead: Read;
}

// Query response types
export interface GetArticleResponse {
  article: Article | null;
}

export interface GetArticlesResponse {
  articles: ArticleConnection;
}

export interface GetRelatedArticlesResponse {
  relatedArticles: ArticleListItem[];
}

export interface SearchArticlesResponse {
  searchArticles: ArticleConnection;
}

export interface GetBookmarkedArticlesResponse {
  bookmarkedArticles: ArticleConnection;
}

export interface GetReadHistoryResponse {
  readHistory: ArticleConnection;
}