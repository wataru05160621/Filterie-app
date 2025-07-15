import { Test, TestingModule } from '@nestjs/testing';
import { FeedService } from './feed.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ArticlesService } from '../articles/articles.service';
import { SourcesService } from '../sources/sources.service';
import { PUB_SUB } from '../pubsub/pubsub.module';

describe('FeedService - Enhanced RSS/Atom Feed Processing', () => {
  let service: FeedService;
  let articlesService: ArticlesService;

  beforeEach(async () => {
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
            findByOriginalUrl: jest.fn().mockResolvedValue(null),
            findByUrl: jest.fn().mockResolvedValue(null),
            create: jest.fn().mockImplementation((data) => ({ id: 'new-article', ...data })),
          },
        },
        {
          provide: SourcesService,
          useValue: {
            findOne: jest.fn(),
            updateLastFetched: jest.fn(),
            updateLastError: jest.fn(),
          },
        },
        {
          provide: PUB_SUB,
          useValue: {
            publish: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get<FeedService>(FeedService);
    articlesService = module.get<ArticlesService>(ArticlesService);

    // Mock RSS Parser
    jest.spyOn(service['parser'], 'parseURL').mockImplementation((url) => {
      if (url.includes('rss')) {
        return Promise.resolve({
          items: [{
            title: '新サービスリリースのお知らせ',
            link: 'https://corp.example.com/news/001',
            contentSnippet: '革新的なAIサービスをリリースしました。',
            isoDate: '2025-01-15T09:00:00.000Z',
            categories: ['プレスリリース', 'AI'],
            enclosure: { url: 'https://corp.example.com/images/001.jpg', type: 'image/jpeg' },
          }],
          title: '企業プレスリリース',
        });
      } else if (url.includes('atom')) {
        return Promise.resolve({
          items: [{
            title: '機械学習の最新トレンド',
            link: 'https://tech.example.com/posts/ml-trends',
            content: '<p>詳細な内容...</p>',
            contentSnippet: '2025年の機械学習トレンドを解説',
            isoDate: '2025-01-15T09:00:00.000Z',
            creator: '山田太郎',
            categories: ['機械学習', 'AI'],
          }],
          title: '技術ブログ',
        });
      }
      throw new Error('Invalid feed URL');
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Feed Format Detection and Parsing', () => {
    it('should correctly parse RSS 2.0 feeds', async () => {
      const sourceId = 'source-rss';
      const feedUrl = 'https://corp.example.com/rss';

      const result = await service.fetchSourceFeed(sourceId, feedUrl);

      expect(result.fetchedCount).toBe(1);
      expect(result.newCount).toBe(1);
      expect(articlesService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          sourceId,
          title: '新サービスリリースのお知らせ',
          originalUrl: 'https://corp.example.com/news/001',
          tagNames: ['プレスリリース', 'AI'],
          imageUrl: 'https://corp.example.com/images/001.jpg',
        })
      );
    });

    it('should correctly parse Atom feeds', async () => {
      const sourceId = 'source-atom';
      const feedUrl = 'https://tech.example.com/atom';

      const result = await service.fetchSourceFeed(sourceId, feedUrl);

      expect(result.fetchedCount).toBe(1);
      expect(result.newCount).toBe(1);
      expect(articlesService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          sourceId,
          title: '機械学習の最新トレンド',
          originalUrl: 'https://tech.example.com/posts/ml-trends',
          author: '山田太郎',
          tagNames: ['機械学習', 'AI'],
        })
      );
    });
  });

  describe('Content Extraction', () => {
    it('should extract summary from content when contentSnippet is missing', async () => {
      jest.spyOn(service['parser'], 'parseURL').mockResolvedValueOnce({
        items: [{
          title: 'Test Article',
          link: 'https://example.com/test',
          content: '<p>これは長い記事の内容です。HTMLタグを含んでいます。</p><p>複数の段落があります。</p>',
          isoDate: '2025-01-15T09:00:00.000Z',
        }],
        title: 'Test Feed',
      } as any);

      await service.fetchSourceFeed('source-1', 'https://example.com/feed');

      expect(articlesService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          summary: expect.stringContaining('これは長い記事の内容です'),
        })
      );
    });

    it('should handle Japanese text properly in summary extraction', async () => {
      const longJapaneseText = '日本のテクノロジー業界は急速に発展しています。特にAI分野では、多くの企業が革新的なソリューションを開発しています。この記事では、最新のトレンドと今後の展望について詳しく解説します。また、国際的な競争力を高めるための戦略についても触れています。';
      
      jest.spyOn(service['parser'], 'parseURL').mockResolvedValueOnce({
        items: [{
          title: 'Test Article',
          link: 'https://example.com/test',
          content: `<p>${longJapaneseText}</p>`,
          isoDate: '2025-01-15T09:00:00.000Z',
        }],
        title: 'Test Feed',
      } as any);

      await service.fetchSourceFeed('source-1', 'https://example.com/feed');

      expect(articlesService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          summary: expect.stringMatching(/^日本のテクノロジー業界.*。$/),
        })
      );
    });
  });

  describe('Image Extraction', () => {
    it('should extract images from various feed formats', async () => {
      const testCases = [
        {
          name: 'enclosure tag',
          item: {
            title: 'Test',
            link: 'https://example.com/1',
            enclosure: { url: 'https://example.com/image1.jpg', type: 'image/jpeg' },
          },
          expectedImage: 'https://example.com/image1.jpg',
        },
        {
          name: 'media:content',
          item: {
            title: 'Test',
            link: 'https://example.com/2',
            mediaContent: { $: { url: 'https://example.com/image2.jpg' } },
          },
          expectedImage: 'https://example.com/image2.jpg',
        },
        {
          name: 'content img tag',
          item: {
            title: 'Test',
            link: 'https://example.com/3',
            content: '<p>Text <img src="https://example.com/image3.jpg" alt="test"> more text</p>',
          },
          expectedImage: 'https://example.com/image3.jpg',
        },
      ];

      for (const testCase of testCases) {
        jest.clearAllMocks();
        jest.spyOn(service['parser'], 'parseURL').mockResolvedValueOnce({
          items: [testCase.item],
          title: 'Test Feed',
        } as any);

        await service.fetchSourceFeed('source-1', 'https://example.com/feed');

        expect(articlesService.create).toHaveBeenCalledWith(
          expect.objectContaining({
            imageUrl: testCase.expectedImage,
          })
        );
      }
    });
  });

  describe('Error Handling and Resilience', () => {
    it('should continue processing when individual articles fail', async () => {
      jest.spyOn(service['parser'], 'parseURL').mockResolvedValueOnce({
        items: [
          { title: 'Article 1', link: 'https://example.com/1' },
          { title: 'Article 2' }, // Missing link
          { title: 'Article 3', link: 'https://example.com/3' },
        ],
        title: 'Test Feed',
      } as any);

      const result = await service.fetchSourceFeed('source-1', 'https://example.com/feed');

      expect(result.fetchedCount).toBe(3);
      expect(result.newCount).toBe(2); // Only 2 articles with valid links
      expect(result.errors).toHaveLength(1);
      expect(articlesService.create).toHaveBeenCalledTimes(2);
    });

    it('should handle malformed XML gracefully', async () => {
      jest.spyOn(service['parser'], 'parseURL').mockRejectedValueOnce(new Error('Invalid XML'));

      await expect(service.fetchSourceFeed('source-1', 'https://example.com/bad-feed'))
        .rejects.toThrow('Invalid XML');
    });
  });

  describe('Performance and Optimization', () => {
    it('should batch process large feeds efficiently', async () => {
      const largeItems = Array.from({ length: 100 }, (_, i) => ({
        title: `Article ${i}`,
        link: `https://example.com/article-${i}`,
        isoDate: new Date().toISOString(),
      }));

      jest.spyOn(service['parser'], 'parseURL').mockResolvedValueOnce({
        items: largeItems,
        title: 'Large Feed',
      } as any);

      const startTime = Date.now();
      const result = await service.fetchSourceFeed('source-1', 'https://example.com/large-feed');
      const duration = Date.now() - startTime;

      expect(result.fetchedCount).toBe(100);
      expect(result.newCount).toBe(100);
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should skip already processed articles efficiently', async () => {
      // First 50 articles already exist
      (articlesService.findByOriginalUrl as jest.Mock).mockImplementation((url) => {
        const match = url.match(/article-(\d+)$/);
        const num = match ? parseInt(match[1]) : 0;
        return num < 50 ? { id: `existing-${num}` } : null;
      });

      const items = Array.from({ length: 100 }, (_, i) => ({
        title: `Article ${i}`,
        link: `https://example.com/article-${i}`,
        isoDate: new Date().toISOString(),
      }));

      jest.spyOn(service['parser'], 'parseURL').mockResolvedValueOnce({
        items,
        title: 'Mixed Feed',
      } as any);

      const result = await service.fetchSourceFeed('source-1', 'https://example.com/mixed-feed');

      expect(result.fetchedCount).toBe(100);
      expect(result.newCount).toBe(50); // Only new articles
      expect(articlesService.create).toHaveBeenCalledTimes(50);
    });
  });
});