import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PreferencesService } from './preferences.service';
import { UserPreference } from './entities/user-preference.entity';
import { UpdatePreferenceInput } from './dto/update-preference.input';
import { User } from '../users/entities/user.entity';
import { Source } from '../sources/entities/source.entity';
import { Article } from '../articles/entities/article.entity';

@Resolver(() => UserPreference)
@UseGuards(JwtAuthGuard)
export class PreferencesResolver {
  constructor(private readonly preferencesService: PreferencesService) {}

  @Query(() => UserPreference, { name: 'myPreferences' })
  async getMyPreferences(@CurrentUser() user: User): Promise<UserPreference> {
    return this.preferencesService.findByUserId(user.id);
  }

  @Mutation(() => UserPreference)
  async updatePreferences(
    @CurrentUser() user: User,
    @Args('input') updatePreferenceInput: UpdatePreferenceInput,
  ): Promise<UserPreference> {
    return this.preferencesService.update(user.id, updatePreferenceInput);
  }

  @Mutation(() => UserPreference)
  async addPreferredTag(
    @CurrentUser() user: User,
    @Args('tagName') tagName: string,
  ): Promise<UserPreference> {
    return this.preferencesService.addPreferredTag(user.id, tagName);
  }

  @Mutation(() => UserPreference)
  async removePreferredTag(
    @CurrentUser() user: User,
    @Args('tagName') tagName: string,
  ): Promise<UserPreference> {
    return this.preferencesService.removePreferredTag(user.id, tagName);
  }

  @Query(() => [Source], { name: 'recommendedSources' })
  async getRecommendedSources(@CurrentUser() user: User): Promise<Source[]> {
    return this.preferencesService.getRecommendedSources(user.id);
  }

  @Query(() => [Article], { name: 'personalizedArticles' })
  async getPersonalizedArticles(
    @CurrentUser() user: User,
    @Args('limit', { type: () => Number, defaultValue: 20 }) limit: number,
  ): Promise<Article[]> {
    return this.preferencesService.getPersonalizedArticles(user.id, limit);
  }
}