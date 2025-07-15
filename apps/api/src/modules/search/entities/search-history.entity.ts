import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
export class SearchHistory {
  @Field(() => ID)
  id: string;

  @Field()
  userId: string;

  @Field()
  query: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}