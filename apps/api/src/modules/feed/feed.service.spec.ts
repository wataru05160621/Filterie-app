import { Test, TestingModule } from '@nestjs/testing';
import { FeedService } from './feed.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ArticlesService } from '../articles/articles.service';
import { SourcesService } from '../sources/sources.service';
import { PUB_SUB } from '../pubsub/pubsub.module';
import Parser from 'rss-parser';

// RSS Parser のモック
jest.mock('rss-parser');

describe('FeedService', () => {
  let service: FeedService;
  let prismaService: jest.Mocked<PrismaService>;
  let articlesService: jest.Mocked<ArticlesService>;
  let sourcesService: jest.Mocked<SourcesService>;
  let pubSub: any;
  let mockParser: jest.Mocked<Parser>;

  const mockSource = {
    id: 'source-1',
    name: 'Tech Blog',
    url: 'https://techblog.example.com',
    feedUrl: 'https://techblog.example.com/rss',
    tier: 2,
    category: 'Technology',
    language: 'ja',
    isActive: true,
    lastFetchedAt: null,
    lastError: null,
    lastErrorAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockFeedData = {
    title: 'Tech Blog RSS',
    description: 'Latest tech news',
    link: 'https://techblog.example.com',
    items: [
      {
        title: '新しいプログラミング言語の紹介',
        link: 'https://techblog.example.com/new-language',
        pubDate: 'Mon, 15 Jan 2024 10:00:00 GMT',
        content: '<p>新しいプログラミング言語についての詳細な記事です。</p>',
        contentSnippet: '新しいプログラミング言語についての詳細な記事です。',
        guid: 'https://techblog.example.com/new-language',
        isoDate: '2024-01-15T10:00:00.000Z',
        creator: 'Tech Writer',
        categories: ['Programming', 'Languages'],
      },
      {
        title: 'AI開発の最新トレンド',
        link: 'https://techblog.example.com/ai-trends',
        pubDate: 'Sun, 14 Jan 2024 15:30:00 GMT',
        content: '<p>AI開発における最新のトレンドを解説します。</p>',
        contentSnippet: 'AI開発における最新のトレンドを解説します。',
        guid: 'https://techblog.example.com/ai-trends',
        isoDate: '2024-01-14T15:30:00.000Z',
        creator: 'AI Expert',
        categories: ['AI', 'Machine Learning'],
      },
    ],
  };

  beforeEach(async () => {
    // モックの設定
    mockParser = {
      parseURL: jest.fn().mockResolvedValue(mockFeedData),
    } as any;

    (Parser as jest.MockedClass<typeof Parser>).mockImplementation(() => mockParser);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeedService,
        {
          provide: PrismaService,
          useValue: {
            source: {
              findMany: jest.fn(),
              update: jest.fn(),
            },
          },
        },
        {
          provide: ArticlesService,
          useValue: {
            create: jest.fn(),
            findByOriginalUrl: jest.fn(),
          },
        },
        {
          provide: SourcesService,
          useValue: {
            findById: jest.fn(),
            updateLastFetched: jest.fn(),
            updateLastError: jest.fn(),
          },
        },
        {
          provide: PUB_SUB,
          useValue: {
            publish: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<FeedService>(FeedService);
    prismaService = module.get(PrismaService);
    articlesService = module.get(ArticlesService);
    sourcesService = module.get(SourcesService);
    pubSub = module.get(PUB_SUB);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchAllActiveFeeds', () => {
    it('should fetch feeds from all active sources', async () => {
      // Arrange
      prismaService.source.findMany = jest.fn().mockResolvedValue([mockSource]);
      sourcesService.updateLastFetched = jest.fn().mockResolvedValue(mockSource);
      articlesService.findByOriginalUrl = jest.fn().mockResolvedValue(null);
      articlesService.create = jest.fn().mockImplementation((data) => ({
        id: `article-${Date.now()}`,
        ...data,
      }));

      // Act
      await service.fetchAllActiveFeeds();

      // Assert
      expect(prismaService.source.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
      });
      expect(mockParser.parseURL).toHaveBeenCalledWith(mockSource.feedUrl);
      expect(articlesService.create).toHaveBeenCalledTimes(2);
      expect(sourcesService.updateLastFetched).toHaveBeenCalledWith(mockSource.id);
    });

    it('should skip existing articles', async () => {
      // Arrange
      prismaService.source.findMany = jest.fn().mockResolvedValue([mockSource]);
      sourcesService.updateLastFetched = jest.fn().mockResolvedValue(mockSource);
      articlesService.findByOriginalUrl = jest.fn()
        .mockResolvedValueOnce({ id: 'existing-article' }) // 最初の記事は既存
        .mockResolvedValueOnce(null); // 2番目の記事は新規
      articlesService.create = jest.fn();

      // Act
      await service.fetchAllActiveFeeds();

      // Assert
      expect(articlesService.create).toHaveBeenCalledTimes(1);
      expect(articlesService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'AI開発の最新トレンド',
          originalUrl: 'https://techblog.example.com/ai-trends',
        })
      );
    });

    it('should handle feed fetch errors', async () => {
      // Arrange
      const error = new Error('Feed parsing failed');
      prismaService.source.findMany = jest.fn().mockResolvedValue([mockSource]);
      mockParser.parseURL = jest.fn().mockRejectedValue(error);
      sourcesService.updateLastError = jest.fn();

      // Act
      await service.fetchAllActiveFeeds();

      // Assert
      expect(sourcesService.updateLastError).toHaveBeenCalledWith(
        mockSource.id,
        'Feed parsing failed'
      );
      expect(articlesService.create).not.toHaveBeenCalled();
    });
  });

  describe('fetchSourceFeed', () => {
    it('should fetch and parse a single source feed', async () => {
      // Arrange
      articlesService.findByOriginalUrl = jest.fn().mockResolvedValue(null);
      articlesService.create = jest.fn().mockImplementation((data) => ({
        id: `article-${Date.now()}`,
        ...data,
      }));

      // Act
      const result = await service.fetchSourceFeed(mockSource.id, mockSource.feedUrl);

      // Assert
      expect(result).toEqual({
        sourceId: mockSource.id,
        fetchedCount: 2,
        newCount: 2,
        errors: [],
      });
      expect(mockParser.parseURL).toHaveBeenCalledWith(mockSource.feedUrl);
    });

    it('should emit events for new articles', async () => {
      // Arrange
      articlesService.findByOriginalUrl = jest.fn().mockResolvedValue(null);
      articlesService.create = jest.fn().mockImplementation((data) => ({
        id: `article-${Date.now()}`,
        ...data,
      }));

      // Act
      await service.fetchSourceFeed(mockSource.id, mockSource.feedUrl);

      // Assert
      expect(pubSub.publish).toHaveBeenCalledWith(
        'sourceFeedFetched',
        expect.objectContaining({
          sourceId: mockSource.id,
          articleCount: 2,
        })
      );
    });

    it('should handle invalid feed URLs', async () => {
      // Arrange
      mockParser.parseURL = jest.fn().mockRejectedValue(new Error('Invalid URL'));

      // Act & Assert
      await expect(service.fetchSourceFeed(mockSource.id, 'invalid-url'))
        .rejects.toThrow('Invalid URL');
    });
  });

  describe('subscribToWebSub', () => {
    it('should subscribe to WebSub for a source', async () => {
      // Arrange
      // const hubUrl = 'https://example.com/hub';
      // const callbackUrl = 'https://api.filterie.com/feed/websub/source-1';

      // TODO: WebSub のモックと実装
      // これは後で実装します
      expect(true).toBe(true); // Placeholder test
    });
  });

  describe('handleWebSubNotification', () => {
    it('should process WebSub notifications', async () => {
      // Arrange
      // const notification = {
      //   sourceId: mockSource.id,
      //   items: mockFeedData.items,
      // };

      // TODO: WebSub 通知のハンドリング
      // これは後で実装します
      expect(true).toBe(true); // Placeholder test
    });
  });
});