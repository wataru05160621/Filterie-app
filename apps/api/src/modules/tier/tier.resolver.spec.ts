import { Test, TestingModule } from '@nestjs/testing';
import { TierResolver } from './tier.resolver';
import { TierClassifierService } from './tier-classifier.service';
import { SourcesService } from '../sources/sources.service';
import { PrismaService } from '../../prisma/prisma.service';
import { VerificationStatus } from './tier-classifier.service';

describe('TierResolver', () => {
  let resolver: TierResolver;

  const mockTierClassifierService = {
    classifySource: jest.fn(),
    saveTierClassification: jest.fn(),
    getTierBadgeInfo: jest.fn(),
  };

  const mockSourcesService = {
    findOne: jest.fn(),
    update: jest.fn(),
  };

  const mockPrismaService = {
    source: {
      groupBy: jest.fn(),
      count: jest.fn(),
    },
    sourceTier: {
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TierResolver,
        {
          provide: TierClassifierService,
          useValue: mockTierClassifierService,
        },
        {
          provide: SourcesService,
          useValue: mockSourcesService,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    resolver = module.get<TierResolver>(TierResolver);

    jest.clearAllMocks();
  });

  describe('evaluateSourceTier', () => {
    it('should evaluate and save tier classification for a URL', async () => {
      const url = 'https://www.apple.com/newsroom/announcement';
      const mockClassification = {
        tier: 1 as const,
        confidence: 0.95,
        verificationStatus: VerificationStatus.VERIFIED,
        reasoning: ['公式企業ドメイン'],
      };

      mockTierClassifierService.classifySource.mockResolvedValue(mockClassification);

      const result = await resolver.evaluateSourceTier(url);

      expect(result).toEqual({
        url,
        tier: mockClassification,
      });

      expect(mockTierClassifierService.classifySource).toHaveBeenCalledWith({
        id: expect.any(String),
        name: 'Unknown',
        url,
        category: 'unknown',
      });
    });
  });

  describe('updateSourceTier', () => {
    it('should update source tier manually', async () => {
      const sourceId = 'source-1';
      const tier = 2;
      const reasoning = 'Manual verification as trusted media';

      const mockSource = {
        id: sourceId,
        name: 'Test Source',
        url: 'https://example.com',
        tier: 3,
      };

      const mockClassification = {
        tier: 2 as const,
        confidence: 1.0,
        verificationStatus: VerificationStatus.VERIFIED,
        reasoning: [reasoning, '手動で検証済み'],
      };

      mockSourcesService.findOne.mockResolvedValue(mockSource);
      mockSourcesService.update.mockResolvedValue({ ...mockSource, tier });
      mockTierClassifierService.saveTierClassification.mockResolvedValue(undefined);

      const result = await resolver.updateSourceTier(sourceId, tier, reasoning);

      expect(result).toEqual({
        ...mockSource,
        tier,
      });

      expect(mockSourcesService.update).toHaveBeenCalledWith(sourceId, { tier });
      expect(mockTierClassifierService.saveTierClassification).toHaveBeenCalledWith(
        sourceId,
        mockClassification,
      );
    });

    it('should throw error if source not found', async () => {
      mockSourcesService.findOne.mockResolvedValue(null);

      await expect(
        resolver.updateSourceTier('invalid-id', 1, 'reason'),
      ).rejects.toThrow('Source not found');
    });
  });

  describe('sourceTierBadge', () => {
    it('should return tier badge for a source', () => {
      const source = {
        tier: 1,
      };

      const mockBadge = {
        tier: 1,
        label: '一次情報',
        color: '#FFD700',
        icon: 'verified',
        description: '公式発表・要人発信',
      };

      mockTierClassifierService.getTierBadgeInfo.mockReturnValue(mockBadge);

      const result = resolver.sourceTierBadge(source);

      expect(result).toEqual(mockBadge);
      expect(mockTierClassifierService.getTierBadgeInfo).toHaveBeenCalledWith(1);
    });
  });

  describe('tierStats', () => {
    it('should return tier statistics', async () => {
      mockPrismaService.source.groupBy.mockResolvedValue([
        { tier: 1, _count: { tier: 10 } },
        { tier: 2, _count: { tier: 25 } },
        { tier: 3, _count: { tier: 50 } },
        { tier: 4, _count: { tier: 15 } },
      ]);
      mockPrismaService.sourceTier.count.mockResolvedValue(35);
      mockPrismaService.source.count.mockResolvedValue(100);

      const result = await resolver.tierStats();

      expect(result).toEqual({
        tierCounts: [
          { tier: 1, count: 10 },
          { tier: 2, count: 25 },
          { tier: 3, count: 50 },
          { tier: 4, count: 15 },
        ],
        verifiedSourceCount: 35,
        totalSourceCount: 100,
      });
    });
  });
});