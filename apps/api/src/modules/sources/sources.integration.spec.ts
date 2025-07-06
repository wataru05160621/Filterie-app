import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../app.module';
import { PrismaService } from '../../prisma/prisma.service';

describe('Sources Integration Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const testSource = {
    name: 'Integration Test Source',
    url: 'https://test.example.com',
    feedUrl: 'https://test.example.com/feed',
    tier: 3,
    category: 'test',
    language: 'en',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = moduleFixture.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Clean up test data
    await prisma.source.deleteMany({
      where: { category: 'test' },
    });
  });

  describe('GraphQL Queries and Mutations', () => {
    describe('createSource mutation', () => {
      it('should create a new source', async () => {
        const mutation = `
          mutation CreateSource($input: CreateSourceInput!) {
            createSource(input: $input) {
              id
              name
              url
              feedUrl
              tier
              category
              language
              isActive
            }
          }
        `;

        const response = await request(app.getHttpServer())
          .post('/graphql')
          .send({
            query: mutation,
            variables: {
              input: testSource,
            },
          })
          .expect(200);

        const { createSource } = response.body.data;
        expect(createSource).toMatchObject({
          name: testSource.name,
          url: testSource.url,
          feedUrl: testSource.feedUrl,
          category: testSource.category,
          language: testSource.language,
          isActive: true,
        });
        expect(createSource.id).toBeDefined();
        expect(createSource.tier).toBeGreaterThanOrEqual(1);
        expect(createSource.tier).toBeLessThanOrEqual(4);
      });

      it('should validate required fields', async () => {
        const mutation = `
          mutation CreateSource($input: CreateSourceInput!) {
            createSource(input: $input) {
              id
            }
          }
        `;

        const response = await request(app.getHttpServer())
          .post('/graphql')
          .send({
            query: mutation,
            variables: {
              input: {
                name: 'Test',
                // Missing required fields
              },
            },
          })
          .expect(200);

        expect(response.body.errors).toBeDefined();
        expect(response.body.errors.length).toBeGreaterThan(0);
      });
    });

    describe('sources query', () => {
      it('should return paginated sources', async () => {
        // Create test sources
        await Promise.all([
          prisma.source.create({ data: { ...testSource, name: 'Source 1', tier: 1 } }),
          prisma.source.create({ data: { ...testSource, name: 'Source 2', tier: 2 } }),
          prisma.source.create({ data: { ...testSource, name: 'Source 3', tier: 3 } }),
        ]);

        const query = `
          query GetSources($filter: SourceFilterInput, $pagination: PaginationInput) {
            sources(filter: $filter, pagination: $pagination) {
              edges {
                node {
                  id
                  name
                  tier
                  category
                }
                cursor
              }
              pageInfo {
                hasNextPage
                hasPreviousPage
                startCursor
                endCursor
              }
              totalCount
            }
          }
        `;

        const response = await request(app.getHttpServer())
          .post('/graphql')
          .send({
            query,
            variables: {
              pagination: { limit: 2, offset: 0 },
            },
          })
          .expect(200);

        const { sources } = response.body.data;
        expect(sources.edges).toHaveLength(2);
        expect(sources.totalCount).toBe(3);
        expect(sources.pageInfo.hasNextPage).toBe(true);
      });

      it('should filter sources by tier', async () => {
        // Create test sources with different tiers
        await Promise.all([
          prisma.source.create({ data: { ...testSource, name: 'Tier 1 Source', tier: 1 } }),
          prisma.source.create({ data: { ...testSource, name: 'Tier 2 Source', tier: 2 } }),
          prisma.source.create({ data: { ...testSource, name: 'Another Tier 2', tier: 2 } }),
        ]);

        const query = `
          query GetSources($filter: SourceFilterInput) {
            sources(filter: $filter) {
              edges {
                node {
                  name
                  tier
                }
              }
              totalCount
            }
          }
        `;

        const response = await request(app.getHttpServer())
          .post('/graphql')
          .send({
            query,
            variables: {
              filter: { tier: 2 },
            },
          })
          .expect(200);

        const { sources } = response.body.data;
        expect(sources.edges).toHaveLength(2);
        expect(sources.totalCount).toBe(2);
        sources.edges.forEach((edge: any) => {
          expect(edge.node.tier).toBe(2);
        });
      });
    });

    describe('source query', () => {
      it('should return a single source by id', async () => {
        const createdSource = await prisma.source.create({
          data: testSource,
        });

        const query = `
          query GetSource($id: ID!) {
            source(id: $id) {
              id
              name
              url
              feedUrl
              tier
              category
              language
              isActive
            }
          }
        `;

        const response = await request(app.getHttpServer())
          .post('/graphql')
          .send({
            query,
            variables: {
              id: createdSource.id,
            },
          })
          .expect(200);

        const { source } = response.body.data;
        expect(source).toMatchObject({
          id: createdSource.id,
          name: testSource.name,
          url: testSource.url,
          feedUrl: testSource.feedUrl,
          category: testSource.category,
          language: testSource.language,
          isActive: true,
        });
      });

      it('should return null for non-existent source', async () => {
        const query = `
          query GetSource($id: ID!) {
            source(id: $id) {
              id
            }
          }
        `;

        const response = await request(app.getHttpServer())
          .post('/graphql')
          .send({
            query,
            variables: {
              id: '00000000-0000-0000-0000-000000000000',
            },
          })
          .expect(200);

        expect(response.body.data.source).toBeNull();
      });
    });

    describe('updateSource mutation', () => {
      it('should update a source', async () => {
        const createdSource = await prisma.source.create({
          data: testSource,
        });

        const mutation = `
          mutation UpdateSource($id: ID!, $input: UpdateSourceInput!) {
            updateSource(id: $id, input: $input) {
              id
              name
              isActive
            }
          }
        `;

        const response = await request(app.getHttpServer())
          .post('/graphql')
          .send({
            query: mutation,
            variables: {
              id: createdSource.id,
              input: {
                name: 'Updated Source Name',
                isActive: false,
              },
            },
          })
          .expect(200);

        const { updateSource } = response.body.data;
        expect(updateSource).toMatchObject({
          id: createdSource.id,
          name: 'Updated Source Name',
          isActive: false,
        });
      });
    });

    describe('deleteSource mutation', () => {
      it('should delete a source', async () => {
        const createdSource = await prisma.source.create({
          data: testSource,
        });

        const mutation = `
          mutation DeleteSource($id: ID!) {
            deleteSource(id: $id)
          }
        `;

        const response = await request(app.getHttpServer())
          .post('/graphql')
          .send({
            query: mutation,
            variables: {
              id: createdSource.id,
            },
          })
          .expect(200);

        expect(response.body.data.deleteSource).toBe(true);

        // Verify source was deleted
        const deletedSource = await prisma.source.findUnique({
          where: { id: createdSource.id },
        });
        expect(deletedSource).toBeNull();
      });
    });

    describe('evaluateSourceTier query', () => {
      it('should evaluate tier for a given URL', async () => {
        const query = `
          query EvaluateSourceTier($url: String!) {
            evaluateSourceTier(url: $url) {
              tier
              confidence
              reasons
            }
          }
        `;

        const response = await request(app.getHttpServer())
          .post('/graphql')
          .send({
            query,
            variables: {
              url: 'https://www.whitehouse.gov',
            },
          })
          .expect(200);

        const { evaluateSourceTier } = response.body.data;
        expect(evaluateSourceTier.tier).toBe(1);
        expect(evaluateSourceTier.confidence).toBeGreaterThan(0.8);
        expect(evaluateSourceTier.reasons).toContain('Government domain (.gov)');
      });
    });
  });
});