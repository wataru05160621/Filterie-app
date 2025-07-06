import { ObjectType, Field, ID, Int } from '@nestjs/graphql';
import { Tag } from '../../articles/entities/tag.entity';

@ObjectType()
export class UserPreference {
  @Field(() => ID)
  id: string;

  @Field()
  userId: string;

  @Field(() => [Tag])
  preferredTags?: Tag[];

  @Field(() => Int)
  minTier: number;

  @Field(() => Int)
  maxTier: number;

  @Field(() => [String])
  languages: string[];

  @Field()
  emailDigest: boolean;

  @Field({ nullable: true })
  digestFrequency?: string | null;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}