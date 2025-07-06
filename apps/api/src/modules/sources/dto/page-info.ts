import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class PageInfo {
  @Field()
  hasNextPage: boolean;

  @Field()
  hasPreviousPage: boolean;

  @Field()
  startCursor: string;

  @Field()
  endCursor: string;
}