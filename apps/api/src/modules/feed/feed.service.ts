import { Injectable, Logger, Inject } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import Parser from 'rss-parser';
import axios from 'axios';
import { PrismaService } from '../../prisma/prisma.service';
import { ArticlesService } from '../articles/articles.service';
import { SourcesService } from '../sources/sources.service';
import { PUB_SUB } from '../pubsub/pubsub.module';
// import { SubscriptionEvent, SourceFeedFetchedPayload } from '../pubsub/subscription-events';

interface FeedItem {
  title?: string;
  link?: string;
  pubDate?: string;
  content?: string;
  contentSnippet?: string;
  guid?: string;
  isoDate?: string;
  creator?: string;
  categories?: string[];
  enclosure?: {
    url?: string;
    type?: string;
  };
}

@Injectable()
export class FeedService {
  private readonly logger = new Logger(FeedService.name);
  private parser: Parser;

  constructor(
    private readonly prisma: PrismaService,
    private readonly articlesService: ArticlesService,
    private readonly sourcesService: SourcesService,
    @Inject(PUB_SUB) private pubSub: any,
  ) {
    this.parser = new Parser({
      customFields: {
        item: [
          ['media:content', 'mediaContent'],
          ['media:thumbnail', 'mediaThumbnail'],
          ['dc:creator', 'creator'],
        ],
      },
    });
  }

  // 15分ごとにフィードを取得
  @Cron('0 */15 * * * *')
  async handleCron() {
    this.logger.log('Starting scheduled feed fetch...');
    await this.fetchAllActiveFeeds();
  }

  async fetchAllActiveFeeds() {
    const activeSources = await this.prisma.source.findMany({
      where: {
        isActive: true,
      },
    });

    this.logger.log(`Found ${activeSources.length} active sources to fetch`);

    for (const source of activeSources) {
      if (!source.feedUrl) {
        this.logger.warn(`Source ${source.name} has no feed URL`);
        continue;
      }

      try {
        await this.fetchSourceFeed(source.id, source.feedUrl);
        await this.sourcesService.updateLastFetched(source.id);
      } catch (error) {
        this.logger.error(`Failed to fetch feed for ${source.name}:`, error);
        await this.sourcesService.updateLastError(source.id, error instanceof Error ? error.message : String(error));
      }
    }
  }

  async fetchSourceFeed(sourceId: string, feedUrl: string) {
    try {
      this.logger.log(`Fetching feed from ${feedUrl}`);

      const feed = await this.parser.parseURL(feedUrl);
      const errors: string[] = [];
      let fetchedCount = 0;
      let newCount = 0;

      for (const item of feed.items as FeedItem[]) {
        fetchedCount++;
        if (!item.link) {
          errors.push(`Item without link: ${item.title}`);
          continue;
        }

        // 既存の記事をチェック
        const existingArticle = await this.articlesService.findByOriginalUrl(item.link);
        if (existingArticle) continue;

        try {
          // 記事の作成
          await this.articlesService.create({
            sourceId,
            originalUrl: item.link,
            title: item.title || 'Untitled',
            content: item.content || item.contentSnippet || '',
            summary: item.contentSnippet || this.extractSummary(item.content || ''),
            publishedAt: item.isoDate || item.pubDate || new Date().toISOString(),
            imageUrl: this.extractImageUrl(item),
            author: item.creator || feed.title || 'Unknown',
            tagNames: item.categories || [],
          });

          newCount++;
        } catch (error) {
          this.logger.error(`Failed to create article from ${item.link}:`, error);
          errors.push(`Failed to create article: ${error instanceof Error ? error.message : String(error)}`);
        }
      }

      this.logger.log(`Fetched ${fetchedCount} items, created ${newCount} new articles`);
      
      // フィード取得完了を通知
      if (newCount > 0) {
        await this.pubSub.publish('sourceFeedFetched', {
          sourceId,
          articleCount: newCount,
          timestamp: new Date(),
        });
      }

      return {
        sourceId,
        fetchedCount,
        newCount,
        errors,
      };
    } catch (error) {
      this.logger.error(`Failed to fetch feed from ${feedUrl}:`, error);
      throw error;
    }
  }

  async fetchSingleFeed(sourceId: string) {
    const source = await this.sourcesService.findOne(sourceId);
    if (!source.feedUrl) {
      throw new Error('Source does not have a feed URL');
    }

    return this.fetchSourceFeed(sourceId, source.feedUrl);
  }

  async subscribeToWebSub(hubUrl: string, topicUrl: string, callbackUrl: string) {
    try {
      const response = await axios.post(hubUrl, {
        'hub.mode': 'subscribe',
        'hub.topic': topicUrl,
        'hub.callback': callbackUrl,
        'hub.lease_seconds': 864000, // 10 days
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      this.logger.log(`WebSub subscription requested for ${topicUrl}`);
      return response.data;
    } catch (error) {
      this.logger.error(`Failed to subscribe to WebSub:`, error);
      throw error;
    }
  }

  async handleWebSubNotification(sourceId: string, content: string) {
    try {
      const source = await this.sourcesService.findOne(sourceId);
      
      // Parse the content (assuming it's RSS/Atom)
      const feed = await this.parser.parseString(content);
      
      for (const item of feed.items as FeedItem[]) {
        if (!item.link) continue;

        const existingArticle = await this.articlesService.findByUrl(item.link);
        if (!existingArticle) {
          await this.articlesService.create({
            sourceId: source.id,
            originalUrl: item.link,
            title: item.title || 'Untitled',
            content: item.content || item.contentSnippet || '',
            summary: item.contentSnippet || this.extractSummary(item.content || ''),
            publishedAt: item.isoDate || item.pubDate || new Date().toISOString(),
            imageUrl: this.extractImageUrl(item),
            author: item.creator || feed.title || source.name,
            tagNames: item.categories || [],
          });
        }
      }

      // 最終取得時刻を更新
      await this.prisma.source.update({
        where: { id: source.id },
        data: { lastFetchedAt: new Date() },
      });

      this.logger.log(`Processed WebSub notification for ${source.name}`);
    } catch (error) {
      this.logger.error(`Failed to process WebSub notification:`, error);
      throw error;
    }
  }

  private extractImageUrl(item: any): string | undefined {
    // Check various possible image locations
    if (item.enclosure?.url && item.enclosure.type?.startsWith('image/')) {
      return item.enclosure.url;
    }
    if (item.mediaContent?.$ ?.url) {
      return item.mediaContent.$.url;
    }
    if (item.mediaThumbnail?.$ ?.url) {
      return item.mediaThumbnail.$.url;
    }
    
    // Extract from content
    const imgMatch = item.content?.match(/<img[^>]+src="([^">]+)"/);
    if (imgMatch) {
      return imgMatch[1];
    }

    return undefined;
  }

  private extractSummary(content: string, maxLength: number = 200): string {
    // Remove HTML tags
    const text = content.replace(/<[^>]*>/g, '');
    
    // Trim and limit length
    if (text.length <= maxLength) {
      return text.trim();
    }
    
    // Find last complete sentence within maxLength
    const truncated = text.substring(0, maxLength);
    const lastPeriod = truncated.lastIndexOf('。');
    const lastExclamation = truncated.lastIndexOf('！');
    const lastQuestion = truncated.lastIndexOf('？');
    
    const lastSentenceEnd = Math.max(lastPeriod, lastExclamation, lastQuestion);
    
    if (lastSentenceEnd > 0) {
      return truncated.substring(0, lastSentenceEnd + 1).trim();
    }
    
    return truncated.trim() + '...';
  }

  async fetchFeed(feedUrl: string) {
    try {
      const feed = await this.parser.parseURL(feedUrl);
      const articles = [];

      for (const item of feed.items as FeedItem[]) {
        if (!item.link) continue;

        articles.push({
          url: item.link,
          title: item.title || 'Untitled',
          content: item.content || item.contentSnippet || '',
          summary: item.contentSnippet || this.extractSummary(item.content || ''),
          publishedAt: item.isoDate ? new Date(item.isoDate) : new Date(),
          imageUrl: this.extractImageUrl(item),
          author: item.creator || feed.title || 'Unknown',
          tags: item.categories || [],
        });
      }

      return articles;
    } catch (error) {
      this.logger.error(`Failed to fetch feed from ${feedUrl}:`, error);
      throw error;
    }
  }

  async fetchAllFeeds() {
    const sources = await this.prisma.source.findMany({
      where: { isActive: true },
    });

    const results = await Promise.allSettled(
      sources.map(source => this.fetchSingleFeed(source.id))
    );

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    return {
      total: sources.length,
      successful,
      failed,
      sources: sources.map((source, index) => ({
        id: source.id,
        name: source.name,
        status: results[index]?.status || 'unknown',
        error: results[index]?.status === 'rejected' ? (results[index] as PromiseRejectedResult).reason : null,
      })),
    };
  }
}