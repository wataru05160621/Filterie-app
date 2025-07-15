import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ThrottlerModule } from '@nestjs/throttler';
import { join } from 'path';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './modules/health/health.module';
import { SourcesModule } from './modules/sources/sources.module';
import { ArticlesModule } from './modules/articles/articles.module';
import { FeedModule } from './modules/feed/feed.module';
import { AiModule } from './modules/ai/ai.module';
import { PreferencesModule } from './modules/preferences/preferences.module';
import { PubSubModule } from './modules/pubsub/pubsub.module';
import { TierModule } from './modules/tier/tier.module';
import { TraysModule } from './modules/trays/trays.module';
import { SearchModule } from './modules/search/search.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // Rate limiting
    ThrottlerModule.forRoot([{
      ttl: 60000, // 1 minute
      limit: 100, // 100 requests per minute
    }]),

    // GraphQL
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      sortSchema: true,
      playground: process.env['NODE_ENV'] !== 'production',
      introspection: process.env['NODE_ENV'] !== 'production',
      context: ({ req, res, connection }: any) => {
        // WebSocket接続の場合
        if (connection) {
          return { req: connection.context };
        }
        // HTTP接続の場合
        return { req, res };
      },
      subscriptions: {
        'graphql-ws': {
          onConnect: (context: any) => {
            const { connectionParams } = context;
            // 認証トークンの検証
            if (connectionParams?.authorization) {
              return { authorization: connectionParams.authorization };
            }
            throw new Error('Missing auth');
          },
        },
      },
      formatError: (error) => {
        const graphQLFormattedError = {
          message: error.message,
          code: error.extensions?.['code'] || 'INTERNAL_SERVER_ERROR',
          path: error.path,
        };
        return graphQLFormattedError;
      },
    }),

    // Feature modules
    PrismaModule,
    PubSubModule,
    HealthModule,
    AuthModule,
    UsersModule,
    SourcesModule,
    ArticlesModule,
    FeedModule,
    AiModule,
    PreferencesModule,
    TierModule,
    TraysModule,
    SearchModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}