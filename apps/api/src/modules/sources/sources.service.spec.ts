import { Test, TestingModule } from '@nestjs/testing';
import { SourcesService } from './sources.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSourceInput } from './dto/create-source.input';
import { UpdateSourceInput } from './dto/update-source.input';
import { NotFoundException } from '@nestjs/common';

describe('SourcesService', () => {
  let service: SourcesService;

  const mockSource = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'TechCrunch',
    url: 'https://techcrunch.com',
    feedUrl: 'https://techcrunch.com/feed/',
    tier: 2,
    category: 'tech',
    language: 'en',
    isActive: true,
    lastFetchedAt: new Date('2024-01-01'),
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  const mockPrismaService = {
    source: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SourcesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<SourcesService>(SourcesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new source successfully', async () => {
      const createSourceInput: CreateSourceInput = {
        name: 'TechCrunch',
        url: 'https://techcrunch.com',
        feedUrl: 'https://techcrunch.com/feed/',
        category: 'tech',
        language: 'en',
      };

      mockPrismaService.source.create.mockResolvedValue(mockSource);

      const result = await service.create(createSourceInput);

      expect(mockPrismaService.source.create).toHaveBeenCalledWith({
        data: createSourceInput,
      });
      expect(result).toEqual(mockSource);
    });

    it('should handle database errors when creating source', async () => {
      const createSourceInput: CreateSourceInput = {
        name: 'Test Source',
        url: 'https://example.com',
        category: 'general',
      };

      mockPrismaService.source.create.mockRejectedValue(new Error('Database error'));

      await expect(service.create(createSourceInput)).rejects.toThrow('Database error');
    });
  });

  describe('findAll', () => {
    it('should return all sources', async () => {
      const mockSources = [mockSource, { ...mockSource, id: '2', name: 'Another Source' }];
      mockPrismaService.source.findMany.mockResolvedValue(mockSources);

      const result = await service.findAll();

      expect(mockPrismaService.source.findMany).toHaveBeenCalled();
      expect(result).toEqual(mockSources);
    });

    it('should return sources filtered by tier', async () => {
      const tier = 2;
      const mockFilteredSources = [mockSource];
      mockPrismaService.source.findMany.mockResolvedValue(mockFilteredSources);

      const result = await service.findAll({ tier });

      expect(mockPrismaService.source.findMany).toHaveBeenCalledWith({
        where: { tier },
      });
      expect(result).toEqual(mockFilteredSources);
    });

    it('should return sources filtered by category', async () => {
      const category = 'tech';
      const mockFilteredSources = [mockSource];
      mockPrismaService.source.findMany.mockResolvedValue(mockFilteredSources);

      const result = await service.findAll({ category });

      expect(mockPrismaService.source.findMany).toHaveBeenCalledWith({
        where: { category },
      });
      expect(result).toEqual(mockFilteredSources);
    });

    it('should return sources filtered by isActive status', async () => {
      const isActive = true;
      const mockFilteredSources = [mockSource];
      mockPrismaService.source.findMany.mockResolvedValue(mockFilteredSources);

      const result = await service.findAll({ isActive });

      expect(mockPrismaService.source.findMany).toHaveBeenCalledWith({
        where: { isActive },
      });
      expect(result).toEqual(mockFilteredSources);
    });

    it('should return sources filtered by language', async () => {
      const language = 'en';
      const mockFilteredSources = [mockSource];
      mockPrismaService.source.findMany.mockResolvedValue(mockFilteredSources);

      const result = await service.findAll({ language });

      expect(mockPrismaService.source.findMany).toHaveBeenCalledWith({
        where: { language },
      });
      expect(result).toEqual(mockFilteredSources);
    });

    it('should apply multiple filters', async () => {
      const filters = { tier: 2, category: 'tech', isActive: true };
      const mockFilteredSources = [mockSource];
      mockPrismaService.source.findMany.mockResolvedValue(mockFilteredSources);

      const result = await service.findAll(filters);

      expect(mockPrismaService.source.findMany).toHaveBeenCalledWith({
        where: filters,
      });
      expect(result).toEqual(mockFilteredSources);
    });
  });

  describe('findOne', () => {
    it('should return a source by id', async () => {
      mockPrismaService.source.findUnique.mockResolvedValue(mockSource);

      const result = await service.findOne(mockSource.id);

      expect(mockPrismaService.source.findUnique).toHaveBeenCalledWith({
        where: { id: mockSource.id },
      });
      expect(result).toEqual(mockSource);
    });

    it('should throw NotFoundException when source not found', async () => {
      mockPrismaService.source.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a source successfully', async () => {
      const updateSourceInput: UpdateSourceInput = {
        name: 'Updated TechCrunch',
        isActive: false,
      };

      const updatedSource = { ...mockSource, ...updateSourceInput };
      mockPrismaService.source.findUnique.mockResolvedValue(mockSource);
      mockPrismaService.source.update.mockResolvedValue(updatedSource);

      const result = await service.update(mockSource.id, updateSourceInput);

      expect(mockPrismaService.source.findUnique).toHaveBeenCalledWith({
        where: { id: mockSource.id },
      });
      expect(mockPrismaService.source.update).toHaveBeenCalledWith({
        where: { id: mockSource.id },
        data: updateSourceInput,
      });
      expect(result).toEqual(updatedSource);
    });

    it('should throw NotFoundException when updating non-existent source', async () => {
      mockPrismaService.source.findUnique.mockResolvedValue(null);

      await expect(
        service.update('non-existent-id', { name: 'Updated' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete a source successfully', async () => {
      mockPrismaService.source.findUnique.mockResolvedValue(mockSource);
      mockPrismaService.source.delete.mockResolvedValue(mockSource);

      const result = await service.remove(mockSource.id);

      expect(mockPrismaService.source.findUnique).toHaveBeenCalledWith({
        where: { id: mockSource.id },
      });
      expect(mockPrismaService.source.delete).toHaveBeenCalledWith({
        where: { id: mockSource.id },
      });
      expect(result).toBe(true);
    });

    it('should throw NotFoundException when deleting non-existent source', async () => {
      mockPrismaService.source.findUnique.mockResolvedValue(null);

      await expect(service.remove('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('evaluateTier', () => {
    it('should evaluate government domain as tier 1', async () => {
      const result = await service.evaluateTier('https://www.whitehouse.gov');

      expect(result.tier).toBe(1);
      expect(result.confidence).toBeGreaterThan(0.8);
      expect(result.reasons).toContain('Government domain (.gov)');
    });

    it('should evaluate Japanese government domain as tier 1', async () => {
      const result = await service.evaluateTier('https://www.mof.go.jp');

      expect(result.tier).toBe(1);
      expect(result.confidence).toBeGreaterThan(0.8);
      expect(result.reasons).toContain('Japanese government domain (.go.jp)');
    });

    it('should evaluate major news outlet as tier 2', async () => {
      const result = await service.evaluateTier('https://www.cnn.com');

      expect(result.tier).toBe(2);
      expect(result.confidence).toBeGreaterThan(0.7);
      expect(result.reasons).toContain('Major news outlet');
    });

    it('should evaluate educational institution as tier 2', async () => {
      const result = await service.evaluateTier('https://www.harvard.edu');

      expect(result.tier).toBe(2);
      expect(result.confidence).toBeGreaterThan(0.7);
      expect(result.reasons).toContain('Educational institution (.edu)');
    });

    it('should evaluate Japanese academic institution as tier 2', async () => {
      const result = await service.evaluateTier('https://www.u-tokyo.ac.jp');

      expect(result.tier).toBe(2);
      expect(result.confidence).toBeGreaterThan(0.7);
      expect(result.reasons).toContain('Japanese academic institution (.ac.jp)');
    });

    it('should evaluate general news site as tier 3', async () => {
      const result = await service.evaluateTier('https://www.buzzfeed.com');

      expect(result.tier).toBe(3);
      expect(result.confidence).toBeGreaterThan(0.5);
      expect(result.reasons).toContain('General news/blog site');
    });

    it('should evaluate personal blog as tier 4', async () => {
      const result = await service.evaluateTier('https://personalblog.wordpress.com');

      expect(result.tier).toBe(4);
      expect(result.confidence).toBeGreaterThan(0.5);
      expect(result.reasons).toContain('Blog platform subdomain');
    });

    it('should evaluate unknown domain as tier 4', async () => {
      const result = await service.evaluateTier('https://random-site-12345.xyz');

      expect(result.tier).toBe(4);
      expect(result.confidence).toBeLessThan(0.5);
      expect(result.reasons).toContain('Unknown or unverified source');
    });

    it('should handle invalid URLs gracefully', async () => {
      const result = await service.evaluateTier('not-a-valid-url');

      expect(result.tier).toBe(4);
      expect(result.confidence).toBe(0);
      expect(result.reasons).toContain('Invalid URL format');
    });
  });
});