import { Test, TestingModule } from '@nestjs/testing';
import { TierClassifierService, VerificationStatus } from './tier-classifier.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

describe('TierClassifierService', () => {
  let service: TierClassifierService;

  const mockPrismaService = {
    trustedDomain: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
    },
    verifiedAccount: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    sourceTier: {
      create: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn(),
    },
    sourceReliabilityHistory: {
      findFirst: jest.fn(),
    },
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TierClassifierService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<TierClassifierService>(TierClassifierService);

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('classifySource', () => {
    it('should classify official corporate domain as Tier 1', async () => {
      const source = {
        id: 'source-1',
        name: 'Apple Inc.',
        url: 'https://www.apple.com/newsroom/2024/01/apple-announces-new-product',
        category: 'tech',
      };

      mockPrismaService.trustedDomain.findFirst.mockResolvedValue({
        domain: 'apple.com',
        tier: 1,
        organization: 'Apple Inc.',
        verified: true,
        category: 'corporate',
      });

      const result = await service.classifySource(source);

      expect(result).toEqual({
        tier: 1,
        confidence: 0.95,
        verificationStatus: 'VERIFIED',
        reasoning: [
          '公式企業ドメイン (www.apple.com)',
          '検証済み組織: Apple Inc.',
        ],
      });

      expect(mockPrismaService.trustedDomain.findFirst).toHaveBeenCalledWith({
        where: { domain: 'www.apple.com' },
      });
    });

    it('should classify government domain as Tier 1', async () => {
      const source = {
        id: 'source-2',
        name: '経済産業省',
        url: 'https://www.meti.go.jp/press/2024/01/announcement.html',
        category: 'government',
      };

      mockPrismaService.trustedDomain.findFirst.mockResolvedValue({
        domain: 'meti.go.jp',
        tier: 1,
        organization: '経済産業省',
        verified: true,
        category: 'government',
      });

      const result = await service.classifySource(source);

      expect(result).toEqual({
        tier: 1,
        confidence: 0.98,
        verificationStatus: 'VERIFIED',
        reasoning: [
          '政府公式ドメイン (www.meti.go.jp)',
          '検証済み組織: 経済産業省',
        ],
      });
    });

    it('should classify verified executive account as Tier 1', async () => {
      const source = {
        id: 'source-3',
        name: 'Elon Musk',
        url: 'https://twitter.com/elonmusk/status/123456789',
        category: 'social',
        author: {
          platform: 'twitter',
          accountId: 'elonmusk',
          name: 'Elon Musk',
        },
      };

      mockPrismaService.trustedDomain.findFirst.mockResolvedValue(null);
      mockPrismaService.verifiedAccount.findFirst.mockResolvedValue({
        platform: 'twitter',
        accountId: 'elonmusk',
        accountName: 'Elon Musk',
        personName: 'Elon Musk',
        title: 'CEO',
        organization: 'Tesla, SpaceX',
        tier: 1,
        verifiedAt: new Date(),
      });

      const result = await service.classifySource(source);

      expect(result).toEqual({
        tier: 1,
        confidence: 0.9,
        verificationStatus: 'VERIFIED',
        reasoning: [
          '認証済み要人アカウント',
          'Elon Musk - CEO (Tesla, SpaceX)',
        ],
      });
    });

    it('should classify major news media as Tier 2', async () => {
      const source = {
        id: 'source-4',
        name: '日本経済新聞',
        url: 'https://www.nikkei.com/article/tech-news-2024',
        category: 'media',
      };

      mockPrismaService.trustedDomain.findFirst.mockResolvedValue({
        domain: 'nikkei.com',
        tier: 2,
        organization: '日本経済新聞社',
        verified: true,
        category: 'media',
      });

      const result = await service.classifySource(source);

      expect(result).toEqual({
        tier: 2,
        confidence: 0.95,
        verificationStatus: 'VERIFIED',
        reasoning: [
          '大手報道機関 (www.nikkei.com)',
          '検証済み組織: 日本経済新聞社',
        ],
      });
    });

    it('should classify online media as Tier 3', async () => {
      const source = {
        id: 'source-5',
        name: 'TechCrunch',
        url: 'https://techcrunch.com/2024/01/startup-news',
        category: 'media',
      };

      mockPrismaService.trustedDomain.findFirst.mockResolvedValue({
        domain: 'techcrunch.com',
        tier: 3,
        organization: 'TechCrunch',
        verified: false,
        category: 'online_media',
      });

      const result = await service.classifySource(source);

      expect(result).toEqual({
        tier: 3,
        confidence: 0.8,
        verificationStatus: 'TRUSTED',
        reasoning: [
          'オンラインメディア (techcrunch.com)',
          '検証済み組織: TechCrunch',
        ],
      });
    });

    it('should classify unknown source as Tier 4 by default', async () => {
      const source = {
        id: 'source-6',
        name: 'Unknown Blog',
        url: 'https://random-blog.example.com/post/123',
        category: 'blog',
      };

      mockPrismaService.trustedDomain.findFirst.mockResolvedValue(null);
      mockPrismaService.verifiedAccount.findFirst.mockResolvedValue(null);

      const result = await service.classifySource(source);

      expect(result).toEqual({
        tier: 4,
        confidence: 0.5,
        verificationStatus: 'UNVERIFIED',
        reasoning: [
          '未検証ドメイン',
          'ユーザー生成コンテンツとして分類',
        ],
      });
    });

    it('should use historical reliability data when available', async () => {
      const source = {
        id: 'source-7',
        name: 'Tech Blog',
        url: 'https://tech-blog.example.com/article',
        category: 'blog',
      };

      mockPrismaService.trustedDomain.findFirst.mockResolvedValue(null);
      mockPrismaService.sourceReliabilityHistory.findFirst.mockResolvedValue({
        accuracyScore: 0.85,
        correctionCount: 2,
        falseInfoCount: 0,
      });

      const result = await service.classifySource(source);

      expect(result).toEqual({
        tier: 3,
        confidence: 0.75,
        verificationStatus: 'TRUSTED',
        reasoning: [
          '未検証ドメイン',
          '過去の信頼性スコア: 0.85',
          '高い信頼性履歴に基づきTier 3に分類',
        ],
      });
    });
  });

  describe('saveTierClassification', () => {
    it('should save tier classification to database', async () => {
      const sourceId = 'source-1';
      const classification = {
        tier: 1 as const,
        confidence: 0.95,
        verificationStatus: VerificationStatus.VERIFIED,
        reasoning: ['公式企業ドメイン'],
      };

      mockPrismaService.sourceTier.upsert.mockResolvedValue({
        id: 'tier-1',
        sourceId,
        ...classification,
        verifiedAt: new Date(),
      });

      await service.saveTierClassification(sourceId, classification);

      expect(mockPrismaService.sourceTier.upsert).toHaveBeenCalledWith({
        where: { sourceId },
        update: {
          tier: classification.tier,
          confidence: classification.confidence,
          verificationStatus: classification.verificationStatus,
          reasoning: classification.reasoning,
          verifiedAt: expect.any(Date),
        },
        create: {
          sourceId,
          tier: classification.tier,
          confidence: classification.confidence,
          verificationStatus: classification.verificationStatus,
          reasoning: classification.reasoning,
          verifiedAt: expect.any(Date),
        },
      });
    });
  });

  describe('getTierBadgeInfo', () => {
    it('should return correct badge info for each tier', () => {
      expect(service.getTierBadgeInfo(1)).toEqual({
        tier: 1,
        label: '一次情報',
        color: '#FFD700',
        icon: 'verified',
        description: '公式発表・要人発信',
      });

      expect(service.getTierBadgeInfo(2)).toEqual({
        tier: 2,
        label: '信頼メディア',
        color: '#C0C0C0',
        icon: 'newspaper',
        description: '大手報道・専門機関',
      });

      expect(service.getTierBadgeInfo(3)).toEqual({
        tier: 3,
        label: '一般メディア',
        color: '#CD7F32',
        icon: 'web',
        description: 'オンラインメディア・ブログ',
      });

      expect(service.getTierBadgeInfo(4)).toEqual({
        tier: 4,
        label: 'ユーザー投稿',
        color: '#808080',
        icon: 'people',
        description: 'SNS・フォーラム',
      });
    });
  });

  describe('checkDomainAuthority', () => {
    it('should extract domain correctly from various URL formats', async () => {
      const urls = [
        'https://www.apple.com/newsroom',
        'http://apple.com',
        'https://subdomain.apple.com/page',
        'https://apple.com:8080/page',
      ];

      for (const url of urls) {
        await service.checkDomainAuthority(url);
      }

      // Should check for the main domain in all cases
      expect(mockPrismaService.trustedDomain.findFirst).toHaveBeenCalledTimes(4);
      expect(mockPrismaService.trustedDomain.findFirst).toHaveBeenCalledWith({
        where: { domain: 'www.apple.com' },
      });
    });
  });
});