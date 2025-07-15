import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSourceInput } from './dto/create-source.input';
import { UpdateSourceInput } from './dto/update-source.input';
import { SourceFilterInput } from './dto/source-filter.input';
import { PaginationInput } from './dto/pagination.input';
import { SourceConnection } from './dto/source-connection';
import { TierEvaluation } from './entities/source.entity';

@Injectable()
export class SourcesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createSourceInput: CreateSourceInput) {
    const tierEvaluation = await this.evaluateTier(createSourceInput.url);
    
    return this.prisma.source.create({
      data: {
        ...createSourceInput,
        tier: tierEvaluation.tier,
        language: createSourceInput.language || 'ja',
        isActive: true,
      },
    });
  }

  async findAll(filter?: SourceFilterInput) {
    const where = filter
      ? {
          ...(filter.tier && { tier: filter.tier }),
          ...(filter.category && { category: filter.category }),
          ...(filter.isActive !== undefined && { isActive: filter.isActive }),
          ...(filter.language && { language: filter.language }),
        }
      : {};

    return this.prisma.source.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findWithPagination(
    filter?: SourceFilterInput,
    pagination?: PaginationInput,
  ): Promise<SourceConnection> {
    const where = filter
      ? {
          ...(filter.tier && { tier: filter.tier }),
          ...(filter.category && { category: filter.category }),
          ...(filter.isActive !== undefined && { isActive: filter.isActive }),
          ...(filter.language && { language: filter.language }),
        }
      : {};

    const limit = pagination?.limit || 10;
    const offset = pagination?.offset || 0;

    const [items, totalCount] = await Promise.all([
      this.prisma.source.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.source.count({ where }),
    ]);

    const edges = items.map((item, index) => ({
      node: item,
      cursor: Buffer.from(`${offset + index}`).toString('base64'),
    }));

    return {
      edges,
      pageInfo: {
        hasNextPage: offset + limit < totalCount,
        hasPreviousPage: offset > 0,
        startCursor: edges[0]?.cursor || '',
        endCursor: edges[edges.length - 1]?.cursor || '',
      },
      totalCount,
    };
  }

  async findOne(id: string) {
    const source = await this.prisma.source.findUnique({
      where: { id },
    });

    if (!source) {
      throw new NotFoundException(`Source with ID ${id} not found`);
    }

    return source;
  }

  async update(id: string, updateSourceInput: UpdateSourceInput) {
    await this.findOne(id); // Check if exists

    return this.prisma.source.update({
      where: { id },
      data: updateSourceInput,
    });
  }

  async remove(id: string): Promise<boolean> {
    await this.findOne(id); // Check if exists

    await this.prisma.source.delete({
      where: { id },
    });

    return true;
  }

  async findById(id: string) {
    return this.findOne(id);
  }

  async updateLastFetched(id: string) {
    return this.prisma.source.update({
      where: { id },
      data: {
        lastFetchedAt: new Date(),
        lastError: null,
        lastErrorAt: null,
      },
    });
  }

  async updateLastError(id: string, error: string) {
    return this.prisma.source.update({
      where: { id },
      data: {
        lastError: error,
        lastErrorAt: new Date(),
      },
    });
  }

  async evaluateTier(url: string): Promise<TierEvaluation> {
    try {
      const domain = new URL(url).hostname.toLowerCase();
      
      // Tier 1: Official sources
      if (domain.endsWith('.gov')) {
        return {
          tier: 1,
          confidence: 0.95,
          reasons: ['Government domain (.gov)'],
        };
      }
      
      if (domain.endsWith('.go.jp')) {
        return {
          tier: 1,
          confidence: 0.95,
          reasons: ['Japanese government domain (.go.jp)'],
        };
      }
      
      if (this.isOfficialCorporateDomain(domain)) {
        return {
          tier: 1,
          confidence: 0.95,
          reasons: ['Official corporate domain'],
        };
      }

      // Tier 2: Academic and major media
      if (domain.endsWith('.edu')) {
        return {
          tier: 2,
          confidence: 0.85,
          reasons: ['Educational institution (.edu)'],
        };
      }
      
      if (domain.endsWith('.ac.jp')) {
        return {
          tier: 2,
          confidence: 0.85,
          reasons: ['Japanese academic institution (.ac.jp)'],
        };
      }
      
      if (this.isMajorMediaDomain(domain)) {
        return {
          tier: 2,
          confidence: 0.85,
          reasons: ['Major news outlet'],
        };
      }

      // Tier 3: General news sites and curated content
      if (this.isGeneralNewsSite(domain)) {
        return {
          tier: 3,
          confidence: 0.7,
          reasons: ['General news/blog site'],
        };
      }

      // Tier 4: User-generated content
      if (domain.includes('.wordpress.com') || domain.includes('blogspot')) {
        return {
          tier: 4,
          confidence: 0.6,
          reasons: ['Blog platform subdomain'],
        };
      }
      
      return {
        tier: 4,
        confidence: 0.4,
        reasons: ['Unknown or unverified source'],
      };
    } catch (e) {
      return {
        tier: 4,
        confidence: 0,
        reasons: ['Invalid URL format'],
      };
    }
  }

  private isOfficialCorporateDomain(domain: string): boolean {
    const officialDomains = [
      'apple.com',
      'google.com',
      'microsoft.com',
      'amazon.com',
      'meta.com',
      'twitter.com',
      'x.com',
    ];
    return officialDomains.some(d => domain === d || domain.endsWith(`.${d}`));
  }

  private isMajorMediaDomain(domain: string): boolean {
    const majorMedia = [
      'nytimes.com',
      'washingtonpost.com',
      'bbc.com',
      'cnn.com',
      'reuters.com',
      'bloomberg.com',
      'nikkei.com',
      'asahi.com',
    ];
    return majorMedia.some(d => domain === d || domain.endsWith(`.${d}`));
  }

  private isGeneralNewsSite(domain: string): boolean {
    const generalNewsSites = [
      'buzzfeed.com',
      'huffpost.com',
      'medium.com',
      'techcrunch.com',
      'engadget.com',
      'gizmodo.com',
    ];
    return generalNewsSites.some(d => domain === d || domain.endsWith(`.${d}`));
  }
}