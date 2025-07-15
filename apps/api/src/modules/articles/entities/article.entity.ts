import { ObjectType, Field, ID } from '@nestjs/graphql';
import { Source } from '../../sources/entities/source.entity';
import { Tag } from './tag.entity';

@ObjectType()
export class Article {
  @Field(() => ID)
  id: string;

  @Field()
  sourceId: string;

  @Field(() => Source)
  source?: Source;

  @Field()
  originalUrl: string;

  @Field()
  title: string;

  @Field(() => String, { nullable: true })
  content?: string | null;

  @Field(() => String, { nullable: true })
  summary?: string | null;

  @Field(() => String, { nullable: true })
  aiSummary?: string | null;

  @Field()
  publishedAt: Date;

  @Field()
  fetchedAt: Date;

  @Field(() => String, { nullable: true })
  imageUrl?: string | null;

  @Field(() => String, { nullable: true })
  author?: string | null;

  @Field(() => [Tag])
  tags?: Tag[];

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}