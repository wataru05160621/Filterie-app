import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
export class AuthUser {
  @Field(() => ID)
  id: string;

  @Field()
  email: string;

  @Field()
  name: string;
}