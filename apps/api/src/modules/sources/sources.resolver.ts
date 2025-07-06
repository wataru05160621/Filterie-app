import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SourcesService } from './sources.service';
import { Source, TierEvaluation } from './entities/source.entity';
import { CreateSourceInput } from './dto/create-source.input';
import { UpdateSourceInput } from './dto/update-source.input';
import { SourceFilterInput } from './dto/source-filter.input';
import { PaginationInput } from './dto/pagination.input';
import { SourceConnection } from './dto/source-connection';

@Resolver(() => Source)
@UseGuards(JwtAuthGuard)
export class SourcesResolver {
  constructor(private readonly sourcesService: SourcesService) {}

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
    return this.sourcesService.update(id, updateSourceInput);
  }

  @Mutation(() => Boolean)
  async deleteSource(@Args('id', { type: () => ID }) id: string): Promise<boolean> {
    return this.sourcesService.remove(id);
  }

  @Mutation(() => TierEvaluation)
  async evaluateSourceTier(@Args('url') url: string): Promise<TierEvaluation> {
    return this.sourcesService.evaluateTier(url);
  }
}