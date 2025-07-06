import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards, UnauthorizedException } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UpdateUserInput } from './dto/update-user.input';
import { UserConnection } from './dto/user-connection';
import { UserFilterInput } from './dto/user-filter.input';

@Resolver(() => User)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Query(() => User)
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser() user: User): Promise<User> {
    const currentUser = await this.usersService.findOne(user.id);
    if (!currentUser) {
      throw new UnauthorizedException();
    }
    return currentUser;
  }

  @Query(() => UserConnection)
  @UseGuards(JwtAuthGuard)
  async users(
    @Args('filter', { nullable: true }) filter?: UserFilterInput,
  ): Promise<UserConnection> {
    return this.usersService.findAll(filter || {});
  }

  @Query(() => User, { nullable: true })
  @UseGuards(JwtAuthGuard)
  async user(@Args('id') id: string): Promise<User | null> {
    try {
      return await this.usersService.findOne(id);
    } catch (error) {
      return null;
    }
  }

  @Mutation(() => User)
  @UseGuards(JwtAuthGuard)
  async updateProfile(
    @CurrentUser() user: User,
    @Args('updateUserInput') updateUserInput: UpdateUserInput,
  ): Promise<User> {
    return this.usersService.update(user.id, updateUserInput);
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard)
  async deleteAccount(@CurrentUser() user: User): Promise<boolean> {
    try {
      await this.usersService.remove(user.id);
      return true;
    } catch (error) {
      return false;
    }
  }
}