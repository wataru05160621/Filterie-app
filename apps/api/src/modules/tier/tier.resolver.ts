import {
  Resolver,
  Query,
  Mutation,
  Args,
  ResolveField,
  Parent,
} from '@nestjs/graphql';
import { UseGuards, NotFoundException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TierClassifierService, TierClassification, VerificationStatus } from './tier-classifier.service';
import { SourcesService } from '../sources/sources.service';
import { PrismaService } from '../../prisma/prisma.service';

@Resolver()
@UseGuards(JwtAuthGuard)
export class TierResolver {
  constructor(
    private readonly tierClassifier: TierClassifierService,
    private readonly sourcesService: SourcesService,
    private readonly prisma: PrismaService,
  ) {}

  @Query(() => TierEvaluationResult)
  async evaluateSourceTier(@Args('url') url: string): Promise<TierEvaluationResult> {
    const source = {
      id: `temp-${Date.now()}`,
      name: 'Unknown',
      url,
      category: 'unknown',
    };

    const classification = await this.tierClassifier.classifySource(source);

    return {
      url,
      tier: classification,
    };
  }

  @Mutation(() => Source)
  async updateSourceTier(
    @Args('sourceId') sourceId: string,
    @Args('tier') tier: number,
    @Args('reasoning') reasoning: string,
  ): Promise<any> {
    const source = await this.sourcesService.findOne(sourceId);
    if (!source) {
      throw new NotFoundException('Source not found');
    }

    // Update source tier
    const updatedSource = await this.sourcesService.update(sourceId, { tier });

    // Save tier classification
    const classification: TierClassification = {
      tier: tier as 1 | 2 | 3 | 4,
      confidence: 1.0,
      verificationStatus: VerificationStatus.VERIFIED,
      reasoning: [reasoning, '手動で検証済み'],
    };

    await this.tierClassifier.saveTierClassification(sourceId, classification);

    return updatedSource;
  }

  @ResolveField('tierBadge')
  sourceTierBadge(@Parent() source: any) {
    return this.tierClassifier.getTierBadgeInfo(source.tier);
  }

  @Query(() => TierStats)
  async tierStats(): Promise<TierStats> {
    return this.getTierStats();
  }

  private async getTierStats(): Promise<TierStats> {
    const sources = await (this.prisma as any).source.groupBy({
      by: ['tier'],
      _count: {
        tier: true,
      },
    });

    const verifiedCount = await (this.prisma as any).sourceTier.count({
      where: {
        verificationStatus: VerificationStatus.VERIFIED,
      },
    });

    const totalCount = await (this.prisma as any).source.count();

    const tierCounts = sources.map((s: any) => ({
      tier: s.tier,
      count: s._count.tier,
    }));

    // Fill in missing tiers
    for (let i = 1; i <= 4; i++) {
      if (!tierCounts.find((tc: any) => tc.tier === i)) {
        tierCounts.push({ tier: i, count: 0 });
      }
    }

    tierCounts.sort((a: any, b: any) => a.tier - b.tier);

    return {
      tierCounts,
      verifiedSourceCount: verifiedCount,
      totalSourceCount: totalCount,
    };
  }
}

// GraphQL Types (would normally be in separate files)
import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType()
class TierEvaluationResult {
  @Field()
  url: string;

  @Field(() => TierClassificationObject)
  tier: TierClassification;
}

@ObjectType()
class TierClassificationObject {
  @Field(() => Int)
  tier: number;

  @Field()
  confidence: number;

  @Field()
  verificationStatus: string;

  @Field(() => [String])
  reasoning: string[];
}

@ObjectType()
class TierStats {
  @Field(() => [TierCount])
  tierCounts: TierCount[];

  @Field(() => Int)
  verifiedSourceCount: number;

  @Field(() => Int)
  totalSourceCount: number;
}

@ObjectType()
class TierCount {
  @Field(() => Int)
  tier: number;

  @Field(() => Int)
  count: number;
}

// Temporary Source type
class Source {
  id: string;
  name: string;
  url: string;
  tier: number;
}