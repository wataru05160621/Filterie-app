import { Resolver, Mutation, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AiSummaryService } from './ai-summary.service';

@Resolver()
@UseGuards(JwtAuthGuard)
export class AiResolver {
  constructor(private readonly aiSummaryService: AiSummaryService) {}

  @Mutation(() => String)
  async generateArticleSummary(
    @Args('articleId', { type: () => ID }) articleId: string,
  ): Promise<string> {
    return this.aiSummaryService.generateSummary(articleId);
  }

  @Mutation(() => [String])
  async extractArticleTags(
    @Args('articleId', { type: () => ID }) articleId: string,
  ): Promise<string[]> {
    return this.aiSummaryService.extractTags(articleId);
  }

  @Mutation(() => Boolean)
  async processNewArticles(): Promise<boolean> {
    await this.aiSummaryService.summarizeNewArticles();
    return true;
  }
}