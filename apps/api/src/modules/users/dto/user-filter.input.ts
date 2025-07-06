import { InputType, Field, Int } from '@nestjs/graphql';
import { IsOptional, IsInt, Min, IsString } from 'class-validator';

@InputType()
export class UserFilterInput {
  @Field(() => Int, { nullable: true, defaultValue: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @Field(() => Int, { nullable: true, defaultValue: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  search?: string;
}