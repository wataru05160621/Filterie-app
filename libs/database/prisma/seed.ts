import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 開始: データベースシーディング');

  // ユーザーの作成
  const password = await bcrypt.hash('password123', 10);
  
  const user1 = await prisma.user.upsert({
    where: { email: 'demo@filterie.com' },
    update: {},
    create: {
      email: 'demo@filterie.com',
      name: 'デモユーザー',
      password,
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'admin@filterie.com' },
    update: {},
    create: {
      email: 'admin@filterie.com',
      name: '管理者',
      password,
    },
  });

  console.log('✅ ユーザーを作成しました');

  // 情報源の作成
  const sources = [
    // Tier 1 - 公式情報源
    {
      name: 'Apple Newsroom',
      url: 'https://www.apple.com/newsroom/rss-feed.rss',
      feedUrl: 'https://www.apple.com/newsroom/rss-feed.rss',
      tier: 1,
      isActive: true,
      category: 'テクノロジー',
      // description: 'Appleの公式ニュースルーム',
    },
    {
      name: 'Google Blog',
      url: 'https://blog.google/',
      feedUrl: 'https://blog.google/rss/',
      tier: 1,
      isActive: true,
      category: 'テクノロジー',
      // description: 'Googleの公式ブログ',
    },
    {
      name: 'Microsoft Blog',
      url: 'https://blogs.microsoft.com/',
      feedUrl: 'https://blogs.microsoft.com/feed/',
      tier: 1,
      isActive: true,
      category: 'テクノロジー',
      // description: 'Microsoftの公式ブログ',
    },
    
    // Tier 2 - 信頼できるメディア
    {
      name: 'TechCrunch',
      url: 'https://techcrunch.com/',
      feedUrl: 'https://techcrunch.com/feed/',
      tier: 2,
      isActive: true,
      category: 'テクノロジー',
      // description: 'テクノロジー業界の最新ニュース',
    },
    {
      name: 'The Verge',
      url: 'https://www.theverge.com/',
      feedUrl: 'https://www.theverge.com/rss/index.xml',
      tier: 2,
      isActive: true,
      category: 'テクノロジー',
      // description: 'テクノロジー、科学、アート、カルチャーの交差点',
    },
    {
      name: 'Ars Technica',
      url: 'https://arstechnica.com/',
      feedUrl: 'https://feeds.arstechnica.com/arstechnica/index',
      tier: 2,
      isActive: true,
      category: 'テクノロジー',
      // description: 'テクノロジーとサイエンスの深い分析',
    },
    
    // Tier 3 - 一般メディア・ブログ
    {
      name: 'Hacker News',
      url: 'https://news.ycombinator.com/',
      feedUrl: 'https://news.ycombinator.com/rss',
      tier: 3,
      isActive: true,
      category: 'テクノロジー',
      // description: 'プログラマーとスタートアップのコミュニティ',
    },
    {
      name: 'Dev.to',
      url: 'https://dev.to/',
      feedUrl: 'https://dev.to/feed',
      tier: 3,
      isActive: true,
      category: 'プログラミング',
      // description: '開発者コミュニティのブログプラットフォーム',
    },
  ];

  const createdSources = [];
  for (const source of sources) {
    const createdSource = await prisma.source.create({
      data: source,
    });
    createdSources.push(createdSource);
  }

  console.log('✅ 情報源を作成しました');

  // ユーザー設定の作成
  await prisma.userPreference.create({
    data: {
      user: { connect: { id: user1.id } },
      theme: 'dark',
      language: 'ja',
      articleDisplayMode: 'card',
      autoMarkAsRead: false,
      showSummary: true,
      summaryLength: 'medium',
      enableNotifications: true,
      notificationFrequency: 'realtime',
      keyboardShortcuts: true,
    },
  });

  await prisma.userPreference.create({
    data: {
      user: { connect: { id: user2.id } },
      theme: 'light',
      language: 'ja',
      articleDisplayMode: 'list',
      autoMarkAsRead: true,
      showSummary: true,
      summaryLength: 'short',
      enableNotifications: false,
      notificationFrequency: 'daily',
      keyboardShortcuts: false,
    },
  });

  console.log('✅ ユーザー設定を作成しました');

  // AI設定の作成
  /* AI設定は現在のスキーマには存在しないのでコメントアウト
  await prisma.aiSetting.create({
    data: {
      model: 'gpt-4',
      temperature: 0.7,
      maxTokens: 500,
      enableSummary: true,
      enableTags: true,
      enableSentiment: true,
      enableTranslation: false,
      customPrompt: '',
    },
  });

  await prisma.aiSetting.create({
    data: {
      userId: user2.id,
      model: 'gpt-3.5-turbo',
      temperature: 0.5,
      maxTokens: 300,
      enableSummary: true,
      enableTags: false,
      enableSentiment: false,
      enableTranslation: false,
      customPrompt: '',
    },
  });
  */

  // console.log('✅ AI設定を作成しました');

  // トレイの作成
  const tray1 = await prisma.tray.create({
    data: {
      name: '後で読む',
      // description: '時間があるときに読みたい記事',
      color: '#3B82F6',
      icon: 'bookmark',
    },
  });

  const tray2 = await prisma.tray.create({
    data: {
      name: '重要な記事',
      // description: '特に重要な記事をまとめて保存',
      color: '#EF4444',
      icon: 'star',
    },
  });

  const tray3 = await prisma.tray.create({
    data: {
      name: '技術メモ',
      // description: '技術的な参考資料',
      color: '#10B981',
      icon: 'code',
    },
  });

  console.log('✅ トレイを作成しました');

  // サンプル記事の作成（実際のRSSフィードから取得する前のテスト用）
  const sampleArticles = [
    {
      title: 'Apple、新しいM3チップを発表',
      originalUrl: 'https://example.com/apple-m3',
      content: 'Appleは本日、最新のM3チップを発表しました。このチップは、前世代と比較して最大50%高速な処理能力を実現します。',
      summary: 'AppleがM3チップを発表。前世代比で最大50%の性能向上を実現。',
      sourceId: createdSources[0].id, // Apple Newsroom
      publishedAt: new Date('2024-01-15T10:00:00Z'),
      // tags: ['Apple', 'M3', 'チップ', 'ハードウェア'],
      // sentiment: 'positive',
    },
    {
      title: 'Google、AI検索の新機能を発表',
      originalUrl: 'https://example.com/google-ai-search',
      content: 'Googleは、AI技術を活用した新しい検索機能を発表しました。この機能により、より自然な言語での検索が可能になります。',
      summary: 'GoogleがAI搭載の新検索機能を発表。自然言語での検索が可能に。',
      sourceId: createdSources[1].id, // Google Blog
      publishedAt: new Date('2024-01-14T15:30:00Z'),
      // tags: ['Google', 'AI', '検索', '人工知能'],
      // sentiment: 'positive',
    },
    {
      title: 'Microsoft、新しいクラウドサービスを開始',
      originalUrl: 'https://example.com/microsoft-cloud',
      content: 'Microsoftは、中小企業向けの新しいクラウドサービスを発表しました。このサービスは、手頃な価格で高度な機能を提供します。',
      summary: 'Microsoftが中小企業向け新クラウドサービスを開始。手頃な価格で高機能を提供。',
      sourceId: createdSources[2].id, // Microsoft Blog
      publishedAt: new Date('2024-01-13T09:00:00Z'),
      // tags: ['Microsoft', 'クラウド', '中小企業', 'Azure'],
      // sentiment: 'positive',
    },
  ];

  for (const article of sampleArticles) {
    const createdArticle = await prisma.article.create({
      data: article,
    });

    // ユーザーの既読状態を設定
    await prisma.readArticle.create({
      data: {
        userId: user1.id,
        articleId: createdArticle.id,
        isRead: false,
        readAt: null,
      },
    });
  }

  console.log('✅ サンプル記事を作成しました');

  console.log('🎉 データベースシーディング完了！');
  console.log('');
  console.log('テストアカウント:');
  console.log('- Email: demo@filterie.com');
  console.log('- Password: password123');
  console.log('');
  console.log('管理者アカウント:');
  console.log('- Email: admin@filterie.com');
  console.log('- Password: password123');
}

main()
  .catch((e) => {
    console.error('❌ シーディングエラー:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });