import { Test, TestingModule } from '@nestjs/testing';
import { SearchService } from './search.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('SearchService - Enhanced Search Features', () => {
  let service: SearchService;
  let prismaService: PrismaService;

  const mockArticles = [
    {
      id: '1',
      title: '新型AIモデルGPT-5のリリース発表',
      content: 'OpenAIは本日、最新のAIモデルGPT-5を発表しました。このモデルは従来のGPT-4と比較して2倍の性能向上を実現しています。',
      publishedAt: new Date('2025-01-15T09:00:00Z'),
      source: { id: 'source-1', name: 'Tech News' },
      tags: [
        { id: 'tag-1', name: 'AI' },
        { id: 'tag-2', name: '機械学習' },
      ],
    },
    {
      id: '2',
      title: '日本のテクノロジー企業が新しいAIチップを開発',
      content: '日本の大手半導体メーカーが、エッジコンピューティング向けの革新的なAIチップを開発したと発表しました。',
      publishedAt: new Date('2025-01-14T10:00:00Z'),
      source: { id: 'source-2', name: '日経テック' },
      tags: [
        { id: 'tag-1', name: 'AI' },
        { id: 'tag-3', name: '半導体' },
      ],
    },
    {
      id: '3',
      title: 'Pythonプログラミング入門ガイド',
      content: 'Pythonは初心者にも優しいプログラミング言語です。本記事では基本的な文法から実践的なコード例まで解説します。',
      publishedAt: new Date('2025-01-13T08:00:00Z'),
      source: { id: 'source-3', name: 'Programming Blog' },
      tags: [
        { id: 'tag-4', name: 'Python' },
        { id: 'tag-5', name: 'プログラミング' },
      ],
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchService,
        {
          provide: PrismaService,
          useValue: {
            article: {
              findMany: jest.fn(),
              count: jest.fn(),
            },
            tag: {
              findMany: jest.fn(),
            },
            searchHistory: {
              create: jest.fn(),
              findMany: jest.fn(),
            },
            $queryRaw: jest.fn(),
            $executeRaw: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<SearchService>(SearchService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Full-text Search with Performance Optimization', () => {
    it('should use full-text search indexes for better performance', async () => {
      const searchQuery = 'AI GPT-5';
      
      // Mock raw query for full-text search
      (prismaService.$queryRaw as jest.Mock).mockResolvedValue(mockArticles.slice(0, 2));
      (prismaService.article.findMany as jest.Mock).mockResolvedValue(mockArticles.slice(0, 2));

      const results = await service.searchArticlesWithFullText({
        query: searchQuery,
        fields: ['title', 'content'],
      });

      expect(prismaService.$queryRaw).toHaveBeenCalledWith(
        expect.anything(),
        expect.stringContaining('AI'),
      );
      expect(results).toHaveLength(2);
      expect(results[0]?.title).toContain('GPT-5');
    });

    it('should support Japanese full-text search with proper tokenization', async () => {
      const searchQuery = '日本 テクノロジー';
      
      (prismaService.$queryRaw as jest.Mock).mockResolvedValue([mockArticles[1]]);
      (prismaService.article.findMany as jest.Mock).mockResolvedValue([mockArticles[1]]);

      const results = await service.searchArticlesWithFullText({
        query: searchQuery,
        fields: ['title', 'content'],
        language: 'japanese',
      });

      expect(prismaService.$queryRaw).toHaveBeenCalled();
      expect(results).toHaveLength(1);
      expect(results[0]?.title).toContain('日本');
    });

    it('should handle search result ranking and relevance scoring', async () => {
      const mockRankedResults = mockArticles.map((article, index) => ({
        ...article,
        relevance_score: 1 - index * 0.3,
      }));

      (prismaService.$queryRaw as jest.Mock).mockResolvedValue(mockRankedResults);
      (prismaService.article.findMany as jest.Mock).mockResolvedValue(mockArticles);

      const results = await service.searchArticlesWithFullText({
        query: 'AI',
        fields: ['title', 'content'],
        includeRelevanceScore: true,
      });

      expect((results[0] as any)?.relevance_score).toBeGreaterThan((results[1] as any)?.relevance_score);
      expect(results).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ relevance_score: expect.any(Number) }),
        ]),
      );
    });
  });

  describe('Regular Expression Search', () => {
    it('should support regex search in article titles', async () => {
      const regexPattern = '^新型.*リリース$';
      
      (prismaService.$queryRaw as jest.Mock).mockResolvedValue([mockArticles[0]]);

      const results = await service.searchWithRegex({
        pattern: regexPattern,
        fields: ['title'],
      });

      expect(results).toHaveLength(1);
      expect((results as any)[0]?.title).toMatch(/新型.*リリース/);
    });

    it('should support case-insensitive regex search', async () => {
      const regexPattern = 'python|PYTHON';
      
      (prismaService.$queryRaw as jest.Mock).mockResolvedValue([mockArticles[2]]);

      const results = await service.searchWithRegex({
        pattern: regexPattern,
        fields: ['title', 'content'],
        flags: 'i',
      });

      expect(results).toHaveLength(1);
      expect((results as any)[0]?.title).toContain('Python');
    });

    it('should validate and sanitize regex patterns', async () => {
      const invalidPattern = '(unclosed';

      await expect(
        service.searchWithRegex({
          pattern: invalidPattern,
          fields: ['title'],
        })
      ).rejects.toThrow('Invalid regular expression');
    });
  });

  describe('Time-based Filtering', () => {
    it('should filter articles by specific time range', async () => {
      const startDate = new Date('2025-01-14T00:00:00Z');
      const endDate = new Date('2025-01-15T23:59:59Z');

      (prismaService.article.findMany as jest.Mock).mockImplementation(() => {
        return Promise.resolve(
          mockArticles.filter(article => 
            article.publishedAt >= startDate && article.publishedAt <= endDate
          )
        );
      });

      const results = await service.searchArticles({
        query: 'AI',
        fields: ['title'],
        filters: {
          publishedAfter: startDate,
          publishedBefore: endDate,
        },
      });

      expect(results).toHaveLength(2);
      expect(results.every(r => r.publishedAt >= startDate)).toBe(true);
      expect(results.every(r => r.publishedAt <= endDate)).toBe(true);
    });

    it('should support relative time filters', async () => {
      const now = new Date('2025-01-15T12:00:00Z');
      jest.useFakeTimers().setSystemTime(now);

      (prismaService.article.findMany as jest.Mock).mockImplementation(() => {
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        return Promise.resolve(
          mockArticles.filter(article => article.publishedAt >= oneDayAgo)
        );
      });

      const results = await service.searchWithRelativeTime({
        query: 'AI',
        fields: ['title'],
        timeFilter: {
          within: '24h',
        },
      });

      expect(results).toHaveLength(1);
      expect(results[0]?.id).toBe('1');

      jest.useRealTimers();
    });

    it('should combine time filters with other search criteria', async () => {
      const sevenDaysAgo = new Date('2025-01-08T00:00:00Z');

      (prismaService.article.findMany as jest.Mock).mockImplementation(() => {
        return Promise.resolve(
          mockArticles.filter(article => 
            article.publishedAt >= sevenDaysAgo &&
            article.tags.some(tag => tag.name === 'AI')
          )
        );
      });

      const results = await service.searchArticles({
        query: 'AI',
        fields: ['tags'],
        filters: {
          publishedAfter: sevenDaysAgo,
        },
      });

      expect(results).toHaveLength(2);
      expect(results.every(r => (r as any).tags.some((t: any) => t.name === 'AI'))).toBe(true);
    });
  });

  describe('Search Performance Optimization', () => {
    it('should create and use search indexes', async () => {
      await service.createSearchIndexes();

      expect(prismaService.$executeRaw).toHaveBeenCalledWith(
        expect.anything()
      );
    });

    it('should cache frequent search queries', async () => {
      const query = 'AI';
      const mockCache = new Map();

      // First search - no cache
      (prismaService.article.findMany as jest.Mock).mockResolvedValue(mockArticles.slice(0, 2));
      
      const results1 = await service.searchWithCache({
        query,
        fields: ['title'],
        cache: mockCache,
      });

      expect(prismaService.article.findMany).toHaveBeenCalledTimes(1);

      // Second search - should use cache
      const results2 = await service.searchWithCache({
        query,
        fields: ['title'],
        cache: mockCache,
      });

      expect(prismaService.article.findMany).toHaveBeenCalledTimes(1); // Still 1
      expect(results2).toEqual(results1);
    });

    it('should optimize large result sets with cursor-based pagination', async () => {
      const largeMockResults = Array.from({ length: 100 }, (_, i) => ({
        ...mockArticles[0],
        id: `article-${i}`,
      }));

      (prismaService.article.findMany as jest.Mock).mockImplementation(({ where, take }) => {
        const startIndex = where?.id?.gt ? parseInt(where.id.gt.split('-')[1]) + 1 : 0;
        return Promise.resolve(largeMockResults.slice(startIndex, startIndex + take));
      });

      const firstPage = await service.searchWithCursor({
        query: 'AI',
        fields: ['title'],
        pageSize: 20,
      });

      expect(firstPage.results).toHaveLength(20);
      expect(firstPage.nextCursor).toBe('article-19');

      const secondPage = await service.searchWithCursor({
        query: 'AI',
        fields: ['title'],
        pageSize: 20,
        cursor: firstPage.nextCursor || undefined,
      });

      expect(secondPage.results).toHaveLength(20);
      expect(secondPage.results[0]?.id).toBe('article-20');
    });
  });
});