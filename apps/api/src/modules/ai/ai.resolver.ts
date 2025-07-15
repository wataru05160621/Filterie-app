import { Resolver, Mutation, Args, ID, ObjectType, Field, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AiSummaryService } from './ai-summary.service';
import { Article } from '../articles/entities/article.entity';

@ObjectType()
export class BulkSummaryResult {
  @Field(() => Int)
  successful: number;

  @Field(() => Int)
  failed: number;

  @Field(() => Int)
  total: number;

  @Field(() => [String])
  errors: string[];
}

@Resolver()
@UseGuards(JwtAuthGuard)
export class AiResolver {
  constructor(private readonly aiSummaryService: AiSummaryService) {}

  @Mutation(() => Article, { description: 'Generate AI summary for a single article' })
  async generateAiSummary(
    @Args('articleId', { type: () => ID }) articleId: string,
  ): Promise<Article> {
    return this.aiSummaryService.generateSummary(articleId);
  }

  @Mutation(() => BulkSummaryResult, { description: 'Generate AI summaries for multiple articles' })
  async generateBulkSummaries(
    @Args('articleIds', { type: () => [ID] }) articleIds: string[],
  ): Promise<BulkSummaryResult> {
    return this.aiSummaryService.generateBulkSummaries(articleIds);
  }

  @Mutation(() => [String], { description: 'Generate tag suggestions for an article' })
  async generateTagSuggestions(
    @Args('articleId', { type: () => ID }) articleId: string,
  ): Promise<string[]> {
    return this.aiSummaryService.generateTagSuggestions(articleId);
  }
}