import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Authentication E2E Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
    await prisma.cleanDb();
  });

  afterAll(async () => {
    await prisma.cleanDb();
    await app.close();
  });

  beforeEach(async () => {
    await prisma.cleanDb();
  });

  describe('User Registration Flow', () => {
    const registerMutation = `
      mutation Register($input: RegisterInput!) {
        register(registerInput: $input) {
          access_token
          refresh_token
          user {
            id
            email
            name
          }
        }
      }
    `;

    it('should register a new user successfully', async () => {
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: registerMutation,
          variables: {
            input: {
              email: 'newuser@example.com',
              password: 'StrongPassword123!',
              name: 'New User',
            },
          },
        });

      expect(response.status).toBe(200);
      expect(response.body.data.register).toBeDefined();
      expect(response.body.data.register.access_token).toBeDefined();
      expect(response.body.data.register.refresh_token).toBeDefined();
      expect(response.body.data.register.user).toMatchObject({
        email: 'newuser@example.com',
        name: 'New User',
      });
      expect(response.body.data.register.user.id).toBeDefined();
    });

    it('should validate email format', async () => {
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: registerMutation,
          variables: {
            input: {
              email: 'invalid-email',
              password: 'StrongPassword123!',
              name: 'Test User',
            },
          },
        });

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('Bad Request');
    });

    it('should validate password length', async () => {
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: registerMutation,
          variables: {
            input: {
              email: 'test@example.com',
              password: '123',
              name: 'Test User',
            },
          },
        });

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('Bad Request');
    });

    it('should prevent duplicate email registration', async () => {
      // First registration
      await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: registerMutation,
          variables: {
            input: {
              email: 'duplicate@example.com',
              password: 'StrongPassword123!',
              name: 'First User',
            },
          },
        });

      // Attempt duplicate registration
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: registerMutation,
          variables: {
            input: {
              email: 'duplicate@example.com',
              password: 'AnotherPassword123!',
              name: 'Second User',
            },
          },
        });

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('Email already exists');
    });
  });

  describe('User Login Flow', () => {
    const loginMutation = `
      mutation Login($input: LoginInput!) {
        login(loginInput: $input) {
          access_token
          refresh_token
          user {
            id
            email
            name
          }
        }
      }
    `;

    beforeEach(async () => {
      // Create a test user
      await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            mutation {
              register(registerInput: {
                email: "testuser@example.com"
                password: "TestPassword123!"
                name: "Test User"
              }) {
                user {
                  id
                }
              }
            }
          `,
        });
    });

    it('should login with valid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: loginMutation,
          variables: {
            input: {
              email: 'testuser@example.com',
              password: 'TestPassword123!',
            },
          },
        });

      expect(response.status).toBe(200);
      expect(response.body.data.login).toBeDefined();
      expect(response.body.data.login.access_token).toBeDefined();
      expect(response.body.data.login.refresh_token).toBeDefined();
      expect(response.body.data.login.user).toMatchObject({
        email: 'testuser@example.com',
        name: 'Test User',
      });
    });

    it('should fail with invalid password', async () => {
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: loginMutation,
          variables: {
            input: {
              email: 'testuser@example.com',
              password: 'WrongPassword',
            },
          },
        });

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('Invalid credentials');
    });

    it('should fail with non-existent email', async () => {
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: loginMutation,
          variables: {
            input: {
              email: 'nonexistent@example.com',
              password: 'AnyPassword123!',
            },
          },
        });

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('Invalid credentials');
    });
  });

  describe('Token Refresh Flow', () => {
    let refreshToken: string;

    beforeEach(async () => {
      // Register and login to get tokens
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            mutation {
              register(registerInput: {
                email: "refresh@example.com"
                password: "RefreshPassword123!"
                name: "Refresh User"
              }) {
                refresh_token
              }
            }
          `,
        });

      refreshToken = response.body.data.register.refresh_token;
    });

    it('should refresh tokens with valid refresh token', async () => {
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            mutation RefreshToken($input: RefreshTokenInput!) {
              refreshToken(refreshTokenInput: $input) {
                access_token
                refresh_token
              }
            }
          `,
          variables: {
            input: {
              refresh_token: refreshToken,
            },
          },
        });

      expect(response.status).toBe(200);
      expect(response.body.data.refreshToken).toBeDefined();
      expect(response.body.data.refreshToken.access_token).toBeDefined();
      expect(response.body.data.refreshToken.refresh_token).toBeDefined();
      expect(response.body.data.refreshToken.refresh_token).not.toBe(
        refreshToken,
      );
    });

    it('should fail with invalid refresh token', async () => {
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            mutation {
              refreshToken(refreshTokenInput: {
                refresh_token: "invalid-refresh-token"
              }) {
                access_token
              }
            }
          `,
        });

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('Invalid refresh token');
    });
  });

  describe('Protected Route Access', () => {
    let accessToken: string;
    let userId: string;

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            mutation {
              register(registerInput: {
                email: "protected@example.com"
                password: "ProtectedPassword123!"
                name: "Protected User"
              }) {
                access_token
                user {
                  id
                }
              }
            }
          `,
        });

      accessToken = response.body.data.register.access_token;
      userId = response.body.data.register.user.id;
    });

    it('should access protected route with valid token', async () => {
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          query: `
            query {
              me {
                id
                email
                name
              }
            }
          `,
        });

      expect(response.status).toBe(200);
      expect(response.body.data.me).toMatchObject({
        id: userId,
        email: 'protected@example.com',
        name: 'Protected User',
      });
    });

    it('should deny access without token', async () => {
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

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('Unauthorized');
    });

    it('should deny access with expired/invalid token', async () => {
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', 'Bearer invalid-token')
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

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('Unauthorized');
    });
  });

  describe('Complete User Journey', () => {
    it('should complete full user journey: register -> login -> access protected resource -> refresh token', async () => {
      // Step 1: Register
      const registerResponse = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            mutation {
              register(registerInput: {
                email: "journey@example.com"
                password: "JourneyPassword123!"
                name: "Journey User"
              }) {
                access_token
                user {
                  id
                }
              }
            }
          `,
        });

      expect(registerResponse.body.data.register).toBeDefined();
      const userId = registerResponse.body.data.register.user.id;

      // Step 2: Login
      const loginResponse = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            mutation {
              login(loginInput: {
                email: "journey@example.com"
                password: "JourneyPassword123!"
              }) {
                access_token
                refresh_token
              }
            }
          `,
        });

      expect(loginResponse.body.data.login).toBeDefined();
      const { access_token, refresh_token } = loginResponse.body.data.login;

      // Step 3: Access protected resource
      const meResponse = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${access_token}`)
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

      expect(meResponse.body.data.me).toMatchObject({
        id: userId,
        email: 'journey@example.com',
      });

      // Step 4: Refresh token
      const refreshResponse = await request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            mutation {
              refreshToken(refreshTokenInput: {
                refresh_token: "${refresh_token}"
              }) {
                access_token
              }
            }
          `,
        });

      expect(refreshResponse.body.data.refreshToken.access_token).toBeDefined();
      const newAccessToken = refreshResponse.body.data.refreshToken.access_token;

      // Step 5: Use new token
      const finalResponse = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${newAccessToken}`)
        .send({
          query: `
            query {
              me {
                email
              }
            }
          `,
        });

      expect(finalResponse.body.data.me.email).toBe('journey@example.com');
    });
  });
});