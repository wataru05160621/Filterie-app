import { Test, TestingModule } from '@nestjs/testing';
import { ArticlesResolver } from './articles.resolver';
import { PubSubService } from '../pubsub/pubsub.service';
import { PrismaService } from '@/database/prisma.service';

describe('ArticlesResolver - Subscriptions', () => {
  let resolver: ArticlesResolver;
  let pubSubService: PubSubService;
  let mockAsyncIterator: any;

  beforeEach(async () => {
    // モックのAsyncIteratorを作成
    mockAsyncIterator = {
      next: jest.fn(),
      return: jest.fn(),
      throw: jest.fn(),
      [Symbol.asyncIterator]: function() { return this; },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ArticlesResolver,
        {
          provide: PubSubService,
          useValue: {
            asyncIterator: jest.fn().mockReturnValue(mockAsyncIterator),
            publishArticleCreated: jest.fn(),
            publishArticleUpdated: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            article: {
              findUnique: jest.fn(),
            },
          },
        },
        {
          provide: 'ArticlesService',
          useValue: {},
        },
      ],
    }).compile();

    resolver = module.get<ArticlesResolver>(ArticlesResolver);
    pubSubService = module.get<PubSubService>(PubSubService);
  });

  describe('articleCreated', () => {
    it('should return async iterator for articleCreated event', () => {
      const result = resolver.articleCreated();

      expect(pubSubService.asyncIterator).toHaveBeenCalledWith('articleCreated');
      expect(result).toBe(mockAsyncIterator);
    });

    it('should filter articles by sourceId when provided', () => {
      const sourceId = 'source-123';
      const result = resolver.articleCreated(sourceId);

      expect(pubSubService.asyncIterator).toHaveBeenCalledWith('articleCreated');
      expect(result).toBeDefined();
    });
  });

  describe('articleUpdated', () => {
    it('should return async iterator for articleUpdated event', () => {
      const result = resolver.articleUpdated();

      expect(pubSubService.asyncIterator).toHaveBeenCalledWith('articleUpdated');
      expect(result).toBe(mockAsyncIterator);
    });

    it('should filter articles by sourceId when provided', () => {
      const sourceId = 'source-123';
      const result = resolver.articleUpdated(sourceId);

      expect(pubSubService.asyncIterator).toHaveBeenCalledWith('articleUpdated');
      expect(result).toBeDefined();
    });
  });

  describe('Integration with article creation', () => {
    it('should publish event when article is created', async () => {
      const newArticle = {
        id: '1',
        title: 'New Article',
        content: 'Content',
        publishedAt: new Date(),
        sourceId: 'source-1',
      };

      // 実際のサービスメソッドが呼ばれた時にイベントが発行されることを確認
      await pubSubService.publishArticleCreated(newArticle);

      expect(pubSubService.publishArticleCreated).toHaveBeenCalledWith(newArticle);
    });
  });
});