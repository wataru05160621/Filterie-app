import { Resolver, Query, Mutation, Args, ID, Subscription } from '@nestjs/graphql';
import { UseGuards, Inject } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SourcesService } from './sources.service';
import { Source, TierEvaluation } from './entities/source.entity';
import { CreateSourceInput } from './dto/create-source.input';
import { UpdateSourceInput } from './dto/update-source.input';
import { SourceFilterInput } from './dto/source-filter.input';
import { PaginationInput } from './dto/pagination.input';
import { SourceConnection } from './dto/source-connection';
import { PubSubEngine } from 'graphql-subscriptions';
import { PUB_SUB } from '../pubsub/pubsub.module';
import { SubscriptionEvent } from '../pubsub/subscription-events';
import { SourceFeedFetchedPayload } from '../pubsub/dto/source-feed-fetched.object';

@Resolver(() => Source)
@UseGuards(JwtAuthGuard)
export class SourcesResolver {
  constructor(
    private readonly sourcesService: SourcesService,
    @Inject(PUB_SUB) private pubSub: PubSubEngine,
  ) {}

  @Mutation(() => Source)
  async createSource(
    @Args('input') createSourceInput: CreateSourceInput,
  ): Promise<Source> {
    return this.sourcesService.create(createSourceInput);
  }

  @Query(() => SourceConnection, { name: 'sources' })
  async findAll(
    @Args('filter', { nullable: true }) filter?: SourceFilterInput,
    @Args('pagination', { nullable: true }) pagination?: PaginationInput,
  ): Promise<SourceConnection> {
    return this.sourcesService.findWithPagination(filter, pagination);
  }

  @Query(() => Source, { name: 'source', nullable: true })
  async findOne(@Args('id', { type: () => ID }) id: string): Promise<Source | null> {
    return this.sourcesService.findOne(id);
  }

  @Mutation(() => Source)
  async updateSource(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') updateSourceInput: UpdateSourceInput,
  ): Promise<Source> {
    const source = await this.sourcesService.update(id, updateSourceInput);
    
    // 情報源更新を通知
    await this.pubSub.publish(SubscriptionEvent.SOURCE_UPDATED, {
      [SubscriptionEvent.SOURCE_UPDATED]: source,
    });
    
    return source;
  }

  @Mutation(() => Boolean)
  async deleteSource(@Args('id', { type: () => ID }) id: string): Promise<boolean> {
    return this.sourcesService.remove(id);
  }

  @Mutation(() => TierEvaluation)
  async evaluateSourceTier(@Args('url') url: string): Promise<TierEvaluation> {
    return this.sourcesService.evaluateTier(url);
  }
  
  // サブスクリプション
  @Subscription(() => Source)
  sourceUpdated() {
    return this.pubSub.asyncIterator(SubscriptionEvent.SOURCE_UPDATED);
  }

  @Subscription(() => SourceFeedFetchedPayload, {
    description: '情報源のフィード取得完了通知',
  })
  sourceFeedFetched() {
    return this.pubSub.asyncIterator(SubscriptionEvent.SOURCE_FEED_FETCHED);
  }
}