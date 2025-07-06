import { InputType, Field, Int } from '@nestjs/graphql';
import { IsOptional, IsInt, Min, Max, IsBoolean, IsString } from 'class-validator';

@InputType()
export class SourceFilterInput {
  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(4)
  tier?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  category?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  language?: string;
}