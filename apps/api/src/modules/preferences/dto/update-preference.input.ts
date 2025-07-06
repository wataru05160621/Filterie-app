import { InputType, Field, Int } from '@nestjs/graphql';
import { IsOptional, IsArray, Min, Max, IsBoolean, IsIn } from 'class-validator';

@InputType()
export class UpdatePreferenceInput {
  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  preferredTagNames?: string[];

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

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  languages?: string[];

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  emailDigest?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsIn(['daily', 'weekly', 'monthly'])
  digestFrequency?: string;
}