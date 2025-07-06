import { Test, TestingModule } from '@nestjs/testing';
import { ArticlesService } from './articles.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateArticleInput } from './dto/create-article.input';
import { NotFoundException } from '@nestjs/common';

describe('ArticlesService', () => {
  let service: ArticlesService;

  const mockArticle = {
    id: 'article-id',
    sourceId: 'source-id',
    originalUrl: 'https://example.com/article',
    title: 'Test Article',
    content: 'Article content',
    summary: 'Article summary',
    aiSummary: null,
    publishedAt: new Date('2024-01-20'),
    fetchedAt: new Date('2024-01-20'),
    imageUrl: 'https://example.com/image.jpg',
    author: 'Test Author',
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-20'),
    source: {
      id: 'source-id',
      name: 'Test Source',
      tier: 2,
    },
    tags: [
      { id: 'tag1', name: 'tech' },
      { id: 'tag2', name: 'news' },
    ],
  };

  const mockPrismaService = {
    article: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    tag: {
      upsert: jest.fn(),
    },
    readArticle: {
      upsert: jest.fn(),
    },
    bookmark: {
      upsert: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ArticlesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ArticlesService>(ArticlesService);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new article with tags', async () => {
      const createArticleInput: CreateArticleInput = {
        sourceId: 'source-id',
        originalUrl: 'https://example.com/article',
        title: 'Test Article',
        content: 'Article content',
        summary: 'Article summary',
        publishedAt: '2024-01-20T00:00:00Z',
        imageUrl: 'https://example.com/image.jpg',
        author: 'Test Author',
        tagNames: ['tech', 'news'],
      };

      mockPrismaService.tag.upsert
        .mockResolvedValueOnce({ id: 'tag1', name: 'tech' })
        .mockResolvedValueOnce({ id: 'tag2', name: 'news' });
      
      mockPrismaService.article.create.mockResolvedValue(mockArticle);

      const result = await service.create(createArticleInput);

      expect(mockPrismaService.tag.upsert).toHaveBeenCalledTimes(2);
      expect(mockPrismaService.tag.upsert).toHaveBeenCalledWith({
        where: { name: 'tech' },
        update: {},
        create: { name: 'tech' },
      });
      expect(mockPrismaService.article.create).toHaveBeenCalledWith({
        data: {
          sourceId: 'source-id',
          originalUrl: 'https://example.com/article',
          title: 'Test Article',
          content: 'Article content',
          summary: 'Article summary',
          publishedAt: new Date('2024-01-20T00:00:00Z'),
          imageUrl: 'https://example.com/image.jpg',
          author: 'Test Author',
          tags: {
            connect: [{ id: 'tag1' }, { id: 'tag2' }],
          },
        },
        include: {
          source: true,
          tags: true,
        },
      });
      expect(result).toEqual(mockArticle);
    });
  });

  describe('findAll', () => {
    it('should return all articles', async () => {
      mockPrismaService.article.findMany.mockResolvedValue([mockArticle]);

      const result = await service.findAll();

      expect(mockPrismaService.article.findMany).toHaveBeenCalledWith({
        where: {},
        include: {
          source: true,
          tags: true,
        },
        orderBy: { publishedAt: 'desc' },
      });
      expect(result).toEqual([mockArticle]);
    });

    it('should filter articles by search query', async () => {
      mockPrismaService.article.findMany.mockResolvedValue([mockArticle]);

      await service.findAll({ searchQuery: 'test' });

      expect(mockPrismaService.article.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { title: { contains: 'test', mode: 'insensitive' } },
            { content: { contains: 'test', mode: 'insensitive' } },
            { summary: { contains: 'test', mode: 'insensitive' } },
          ],
        },
        include: {
          source: true,
          tags: true,
        },
        orderBy: { publishedAt: 'desc' },
      });
    });
  });

  describe('findOne', () => {
    it('should return an article by id', async () => {
      mockPrismaService.article.findUnique.mockResolvedValue(mockArticle);

      const result = await service.findOne('article-id');

      expect(mockPrismaService.article.findUnique).toHaveBeenCalledWith({
        where: { id: 'article-id' },
        include: {
          source: true,
          tags: true,
        },
      });
      expect(result).toEqual(mockArticle);
    });

    it('should throw NotFoundException when article not found', async () => {
      mockPrismaService.article.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('markAsRead', () => {
    it('should mark article as read for user', async () => {
      const readArticle = {
        id: 'read-id',
        userId: 'user-id',
        articleId: 'article-id',
        readAt: new Date(),
        readDuration: 120,
      };

      mockPrismaService.readArticle.upsert.mockResolvedValue(readArticle);

      const result = await service.markAsRead('article-id', 'user-id', 120);

      expect(mockPrismaService.readArticle.upsert).toHaveBeenCalledWith({
        where: {
          userId_articleId: {
            userId: 'user-id',
            articleId: 'article-id',
          },
        },
        update: {
          readAt: expect.any(Date),
          readDuration: 120,
        },
        create: {
          userId: 'user-id',
          articleId: 'article-id',
          readDuration: 120,
        },
      });
      expect(result).toEqual(readArticle);
    });
  });

  describe('bookmark', () => {
    it('should bookmark article for user', async () => {
      const bookmark = {
        id: 'bookmark-id',
        userId: 'user-id',
        articleId: 'article-id',
        note: 'Important article',
        createdAt: new Date(),
      };

      mockPrismaService.bookmark.upsert.mockResolvedValue(bookmark);

      const result = await service.bookmark('article-id', 'user-id', 'Important article');

      expect(mockPrismaService.bookmark.upsert).toHaveBeenCalledWith({
        where: {
          userId_articleId: {
            userId: 'user-id',
            articleId: 'article-id',
          },
        },
        update: {
          note: 'Important article',
        },
        create: {
          userId: 'user-id',
          articleId: 'article-id',
          note: 'Important article',
        },
      });
      expect(result).toEqual(bookmark);
    });
  });
});