import { ObjectType, Field } from '@nestjs/graphql';
import { AuthUser } from './auth-user';

@ObjectType()
export class AuthPayload {
  @Field()
  access_token: string;

  @Field()
  refresh_token: string;

  @Field(() => AuthUser)
  user: AuthUser;
}