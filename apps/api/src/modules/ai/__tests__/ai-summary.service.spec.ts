import { Test, TestingModule } from '@nestjs/testing';
import { AiSummaryService } from '../ai-summary.service';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service';
import { ArticlesService } from '../../articles/articles.service';

// OpenAI モジュールのモック
const mockCreate = jest.fn();
jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: mockCreate,
      },
    },
  }));
});

describe('AiSummaryService', () => {
  let service: AiSummaryService;
  let prismaService: jest.Mocked<PrismaService>;
  let articlesService: jest.Mocked<ArticlesService>;

  const mockArticle: any = {
    id: 'article-1',
    title: '新しいAI技術が医療分野に革命をもたらす',
    content: `
      人工知能（AI）技術の急速な発展により、医療分野において画期的な変革が起きています。
      特に画像診断の分野では、AIが医師の診断精度を大幅に向上させており、
      早期発見が困難だった疾患の検出率が飛躍的に改善されています。
      
      また、創薬の分野でも、AIを活用した新薬開発のスピードが従来の10分の1に短縮され、
      これまで治療が困難だった希少疾患に対する新たな治療薬の開発が進んでいます。
      
      専門家は、今後5年以内にAIを活用した個別化医療が一般的になり、
      患者一人ひとりに最適化された治療計画が提供されるようになると予測しています。
    `,
    originalUrl: 'https://example.com/ai-medical-revolution',
    publishedAt: new Date('2024-01-15'),
    sourceId: 'source-1',
    source: {
      id: 'source-1',
      name: 'Tech News',
      tier: 2,
    },
    tags: [],
    aiSummary: null,
    summary: null,
  };

  beforeEach(async () => {
    // モックをリセット
    mockCreate.mockClear();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiSummaryService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('test-api-key'),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            article: {
              update: jest.fn(),
            },
          },
        },
        {
          provide: ArticlesService,
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AiSummaryService>(AiSummaryService);
    prismaService = module.get(PrismaService);
    articlesService = module.get(ArticlesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateSummary', () => {
    it('should generate AI summary for an article', async () => {
      // Arrange
      const expectedSummary = 'AI技術が医療分野で革命的な進歩をもたらし、画像診断の精度向上と創薬の高速化を実現。5年以内に個別化医療が一般化する見込み。';
      
      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: expectedSummary,
            },
          },
        ],
      });

      articlesService.findOne.mockResolvedValue(mockArticle);
      (prismaService.article.update as jest.Mock).mockResolvedValue({
        ...mockArticle,
        aiSummary: expectedSummary,
      });

      // Act
      const result = await service.generateSummary('article-1');

      // Assert
      expect(articlesService.findOne).toHaveBeenCalledWith('article-1');
      expect(mockCreate).toHaveBeenCalledWith({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: expect.stringContaining('日本語で簡潔な要約'),
          },
          {
            role: 'user',
            content: expect.stringContaining(mockArticle.title),
          },
        ],
        max_tokens: 200,
        temperature: 0.3,
      });
      expect(prismaService.article.update).toHaveBeenCalledWith({
        where: { id: 'article-1' },
        data: { aiSummary: expectedSummary },
      });
      expect(result.aiSummary).toBe(expectedSummary);
    });

    it('should use existing AI summary if available', async () => {
      // Arrange
      const articleWithSummary = {
        ...mockArticle,
        aiSummary: '既存のAI要約',
      };
      articlesService.findOne.mockResolvedValue(articleWithSummary);

      // Act
      const result = await service.generateSummary('article-1');

      // Assert
      expect(mockCreate).not.toHaveBeenCalled();
      expect(prismaService.article.update).not.toHaveBeenCalled();
      expect(result.aiSummary).toBe('既存のAI要約');
    });

    it('should handle OpenAI API errors gracefully', async () => {
      // Arrange
      articlesService.findOne.mockResolvedValue(mockArticle);
      mockCreate.mockRejectedValue(
        new Error('OpenAI API error')
      );

      // Act & Assert
      await expect(service.generateSummary('article-1')).rejects.toThrow(
        'Failed to generate AI summary'
      );
      expect(prismaService.article.update).not.toHaveBeenCalled();
    });

    it('should handle articles without content', async () => {
      // Arrange
      const articleWithoutContent = {
        ...mockArticle,
        content: null,
      };
      articlesService.findOne.mockResolvedValue(articleWithoutContent);

      const expectedSummary = 'タイトルのみから生成された要約';
      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: expectedSummary,
            },
          },
        ],
      });

      (prismaService.article.update as jest.Mock).mockResolvedValue({
        ...articleWithoutContent,
        aiSummary: expectedSummary,
      });

      // Act
      const result = await service.generateSummary('article-1');

      // Assert
      expect(mockCreate).toHaveBeenCalledWith({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: expect.stringContaining('日本語で簡潔な要約'),
          },
          {
            role: 'user',
            content: expect.stringContaining('タイトル:'),
          },
        ],
        max_tokens: 200,
        temperature: 0.3,
      });
      expect(result.aiSummary).toBe(expectedSummary);
    });
  });

  describe('generateBulkSummaries', () => {
    it('should generate summaries for multiple articles', async () => {
      // Arrange
      const articleIds = ['article-1', 'article-2', 'article-3'];
      const mockArticles = articleIds.map((id, index) => ({
        ...mockArticle,
        id,
        title: `記事${index + 1}`,
      }));

      articlesService.findOne
        .mockResolvedValueOnce(mockArticles[0])
        .mockResolvedValueOnce(mockArticles[1])
        .mockResolvedValueOnce(mockArticles[2]);

      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: '要約テキスト',
            },
          },
        ],
      });

      (prismaService.article.update as jest.Mock).mockResolvedValue({
        ...mockArticle,
        aiSummary: '要約テキスト',
      });

      // Act
      const results = await service.generateBulkSummaries(articleIds);

      // Assert
      expect(results.successful).toBe(3);
      expect(results.failed).toBe(0);
      expect(results.total).toBe(3);
      expect(articlesService.findOne).toHaveBeenCalledTimes(3);
      expect(mockCreate).toHaveBeenCalledTimes(3);
    });

    it('should handle partial failures in bulk generation', async () => {
      // Arrange
      const articleIds = ['article-1', 'article-2'];

      articlesService.findOne
        .mockResolvedValueOnce(mockArticle)
        .mockResolvedValueOnce({ ...mockArticle, id: 'article-2' });

      mockCreate
        .mockResolvedValueOnce({
          choices: [{ message: { content: '要約1' } }],
        })
        .mockRejectedValueOnce(new Error('API error'));

      (prismaService.article.update as jest.Mock).mockResolvedValueOnce({
        ...mockArticle,
        aiSummary: '要約1',
      });

      // Act
      const results = await service.generateBulkSummaries(articleIds);

      // Assert
      expect(results.successful).toBe(1);
      expect(results.failed).toBe(1);
      expect(results.total).toBe(2);
      expect(results.errors).toHaveLength(1);
      expect(results.errors[0]).toContain('article-2');
    });
  });

  describe('generateTagSuggestions', () => {
    it('should generate tag suggestions for an article', async () => {
      // Arrange
      const expectedTags = ['AI', '医療', '画像診断', '創薬', '個別化医療'];
      
      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify(expectedTags),
            },
          },
        ],
      });

      articlesService.findOne.mockResolvedValue(mockArticle);

      // Act
      const result = await service.generateTagSuggestions('article-1');

      // Assert
      expect(mockCreate).toHaveBeenCalledWith({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: expect.stringContaining('タグを生成'),
          },
          {
            role: 'user',
            content: expect.stringContaining(mockArticle.title),
          },
        ],
        max_tokens: 100,
        temperature: 0.5,
      });
      expect(result).toEqual(expectedTags);
    });

    it('should handle invalid JSON response from OpenAI', async () => {
      // Arrange
      articlesService.findOne.mockResolvedValue(mockArticle);
      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: 'invalid json',
            },
          },
        ],
      });

      // Act
      const result = await service.generateTagSuggestions('article-1');

      // Assert
      expect(result).toEqual([]);
    });
  });
});