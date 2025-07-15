import { Test, TestingModule } from '@nestjs/testing';
import { SearchResolver } from './search.resolver';
import { SearchService } from './search.service';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';

describe('SearchResolver', () => {
  let resolver: SearchResolver;
  let searchService: DeepMockProxy<SearchService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchResolver,
        {
          provide: SearchService,
          useValue: mockDeep<SearchService>(),
        },
      ],
    }).compile();

    resolver = module.get<SearchResolver>(SearchResolver);
    searchService = module.get(SearchService);
  });

  describe('searchArticles', () => {
    it('should search articles with all parameters', async () => {
      const mockArticles = [
        {
          id: '1',
          title: 'Test Article',
          content: 'Test content',
          summary: null,
          aiSummary: 'Test summary',
          createdAt: new Date(),
          updatedAt: new Date(),
          sourceId: 'source1',
          originalUrl: 'https://example.com/1',
          publishedAt: new Date(),
          fetchedAt: new Date(),
          imageUrl: null,
          author: null,
          readCount: 0,
          isArchived: false,
          tags: [{ id: 'tag1', name: 'test', createdAt: new Date() }],
          source: {
            id: 'source1',
            name: 'Test Source',
            url: 'https://example.com',
            feedUrl: null,
            tier: 2,
            category: 'tech',
            language: 'ja',
            isActive: true,
            lastFetchedAt: null,
            lastError: null,
            lastErrorAt: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
      ];

      searchService.searchArticles.mockResolvedValue(mockArticles);

      const input = {
        query: 'test',
        fields: ['title', 'content', 'tags'] as Array<'title' | 'content' | 'tags'>,
        filters: {
          sourceId: 'source1',
          publishedAfter: new Date('2024-01-01'),
          publishedBefore: new Date('2024-12-31'),
        },
        pagination: {
          page: 1,
          limit: 10,
        },
        sortBy: 'publishedAt' as const,
        sortOrder: 'desc' as const,
      };

      const result = await resolver.searchArticles(input);

      expect(result).toEqual(mockArticles);
      expect(searchService.searchArticles).toHaveBeenCalledWith(input);
    });

    it('should search articles with minimal parameters', async () => {
      const mockArticles: any[] = [];
      searchService.searchArticles.mockResolvedValue(mockArticles);

      const input = {
        query: 'test',
        fields: ['title'] as Array<'title' | 'content' | 'tags'>,
      };

      const result = await resolver.searchArticles(input);

      expect(result).toEqual(mockArticles);
      expect(searchService.searchArticles).toHaveBeenCalledWith(input);
    });
  });

  describe('getSearchSuggestions', () => {
    it('should return search suggestions', async () => {
      const mockSuggestions = ['JavaScript', 'Java', 'JavaFX'];
      searchService.getSearchSuggestions.mockResolvedValue(mockSuggestions);

      const result = await resolver.getSearchSuggestions('Java');

      expect(result).toEqual(mockSuggestions);
      expect(searchService.getSearchSuggestions).toHaveBeenCalledWith('Java');
    });
  });

  describe('saveSearchHistory', () => {
    it('should save search history', async () => {
      const userId = 'user1';
      const query = 'React hooks';

      searchService.saveSearchHistory.mockResolvedValue(undefined);

      const result = await resolver.saveSearchHistory({ userId, query });

      expect(result).toBe(true);
      expect(searchService.saveSearchHistory).toHaveBeenCalledWith(userId, query);
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
          updatedAt: new Date('2024-01-10'),
        },
        {
          id: '2',
          userId,
          query: 'Vue',
          createdAt: new Date('2024-01-09'),
          updatedAt: new Date('2024-01-09'),
        },
      ];

      searchService.getSearchHistory.mockResolvedValue(mockHistory);

      const result = await resolver.getSearchHistory(userId);

      expect(result).toEqual(mockHistory);
      expect(searchService.getSearchHistory).toHaveBeenCalledWith(userId);
    });
  });
});