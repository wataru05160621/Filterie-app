import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { ConflictException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { AuthPayload } from './dto/auth-payload';
import { RegisterInput } from './dto/register.input';
import { LoginInput } from './dto/login.input';
import { RefreshTokenInput } from './dto/refresh-token.input';
import { RefreshTokenPayload } from './dto/refresh-payload';

@Resolver()
export class AuthResolver {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
  ) {}

  @Mutation(() => AuthPayload)
  async register(
    @Args('registerInput') registerInput: RegisterInput,
  ): Promise<AuthPayload> {
    // Check if email already exists
    const existingUser = await this.usersService.findByEmail(registerInput.email);
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    return this.authService.register(registerInput);
  }

  @Mutation(() => AuthPayload)
  async login(
    @Args('loginInput') loginInput: LoginInput,
  ): Promise<AuthPayload> {
    return this.authService.login(loginInput);
  }

  @Mutation(() => RefreshTokenPayload)
  async refreshToken(
    @Args('refreshTokenInput') refreshTokenInput: RefreshTokenInput,
  ): Promise<RefreshTokenPayload> {
    return this.authService.refreshToken(refreshTokenInput.refresh_token);
  }
}