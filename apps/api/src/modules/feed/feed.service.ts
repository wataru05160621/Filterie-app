import { Injectable, Logger, Inject } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as Parser from 'rss-parser';
import axios from 'axios';
import { PrismaService } from '../../prisma/prisma.service';
import { ArticlesService } from '../articles/articles.service';
import { SourcesService } from '../sources/sources.service';
import { PubSubEngine } from 'graphql-subscriptions';
import { PUB_SUB } from '../pubsub/pubsub.module';
import { SubscriptionEvent, SourceFeedFetchedPayload } from '../pubsub/subscription-events';

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
    @Inject(PUB_SUB) private pubSub: PubSubEngine,
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
  @Cron(CronExpression.EVERY_15_MINUTES)
  async handleCron() {
    this.logger.log('Starting scheduled feed fetch...');
    await this.fetchAllFeeds();
  }

  async fetchAllFeeds() {
    const activeSources = await this.prisma.source.findMany({
      where: {
        isActive: true,
        feedUrl: { not: null },
      },
    });

    this.logger.log(`Found ${activeSources.length} active sources to fetch`);

    const results = await Promise.allSettled(
      activeSources.map(source => this.fetchFeed(source)),
    );

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    this.logger.log(`Feed fetch completed: ${successful} successful, ${failed} failed`);

    return { successful, failed, total: activeSources.length };
  }

  async fetchFeed(source: any) {
    try {
      this.logger.log(`Fetching feed for ${source.name} (${source.feedUrl})`);

      const feed = await this.parser.parseURL(source.feedUrl);
      const newArticles = [];

      for (const item of feed.items as FeedItem[]) {
        if (!item.link) continue;

        // 既存の記事をチェック
        const existingArticle = await this.articlesService.findByUrl(item.link);
        if (existingArticle) continue;

        try {
          // 記事の作成
          const article = await this.articlesService.create({
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

          newArticles.push(article);
        } catch (error) {
          this.logger.error(`Failed to create article from ${item.link}:`, error);
        }
      }

      // 最終取得時刻を更新
      await this.prisma.source.update({
        where: { id: source.id },
        data: { lastFetchedAt: new Date() },
      });

      this.logger.log(`Added ${newArticles.length} new articles from ${source.name}`);
      
      // フィード取得完了を通知
      if (newArticles.length > 0) {
        await this.pubSub.publish(SubscriptionEvent.SOURCE_FEED_FETCHED, {
          [SubscriptionEvent.SOURCE_FEED_FETCHED]: {
            sourceId: source.id,
            sourceName: source.name,
            newArticlesCount: newArticles.length,
            timestamp: new Date(),
          } as SourceFeedFetchedPayload,
        });
      }

      return { source, newArticles: newArticles.length };
    } catch (error) {
      this.logger.error(`Failed to fetch feed for ${source.name}:`, error);
      throw error;
    }
  }

  async fetchSingleFeed(sourceId: string) {
    const source = await this.sourcesService.findOne(sourceId);
    if (!source.feedUrl) {
      throw new Error('Source does not have a feed URL');
    }

    return this.fetchFeed(source);
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
}