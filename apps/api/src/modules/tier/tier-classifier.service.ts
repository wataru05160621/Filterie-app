import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

export interface TierClassification {
  tier: 1 | 2 | 3 | 4;
  confidence: number;
  verificationStatus: VerificationStatus;
  reasoning: string[];
}

export enum VerificationStatus {
  VERIFIED = 'VERIFIED',
  TRUSTED = 'TRUSTED',
  UNVERIFIED = 'UNVERIFIED',
  SUSPICIOUS = 'SUSPICIOUS',
}

export interface TierBadge {
  tier: number;
  label: string;
  color: string;
  icon: string;
  description: string;
}

interface SourceInfo {
  id: string;
  name: string;
  url: string;
  category: string;
  author?: {
    platform: string;
    accountId: string;
    name: string;
  };
}

@Injectable()
export class TierClassifierService {
  private readonly logger = new Logger(TierClassifierService.name);

  private readonly tierBadges: Record<number, TierBadge> = {
    1: {
      tier: 1,
      label: '一次情報',
      color: '#FFD700',
      icon: 'verified',
      description: '公式発表・要人発信',
    },
    2: {
      tier: 2,
      label: '信頼メディア',
      color: '#C0C0C0',
      icon: 'newspaper',
      description: '大手報道・専門機関',
    },
    3: {
      tier: 3,
      label: '一般メディア',
      color: '#CD7F32',
      icon: 'web',
      description: 'オンラインメディア・ブログ',
    },
    4: {
      tier: 4,
      label: 'ユーザー投稿',
      color: '#808080',
      icon: 'people',
      description: 'SNS・フォーラム',
    },
  };

  constructor(
    private readonly prisma: PrismaService,
    configService: ConfigService, // Will be used for SSL checks etc
  ) {
    // Store for future use
    configService.get('NODE_ENV');
  }

  async classifySource(source: SourceInfo): Promise<TierClassification> {
    this.logger.log(`Classifying source: ${source.name} (${source.url})`);

    const checks = await Promise.all([
      this.checkDomainAuthority(source.url),
      this.checkAccountVerification(source),
      this.checkHistoricalReliability(source.id),
    ]);

    const classification = this.aggregateChecks(checks, source);
    
    this.logger.log(
      `Classified ${source.name} as Tier ${classification.tier} ` +
      `with confidence ${classification.confidence}`
    );

    return classification;
  }

  async saveTierClassification(
    sourceId: string,
    classification: TierClassification,
  ): Promise<void> {
    await (this.prisma as any).sourceTier.upsert({
      where: { sourceId },
      update: {
        tier: classification.tier,
        confidence: classification.confidence,
        verificationStatus: classification.verificationStatus,
        reasoning: classification.reasoning,
        verifiedAt: new Date(),
      },
      create: {
        sourceId,
        tier: classification.tier,
        confidence: classification.confidence,
        verificationStatus: classification.verificationStatus,
        reasoning: classification.reasoning,
        verifiedAt: new Date(),
      },
    });
  }

  getTierBadgeInfo(tier: number): TierBadge {
    return this.tierBadges[tier] || this.tierBadges[4]!;
  }

  async checkDomainAuthority(url: string): Promise<any> {
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname;

      const trustedDomain = await (this.prisma as any).trustedDomain.findFirst({
        where: { domain },
      });

      if (trustedDomain) {
        return {
          type: 'domain',
          tier: trustedDomain.tier,
          confidence: trustedDomain.verified ? 0.95 : 0.8,
          verificationStatus: trustedDomain.verified
            ? VerificationStatus.VERIFIED
            : VerificationStatus.TRUSTED,
          organization: trustedDomain.organization,
          category: trustedDomain.category,
        };
      }

      return {
        type: 'domain',
        tier: null,
        confidence: 0,
        verificationStatus: VerificationStatus.UNVERIFIED,
      };
    } catch (error) {
      this.logger.error(`Failed to check domain authority: ${error}`);
      return {
        type: 'domain',
        tier: null,
        confidence: 0,
        verificationStatus: VerificationStatus.UNVERIFIED,
      };
    }
  }

  private async checkAccountVerification(source: SourceInfo): Promise<any> {
    if (!source.author) {
      return {
        type: 'account',
        tier: null,
        confidence: 0,
        verificationStatus: VerificationStatus.UNVERIFIED,
      };
    }

    const verifiedAccount = await (this.prisma as any).verifiedAccount.findFirst({
      where: {
        platform: source.author.platform,
        accountId: source.author.accountId,
      },
    });

    if (verifiedAccount) {
      return {
        type: 'account',
        tier: verifiedAccount.tier,
        confidence: 0.9,
        verificationStatus: VerificationStatus.VERIFIED,
        personName: verifiedAccount.personName,
        title: verifiedAccount.title,
        organization: verifiedAccount.organization,
      };
    }

    return {
      type: 'account',
      tier: null,
      confidence: 0,
      verificationStatus: VerificationStatus.UNVERIFIED,
    };
  }

  private async checkHistoricalReliability(sourceId: string): Promise<any> {
    const history = await (this.prisma as any).sourceReliabilityHistory.findFirst({
      where: { sourceId },
      orderBy: { createdAt: 'desc' },
    });

    if (history && history.accuracyScore) {
      const reliability = history.accuracyScore;
      let tier = 4;
      let confidence = 0.5;

      if (reliability >= 0.8) {
        tier = 3;
        confidence = 0.75;
      } else if (reliability >= 0.9) {
        tier = 2;
        confidence = 0.85;
      }

      return {
        type: 'history',
        tier,
        confidence,
        verificationStatus:
          reliability >= 0.8
            ? VerificationStatus.TRUSTED
            : VerificationStatus.UNVERIFIED,
        accuracyScore: reliability,
        correctionCount: history.correctionCount,
        falseInfoCount: history.falseInfoCount,
      };
    }

    return {
      type: 'history',
      tier: null,
      confidence: 0,
      verificationStatus: VerificationStatus.UNVERIFIED,
    };
  }

  private aggregateChecks(checks: any[], source: SourceInfo): TierClassification {
    const domainCheck = checks[0];
    const accountCheck = checks[1];
    const historyCheck = checks[2];

    const reasoning: string[] = [];
    let tier: 1 | 2 | 3 | 4 = 4;
    let confidence = 0.5;
    let verificationStatus = VerificationStatus.UNVERIFIED;

    // Domain-based classification (highest priority)
    if (domainCheck.tier) {
      tier = domainCheck.tier as 1 | 2 | 3 | 4;
      confidence = domainCheck.confidence;
      verificationStatus = domainCheck.verificationStatus;

      if (domainCheck.category === 'corporate') {
        reasoning.push(`公式企業ドメイン (${new URL(source.url).hostname})`);
      } else if (domainCheck.category === 'government') {
        reasoning.push(`政府公式ドメイン (${new URL(source.url).hostname})`);
      } else if (domainCheck.category === 'media') {
        reasoning.push(`大手報道機関 (${new URL(source.url).hostname})`);
      } else if (domainCheck.category === 'online_media') {
        reasoning.push(`オンラインメディア (${new URL(source.url).hostname})`);
      }

      if (domainCheck.organization) {
        reasoning.push(`検証済み組織: ${domainCheck.organization}`);
      }
    }

    // Account-based classification (can override domain for Tier 1)
    if (accountCheck.tier === 1) {
      tier = 1;
      confidence = Math.max(confidence, accountCheck.confidence);
      verificationStatus = accountCheck.verificationStatus;
      reasoning.push('認証済み要人アカウント');
      if (accountCheck.personName && accountCheck.title && accountCheck.organization) {
        reasoning.push(
          `${accountCheck.personName} - ${accountCheck.title} (${accountCheck.organization})`
        );
      }
    }

    // History-based adjustment
    if (historyCheck.tier && !domainCheck.tier && !accountCheck.tier) {
      tier = historyCheck.tier as 1 | 2 | 3 | 4;
      confidence = historyCheck.confidence;
      verificationStatus = historyCheck.verificationStatus;
      reasoning.push('未検証ドメイン');
      reasoning.push(`過去の信頼性スコア: ${historyCheck.accuracyScore}`);
      reasoning.push(`高い信頼性履歴に基づきTier ${tier}に分類`);
    }

    // Default classification
    if (reasoning.length === 0) {
      reasoning.push('未検証ドメイン');
      reasoning.push('ユーザー生成コンテンツとして分類');
    }

    // Adjust confidence based on government domains
    if (domainCheck.category === 'government') {
      confidence = Math.min(confidence * 1.03, 1.0); // Boost confidence for government sources
    }

    return {
      tier,
      confidence: Math.round(confidence * 100) / 100,
      verificationStatus,
      reasoning,
    };
  }
}