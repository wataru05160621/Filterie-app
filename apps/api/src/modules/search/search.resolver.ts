import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { SearchService } from './search.service';
import { Article } from '../articles/entities/article.entity';
import { SearchHistory } from './entities/search-history.entity';
import { SearchInput } from './dto/search.input';
import { SaveSearchHistoryInput } from './dto/save-search-history.input';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Resolver()
export class SearchResolver {
  constructor(private readonly searchService: SearchService) {}

  @Query(() => [Article])
  async searchArticles(@Args('input') input: SearchInput) {
    return this.searchService.searchArticles(input);
  }

  @Query(() => [String])
  async getSearchSuggestions(@Args('query') query: string) {
    return this.searchService.getSearchSuggestions(query);
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard)
  async saveSearchHistory(@Args('input') input: SaveSearchHistoryInput) {
    await this.searchService.saveSearchHistory(input.userId, input.query);
    return true;
  }

  @Query(() => [SearchHistory])
  @UseGuards(JwtAuthGuard)
  async getSearchHistory(@Args('userId') userId: string) {
    return this.searchService.getSearchHistory(userId);
  }
}