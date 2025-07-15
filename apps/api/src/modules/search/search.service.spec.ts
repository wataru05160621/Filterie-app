import { Test, TestingModule } from '@nestjs/testing';
import { SearchService } from './search.service';
import { PrismaService } from '../../prisma/prisma.service';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';

describe('SearchService', () => {
  let service: SearchService;
  let prisma: DeepMockProxy<PrismaService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchService,
        {
          provide: PrismaService,
          useValue: mockDeep<PrismaService>(),
        },
      ],
    }).compile();

    service = module.get<SearchService>(SearchService);
    prisma = module.get(PrismaService);
  });

  describe('searchArticles', () => {
    it('should search articles by title', async () => {
      const mockArticles = [
        {
          id: '1',
          title: 'Next.js 15の新機能',
          content: 'Next.js 15がリリースされました',
          summary: null,
          aiSummary: '新機能の要約',
          createdAt: new Date(),
          updatedAt: new Date(),
          sourceId: 'source1',
          author: 'author1',
          publishedAt: new Date(),
          fetchedAt: new Date(),
          originalUrl: 'https://example.com/1',
          imageUrl: null,
          readCount: 0,
          isArchived: false,
          tags: [],
        },
      ];

      prisma.article.findMany.mockResolvedValue(mockArticles);

      const result = await service.searchArticles({
        query: 'Next.js',
        fields: ['title'],
      });

      expect(result).toEqual(mockArticles);
      expect(prisma.article.findMany).toHaveBeenCalledWith({
        where: {
          title: {
            contains: 'Next.js',
            mode: 'insensitive',
          },
        },
        include: {
          tags: true,
          source: true,
        },
        orderBy: {
          publishedAt: 'desc',
        },
      });
    });

    it('should search articles by content', async () => {
      const mockArticles = [
        {
          id: '2',
          title: 'React 19の発表',
          content: 'React 19の新しいフックが導入されました',
          summary: null,
          aiSummary: 'React 19の要約',
          createdAt: new Date(),
          updatedAt: new Date(),
          sourceId: 'source2',
          author: 'author2',
          publishedAt: new Date(),
          fetchedAt: new Date(),
          originalUrl: 'https://example.com/2',
          imageUrl: null,
          readCount: 0,
          isArchived: false,
          tags: [],
        },
      ];

      prisma.article.findMany.mockResolvedValue(mockArticles);

      const result = await service.searchArticles({
        query: 'フック',
        fields: ['content'],
      });

      expect(result).toEqual(mockArticles);
      expect(prisma.article.findMany).toHaveBeenCalledWith({
        where: {
          content: {
            contains: 'フック',
            mode: 'insensitive',
          },
        },
        include: {
          tags: true,
          source: true,
        },
        orderBy: {
          publishedAt: 'desc',
        },
      });
    });

    it('should search articles by tags', async () => {
      const mockArticles = [
        {
          id: '3',
          title: 'TypeScriptの型システム',
          content: 'TypeScriptの高度な型システムについて',
          summary: null,
          aiSummary: 'TypeScriptの要約',
          createdAt: new Date(),
          updatedAt: new Date(),
          sourceId: 'source3',
          author: 'author3',
          publishedAt: new Date(),
          fetchedAt: new Date(),
          originalUrl: 'https://example.com/3',
          imageUrl: null,
          readCount: 0,
          isArchived: false,
          tags: [
            {
              id: 'tag1',
              name: 'TypeScript',
              createdAt: new Date(),
            },
          ],
        },
      ];

      prisma.article.findMany.mockResolvedValue(mockArticles);

      const result = await service.searchArticles({
        query: 'TypeScript',
        fields: ['tags'],
      });

      expect(result).toEqual(mockArticles);
      expect(prisma.article.findMany).toHaveBeenCalledWith({
        where: {
          tags: {
            some: {
              name: {
                contains: 'TypeScript',
                mode: 'insensitive',
              },
            },
          },
        },
        include: {
          tags: true,
          source: true,
        },
        orderBy: {
          publishedAt: 'desc',
        },
      });
    });

    it('should search articles across multiple fields', async () => {
      const mockArticles = [
        {
          id: '4',
          title: 'Vue.js 3の最新情報',
          content: 'Vue.js 3のComposition APIについて',
          summary: null,
          aiSummary: 'Vue.js 3の要約',
          createdAt: new Date(),
          updatedAt: new Date(),
          sourceId: 'source4',
          author: 'author4',
          publishedAt: new Date(),
          fetchedAt: new Date(),
          originalUrl: 'https://example.com/4',
          imageUrl: null,
          readCount: 0,
          isArchived: false,
          tags: [
            {
              id: 'tag2',
              name: 'Vue.js',
              createdAt: new Date(),
            },
          ],
        },
      ];

      prisma.article.findMany.mockResolvedValue(mockArticles);

      const result = await service.searchArticles({
        query: 'Vue',
        fields: ['title', 'content', 'tags'],
      });

      expect(result).toEqual(mockArticles);
      expect(prisma.article.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            {
              title: {
                contains: 'Vue',
                mode: 'insensitive',
              },
            },
            {
              content: {
                contains: 'Vue',
                mode: 'insensitive',
              },
            },
            {
              tags: {
                some: {
                  name: {
                    contains: 'Vue',
                    mode: 'insensitive',
                  },
                },
              },
            },
          ],
        },
        include: {
          tags: true,
          source: true,
        },
        orderBy: {
          publishedAt: 'desc',
        },
      });
    });

    it('should apply filters to search results', async () => {
      const mockArticles = [
        {
          id: '5',
          title: 'AI技術の最前線',
          content: 'AIとMLの違いについて',
          summary: null,
          aiSummary: 'AI技術の要約',
          createdAt: new Date(),
          updatedAt: new Date(),
          sourceId: 'source5',
          author: 'author5',
          publishedAt: new Date('2024-01-15'),
          fetchedAt: new Date(),
          originalUrl: 'https://example.com/5',
          imageUrl: null,
          readCount: 100,
          isArchived: false,
          tags: [],
        },
      ];

      prisma.article.findMany.mockResolvedValue(mockArticles);

      const result = await service.searchArticles({
        query: 'AI',
        fields: ['title', 'content'],
        filters: {
          sourceId: 'source5',
          publishedAfter: new Date('2024-01-01'),
          publishedBefore: new Date('2024-12-31'),
        },
      });

      expect(result).toEqual(mockArticles);
      expect(prisma.article.findMany).toHaveBeenCalledWith({
        where: {
          AND: [
            {
              OR: [
                {
                  title: {
                    contains: 'AI',
                    mode: 'insensitive',
                  },
                },
                {
                  content: {
                    contains: 'AI',
                    mode: 'insensitive',
                  },
                },
              ],
            },
            {
              sourceId: 'source5',
              publishedAt: {
                gte: new Date('2024-01-01'),
                lte: new Date('2024-12-31'),
              },
            },
          ],
        },
        include: {
          tags: true,
          source: true,
        },
        orderBy: {
          publishedAt: 'desc',
        },
      });
    });

    it('should paginate search results', async () => {
      const mockArticles = Array(5).fill(null).map((_, i) => ({
        id: `${i + 1}`,
        title: `記事 ${i + 1}`,
        content: `内容 ${i + 1}`,
        summary: null,
        aiSummary: `要約 ${i + 1}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        sourceId: 'source1',
        author: `author${i + 1}`,
        publishedAt: new Date(),
        fetchedAt: new Date(),
        originalUrl: `https://example.com/${i + 1}`,
        imageUrl: null,
        readCount: 0,
        isArchived: false,
        tags: [],
      }));

      prisma.article.findMany.mockResolvedValue(mockArticles);

      const result = await service.searchArticles({
        query: '記事',
        fields: ['title'],
        pagination: {
          page: 2,
          limit: 5,
        },
      });

      expect(result).toEqual(mockArticles);
      expect(prisma.article.findMany).toHaveBeenCalledWith({
        where: {
          title: {
            contains: '記事',
            mode: 'insensitive',
          },
        },
        include: {
          tags: true,
          source: true,
        },
        orderBy: {
          publishedAt: 'desc',
        },
        skip: 5,
        take: 5,
      });
    });

    it('should sort search results', async () => {
      const mockArticles = [
        {
          id: '6',
          title: 'Popular Article',
          content: 'This is a popular article',
          summary: null,
          aiSummary: 'Popular summary',
          createdAt: new Date(),
          updatedAt: new Date(),
          sourceId: 'source6',
          author: 'author6',
          publishedAt: new Date(),
          fetchedAt: new Date(),
          originalUrl: 'https://example.com/6',
          imageUrl: null,
          readCount: 1000,
          isArchived: false,
          tags: [],
        },
      ];

      prisma.article.findMany.mockResolvedValue(mockArticles);

      const result = await service.searchArticles({
        query: 'popular',
        fields: ['title'],
        sortBy: 'readCount',
        sortOrder: 'desc',
      });

      expect(result).toEqual(mockArticles);
      expect(prisma.article.findMany).toHaveBeenCalledWith({
        where: {
          title: {
            contains: 'popular',
            mode: 'insensitive',
          },
        },
        include: {
          tags: true,
          source: true,
        },
        orderBy: {
          readCount: 'desc',
        },
      });
    });
  });

  describe('getSearchSuggestions', () => {
    it('should return search suggestions based on query', async () => {
      const mockSuggestions = [
        'JavaScript',
        'Java',
        'JavaFX',
      ];

      prisma.tag.findMany.mockResolvedValue([
        { id: '1', name: 'JavaScript', createdAt: new Date() },
        { id: '2', name: 'Java', createdAt: new Date() },
        { id: '3', name: 'JavaFX', createdAt: new Date() },
      ]);

      const result = await service.getSearchSuggestions('Java');

      expect(result).toEqual(mockSuggestions);
      expect(prisma.tag.findMany).toHaveBeenCalledWith({
        where: {
          name: {
            startsWith: 'Java',
            mode: 'insensitive',
          },
        },
        take: 10,
        orderBy: {
          name: 'asc',
        },
      });
    });
  });

  describe('saveSearchHistory', () => {
    it('should save search history for user', async () => {
      const userId = 'user1';
      const query = 'React hooks';

      prisma.searchHistory.create.mockResolvedValue({
        id: '1',
        userId,
        query,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await service.saveSearchHistory(userId, query);

      expect(prisma.searchHistory.create).toHaveBeenCalledWith({
        data: {
          userId,
          query,
        },
      });
    });
  });

  describe('getSearchHistory', () => {
    it('should return user search history', async () => {
      const userId = 'user1';
      const mockHistory = [
        {
          id: '1',
          userId,
          query: 'React',
          createdAt: new Date('2024-01-10'),
          updatedAt: new Date(),
        },
        {
          id: '2',
          userId,
          query: 'Vue',
          createdAt: new Date('2024-01-09'),
          updatedAt: new Date(),
        },
      ];

      prisma.searchHistory.findMany.mockResolvedValue(mockHistory);

      const result = await service.getSearchHistory(userId);

      expect(result).toEqual(mockHistory);
      expect(prisma.searchHistory.findMany).toHaveBeenCalledWith({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });
    });
  });
});