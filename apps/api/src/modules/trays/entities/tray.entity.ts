import { ObjectType, Field, Int } from '@nestjs/graphql';
import { User } from '../../users/entities/user.entity';
import { Article } from '../../articles/entities/article.entity';

@ObjectType()
export class Tray {
  @Field()
  id: string;

  @Field()
  userId: string;

  @Field()
  name: string;

  @Field({ nullable: true })
  description?: string;

  @Field()
  isPublic: boolean;

  @Field(() => Int)
  itemCount: number;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;

  @Field(() => User, { nullable: true })
  user?: User;

  @Field(() => [TrayItem], { nullable: true })
  items?: TrayItem[];
}

@ObjectType()
export class TrayItem {
  @Field()
  id: string;

  @Field()
  trayId: string;

  @Field()
  articleId: string;

  @Field({ nullable: true })
  note?: string;

  @Field()
  createdAt: Date;

  @Field(() => Article, { nullable: true })
  article?: Article;
}