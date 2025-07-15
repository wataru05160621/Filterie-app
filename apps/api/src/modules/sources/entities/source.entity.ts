import { ObjectType, Field, Int, ID } from '@nestjs/graphql';

@ObjectType()
export class Source {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  url: string;

  @Field(() => String, { nullable: true })
  feedUrl?: string | null;

  @Field(() => Int)
  tier: number;

  @Field()
  category: string;

  @Field()
  language: string;

  @Field()
  isActive: boolean;

  @Field(() => Date, { nullable: true })
  lastFetchedAt?: Date | null;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

@ObjectType()
export class TierEvaluation {
  @Field(() => Int)
  tier: number;

  @Field()
  confidence: number;

  @Field(() => [String])
  reasons: string[];
}