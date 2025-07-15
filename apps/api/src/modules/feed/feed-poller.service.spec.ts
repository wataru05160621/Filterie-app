import { Test, TestingModule } from '@nestjs/testing';
import { FeedPollerService } from './feed-poller.service';
import { FeedService } from './feed.service';
import { SourcesService } from '../sources/sources.service';
import { ArticlesService } from '../articles/articles.service';
import { PubSubService } from '../pubsub/pubsub.service';
import { SchedulerRegistry } from '@nestjs/schedule';

describe('FeedPollerService', () => {
  let service: FeedPollerService;
  let feedService: FeedService;
  let sourcesService: SourcesService;
  let articlesService: ArticlesService;
  let pubSubService: PubSubService;
  let schedulerRegistry: SchedulerRegistry;

  const mockSource = {
    id: 'source-1',
    name: 'Test Source',
    url: 'https://example.com/feed.xml',
    feedUrl: 'https://example.com/feed.xml',
    tier: 1, // Tier 1
    category: 'NEWS',
    language: 'ja',
    isActive: true,
    lastFetchedAt: new Date('2024-01-01'),
    lastError: null,
    lastErrorAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockArticles = [
    {
      title: 'New Article 1',
      url: 'https://example.com/article1',
      content: 'Content 1',
      publishedAt: new Date(),
      sourceId: 'source-1',
    },
    {
      title: 'New Article 2',
      url: 'https://example.com/article2',
      content: 'Content 2',
      publishedAt: new Date(),
      sourceId: 'source-1',
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeedPollerService,
        {
          provide: FeedService,
          useValue: {
            fetchFeed: jest.fn().mockResolvedValue(mockArticles),
          },
        },
        {
          provide: SourcesService,
          useValue: {
            findAll: jest.fn().mockResolvedValue([mockSource]),
            updateLastFetched: jest.fn().mockResolvedValue(mockSource),
          },
        },
        {
          provide: ArticlesService,
          useValue: {
            findByUrl: jest.fn().mockResolvedValue(null),
            create: jest.fn().mockImplementation((article) => ({
              id: 'article-' + Math.random(),
              ...article,
            })),
          },
        },
        {
          provide: PubSubService,
          useValue: {
            publishArticleCreated: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: SchedulerRegistry,
          useValue: {
            addInterval: jest.fn(),
            deleteInterval: jest.fn(),
            getIntervals: jest.fn().mockReturnValue([]),
          },
        },
      ],
    }).compile();

    service = module.get<FeedPollerService>(FeedPollerService);
    feedService = module.get<FeedService>(FeedService);
    sourcesService = module.get<SourcesService>(SourcesService);
    articlesService = module.get<ArticlesService>(ArticlesService);
    pubSubService = module.get<PubSubService>(PubSubService);
    schedulerRegistry = module.get<SchedulerRegistry>(SchedulerRegistry);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('pollSource', () => {
    it('should fetch and save new articles from a source', async () => {
      await service.pollSource(mockSource);

      expect(feedService.fetchFeed).toHaveBeenCalledWith(mockSource.feedUrl);
      expect(articlesService.findByUrl).toHaveBeenCalledTimes(2);
      expect(articlesService.create).toHaveBeenCalledTimes(2);
      expect(pubSubService.publishArticleCreated).toHaveBeenCalledTimes(2);
      expect(sourcesService.updateLastFetched).toHaveBeenCalledWith(mockSource.id);
    });

    it('should skip existing articles', async () => {
      // 1つ目の記事は既に存在すると仮定
      (articlesService.findByUrl as jest.Mock)
        .mockResolvedValueOnce({ id: 'existing-article' })
        .mockResolvedValueOnce(null);

      await service.pollSource(mockSource);

      expect(articlesService.create).toHaveBeenCalledTimes(1); // 2つ目の記事のみ作成
      expect(pubSubService.publishArticleCreated).toHaveBeenCalledTimes(1);
    });

    it('should handle feed parsing errors gracefully', async () => {
      (feedService.fetchFeed as jest.Mock).mockRejectedValue(new Error('Parse error'));

      await expect(service.pollSource(mockSource)).rejects.toThrow('Parse error');
      expect(articlesService.create).not.toHaveBeenCalled();
      expect(pubSubService.publishArticleCreated).not.toHaveBeenCalled();
    });
  });

  describe('startPolling', () => {
    it('should start polling for all active sources', async () => {
      await service.startPolling();

      expect(sourcesService.findAll).toHaveBeenCalledWith({ isActive: true });
      expect(schedulerRegistry.addInterval).toHaveBeenCalledTimes(1);
    });

    it('should set different intervals based on source tier', async () => {
      const tier2Source = { ...mockSource, id: 'source-2', tier: 2 };
      const tier3Source = { ...mockSource, id: 'source-3', tier: 3 };
      
      (sourcesService.findAll as jest.Mock).mockResolvedValue([mockSource, tier2Source, tier3Source]);

      await service.startPolling();

      expect(schedulerRegistry.addInterval).toHaveBeenCalledTimes(3);
      
      // 各Tierの間隔を確認
      const calls = (schedulerRegistry.addInterval as jest.Mock).mock.calls;
      expect(calls[0][0]).toBe(`poll-${mockSource.id}`); // Tier 1: 5分
      expect(calls[1][0]).toBe(`poll-${tier2Source.id}`); // Tier 2: 10分
      expect(calls[2][0]).toBe(`poll-${tier3Source.id}`); // Tier 3: 30分
    });
  });

  describe('stopPolling', () => {
    it('should stop all polling intervals', () => {
      (schedulerRegistry.getIntervals as jest.Mock).mockReturnValue([
        'poll-source-1',
        'poll-source-2',
      ]);

      service.stopPolling();

      expect(schedulerRegistry.deleteInterval).toHaveBeenCalledWith('poll-source-1');
      expect(schedulerRegistry.deleteInterval).toHaveBeenCalledWith('poll-source-2');
    });
  });

  describe('getPollingInterval', () => {
    it('should return correct interval for each tier', () => {
      expect(service.getPollingInterval(1)).toBe(5 * 60 * 1000); // 5分
      expect(service.getPollingInterval(2)).toBe(10 * 60 * 1000); // 10分
      expect(service.getPollingInterval(3)).toBe(30 * 60 * 1000); // 30分
      expect(service.getPollingInterval(4)).toBe(60 * 60 * 1000); // 60分
    });
  });
});