import { InputType, Field, Int } from '@nestjs/graphql';
import { IsOptional, IsArray, Min, Max, IsDateString } from 'class-validator';

@InputType()
export class ArticleFilterInput {
  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  sourceIds?: string[];

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  tagNames?: string[];

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @Min(1)
  @Max(4)
  minTier?: number;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @Min(1)
  @Max(4)
  maxTier?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  publishedAfter?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsDateString()
  publishedBefore?: string;

  @Field({ nullable: true })
  @IsOptional()
  searchQuery?: string;

  @Field({ nullable: true })
  @IsOptional()
  language?: string;

  @Field({ nullable: true })
  @IsOptional()
  hasAiSummary?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  unreadOnly?: boolean;
}