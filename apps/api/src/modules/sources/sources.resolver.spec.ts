import { Test, TestingModule } from '@nestjs/testing';
import { SourcesResolver } from './sources.resolver';
import { SourcesService } from './sources.service';
import { Source } from './entities/source.entity';
import { CreateSourceInput } from './dto/create-source.input';
import { UpdateSourceInput } from './dto/update-source.input';
import { SourceFilterInput } from './dto/source-filter.input';
import { PaginationInput } from '../common/dto/pagination.input';

describe('SourcesResolver', () => {
  let resolver: SourcesResolver;
  let service: SourcesService;

  const mockSource: Source = {
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

  const mockSourcesService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    evaluateTier: jest.fn(),
    findWithPagination: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SourcesResolver,
        {
          provide: SourcesService,
          useValue: mockSourcesService,
        },
      ],
    }).compile();

    resolver = module.get<SourcesResolver>(SourcesResolver);
    service = module.get<SourcesService>(SourcesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createSource', () => {
    it('should create a new source', async () => {
      const createSourceInput: CreateSourceInput = {
        name: 'TechCrunch',
        url: 'https://techcrunch.com',
        feedUrl: 'https://techcrunch.com/feed/',
        category: 'tech',
        language: 'en',
      };

      mockSourcesService.create.mockResolvedValue(mockSource);

      const result = await resolver.createSource(createSourceInput);

      expect(service.create).toHaveBeenCalledWith(createSourceInput);
      expect(result).toEqual(mockSource);
    });
  });

  describe('findAll', () => {
    it('should return paginated sources', async () => {
      const filter: SourceFilterInput = { tier: 2 };
      const pagination: PaginationInput = { limit: 10, offset: 0 };
      const mockPaginatedResult = {
        edges: [{ node: mockSource, cursor: 'cursor1' }],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: 'cursor1',
          endCursor: 'cursor1',
        },
        totalCount: 1,
      };

      mockSourcesService.findWithPagination.mockResolvedValue(mockPaginatedResult);

      const result = await resolver.findAll(filter, pagination);

      expect(service.findWithPagination).toHaveBeenCalledWith(filter, pagination);
      expect(result).toEqual(mockPaginatedResult);
    });

    it('should return all sources without filter', async () => {
      const pagination: PaginationInput = { limit: 20, offset: 0 };
      const mockPaginatedResult = {
        edges: [
          { node: mockSource, cursor: 'cursor1' },
          { node: { ...mockSource, id: '2' }, cursor: 'cursor2' },
        ],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: 'cursor1',
          endCursor: 'cursor2',
        },
        totalCount: 2,
      };

      mockSourcesService.findWithPagination.mockResolvedValue(mockPaginatedResult);

      const result = await resolver.findAll(undefined, pagination);

      expect(service.findWithPagination).toHaveBeenCalledWith(undefined, pagination);
      expect(result).toEqual(mockPaginatedResult);
    });
  });

  describe('findOne', () => {
    it('should return a single source by id', async () => {
      mockSourcesService.findOne.mockResolvedValue(mockSource);

      const result = await resolver.findOne(mockSource.id);

      expect(service.findOne).toHaveBeenCalledWith(mockSource.id);
      expect(result).toEqual(mockSource);
    });

    it('should return null when source not found', async () => {
      mockSourcesService.findOne.mockResolvedValue(null);

      const result = await resolver.findOne('non-existent-id');

      expect(service.findOne).toHaveBeenCalledWith('non-existent-id');
      expect(result).toBeNull();
    });
  });

  describe('updateSource', () => {
    it('should update a source', async () => {
      const updateSourceInput: UpdateSourceInput = {
        name: 'Updated TechCrunch',
        isActive: false,
      };
      const updatedSource = { ...mockSource, ...updateSourceInput };

      mockSourcesService.update.mockResolvedValue(updatedSource);

      const result = await resolver.updateSource(mockSource.id, updateSourceInput);

      expect(service.update).toHaveBeenCalledWith(mockSource.id, updateSourceInput);
      expect(result).toEqual(updatedSource);
    });
  });

  describe('deleteSource', () => {
    it('should delete a source successfully', async () => {
      mockSourcesService.remove.mockResolvedValue(true);

      const result = await resolver.deleteSource(mockSource.id);

      expect(service.remove).toHaveBeenCalledWith(mockSource.id);
      expect(result).toBe(true);
    });

    it('should return false when deletion fails', async () => {
      mockSourcesService.remove.mockResolvedValue(false);

      const result = await resolver.deleteSource('non-existent-id');

      expect(service.remove).toHaveBeenCalledWith('non-existent-id');
      expect(result).toBe(false);
    });
  });

  describe('evaluateSourceTier', () => {
    it('should evaluate source tier for a given URL', async () => {
      const url = 'https://www.whitehouse.gov';
      const mockEvaluation = {
        tier: 1,
        confidence: 0.95,
        reasons: ['Government domain (.gov)'],
      };

      mockSourcesService.evaluateTier.mockResolvedValue(mockEvaluation);

      const result = await resolver.evaluateSourceTier(url);

      expect(service.evaluateTier).toHaveBeenCalledWith(url);
      expect(result).toEqual(mockEvaluation);
    });
  });
});