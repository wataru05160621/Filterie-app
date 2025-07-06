import { InputType, Field } from '@nestjs/graphql';
import { IsOptional, IsUrl, IsArray } from 'class-validator';

@InputType()
export class UpdateArticleInput {
  @Field({ nullable: true })
  @IsOptional()
  title?: string;

  @Field({ nullable: true })
  @IsOptional()
  content?: string;

  @Field({ nullable: true })
  @IsOptional()
  summary?: string;

  @Field({ nullable: true })
  @IsOptional()
  aiSummary?: string;

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