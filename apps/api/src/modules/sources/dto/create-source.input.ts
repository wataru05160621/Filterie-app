import { InputType, Field } from '@nestjs/graphql';
import { IsUrl, IsString, IsOptional, MinLength } from 'class-validator';

@InputType()
export class CreateSourceInput {
  @Field()
  @IsString()
  @MinLength(1)
  name: string;

  @Field()
  @IsUrl()
  url: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsUrl()
  feedUrl?: string;

  @Field()
  @IsString()
  category: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  language?: string;
}