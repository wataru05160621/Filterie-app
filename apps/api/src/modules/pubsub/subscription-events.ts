export enum SubscriptionEvent {
  // 記事関連
  ARTICLE_CREATED = 'articleCreated',
  ARTICLE_UPDATED = 'articleUpdated',
  ARTICLE_DELETED = 'articleDeleted',
  
  // 情報源関連
  SOURCE_UPDATED = 'sourceUpdated',
  SOURCE_FEED_FETCHED = 'sourceFeedFetched',
  
  // ユーザー関連
  USER_PREFERENCE_UPDATED = 'userPreferenceUpdated',
  
  // AI関連
  AI_SUMMARY_GENERATED = 'aiSummaryGenerated',
  TAGS_EXTRACTED = 'tagsExtracted',
}

export interface ArticleCreatedPayload {
  article: any;
  sourceId: string;
}

export interface ArticleUpdatedPayload {
  article: any;
  updatedFields: string[];
}

export interface SourceFeedFetchedPayload {
  sourceId: string;
  sourceName: string;
  newArticlesCount: number;
  timestamp: Date;
}

export interface AiSummaryGeneratedPayload {
  articleId: string;
  summary: string;
  timestamp: Date;
}