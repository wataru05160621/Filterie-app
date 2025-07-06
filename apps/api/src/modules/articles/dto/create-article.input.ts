import { InputType, Field } from '@nestjs/graphql';
import { IsNotEmpty, IsUrl, IsOptional, IsArray, IsDateString } from 'class-validator';

@InputType()
export class CreateArticleInput {
  @Field()
  @IsNotEmpty()
  sourceId: string;

  @Field()
  @IsNotEmpty()
  @IsUrl()
  originalUrl: string;

  @Field()
  @IsNotEmpty()
  title: string;

  @Field({ nullable: true })
  @IsOptional()
  content?: string;

  @Field({ nullable: true })
  @IsOptional()
  summary?: string;

  @Field()
  @IsDateString()
  publishedAt: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUrl()
  imageUrl?: string;

  @Field({ nullable: true })
  @IsOptional()
  author?: string;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  tagNames?: string[];
}