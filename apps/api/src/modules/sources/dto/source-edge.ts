import { ObjectType, Field } from '@nestjs/graphql';
import { Source } from '../entities/source.entity';

@ObjectType()
export class SourceEdge {
  @Field(() => Source)
  node: Source;

  @Field()
  cursor: string;
}