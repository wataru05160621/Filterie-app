import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { FeedService } from './feed.service';
import { SourcesService } from '../sources/sources.service';
import { ArticlesService } from '../articles/articles.service';
import { PubSubService } from '../pubsub/pubsub.service';
import { Source } from '@prisma/client';

@Injectable()
export class FeedPollerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(FeedPollerService.name);

  constructor(
    private readonly feedService: FeedService,
    private readonly sourcesService: SourcesService,
    private readonly articlesService: ArticlesService,
    private readonly pubSubService: PubSubService,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) {}

  async onModuleInit() {
    // テスト環境では自動起動しない
    if (process.env.NODE_ENV !== 'test') {
      await this.startPolling();
    }
  }

  onModuleDestroy() {
    this.stopPolling();
  }

  async startPolling() {
    this.logger.log('Starting feed polling...');
    
    // アクティブな全ての情報源を取得
    const sources = await this.sourcesService.findAll({ isActive: true });

    for (const source of sources) {
      const interval = this.getPollingInterval(source.tier);
      const callback = () => {
        this.pollSource(source).catch((error) => {
          this.logger.error(`Error polling source ${source.id}: ${error.message}`);
        });
      };

      // 初回実行
      callback();

      // 定期実行の設定
      const intervalId = setInterval(callback, interval);
      this.schedulerRegistry.addInterval(`poll-${source.id}`, intervalId);
      
      this.logger.log(
        `Started polling for ${source.name} (${source.tier}) every ${interval / 1000 / 60} minutes`
      );
    }
  }

  stopPolling() {
    this.logger.log('Stopping feed polling...');
    
    const intervals = this.schedulerRegistry.getIntervals();
    for (const intervalName of intervals) {
      if (intervalName.startsWith('poll-')) {
        this.schedulerRegistry.deleteInterval(intervalName);
        this.logger.log(`Stopped polling for ${intervalName}`);
      }
    }
  }

  async pollSource(source: Source) {
    this.logger.debug(`Polling source: ${source.name}`);
    
    try {
      // フィードをパース
      const articles = await this.feedService.fetchFeed(source.feedUrl || source.url);
      
      let newArticlesCount = 0;
      
      for (const articleData of articles) {
        // 既存の記事かチェック
        const existingArticle = await this.articlesService.findByUrl(articleData.url);
        
        if (!existingArticle) {
          // 新しい記事を作成
          const newArticle = await this.articlesService.create({
            sourceId: source.id,
            originalUrl: articleData.url,
            title: articleData.title,
            content: articleData.content,
            summary: articleData.summary,
            publishedAt: articleData.publishedAt.toISOString(),
            imageUrl: articleData.imageUrl,
            author: articleData.author,
            tagNames: articleData.tags,
          });
          
          // リアルタイムで通知
          await this.pubSubService.publishArticleCreated(newArticle);
          newArticlesCount++;
        }
      }
      
      // 最終チェック時刻を更新
      await this.sourcesService.updateLastFetched(source.id);
      
      if (newArticlesCount > 0) {
        this.logger.log(
          `Found ${newArticlesCount} new articles from ${source.name}`
        );
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      
      this.logger.error(
        `Failed to poll source ${source.name}: ${errorMessage}`,
        errorStack
      );
      throw error;
    }
  }

  getPollingInterval(tier: number): number {
    // Tierに基づいてポーリング間隔を決定
    switch (tier) {
      case 1:
        return 5 * 60 * 1000; // 5分
      case 2:
        return 10 * 60 * 1000; // 10分
      case 3:
        return 30 * 60 * 1000; // 30分
      case 4:
      default:
        return 60 * 60 * 1000; // 60分
    }
  }
}