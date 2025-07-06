import { Resolver, Query, Mutation, Args, ID, Subscription } from '@nestjs/graphql';
import { UseGuards, Inject } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ArticlesService } from './articles.service';
import { Article } from './entities/article.entity';
import { CreateArticleInput } from './dto/create-article.input';
import { UpdateArticleInput } from './dto/update-article.input';
import { ArticleFilterInput } from './dto/article-filter.input';
import { PaginationInput } from '../common/dto/pagination.input';
import { ArticleConnection } from './dto/article-connection';
import { User } from '../users/entities/user.entity';
import { PubSubEngine } from 'graphql-subscriptions';
import { PUB_SUB } from '../pubsub/pubsub.module';
import { SubscriptionEvent, ArticleCreatedPayload, ArticleUpdatedPayload } from '../pubsub/subscription-events';

@Resolver(() => Article)
@UseGuards(JwtAuthGuard)
export class ArticlesResolver {
  constructor(
    private readonly articlesService: ArticlesService,
    @Inject(PUB_SUB) private pubSub: PubSubEngine,
  ) {}

  @Mutation(() => Article)
  async createArticle(
    @Args('input') createArticleInput: CreateArticleInput,
  ): Promise<Article> {
    const article = await this.articlesService.create(createArticleInput);
    
    // 新しい記事作成をサブスクリプションで通知
    await this.pubSub.publish(SubscriptionEvent.ARTICLE_CREATED, {
      [SubscriptionEvent.ARTICLE_CREATED]: {
        article,
        sourceId: article.sourceId,
      } as ArticleCreatedPayload,
    });
    
    return article;
  }

  @Query(() => ArticleConnection, { name: 'articles' })
  async findAll(
    @CurrentUser() user: User,
    @Args('filter', { nullable: true }) filter?: ArticleFilterInput,
    @Args('pagination', { nullable: true }) pagination?: PaginationInput,
  ): Promise<ArticleConnection> {
    return this.articlesService.findWithPagination(filter, pagination, user.id);
  }

  @Query(() => Article, { name: 'article', nullable: true })
  async findOne(@Args('id', { type: () => ID }) id: string): Promise<Article | null> {
    return this.articlesService.findOne(id);
  }

  @Query(() => Article, { name: 'articleByUrl', nullable: true })
  async findByUrl(@Args('url') url: string): Promise<Article | null> {
    return this.articlesService.findByUrl(url);
  }

  @Mutation(() => Article)
  async updateArticle(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') updateArticleInput: UpdateArticleInput,
  ): Promise<Article> {
    const article = await this.articlesService.update(id, updateArticleInput);
    
    // 記事更新をサブスクリプションで通知
    await this.pubSub.publish(SubscriptionEvent.ARTICLE_UPDATED, {
      [SubscriptionEvent.ARTICLE_UPDATED]: {
        article,
        updatedFields: Object.keys(updateArticleInput),
      } as ArticleUpdatedPayload,
    });
    
    return article;
  }

  @Mutation(() => Boolean)
  async deleteArticle(@Args('id', { type: () => ID }) id: string): Promise<boolean> {
    return this.articlesService.remove(id);
  }

  @Mutation(() => Boolean)
  async markArticleAsRead(
    @CurrentUser() user: User,
    @Args('articleId', { type: () => ID }) articleId: string,
    @Args('readDuration', { type: () => Number, nullable: true }) readDuration?: number,
  ): Promise<boolean> {
    await this.articlesService.markAsRead(articleId, user.id, readDuration);
    return true;
  }

  @Mutation(() => Boolean)
  async bookmarkArticle(
    @CurrentUser() user: User,
    @Args('articleId', { type: () => ID }) articleId: string,
    @Args('note', { nullable: true }) note?: string,
  ): Promise<boolean> {
    await this.articlesService.bookmark(articleId, user.id, note);
    return true;
  }

  @Mutation(() => Boolean)
  async removeBookmark(
    @CurrentUser() user: User,
    @Args('articleId', { type: () => ID }) articleId: string,
  ): Promise<boolean> {
    return this.articlesService.removeBookmark(articleId, user.id);
  }
  
  // サブスクリプション
  @Subscription(() => Article, {
    filter: (payload, variables) => {
      // ソースIDでフィルタリング
      if (variables.sourceId && payload.articleCreated.sourceId !== variables.sourceId) {
        return false;
      }
      return true;
    },
  })
  articleCreated(
    @Args('sourceId', { type: () => ID, nullable: true }) sourceId?: string,
  ) {
    return this.pubSub.asyncIterator(SubscriptionEvent.ARTICLE_CREATED);
  }
  
  @Subscription(() => Article)
  articleUpdated() {
    return this.pubSub.asyncIterator(SubscriptionEvent.ARTICLE_UPDATED);
  }
}