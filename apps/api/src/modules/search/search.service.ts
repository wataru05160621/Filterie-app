import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

export interface SearchOptions {
  query: string;
  fields: Array<'title' | 'content' | 'tags'>;
  filters?: {
    sourceId?: string;
    publishedAfter?: Date;
    publishedBefore?: Date;
  };
  pagination?: {
    page: number;
    limit: number;
  };
  sortBy?: 'publishedAt' | 'readCount' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface FullTextSearchOptions {
  query: string;
  fields: Array<'title' | 'content'>;
  language?: 'english' | 'japanese';
  includeRelevanceScore?: boolean;
  filters?: SearchOptions['filters'];
  pagination?: SearchOptions['pagination'];
}

export interface RegexSearchOptions {
  pattern: string;
  fields: Array<'title' | 'content'>;
  flags?: string;
  filters?: SearchOptions['filters'];
  pagination?: SearchOptions['pagination'];
}

export interface RelativeTimeSearchOptions {
  query: string;
  fields: Array<'title' | 'content' | 'tags'>;
  timeFilter: {
    within: string; // e.g., '24h', '7d', '1m'
  };
  pagination?: SearchOptions['pagination'];
}

export interface CursorSearchOptions {
  query: string;
  fields: Array<'title' | 'content' | 'tags'>;
  pageSize: number;
  cursor?: string;
  filters?: SearchOptions['filters'];
}

@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  async searchArticles(options: SearchOptions) {
    const {
      query,
      fields,
      filters,
      pagination,
      sortBy = 'publishedAt',
      sortOrder = 'desc',
    } = options;

    const whereConditions: Prisma.ArticleWhereInput[] = [];

    // Build search conditions based on fields
    if (fields.length === 1) {
      const field = fields[0];
      if (field === 'title') {
        whereConditions.push({
          title: {
            contains: query,
            mode: 'insensitive',
          },
        });
      } else if (field === 'content') {
        whereConditions.push({
          content: {
            contains: query,
            mode: 'insensitive',
          },
        });
      } else if (field === 'tags') {
        whereConditions.push({
          tags: {
            some: {
              name: {
                contains: query,
                mode: 'insensitive',
              },
            },
          },
        });
      }
    } else if (fields.length > 1) {
      const orConditions: Prisma.ArticleWhereInput[] = [];
      
      if (fields.includes('title')) {
        orConditions.push({
          title: {
            contains: query,
            mode: 'insensitive',
          },
        });
      }
      
      if (fields.includes('content')) {
        orConditions.push({
          content: {
            contains: query,
            mode: 'insensitive',
          },
        });
      }
      
      if (fields.includes('tags')) {
        orConditions.push({
          tags: {
            some: {
              name: {
                contains: query,
                mode: 'insensitive',
              },
            },
          },
        });
      }
      
      whereConditions.push({ OR: orConditions });
    }

    // Apply filters
    if (filters) {
      const filterConditions: Prisma.ArticleWhereInput = {};
      
      if (filters.sourceId) {
        filterConditions.sourceId = filters.sourceId;
      }
      
      if (filters.publishedAfter || filters.publishedBefore) {
        filterConditions.publishedAt = {};
        if (filters.publishedAfter) {
          filterConditions.publishedAt.gte = filters.publishedAfter;
        }
        if (filters.publishedBefore) {
          filterConditions.publishedAt.lte = filters.publishedBefore;
        }
      }
      
      if (Object.keys(filterConditions).length > 0) {
        whereConditions.push(filterConditions);
      }
    }

    // Build final where clause
    let where: Prisma.ArticleWhereInput;
    if (whereConditions.length === 0) {
      where = {};
    } else if (whereConditions.length === 1) {
      where = whereConditions[0]!;
    } else {
      where = { AND: whereConditions };
    }

    // Build query options
    const queryOptions: Prisma.ArticleFindManyArgs = {
      where,
      include: {
        tags: true,
        source: true,
      },
      orderBy: {
        [sortBy]: sortOrder,
      },
    };

    // Apply pagination
    if (pagination) {
      queryOptions.skip = (pagination.page - 1) * pagination.limit;
      queryOptions.take = pagination.limit;
    }

    return this.prisma.article.findMany(queryOptions);
  }

  async getSearchSuggestions(query: string): Promise<string[]> {
    const tags = await this.prisma.tag.findMany({
      where: {
        name: {
          startsWith: query,
          mode: 'insensitive',
        },
      },
      take: 10,
      orderBy: {
        name: 'asc',
      },
    });

    return tags.map(tag => tag.name);
  }

  async saveSearchHistory(userId: string, query: string): Promise<void> {
    await this.prisma.searchHistory.create({
      data: {
        userId,
        query,
      },
    });
  }

  async getSearchHistory(userId: string) {
    return this.prisma.searchHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
  }

  // Enhanced full-text search with PostgreSQL
  async searchArticlesWithFullText(options: FullTextSearchOptions) {
    const { query, fields, language = 'english', includeRelevanceScore, filters, pagination } = options;
    
    // Build the full-text search query
    const searchVector = fields.includes('title') && fields.includes('content')
      ? `to_tsvector('${language}', title || ' ' || content)`
      : fields.includes('title')
      ? `to_tsvector('${language}', title)`
      : `to_tsvector('${language}', content)`;
    
    const tsQuery = `to_tsquery('${language}', $1)`;
    
    let sql = `
      SELECT 
        id, title, content, "publishedAt", "sourceId", "createdAt", "updatedAt"
        ${includeRelevanceScore ? `, ts_rank(${searchVector}, ${tsQuery}) as relevance_score` : ''}
      FROM "Article"
      WHERE ${searchVector} @@ ${tsQuery}
    `;
    
    // Apply filters
    const conditions: string[] = [];
    const params: any[] = [query.split(' ').join(' & ')]; // Convert to tsquery format
    
    if (filters?.sourceId) {
      conditions.push(`"sourceId" = $${params.length + 1}`);
      params.push(filters.sourceId);
    }
    
    if (filters?.publishedAfter) {
      conditions.push(`"publishedAt" >= $${params.length + 1}`);
      params.push(filters.publishedAfter);
    }
    
    if (filters?.publishedBefore) {
      conditions.push(`"publishedAt" <= $${params.length + 1}`);
      params.push(filters.publishedBefore);
    }
    
    if (conditions.length > 0) {
      sql += ` AND ${conditions.join(' AND ')}`;
    }
    
    // Order by relevance if score is included
    if (includeRelevanceScore) {
      sql += ` ORDER BY relevance_score DESC`;
    } else {
      sql += ` ORDER BY "publishedAt" DESC`;
    }
    
    // Apply pagination
    if (pagination) {
      sql += ` LIMIT ${pagination.limit} OFFSET ${(pagination.page - 1) * pagination.limit}`;
    }
    
    const results = await this.prisma.$queryRaw(Prisma.raw(sql), ...params);
    
    // Load related data
    const articleIds = (results as any[]).map(r => r.id);
    const articlesWithRelations = await this.prisma.article.findMany({
      where: { id: { in: articleIds } },
      include: { tags: true, source: true },
    });
    
    // Merge results with relevance scores
    return (results as any[]).map(result => {
      const article = articlesWithRelations.find(a => a.id === result.id);
      return includeRelevanceScore 
        ? { ...article, relevance_score: result.relevance_score }
        : article;
    });
  }

  // Regular expression search
  async searchWithRegex(options: RegexSearchOptions) {
    const { pattern, fields, flags = '', filters, pagination } = options;
    
    // Validate regex pattern
    try {
      new RegExp(pattern, flags);
    } catch (error) {
      throw new BadRequestException('Invalid regular expression');
    }
    
    const whereConditions: Prisma.ArticleWhereInput = {};
    
    // Build regex conditions using raw SQL
    const regexConditions: string[] = [];
    
    if (fields.includes('title')) {
      regexConditions.push(`title ~${flags.includes('i') ? '*' : ''} '${pattern}'`);
    }
    
    if (fields.includes('content')) {
      regexConditions.push(`content ~${flags.includes('i') ? '*' : ''} '${pattern}'`);
    }
    
    // Apply filters
    if (filters) {
      if (filters.sourceId) {
        whereConditions.sourceId = filters.sourceId;
      }
      
      if (filters.publishedAfter || filters.publishedBefore) {
        whereConditions.publishedAt = {};
        if (filters.publishedAfter) {
          whereConditions.publishedAt.gte = filters.publishedAfter;
        }
        if (filters.publishedBefore) {
          whereConditions.publishedAt.lte = filters.publishedBefore;
        }
      }
    }
    
    // Execute query with raw SQL for regex
    const sql = `
      SELECT * FROM "Article"
      WHERE (${regexConditions.join(' OR ')})
      ${Object.keys(whereConditions).length > 0 ? ' AND ' + this.buildWhereClause(whereConditions) : ''}
      ORDER BY "publishedAt" DESC
      ${pagination ? `LIMIT ${pagination.limit} OFFSET ${(pagination.page - 1) * pagination.limit}` : ''}
    `;
    
    return this.prisma.$queryRaw(Prisma.raw(sql));
  }

  // Search with relative time filters
  async searchWithRelativeTime(options: RelativeTimeSearchOptions) {
    const { query, fields, timeFilter, pagination } = options;
    
    // Parse relative time
    const now = new Date();
    let publishedAfter: Date;
    
    const match = timeFilter.within.match(/^(\d+)([hdwm])$/);
    if (!match) {
      throw new BadRequestException('Invalid time filter format');
    }
    
    const [, amount, unit] = match;
    const value = parseInt(amount!);
    
    switch (unit) {
      case 'h': // hours
        publishedAfter = new Date(now.getTime() - value * 60 * 60 * 1000);
        break;
      case 'd': // days
        publishedAfter = new Date(now.getTime() - value * 24 * 60 * 60 * 1000);
        break;
      case 'w': // weeks
        publishedAfter = new Date(now.getTime() - value * 7 * 24 * 60 * 60 * 1000);
        break;
      case 'm': // months
        publishedAfter = new Date(now.getTime() - value * 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        throw new BadRequestException('Invalid time unit');
    }
    
    return this.searchArticles({
      query,
      fields,
      filters: { publishedAfter },
      pagination,
    });
  }

  // Cursor-based pagination for large result sets
  async searchWithCursor(options: CursorSearchOptions) {
    const { query, fields, pageSize, cursor, filters } = options;
    
    const whereConditions = this.buildSearchConditions({ query, fields, filters });
    
    // Add cursor condition
    if (cursor) {
      whereConditions.id = { gt: cursor };
    }
    
    const results = await this.prisma.article.findMany({
      where: whereConditions,
      take: pageSize + 1, // Fetch one extra to determine if there's a next page
      orderBy: { id: 'asc' },
      include: { tags: true, source: true },
    });
    
    const hasNextPage = results.length > pageSize;
    const items = hasNextPage ? results.slice(0, pageSize) : results;
    const nextCursor = hasNextPage && items.length > 0 ? items[items.length - 1]!.id : null;
    
    return {
      results: items,
      nextCursor,
      hasNextPage,
    };
  }

  // Search with caching
  async searchWithCache(options: { query: string; fields: Array<'title' | 'content' | 'tags'>; cache: Map<string, any> }) {
    const { query, fields, cache } = options;
    const cacheKey = `${query}-${fields.join(',')}`;
    
    // Check cache
    if (cache.has(cacheKey)) {
      return cache.get(cacheKey);
    }
    
    // Perform search
    const results = await this.searchArticles({ query, fields });
    
    // Cache results
    cache.set(cacheKey, results);
    
    return results;
  }

  // Create search indexes for better performance
  async createSearchIndexes() {
    // Create GIN index for full-text search
    await this.prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_article_title_content_gin 
      ON "Article" USING gin(to_tsvector('english', title || ' ' || content))
    `;
    
    // Create trigram index for fuzzy search
    await this.prisma.$executeRaw`
      CREATE EXTENSION IF NOT EXISTS pg_trgm
    `;
    
    await this.prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_article_title_trgm 
      ON "Article" USING gin(title gin_trgm_ops)
    `;
    
    await this.prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_article_content_trgm 
      ON "Article" USING gin(content gin_trgm_ops)
    `;
    
    // Create index for time-based queries
    await this.prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_article_published_at 
      ON "Article" ("publishedAt" DESC)
    `;
  }

  // Helper method to build WHERE clause from conditions
  private buildWhereClause(conditions: Prisma.ArticleWhereInput): string {
    const clauses: string[] = [];
    
    if (conditions.sourceId) {
      clauses.push(`"sourceId" = '${conditions.sourceId}'`);
    }
    
    if (conditions.publishedAt) {
      const dateConditions = conditions.publishedAt as any;
      if (dateConditions.gte) {
        clauses.push(`"publishedAt" >= '${dateConditions.gte.toISOString()}'`);
      }
      if (dateConditions.lte) {
        clauses.push(`"publishedAt" <= '${dateConditions.lte.toISOString()}'`);
      }
    }
    
    return clauses.join(' AND ');
  }

  // Helper method to build search conditions
  private buildSearchConditions(options: Partial<SearchOptions>): Prisma.ArticleWhereInput {
    const { query, fields, filters } = options;
    const whereConditions: Prisma.ArticleWhereInput[] = [];
    
    if (query && fields) {
      const searchConditions = this.buildFieldSearchConditions(query, fields);
      if (searchConditions) {
        whereConditions.push(searchConditions);
      }
    }
    
    if (filters) {
      const filterConditions = this.buildFilterConditions(filters);
      if (filterConditions) {
        whereConditions.push(filterConditions);
      }
    }
    
    if (whereConditions.length === 0) {
      return {};
    } else if (whereConditions.length === 1) {
      return whereConditions[0]!;
    } else {
      return { AND: whereConditions };
    }
  }

  private buildFieldSearchConditions(query: string, fields: Array<'title' | 'content' | 'tags'>): Prisma.ArticleWhereInput | null {
    if (fields.length === 1) {
      const field = fields[0];
      if (field === 'title') {
        return { title: { contains: query, mode: 'insensitive' } };
      } else if (field === 'content') {
        return { content: { contains: query, mode: 'insensitive' } };
      } else if (field === 'tags') {
        return { tags: { some: { name: { contains: query, mode: 'insensitive' } } } };
      }
    } else if (fields.length > 1) {
      const orConditions: Prisma.ArticleWhereInput[] = [];
      
      if (fields.includes('title')) {
        orConditions.push({ title: { contains: query, mode: 'insensitive' } });
      }
      if (fields.includes('content')) {
        orConditions.push({ content: { contains: query, mode: 'insensitive' } });
      }
      if (fields.includes('tags')) {
        orConditions.push({ tags: { some: { name: { contains: query, mode: 'insensitive' } } } });
      }
      
      return { OR: orConditions };
    }
    
    return null;
  }

  private buildFilterConditions(filters: SearchOptions['filters']): Prisma.ArticleWhereInput | null {
    if (!filters) return null;
    
    const conditions: Prisma.ArticleWhereInput = {};
    
    if (filters.sourceId) {
      conditions.sourceId = filters.sourceId;
    }
    
    if (filters.publishedAfter || filters.publishedBefore) {
      conditions.publishedAt = {};
      if (filters.publishedAfter) {
        conditions.publishedAt.gte = filters.publishedAfter;
      }
      if (filters.publishedBefore) {
        conditions.publishedAt.lte = filters.publishedBefore;
      }
    }
    
    return Object.keys(conditions).length > 0 ? conditions : null;
  }
}