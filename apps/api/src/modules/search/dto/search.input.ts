import { InputType, Field, Int } from '@nestjs/graphql';
import { IsString, IsArray, IsOptional, IsInt, Min, IsIn } from 'class-validator';

@InputType()
export class SearchFilters {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  sourceId?: string;

  @Field(() => Date, { nullable: true })
  @IsOptional()
  publishedAfter?: Date;

  @Field(() => Date, { nullable: true })
  @IsOptional()
  publishedBefore?: Date;
}

@InputType()
export class SearchPagination {
  @Field(() => Int)
  @IsInt()
  @Min(1)
  page: number;

  @Field(() => Int)
  @IsInt()
  @Min(1)
  limit: number;
}

@InputType()
export class SearchInput {
  @Field()
  @IsString()
  query: string;

  @Field(() => [String])
  @IsArray()
  @IsIn(['title', 'content', 'tags'], { each: true })
  fields: Array<'title' | 'content' | 'tags'>;

  @Field(() => SearchFilters, { nullable: true })
  @IsOptional()
  filters?: SearchFilters;

  @Field(() => SearchPagination, { nullable: true })
  @IsOptional()
  pagination?: SearchPagination;

  @Field({ nullable: true })
  @IsOptional()
  @IsIn(['publishedAt', 'readCount', 'createdAt'])
  sortBy?: 'publishedAt' | 'readCount' | 'createdAt';

  @Field({ nullable: true })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}