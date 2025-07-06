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

  @Field({ nullable: true })
  content?: string | null;

  @Field({ nullable: true })
  summary?: string | null;

  @Field({ nullable: true })
  aiSummary?: string | null;

  @Field()
  publishedAt: Date;

  @Field()
  fetchedAt: Date;

  @Field({ nullable: true })
  imageUrl?: string | null;

  @Field({ nullable: true })
  author?: string | null;

  @Field(() => [Tag])
  tags?: Tag[];

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}