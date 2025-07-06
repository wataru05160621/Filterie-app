import { ObjectType, Field, Int } from '@nestjs/graphql';
import { PageInfo } from '../../sources/dto/page-info';
import { Article } from '../entities/article.entity';

@ObjectType()
export class ArticleEdge {
  @Field(() => Article)
  node: Article;

  @Field()
  cursor: string;
}

@ObjectType()
export class ArticleConnection {
  @Field(() => [ArticleEdge])
  edges: ArticleEdge[];

  @Field(() => PageInfo)
  pageInfo: PageInfo;

  @Field(() => Int)
  totalCount: number;
}