import { InputType, Field, PartialType } from '@nestjs/graphql';
import { CreateSourceInput } from './create-source.input';
import { IsBoolean, IsOptional } from 'class-validator';

@InputType()
export class UpdateSourceInput extends PartialType(CreateSourceInput) {
  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}