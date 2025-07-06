import { ObjectType, Field, Int } from '@nestjs/graphql';
import { SourceEdge } from './source-edge';
import { PageInfo } from './page-info';

@ObjectType()
export class SourceConnection {
  @Field(() => [SourceEdge])
  edges: SourceEdge[];

  @Field(() => PageInfo)
  pageInfo: PageInfo;

  @Field(() => Int)
  totalCount: number;
}