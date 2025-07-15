import { Test, TestingModule } from '@nestjs/testing';
import { AiResolver } from '../ai.resolver';
import { AiSummaryService } from '../ai-summary.service';

describe('AiResolver', () => {
  let resolver: AiResolver;
  let aiSummaryService: jest.Mocked<AiSummaryService>;

  const mockArticle = {
    id: 'article-1',
    title: 'Test Article',
    content: 'Test content',
    aiSummary: 'AI generated summary',
    originalUrl: 'https://example.com/article',
    publishedAt: new Date('2024-01-15'),
    sourceId: 'source-1',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiResolver,
        {
          provide: AiSummaryService,
          useValue: {
            generateSummary: jest.fn(),
            generateBulkSummaries: jest.fn(),
            generateTagSuggestions: jest.fn(),
          },
        },
      ],
    }).compile();

    resolver = module.get<AiResolver>(AiResolver);
    aiSummaryService = module.get(AiSummaryService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateAiSummary', () => {
    it('should generate AI summary for an article', async () => {
      // Arrange
      aiSummaryService.generateSummary.mockResolvedValue(mockArticle as any);

      // Act
      const result = await resolver.generateAiSummary('article-1');

      // Assert
      expect(aiSummaryService.generateSummary).toHaveBeenCalledWith('article-1');
      expect(result).toEqual(mockArticle);
    });

    it('should throw error if service fails', async () => {
      // Arrange
      aiSummaryService.generateSummary.mockRejectedValue(
        new Error('Failed to generate summary')
      );

      // Act & Assert
      await expect(resolver.generateAiSummary('article-1')).rejects.toThrow(
        'Failed to generate summary'
      );
    });
  });

  describe('generateBulkSummaries', () => {
    it('should generate summaries for multiple articles', async () => {
      // Arrange
      const articleIds = ['article-1', 'article-2', 'article-3'];
      const expectedResult = {
        successful: 3,
        failed: 0,
        total: 3,
        errors: [],
      };
      aiSummaryService.generateBulkSummaries.mockResolvedValue(expectedResult);

      // Act
      const result = await resolver.generateBulkSummaries(articleIds);

      // Assert
      expect(aiSummaryService.generateBulkSummaries).toHaveBeenCalledWith(articleIds);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('generateTagSuggestions', () => {
    it('should generate tag suggestions for an article', async () => {
      // Arrange
      const expectedTags = ['AI', '医療', 'テクノロジー'];
      aiSummaryService.generateTagSuggestions.mockResolvedValue(expectedTags);

      // Act
      const result = await resolver.generateTagSuggestions('article-1');

      // Assert
      expect(aiSummaryService.generateTagSuggestions).toHaveBeenCalledWith('article-1');
      expect(result).toEqual(expectedTags);
    });
  });
});