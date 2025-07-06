import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { ArticlesService } from '../articles/articles.service';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class AiSummaryService {
  private readonly logger = new Logger(AiSummaryService.name);
  private openai: OpenAI;

  constructor(
    private readonly configService: ConfigService,
    private readonly articlesService: ArticlesService,
  ) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
    } else {
      this.logger.warn('OpenAI API key not configured. AI summary features will be disabled.');
    }
  }

  // 1時間ごとに要約されていない記事を処理
  @Cron(CronExpression.EVERY_HOUR)
  async handleCron() {
    if (!this.openai) {
      return;
    }

    this.logger.log('Starting scheduled AI summary generation...');
    await this.summarizeNewArticles();
  }

  async summarizeNewArticles() {
    // AI要約がない最新の記事を取得
    const articles = await this.articlesService.findAll({
      hasAiSummary: false,
    });

    const articlesToProcess = articles.slice(0, 10); // 1回の実行で最大10記事を処理

    this.logger.log(`Found ${articlesToProcess.length} articles to summarize`);

    const results = await Promise.allSettled(
      articlesToProcess.map(article => this.generateSummary(article.id)),
    );

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    this.logger.log(`Summary generation completed: ${successful} successful, ${failed} failed`);

    return { successful, failed, total: articlesToProcess.length };
  }

  async generateSummary(articleId: string): Promise<string> {
    if (!this.openai) {
      throw new Error('OpenAI API is not configured');
    }

    try {
      const article = await this.articlesService.findOne(articleId);
      
      if (!article.content && !article.summary) {
        throw new Error('Article has no content to summarize');
      }

      const textToSummarize = article.content || article.summary || '';
      
      // 長すぎるテキストは最初の3000文字に制限
      const truncatedText = textToSummarize.substring(0, 3000);

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `あなたは日本語のニュース記事を要約する専門家です。以下の指示に従って記事を要約してください：
1. 重要なポイントを3-5個の箇条書きで抽出
2. 各ポイントは簡潔に（50文字以内）
3. 事実に基づき、主観を排除
4. 専門用語は分かりやすく説明
5. 記事の核心的な価値を明確に伝える`,
          },
          {
            role: 'user',
            content: `次の記事を要約してください：\n\n${truncatedText}`,
          },
        ],
        temperature: 0.3,
        max_tokens: 500,
      });

      const summary = completion.choices[0]?.message?.content || '';

      // 記事を更新
      await this.articlesService.update(articleId, {
        aiSummary: summary,
      });

      this.logger.log(`Generated summary for article ${articleId}`);

      return summary;
    } catch (error) {
      this.logger.error(`Failed to generate summary for article ${articleId}:`, error);
      throw error;
    }
  }

  async extractTags(articleId: string): Promise<string[]> {
    if (!this.openai) {
      throw new Error('OpenAI API is not configured');
    }

    try {
      const article = await this.articlesService.findOne(articleId);
      
      const textToAnalyze = article.title + ' ' + (article.summary || article.content?.substring(0, 1000) || '');

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `記事からタグを抽出する専門家として、以下の指示に従ってください：
1. 記事の内容を最もよく表すタグを5-10個抽出
2. タグは日本語で、一般的に理解される単語を使用
3. 具体的で検索しやすいタグを選択
4. カテゴリー（例：テクノロジー、ビジネス、AI、など）
5. JSON配列形式で返す`,
          },
          {
            role: 'user',
            content: `次の記事からタグを抽出してください：\n\n${textToAnalyze}`,
          },
        ],
        temperature: 0.5,
        max_tokens: 200,
        response_format: { type: 'json_object' },
      });

      const response = completion.choices[0]?.message?.content || '{}';
      const parsed = JSON.parse(response);
      const tags = parsed.tags || [];

      // 記事を更新
      if (tags.length > 0) {
        await this.articlesService.update(articleId, {
          tagNames: tags,
        });
      }

      this.logger.log(`Extracted ${tags.length} tags for article ${articleId}`);

      return tags;
    } catch (error) {
      this.logger.error(`Failed to extract tags for article ${articleId}:`, error);
      throw error;
    }
  }

  async evaluateRelevance(articleId: string, userInterests: string[]): Promise<number> {
    if (!this.openai || userInterests.length === 0) {
      return 0.5; // デフォルトの関連性スコア
    }

    try {
      const article = await this.articlesService.findOne(articleId);
      
      const articleText = article.title + ' ' + (article.aiSummary || article.summary || '');
      const interests = userInterests.join(', ');

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `記事とユーザーの興味の関連性を0から1の数値で評価してください。
0: 全く関連なし
0.5: 部分的に関連
1: 高度に関連`,
          },
          {
            role: 'user',
            content: `記事: ${articleText}\n\nユーザーの興味: ${interests}\n\n関連性スコア（0-1）:`,
          },
        ],
        temperature: 0.3,
        max_tokens: 10,
      });

      const scoreText = completion.choices[0]?.message?.content || '0.5';
      const score = parseFloat(scoreText);

      return isNaN(score) ? 0.5 : Math.max(0, Math.min(1, score));
    } catch (error) {
      this.logger.error(`Failed to evaluate relevance for article ${articleId}:`, error);
      return 0.5;
    }
  }
}