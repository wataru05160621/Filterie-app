import { InputType, Field } from '@nestjs/graphql';
import { IsString } from 'class-validator';

@InputType()
export class SaveSearchHistoryInput {
  @Field()
  @IsString()
  userId: string;

  @Field()
  @IsString()
  query: string;
}