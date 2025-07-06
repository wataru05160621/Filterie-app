import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdatePreferenceInput } from './dto/update-preference.input';

@Injectable()
export class PreferencesService {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserId(userId: string) {
    let preference = await this.prisma.userPreference.findUnique({
      where: { userId },
      include: {
        preferredTags: true,
      },
    });

    // プリファレンスが存在しない場合はデフォルト値で作成
    if (!preference) {
      preference = await this.prisma.userPreference.create({
        data: {
          userId,
          minTier: 1,
          maxTier: 4,
          languages: ['ja'],
          emailDigest: false,
        },
        include: {
          preferredTags: true,
        },
      });
    }

    return preference;
  }

  async update(userId: string, updatePreferenceInput: UpdatePreferenceInput) {
    const { preferredTagNames, ...preferenceData } = updatePreferenceInput;

    // 既存のプリファレンスを確認
    await this.findByUserId(userId);

    // タグの処理
    if (preferredTagNames) {
      const tags = await Promise.all(
        preferredTagNames.map(name =>
          this.prisma.tag.upsert({
            where: { name },
            update: {},
            create: { name },
          }),
        ),
      );

      // タグを更新
      await this.prisma.userPreference.update({
        where: { userId },
        data: {
          preferredTags: {
            set: tags.map(tag => ({ id: tag.id })),
          },
        },
      });
    }

    // その他のプリファレンスを更新
    return this.prisma.userPreference.update({
      where: { userId },
      data: preferenceData,
      include: {
        preferredTags: true,
      },
    });
  }

  async getRecommendedSources(userId: string) {
    const preference = await this.findByUserId(userId);

    // ユーザーの好みのタグに基づいて情報源を推薦
    const sources = await this.prisma.source.findMany({
      where: {
        AND: [
          {
            tier: {
              gte: preference.minTier,
              lte: preference.maxTier,
            },
          },
          {
            language: {
              in: preference.languages,
            },
          },
          {
            isActive: true,
          },
        ],
      },
      include: {
        articles: {
          where: {
            tags: {
              some: {
                id: {
                  in: preference.preferredTags.map(tag => tag.id),
                },
              },
            },
          },
          take: 1,
        },
      },
      orderBy: {
        tier: 'asc',
      },
    });

    // タグとマッチする記事を持つ情報源を優先
    return sources.sort((a, b) => b.articles.length - a.articles.length);
  }

  async getPersonalizedArticles(userId: string, limit: number = 20) {
    const preference = await this.findByUserId(userId);

    const articles = await this.prisma.article.findMany({
      where: {
        AND: [
          {
            source: {
              tier: {
                gte: preference.minTier,
                lte: preference.maxTier,
              },
              language: {
                in: preference.languages,
              },
            },
          },
          preference.preferredTags.length > 0
            ? {
                tags: {
                  some: {
                    id: {
                      in: preference.preferredTags.map(tag => tag.id),
                    },
                  },
                },
              }
            : {},
        ],
      },
      include: {
        source: true,
        tags: true,
      },
      orderBy: [
        { publishedAt: 'desc' },
        { source: { tier: 'asc' } },
      ],
      take: limit,
    });

    return articles;
  }

  async addPreferredTag(userId: string, tagName: string) {
    const tag = await this.prisma.tag.upsert({
      where: { name: tagName },
      update: {},
      create: { name: tagName },
    });

    return this.prisma.userPreference.update({
      where: { userId },
      data: {
        preferredTags: {
          connect: { id: tag.id },
        },
      },
      include: {
        preferredTags: true,
      },
    });
  }

  async removePreferredTag(userId: string, tagName: string) {
    const tag = await this.prisma.tag.findUnique({
      where: { name: tagName },
    });

    if (!tag) {
      return this.findByUserId(userId);
    }

    return this.prisma.userPreference.update({
      where: { userId },
      data: {
        preferredTags: {
          disconnect: { id: tag.id },
        },
      },
      include: {
        preferredTags: true,
      },
    });
  }
}