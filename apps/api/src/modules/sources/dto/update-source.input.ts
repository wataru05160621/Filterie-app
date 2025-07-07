import { InputType, Field, PartialType, Int } from '@nestjs/graphql';
import { CreateSourceInput } from './create-source.input';
import { IsBoolean, IsOptional, IsInt, Min, Max } from 'class-validator';

@InputType()
export class UpdateSourceInput extends PartialType(CreateSourceInput) {
  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(4)
  tier?: number;
}