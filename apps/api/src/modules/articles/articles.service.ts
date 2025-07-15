import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateArticleInput } from './dto/create-article.input';
import { UpdateArticleInput } from './dto/update-article.input';
import { ArticleFilterInput } from './dto/article-filter.input';
import { PaginationInput } from '../common/dto/pagination.input';
import { ArticleConnection } from './dto/article-connection';
import { Prisma } from '@prisma/client';

@Injectable()
export class ArticlesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createArticleInput: CreateArticleInput) {
    const { tagNames, publishedAt, ...articleData } = createArticleInput;

    // タグの作成または取得
    const tags = tagNames
      ? await Promise.all(
          tagNames.map(name =>
            this.prisma.tag.upsert({
              where: { name },
              update: {},
              create: { name },
            }),
          ),
        )
      : [];

    return this.prisma.article.create({
      data: {
        ...articleData,
        publishedAt: new Date(publishedAt),
        tags: {
          connect: tags.map(tag => ({ id: tag.id })),
        },
      },
      include: {
        source: true,
        tags: true,
      },
    });
  }

  async findAll(filter?: ArticleFilterInput) {
    const where = this.buildWhereClause(filter);

    return this.prisma.article.findMany({
      where,
      include: {
        source: true,
        tags: true,
      },
      orderBy: { publishedAt: 'desc' },
    });
  }

  async findWithPagination(
    filter?: ArticleFilterInput,
    pagination?: PaginationInput,
    userId?: string,
  ): Promise<ArticleConnection> {
    const where = this.buildWhereClause(filter, userId);
    const limit = pagination?.limit || 20;
    const offset = pagination?.offset || 0;

    const [items, totalCount] = await Promise.all([
      this.prisma.article.findMany({
        where,
        include: {
          source: true,
          tags: true,
          readArticles: userId
            ? {
                where: { userId },
                select: { readAt: true },
              }
            : false,
        },
        take: limit,
        skip: offset,
        orderBy: { publishedAt: 'desc' },
      }),
      this.prisma.article.count({ where }),
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
    const article = await this.prisma.article.findUnique({
      where: { id },
      include: {
        source: true,
        tags: true,
      },
    });

    if (!article) {
      throw new NotFoundException(`Article with ID ${id} not found`);
    }

    return article;
  }

  async update(id: string, updateArticleInput: UpdateArticleInput) {
    await this.findOne(id); // Check if exists

    const { tagNames, ...articleData } = updateArticleInput;

    // タグの更新
    if (tagNames) {
      const tags = await Promise.all(
        tagNames.map(name =>
          this.prisma.tag.upsert({
            where: { name },
            update: {},
            create: { name },
          }),
        ),
      );

      // 既存のタグをクリアして新しいタグを設定
      await this.prisma.article.update({
        where: { id },
        data: {
          tags: {
            set: tags.map(tag => ({ id: tag.id })),
          },
        },
      });
    }

    return this.prisma.article.update({
      where: { id },
      data: articleData,
      include: {
        source: true,
        tags: true,
      },
    });
  }

  async remove(id: string): Promise<boolean> {
    await this.findOne(id); // Check if exists

    await this.prisma.article.delete({
      where: { id },
    });

    return true;
  }

  async markAsRead(articleId: string, userId: string, readDuration?: number) {
    return this.prisma.readArticle.upsert({
      where: {
        userId_articleId: {
          userId,
          articleId,
        },
      },
      update: {
        readAt: new Date(),
        readDuration,
      },
      create: {
        userId,
        articleId,
        readDuration,
      },
    });
  }

  async bookmark(articleId: string, userId: string, note?: string) {
    return this.prisma.bookmark.upsert({
      where: {
        userId_articleId: {
          userId,
          articleId,
        },
      },
      update: {
        note,
      },
      create: {
        userId,
        articleId,
        note,
      },
    });
  }

  async removeBookmark(articleId: string, userId: string): Promise<boolean> {
    await this.prisma.bookmark.delete({
      where: {
        userId_articleId: {
          userId,
          articleId,
        },
      },
    });

    return true;
  }

  async findByUrl(url: string) {
    return this.prisma.article.findUnique({
      where: { originalUrl: url },
      include: {
        source: true,
        tags: true,
      },
    });
  }

  async findByOriginalUrl(url: string) {
    return this.prisma.article.findUnique({
      where: { originalUrl: url },
      include: {
        source: true,
        tags: true,
      },
    });
  }

  private buildWhereClause(filter?: ArticleFilterInput, userId?: string): Prisma.ArticleWhereInput {
    if (!filter) return {};

    const where: Prisma.ArticleWhereInput = {};

    if (filter.sourceIds?.length) {
      where.sourceId = { in: filter.sourceIds };
    }

    if (filter.tagNames?.length) {
      where.tags = {
        some: {
          name: { in: filter.tagNames },
        },
      };
    }

    if (filter.minTier || filter.maxTier) {
      where.source = {
        tier: {
          gte: filter.minTier || 1,
          lte: filter.maxTier || 4,
        },
      };
    }

    if (filter.publishedAfter) {
      where.publishedAt = {
        ...(where.publishedAt as object || {}),
        gte: new Date(filter.publishedAfter),
      };
    }

    if (filter.publishedBefore) {
      where.publishedAt = {
        ...(where.publishedAt as object || {}),
        lte: new Date(filter.publishedBefore),
      };
    }

    if (filter.searchQuery) {
      where.OR = [
        { title: { contains: filter.searchQuery, mode: 'insensitive' } },
        { content: { contains: filter.searchQuery, mode: 'insensitive' } },
        { summary: { contains: filter.searchQuery, mode: 'insensitive' } },
      ];
    }

    if (filter.language) {
      where.source = {
        ...(where.source as object || {}),
        language: filter.language,
      };
    }

    if (filter.hasAiSummary !== undefined) {
      where.aiSummary = filter.hasAiSummary
        ? { not: null }
        : null;
    }

    if (filter.unreadOnly && userId) {
      where.readArticles = {
        none: {
          userId,
        },
      };
    }

    return where;
  }
}