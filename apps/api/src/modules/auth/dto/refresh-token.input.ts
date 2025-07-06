import { InputType, Field } from '@nestjs/graphql';
import { IsString } from 'class-validator';

@InputType()
export class RefreshTokenInput {
  @Field()
  @IsString()
  refreshToken: string;
}