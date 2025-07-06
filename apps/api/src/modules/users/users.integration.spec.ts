import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import request from 'supertest';
import { UsersModule } from './users.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthModule } from '../auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

describe('Users Module Integration Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
        GraphQLModule.forRoot<ApolloDriverConfig>({
          driver: ApolloDriver,
          autoSchemaFile: true,
          playground: false,
        }),
        PrismaModule,
        AuthModule,
        UsersModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
    await prisma.cleanDb();

    // Create a test user and get auth token
    const hashedPassword = await bcrypt.hash('password123', 10);
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        password: hashedPassword,
        name: 'Test User',
      },
    });
    userId = user.id;

    // Login to get token
    const loginResponse = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: `
          mutation {
            login(loginInput: { email: "test@example.com", password: "password123" }) {
              access_token
            }
          }
        `,
      });

    authToken = loginResponse.body.data.login.access_token;
  });

  afterAll(async () => {
    await prisma.cleanDb();
    await app.close();
  });

  describe('Query me', () => {
    it('should return current user info', async () => {
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          query: `
            query {
              me {
                id
                email
                name
                createdAt
                updatedAt
              }
            }
          `,
        });

      expect(response.body.data.me).toMatchObject({
        id: userId,
        email: 'test@example.com',
        name: 'Test User',
      });
      expect(response.body.data.me.createdAt).toBeDefined();
      expect(response.body.data.me.updatedAt).toBeDefined();
    });

    it('should return error without auth token', async () => {
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            query {
              me {
                id
                email
              }
            }
          `,
        });

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('Unauthorized');
    });
  });

  describe('Query users', () => {
    beforeEach(async () => {
      // Create additional test users
      await prisma.user.createMany({
        data: [
          {
            email: 'user2@example.com',
            password: await bcrypt.hash('password', 10),
            name: 'User Two',
          },
          {
            email: 'user3@example.com',
            password: await bcrypt.hash('password', 10),
            name: 'User Three',
          },
        ],
      });
    });

    it('should return paginated users', async () => {
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          query: `
            query {
              users(filter: { page: 1, limit: 2 }) {
                items {
                  id
                  email
                  name
                }
                total
                page
                limit
                totalPages
              }
            }
          `,
        });

      expect(response.body.data.users).toMatchObject({
        total: 3,
        page: 1,
        limit: 2,
        totalPages: 2,
      });
      expect(response.body.data.users.items).toHaveLength(2);
    });

    it('should filter users by search term', async () => {
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          query: `
            query {
              users(filter: { search: "Two" }) {
                items {
                  name
                  email
                }
                total
              }
            }
          `,
        });

      expect(response.body.data.users.total).toBe(1);
      expect(response.body.data.users.items[0].name).toBe('User Two');
    });
  });

  describe('Query user', () => {
    it('should return a specific user by id', async () => {
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          query: `
            query {
              user(id: "${userId}") {
                id
                email
                name
              }
            }
          `,
        });

      expect(response.body.data.user).toMatchObject({
        id: userId,
        email: 'test@example.com',
        name: 'Test User',
      });
    });

    it('should return null for non-existent user', async () => {
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          query: `
            query {
              user(id: "non-existent-id") {
                id
                email
              }
            }
          `,
        });

      expect(response.body.data.user).toBeNull();
    });
  });

  describe('Mutation updateProfile', () => {
    it('should update user profile', async () => {
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          query: `
            mutation {
              updateProfile(updateUserInput: { name: "Updated Name" }) {
                id
                name
                email
              }
            }
          `,
        });

      expect(response.body.data.updateProfile).toMatchObject({
        id: userId,
        name: 'Updated Name',
        email: 'test@example.com',
      });

      // Verify in database
      const updatedUser = await prisma.user.findUnique({
        where: { id: userId },
      });
      expect(updatedUser?.name).toBe('Updated Name');
    });

    it('should update email', async () => {
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          query: `
            mutation {
              updateProfile(updateUserInput: { email: "newemail@example.com" }) {
                id
                email
              }
            }
          `,
        });

      expect(response.body.data.updateProfile.email).toBe(
        'newemail@example.com',
      );
    });

    it('should return error for duplicate email', async () => {
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          query: `
            mutation {
              updateProfile(updateUserInput: { email: "user2@example.com" }) {
                id
                email
              }
            }
          `,
        });

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('Email already exists');
    });
  });

  describe('Mutation deleteAccount', () => {
    it('should delete user account', async () => {
      // Create a new user for deletion test
      const newUser = await prisma.user.create({
        data: {
          email: 'delete@example.com',
          password: await bcrypt.hash('password', 10),
          name: 'Delete Me',
        },
      });

      // Login as the new user
      const loginResponse = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            mutation {
              login(loginInput: { email: "delete@example.com", password: "password" }) {
                access_token
              }
            }
          `,
        });

      const deleteToken = loginResponse.body.data.login.access_token;

      // Delete account
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${deleteToken}`)
        .send({
          query: `
            mutation {
              deleteAccount
            }
          `,
        });

      expect(response.body.data.deleteAccount).toBe(true);

      // Verify user is deleted
      const deletedUser = await prisma.user.findUnique({
        where: { id: newUser.id },
      });
      expect(deletedUser).toBeNull();
    });
  });

  describe('Authorization tests', () => {
    it('should require authentication for users query', async () => {
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            query {
              users {
                items {
                  id
                }
              }
            }
          `,
        });

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('Unauthorized');
    });

    it('should require authentication for updateProfile', async () => {
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            mutation {
              updateProfile(updateUserInput: { name: "Hacker" }) {
                id
              }
            }
          `,
        });

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('Unauthorized');
    });
  });
});