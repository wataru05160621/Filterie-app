import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { PrismaService } from '../../prisma/prisma.service';
import { ArticlesService } from '../articles/articles.service';
import { Article } from '@prisma/client';

@Injectable()
export class AiSummaryService {
  private readonly logger = new Logger(AiSummaryService.name);
  private openai: OpenAI;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly articlesService: ArticlesService,
  ) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (apiKey) {
      this.openai = new OpenAI({
        apiKey,
      });
    } else {
      this.logger.warn('OPENAI_API_KEY is not configured. AI summary features will be disabled.');
      // Create a dummy instance to prevent errors during initialization
      this.openai = new OpenAI({
        apiKey: 'dummy-key-for-development',
      });
    }
  }

  async generateSummary(articleId: string): Promise<Article> {
    try {
      // 記事を取得
      const article = await this.articlesService.findOne(articleId);

      // 既にAI要約がある場合はそれを返す
      if (article.aiSummary) {
        this.logger.log(`Article ${articleId} already has AI summary`);
        return article;
      }

      // プロンプトの作成
      const prompt = this.createSummaryPrompt(article);

      // OpenAI APIを呼び出し
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `あなたは優秀な日本語編集者です。与えられた記事を日本語で簡潔な要約にまとめてください。
要約は以下の条件を満たしてください：
- 100文字以内
- 記事の主要なポイントを含む
- 読みやすく自然な日本語
- 事実に基づいた内容のみ`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 200,
        temperature: 0.3,
      });

      const summary = completion.choices[0]?.message?.content;
      if (!summary) {
        throw new Error('No summary generated');
      }

      // 要約を保存
      const updatedArticle = await this.prisma.article.update({
        where: { id: articleId },
        data: { aiSummary: summary },
      });

      this.logger.log(`Generated AI summary for article ${articleId}`);
      return updatedArticle;
    } catch (error) {
      this.logger.error(`Failed to generate summary for article ${articleId}:`, error);
      throw new Error('Failed to generate AI summary');
    }
  }

  async generateBulkSummaries(
    articleIds: string[],
  ): Promise<{
    successful: number;
    failed: number;
    total: number;
    errors: string[];
  }> {
    const results = {
      successful: 0,
      failed: 0,
      total: articleIds.length,
      errors: [] as string[],
    };

    for (const articleId of articleIds) {
      try {
        await this.generateSummary(articleId);
        results.successful++;
      } catch (error) {
        results.failed++;
        results.errors.push(`${articleId}: ${error instanceof Error ? error.message : String(error)}`);
        this.logger.error(`Failed to generate summary for ${articleId}:`, error);
      }
    }

    return results;
  }

  async generateTagSuggestions(articleId: string): Promise<string[]> {
    try {
      const article = await this.articlesService.findOne(articleId);
      const prompt = this.createTagPrompt(article);

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `記事の内容から適切なタグを生成してください。
以下の条件を満たしてください：
- 日本語のタグ
- 3〜5個のタグ
- 具体的で検索しやすいタグ
- JSON配列形式で返す（例: ["タグ1", "タグ2", "タグ3"]）`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 100,
        temperature: 0.5,
      });

      const tagsContent = completion.choices[0]?.message?.content;
      if (!tagsContent) {
        return [];
      }

      try {
        const tags = JSON.parse(tagsContent);
        if (Array.isArray(tags)) {
          return tags;
        }
      } catch (e) {
        this.logger.warn('Failed to parse tags JSON:', tagsContent);
      }

      return [];
    } catch (error) {
      this.logger.error(`Failed to generate tags for article ${articleId}:`, error);
      throw new Error('Failed to generate tag suggestions');
    }
  }

  private createSummaryPrompt(article: any): string {
    const content = article.content || '';
    const title = article.title || '';

    if (!content && !title) {
      return '内容が利用できません。';
    }

    if (!content) {
      return `タイトル: ${title}\n\nタイトルのみから要約を生成してください。`;
    }

    // コンテンツが長すぎる場合は切り詰める
    const truncatedContent = content.length > 2000 
      ? content.substring(0, 2000) + '...'
      : content;

    return `タイトル: ${title}\n\n本文:\n${truncatedContent}`;
  }

  private createTagPrompt(article: any): string {
    const title = article.title || '';
    const summary = article.aiSummary || article.summary || '';
    const content = article.content || '';

    // タグ生成用のテキストを準備（優先順位: タイトル > AI要約 > 通常要約 > 本文の一部）
    let text = title;
    if (summary) {
      text += `\n\n${summary}`;
    } else if (content) {
      text += `\n\n${content.substring(0, 500)}`;
    }

    return text;
  }
}