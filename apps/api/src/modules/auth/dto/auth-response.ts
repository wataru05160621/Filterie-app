import { ObjectType, Field } from '@nestjs/graphql';
import { AuthUser } from '../entities/auth-user.entity';

@ObjectType()
export class AuthResponse {
  @Field()
  accessToken: string;

  @Field()
  refreshToken: string;

  @Field(() => AuthUser)
  user: AuthUser;
}