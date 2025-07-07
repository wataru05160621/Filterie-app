import {
  Resolver,
  Query,
  Mutation,
  Args,
  ResolveField,
  Parent,
} from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { TraysService } from './trays.service';
import { CreateTrayDto } from './dto/create-tray.dto';
import { UpdateTrayDto } from './dto/update-tray.dto';
import { AddItemToTrayDto } from './dto/add-item-to-tray.dto';

@Resolver(() => Tray)
@UseGuards(JwtAuthGuard)
export class TraysResolver {
  constructor(private readonly traysService: TraysService) {}

  @Mutation(() => Tray)
  async createTray(
    @CurrentUser() user: any,
    @Args('input') createTrayDto: CreateTrayDto,
  ) {
    return this.traysService.createTray(user.userId, createTrayDto);
  }

  @Query(() => [Tray])
  async myTrays(@CurrentUser() user: any) {
    return this.traysService.getUserTrays(user.userId);
  }

  @Query(() => Tray)
  async tray(@Args('id') id: string, @CurrentUser() user: any) {
    return this.traysService.getTray(id, user.userId);
  }

  @Mutation(() => Tray)
  async updateTray(
    @Args('id') id: string,
    @Args('input') updateTrayDto: UpdateTrayDto,
    @CurrentUser() user: any,
  ) {
    return this.traysService.updateTray(id, user.userId, updateTrayDto);
  }

  @Mutation(() => Boolean)
  async deleteTray(@Args('id') id: string, @CurrentUser() user: any) {
    await this.traysService.deleteTray(id, user.userId);
    return true;
  }

  @Mutation(() => TrayItem)
  async addToTray(
    @Args('trayId') trayId: string,
    @Args('input') addItemDto: AddItemToTrayDto,
    @CurrentUser() user: any,
  ) {
    return this.traysService.addItemToTray(trayId, user.userId, addItemDto);
  }

  @Mutation(() => Boolean)
  async removeFromTray(@Args('itemId') itemId: string, @CurrentUser() user: any) {
    await this.traysService.removeItemFromTray(itemId, user.userId);
    return true;
  }

  @Query(() => [Tray])
  async publicTrays() {
    return this.traysService.getPublicTrays();
  }

  @Query(() => TrayStats)
  async myTrayStats(@CurrentUser() user: any) {
    return this.traysService.getTrayStats(user.userId);
  }

  @ResolveField('itemCount')
  itemCount(@Parent() tray: any) {
    return tray._count?.items || 0;
  }

  @ResolveField('owner')
  owner(@Parent() tray: any) {
    return tray.user || null;
  }
}

// GraphQL Types
import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType()
class Tray {
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

  @Field(() => [TrayItem], { nullable: true })
  items?: TrayItem[];

  @Field(() => Int)
  itemCount: number;

  @Field(() => User, { nullable: true })
  owner?: User;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

@ObjectType()
class TrayItem {
  @Field()
  id: string;

  @Field()
  trayId: string;

  @Field()
  articleId: string;

  @Field({ nullable: true })
  note?: string;

  @Field(() => Article, { nullable: true })
  article?: Article;

  @Field()
  addedAt: Date;
}

@ObjectType()
class TrayStats {
  @Field(() => Int)
  trayCount: number;

  @Field(() => Int)
  totalItems: number;

  @Field(() => Int)
  publicTrays: number;
}

// Placeholder types - should be imported from their respective modules
class User {
  @Field()
  id: string;

  @Field()
  name: string;
}

class Article {
  @Field()
  id: string;

  @Field()
  title: string;
}