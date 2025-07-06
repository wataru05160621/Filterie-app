import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
export class SourceFeedFetchedPayload {
  @Field(() => ID)
  sourceId: string;

  @Field()
  sourceName: string;

  @Field()
  newArticlesCount: number;

  @Field()
  timestamp: Date;
}