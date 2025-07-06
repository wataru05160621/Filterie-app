import { InputType, Field, Int } from '@nestjs/graphql';
import { IsOptional, Min, Max } from 'class-validator';

@InputType()
export class PaginationInput {
  @Field(() => Int, { nullable: true, defaultValue: 10 })
  @IsOptional()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @Field(() => Int, { nullable: true, defaultValue: 0 })
  @IsOptional()
  @Min(0)
  offset?: number = 0;
}