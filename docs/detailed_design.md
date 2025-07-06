# Filterie 詳細設計書

## 1. API設計

### 1.1 GraphQL スキーマ

```graphql
# ユーザー関連
type User {
  id: ID!
  email: String!
  name: String!
  plan: PlanType!
  sources: [Source!]!
  trays: [Tray!]!
  createdAt: DateTime!
  updatedAt: DateTime!
}

enum PlanType {
  FREE
  PRO
  TEAM
  ENTERPRISE
}

# ソース関連
type Source {
  id: ID!
  type: SourceType!
  url: String!
  title: String!
  isActive: Boolean!
  lastFetchedAt: DateTime
  articles(
    first: Int = 20
    after: String
    filter: ArticleFilter
  ): ArticleConnection!
}

enum SourceType {
  RSS
  ATOM
  WEBSUB
  EMAIL
}

# 記事関連
type Article {
  id: ID!
  source: Source!
  title: String!
  content: String!
  summary: String
  url: String!
  publishedAt: DateTime!
  tags: [Tag!]!
  metadata: JSON
  isRead: Boolean!
  isSaved: Boolean!
}

type ArticleConnection {
  edges: [ArticleEdge!]!
  pageInfo: PageInfo!
  totalCount: Int!
}

type ArticleEdge {
  node: Article!
  cursor: String!
}

# Tray関連
type Tray {
  id: ID!
  name: String!
  articles: [Article!]!
  position: Int!
  createdAt: DateTime!
  updatedAt: DateTime!
}

# タグ関連
type Tag {
  id: ID!
  name: String!
  color: String!
  articleCount: Int!
}

# クエリ
type Query {
  # ユーザー
  me: User!
  
  # ソース
  sources: [Source!]!
  source(id: ID!): Source
  
  # 記事
  articles(
    first: Int = 20
    after: String
    filter: ArticleFilter
  ): ArticleConnection!
  article(id: ID!): Article
  todayHighlights: [Article!]!
  
  # Tray
  trays: [Tray!]!
  tray(id: ID!): Tray
  
  # タグ
  tags: [Tag!]!
  tagCloud: [TagCloudItem!]!
}

# ミューテーション
type Mutation {
  # ソース管理
  addSource(input: AddSourceInput!): Source!
  updateSource(id: ID!, input: UpdateSourceInput!): Source!
  deleteSource(id: ID!): Boolean!
  
  # 記事操作
  markAsRead(articleId: ID!): Article!
  markAsUnread(articleId: ID!): Article!
  saveToTray(articleId: ID!, trayId: ID!): Article!
  removeFromTray(articleId: ID!, trayId: ID!): Article!
  
  # Tray管理
  createTray(input: CreateTrayInput!): Tray!
  updateTray(id: ID!, input: UpdateTrayInput!): Tray!
  deleteTray(id: ID!): Boolean!
  reorderTray(trayId: ID!, position: Int!): Tray!
  
  # タグ管理
  addTag(articleId: ID!, tagName: String!): Article!
  removeTag(articleId: ID!, tagId: ID!): Article!
  
  # エクスポート
  exportArticles(input: ExportArticlesInput!): ExportResult!
  
  # FilterAI設定
  updateFilterSettings(input: FilterSettingsInput!): FilterSettings!
}

# サブスクリプション
type Subscription {
  articleAdded(sourceId: ID): Article!
  articleUpdated(articleId: ID!): Article!
}

# 入力型
input ArticleFilter {
  sourceIds: [ID!]
  tagIds: [ID!]
  isRead: Boolean
  searchQuery: String
  dateFrom: DateTime
  dateTo: DateTime
}

input AddSourceInput {
  type: SourceType!
  url: String!
  title: String
}

input CreateTrayInput {
  name: String!
}

input ExportArticlesInput {
  articleIds: [ID!]!
  format: ExportFormat!
}

enum ExportFormat {
  MARKDOWN
  HTML
  PDF
  CSV
  OPML
  IMAGE_CARD
}

type ExportResult {
  downloadUrl: String!
  expiresAt: DateTime!
}
```

### 1.2 REST API エンドポイント

```
# 認証
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/refresh
POST   /api/auth/register
GET    /api/auth/me

# Webhook (外部サービス連携用)
POST   /api/webhooks/websub/{sourceId}
POST   /api/webhooks/email/inbound

# ファイルアップロード
POST   /api/upload/opml
POST   /api/upload/csv

# エクスポート (ダウンロード)
GET    /api/export/{exportId}/download

# 健全性チェック
GET    /api/health
GET    /api/metrics
```

## 2. データベース詳細設計

### 2.1 テーブル定義

```sql
-- ユーザーテーブル
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255),
    plan VARCHAR(20) NOT NULL DEFAULT 'free',
    is_email_verified BOOLEAN DEFAULT FALSE,
    two_factor_secret VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ソーステーブル
CREATE TABLE sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL,
    url VARCHAR(1024) NOT NULL,
    title VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    last_fetched_at TIMESTAMP WITH TIME ZONE,
    fetch_interval_minutes INTEGER DEFAULT 30,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, url)
);

-- 記事テーブル
CREATE TABLE articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id UUID NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
    external_id VARCHAR(512),
    title TEXT NOT NULL,
    content TEXT,
    summary TEXT,
    url VARCHAR(2048) NOT NULL,
    published_at TIMESTAMP WITH TIME ZONE NOT NULL,
    author VARCHAR(255),
    metadata JSONB DEFAULT '{}',
    embedding vector(768),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(source_id, external_id)
);

-- インデックス
CREATE INDEX idx_articles_published_at ON articles(published_at DESC);
CREATE INDEX idx_articles_source_id ON articles(source_id);
CREATE INDEX idx_articles_embedding ON articles USING ivfflat (embedding vector_cosine_ops);

-- 既読管理テーブル
CREATE TABLE user_article_states (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    PRIMARY KEY (user_id, article_id)
);

-- Trayテーブル
CREATE TABLE trays (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    position INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tray-記事関連テーブル
CREATE TABLE tray_articles (
    tray_id UUID NOT NULL REFERENCES trays(id) ON DELETE CASCADE,
    article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    position INTEGER NOT NULL,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (tray_id, article_id)
);

-- タグテーブル
CREATE TABLE tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    color VARCHAR(7) DEFAULT '#808080',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 記事-タグ関連テーブル
CREATE TABLE article_tags (
    article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (article_id, tag_id)
);

-- FilterAI設定テーブル
CREATE TABLE filter_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    priority_keywords TEXT[],
    mute_keywords TEXT[],
    auto_tag_enabled BOOLEAN DEFAULT TRUE,
    summary_enabled BOOLEAN DEFAULT TRUE,
    duplicate_threshold FLOAT DEFAULT 0.85,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- エクスポート履歴テーブル
CREATE TABLE export_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    format VARCHAR(20) NOT NULL,
    file_url VARCHAR(1024),
    expires_at TIMESTAMP WITH TIME ZONE,
    article_count INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 2.2 インデックス戦略

```sql
-- パフォーマンス最適化のためのインデックス
CREATE INDEX idx_sources_user_id_active ON sources(user_id, is_active);
CREATE INDEX idx_articles_created_at ON articles(created_at DESC);
CREATE INDEX idx_user_article_states_user_read ON user_article_states(user_id, is_read);
CREATE INDEX idx_tray_articles_tray_position ON tray_articles(tray_id, position);
CREATE INDEX idx_export_history_user_created ON export_history(user_id, created_at DESC);

-- 全文検索用インデックス（PostgreSQL）
CREATE INDEX idx_articles_title_gin ON articles USING gin(to_tsvector('japanese', title));
CREATE INDEX idx_articles_content_gin ON articles USING gin(to_tsvector('japanese', content));
```

## 3. 情報源信頼性評価とAI処理詳細設計

### 3.1 情報源Tier判定システム

```typescript
interface SourceTierEvaluator {
  // Tier判定のメインエントリーポイント
  evaluateSource(source: Source): Promise<TierEvaluation>
  
  // 各種検証メソッド
  verifyDomain(url: string): Promise<DomainVerification>
  verifyAccount(platform: string, accountId: string): Promise<AccountVerification>
  checkHistoricalReliability(sourceId: string): Promise<ReliabilityScore>
}

class SourceTierEvaluatorImpl implements SourceTierEvaluator {
  async evaluateSource(source: Source): Promise<TierEvaluation> {
    // 並列で各種チェックを実行
    const [domainCheck, accountCheck, historyCheck] = await Promise.all([
      this.verifyDomain(source.url),
      source.accountId ? this.verifyAccount(source.platform, source.accountId) : null,
      this.checkHistoricalReliability(source.id)
    ])
    
    // Tier判定ロジック
    if (this.isTier1Source(domainCheck, accountCheck)) {
      return {
        tier: 1,
        confidence: 0.95,
        reasoning: ["公式ドメイン確認済み", "認証済みアカウント"],
        verificationStatus: VerificationStatus.VERIFIED
      }
    }
    
    if (this.isTier2Source(domainCheck, historyCheck)) {
      return {
        tier: 2,
        confidence: 0.85,
        reasoning: ["大手メディアドメイン", "高い信頼性履歴"],
        verificationStatus: VerificationStatus.TRUSTED
      }
    }
    
    // 以下、Tier3, 4の判定...
  }
  
  private async verifyDomain(url: string): Promise<DomainVerification> {
    const domain = new URL(url).hostname
    
    // 信頼ドメインDBチェック
    const trustedDomain = await this.prisma.trustedDomain.findUnique({
      where: { domain }
    })
    
    if (trustedDomain) {
      return {
        isTrusted: true,
        tier: trustedDomain.tier,
        organization: trustedDomain.organization,
        category: trustedDomain.category
      }
    }
    
    // SSL証明書チェック
    const sslInfo = await this.checkSSLCertificate(domain)
    
    // WHOIS情報チェック
    const whoisInfo = await this.checkWhoisInfo(domain)
    
    return {
      isTrusted: false,
      sslOrganization: sslInfo?.organization,
      domainAge: whoisInfo?.registrationDate,
      suspiciousIndicators: this.detectSuspiciousPatterns(domain)
    }
  }
}
```

### 3.2 要約生成パイプライン（Tier考慮版）

```typescript
interface SummaryPipeline {
  // 1. 前処理
  preprocessArticle(article: Article): ProcessedArticle
  
  // 2. 要約生成
  generateSummary(content: string): Promise<string>
  
  // 3. 品質チェック
  validateSummary(summary: string, original: string): boolean
  
  // 4. 後処理
  postprocessSummary(summary: string): string
}

class JapaneseSummaryPipeline implements SummaryPipeline {
  private llm: OpenAI
  private tokenizer: Tokenizer
  
  async generateSummary(content: string): Promise<string> {
    // トークン数チェック
    const tokens = this.tokenizer.encode(content)
    if (tokens.length > 4000) {
      content = this.truncateByTokens(content, 4000)
    }
    
    // プロンプト構築
    const prompt = `
      以下の記事を日本語で3行以内に要約してください：
      - 重要な事実を優先
      - 数値や固有名詞を含める
      - 簡潔で分かりやすく
      
      記事：
      ${content}
    `
    
    // GPT-4o呼び出し
    const response = await this.llm.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 300
    })
    
    return response.choices[0].message.content
  }
}
```

### 3.3 情報源メタデータ強化

```typescript
interface SourceMetadataEnhancer {
  // 著者情報の抽出と検証
  extractAuthorInfo(article: Article): Promise<AuthorInfo>
  
  // 組織情報の補完
  enrichOrganizationData(source: Source): Promise<OrganizationInfo>
  
  // 発信者の役職・権限確認
  verifyAuthorAuthority(author: AuthorInfo): Promise<AuthorityLevel>
}

class SourceMetadataEnhancerImpl implements SourceMetadataEnhancer {
  async extractAuthorInfo(article: Article): Promise<AuthorInfo> {
    // 記事メタデータから著者情報抽出
    const authorMeta = this.parseAuthorMetadata(article.metadata)
    
    // SNSプロフィール情報の取得
    if (article.source.platform === 'twitter') {
      const profile = await this.getTwitterProfile(authorMeta.handle)
      
      return {
        name: profile.name,
        handle: profile.username,
        isVerified: profile.verified,
        title: this.extractTitleFromBio(profile.bio),
        organization: this.extractOrgFromBio(profile.bio),
        followerCount: profile.followersCount,
        authorityScore: this.calculateAuthorityScore(profile)
      }
    }
    
    // 企業サイトの場合は構造化データから抽出
    if (article.source.type === 'corporate_website') {
      const structuredData = await this.extractStructuredData(article.url)
      return this.parseAuthorFromStructuredData(structuredData)
    }
    
    return authorMeta
  }
  
  private calculateAuthorityScore(profile: any): number {
    // 権威性スコアの計算
    let score = 0
    
    if (profile.verified) score += 0.3
    if (profile.followersCount > 100000) score += 0.2
    if (profile.followersCount > 1000000) score += 0.2
    if (this.isExecutiveTitle(profile.bio)) score += 0.3
    
    return Math.min(score, 1.0)
  }
}
```

### 3.4 タグ自動分類（Tier連動版）

```typescript
interface TierAwareTagClassifier {
  // Tierに応じたタグ生成
  generateTags(article: Article, tier: number): Promise<Tag[]>
  
  // 情報源の専門分野判定
  classifySourceExpertise(source: Source): Promise<string[]>
  
  // 信頼性インジケータータグ
  addTrustIndicatorTags(article: Article): Promise<Tag[]>
}

class TierAwareTagClassifierImpl implements TierAwareTagClassifier {
  async generateTags(article: Article, tier: number): Promise<Tag[]> {
    const tags: Tag[] = []
    
    // Tier1の場合は特別なタグを付与
    if (tier === 1) {
      tags.push({
        name: "一次情報",
        color: "#FFD700",
        priority: 1
      })
      
      // 発信者の役職タグ
      if (article.author?.title) {
        tags.push({
          name: `${article.author.title}発信`,
          color: "#FF6B6B",
          priority: 2
        })
      }
    }
    
    // 通常のトピックタグ
    const topicTags = await this.generateTopicTags(article.content)
    tags.push(...topicTags)
    
    // 情報の鮮度タグ
    const freshnessTag = this.getFreshnessTag(article.publishedAt)
    if (freshnessTag) tags.push(freshnessTag)
    
    return tags
  }
  
  private getFreshnessTag(publishedAt: Date): Tag | null {
    const hoursSincePublish = (Date.now() - publishedAt.getTime()) / (1000 * 60 * 60)
    
    if (hoursSincePublish < 1) {
      return { name: "速報", color: "#FF0000", priority: 1 }
    } else if (hoursSincePublish < 24) {
      return { name: "最新", color: "#FF8C00", priority: 2 }
    }
    
    return null
  }
}
```

### 3.5 重複記事検出

```typescript
interface DuplicateDetector {
  // テキスト類似度計算
  calculateSimilarity(text1: string, text2: string): number
  
  // 重複候補検索
  findDuplicates(article: Article, threshold: number): Promise<Article[]>
  
  // グループ化
  groupDuplicates(articles: Article[]): ArticleGroup[]
}

class HybridDuplicateDetector implements DuplicateDetector {
  async findDuplicates(article: Article, threshold = 0.85): Promise<Article[]> {
    // 1. タイトルの編集距離でフィルタリング
    const titleCandidates = await this.findByTitleSimilarity(article.title)
    
    // 2. 埋め込みベクトルで意味的類似度チェック
    const semanticCandidates = await this.findBySemanticSimilarity(
      article.embedding,
      threshold
    )
    
    // 3. 公開日時の近さでさらにフィルタ
    const timeCandidates = this.filterByTimeProximity(
      [...titleCandidates, ...semanticCandidates],
      article.publishedAt,
      24 // 24時間以内
    )
    
    return this.deduplicate(timeCandidates)
  }
}
```

## 4. フロントエンド詳細設計

### 4.1 コンポーネント階層

```
App
├── Layout
│   ├── Header
│   │   ├── Logo
│   │   ├── Navigation
│   │   └── UserMenu
│   ├── Sidebar
│   │   ├── SourceList
│   │   ├── TagCloud
│   │   └── TrayList
│   └── Footer
├── Pages
│   ├── TodayPage
│   │   ├── HighlightCards
│   │   └── QuickStats
│   ├── FeedPage
│   │   ├── ArticleList
│   │   ├── ArticleCard
│   │   └── InfiniteScroll
│   ├── ArticlePage
│   │   ├── ArticleHeader
│   │   ├── ArticleContent
│   │   ├── ArticleSummary
│   │   └── ArticleActions
│   ├── TrayPage
│   │   ├── TrayBoard
│   │   ├── DraggableArticle
│   │   └── ExportPanel
│   └── SettingsPage
│       ├── SourceManager
│       ├── FilterSettings
│       └── AccountSettings
└── Common
    ├── Button
    ├── Input
    ├── Modal
    ├── Toast
    └── Loading
```

### 4.2 状態管理設計

```typescript
// Zustand Store定義
interface AppStore {
  // ユーザー状態
  user: User | null
  setUser: (user: User | null) => void
  
  // 記事状態
  articles: Article[]
  addArticles: (articles: Article[]) => void
  updateArticle: (id: string, updates: Partial<Article>) => void
  
  // Tray状態
  trays: Tray[]
  addToTray: (articleId: string, trayId: string) => void
  removeFromTray: (articleId: string, trayId: string) => void
  
  // UI状態
  sidebarOpen: boolean
  toggleSidebar: () => void
  activeView: 'list' | 'magazine'
  setActiveView: (view: 'list' | 'magazine') => void
}

// React Query設定
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5分
      cacheTime: 10 * 60 * 1000, // 10分
      refetchOnWindowFocus: false,
    },
  },
})

// GraphQLクライアント設定
const apolloClient = new ApolloClient({
  uri: process.env.NEXT_PUBLIC_GRAPHQL_URL,
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          articles: {
            keyArgs: ['filter'],
            merge(existing, incoming) {
              return {
                ...incoming,
                edges: [...(existing?.edges || []), ...incoming.edges],
              }
            },
          },
        },
      },
    },
  }),
})
```

### 4.3 レスポンシブデザイン

```scss
// ブレークポイント定義
$breakpoints: (
  'mobile': 320px,
  'tablet': 768px,
  'desktop': 1024px,
  'wide': 1440px
);

// レイアウトグリッド
.article-grid {
  display: grid;
  gap: 1rem;
  
  @include mobile {
    grid-template-columns: 1fr;
  }
  
  @include tablet {
    grid-template-columns: repeat(2, 1fr);
  }
  
  @include desktop {
    grid-template-columns: repeat(3, 1fr);
  }
  
  @include wide {
    grid-template-columns: repeat(4, 1fr);
  }
}
```

## 5. バックエンド詳細設計

### 5.1 サービス層アーキテクチャ

```typescript
// NestJS サービス構成
@Injectable()
export class ArticleService {
  constructor(
    private prisma: PrismaService,
    private aiService: AIService,
    private cacheService: CacheService,
    private queueService: QueueService,
  ) {}
  
  async processNewArticle(sourceId: string, rawArticle: RawArticle): Promise<Article> {
    // 1. 重複チェック
    const isDuplicate = await this.checkDuplicate(rawArticle)
    if (isDuplicate) {
      throw new DuplicateArticleException()
    }
    
    // 2. 記事作成
    const article = await this.prisma.article.create({
      data: {
        sourceId,
        title: rawArticle.title,
        content: rawArticle.content,
        url: rawArticle.url,
        publishedAt: rawArticle.publishedAt,
        externalId: rawArticle.id,
      },
    })
    
    // 3. AI処理キューに追加
    await this.queueService.addJob('ai-processing', {
      articleId: article.id,
      tasks: ['summary', 'tagging', 'embedding'],
    })
    
    // 4. キャッシュ更新
    await this.cacheService.invalidate(`source:${sourceId}:articles`)
    
    return article
  }
}
```

### 5.2 キュー処理設計

```typescript
// Bull Queue 定義
@Processor('ai-processing')
export class AIProcessingConsumer {
  constructor(
    private aiService: AIService,
    private prisma: PrismaService,
  ) {}
  
  @Process()
  async processArticle(job: Job<AIProcessingJob>) {
    const { articleId, tasks } = job.data
    
    const article = await this.prisma.article.findUnique({
      where: { id: articleId },
    })
    
    if (!article) {
      throw new Error(`Article ${articleId} not found`)
    }
    
    const updates: Partial<Article> = {}
    
    // 並列処理
    const results = await Promise.allSettled([
      tasks.includes('summary') && this.generateSummary(article),
      tasks.includes('tagging') && this.generateTags(article),
      tasks.includes('embedding') && this.generateEmbedding(article),
    ])
    
    // 結果の集約
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        switch (tasks[index]) {
          case 'summary':
            updates.summary = result.value
            break
          case 'tagging':
            updates.tags = result.value
            break
          case 'embedding':
            updates.embedding = result.value
            break
        }
      }
    })
    
    // DB更新
    await this.prisma.article.update({
      where: { id: articleId },
      data: updates,
    })
  }
}
```

### 5.3 WebSub実装

```typescript
@Controller('webhooks/websub')
export class WebSubController {
  constructor(
    private sourceService: SourceService,
    private articleService: ArticleService,
  ) {}
  
  @Get(':sourceId')
  async verify(
    @Param('sourceId') sourceId: string,
    @Query('hub.mode') mode: string,
    @Query('hub.topic') topic: string,
    @Query('hub.challenge') challenge: string,
  ): Promise<string> {
    // 購読確認
    const source = await this.sourceService.findById(sourceId)
    
    if (!source || source.url !== topic) {
      throw new UnauthorizedException()
    }
    
    if (mode === 'subscribe' || mode === 'unsubscribe') {
      // チャレンジレスポンス返却
      return challenge
    }
    
    throw new BadRequestException()
  }
  
  @Post(':sourceId')
  async handleUpdate(
    @Param('sourceId') sourceId: string,
    @Body() body: string,
    @Headers('x-hub-signature') signature: string,
  ): Promise<void> {
    // 署名検証
    if (!this.verifySignature(body, signature)) {
      throw new UnauthorizedException()
    }
    
    // フィード解析
    const articles = await this.parseFeed(body)
    
    // 記事処理
    for (const article of articles) {
      await this.articleService.processNewArticle(sourceId, article)
    }
  }
}
```

## 6. インフラ詳細設計

### 6.1 Kubernetes マニフェスト

```yaml
# Deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: filterie-api
  namespace: production
spec:
  replicas: 3
  selector:
    matchLabels:
      app: filterie-api
  template:
    metadata:
      labels:
        app: filterie-api
    spec:
      containers:
      - name: api
        image: filterie/api:latest
        ports:
        - containerPort: 3000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: url
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: redis-secret
              key: url
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5

---
# Service
apiVersion: v1
kind: Service
metadata:
  name: filterie-api
  namespace: production
spec:
  selector:
    app: filterie-api
  ports:
  - port: 80
    targetPort: 3000
  type: ClusterIP

---
# HorizontalPodAutoscaler
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: filterie-api-hpa
  namespace: production
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: filterie-api
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

### 6.2 CI/CDパイプライン

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Run E2E tests
        run: npm run test:e2e
      
      - name: SonarCloud Scan
        uses: SonarSource/sonarcloud-github-action@master
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
  
  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2
      
      - name: Login to DockerHub
        uses: docker/login-action@v2
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}
      
      - name: Build and push API image
        uses: docker/build-push-action@v4
        with:
          context: ./apps/api
          push: true
          tags: |
            filterie/api:latest
            filterie/api:${{ github.sha }}
          cache-from: type=registry,ref=filterie/api:buildcache
          cache-to: type=registry,ref=filterie/api:buildcache,mode=max
      
      - name: Build and push Web image
        uses: docker/build-push-action@v4
        with:
          context: ./apps/web
          push: true
          tags: |
            filterie/web:latest
            filterie/web:${{ github.sha }}
  
  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Update Kubernetes manifests
        run: |
          sed -i "s|image: filterie/api:.*|image: filterie/api:${{ github.sha }}|g" k8s/production/*.yaml
          sed -i "s|image: filterie/web:.*|image: filterie/web:${{ github.sha }}|g" k8s/production/*.yaml
      
      - name: Commit and push to GitOps repo
        run: |
          git config --global user.name 'GitHub Actions'
          git config --global user.email 'actions@github.com'
          git add k8s/production/*.yaml
          git commit -m "Deploy ${{ github.sha }}"
          git push
```

## 7. セキュリティ詳細設計

### 7.1 認証フロー

```typescript
// JWT認証実装
@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private userService: UserService,
    private configService: ConfigService,
  ) {}
  
  async login(email: string, password: string): Promise<AuthResponse> {
    // 1. ユーザー検証
    const user = await this.userService.findByEmail(email)
    if (!user || !await bcrypt.compare(password, user.passwordHash)) {
      throw new UnauthorizedException('Invalid credentials')
    }
    
    // 2. 2FA確認
    if (user.twoFactorSecret) {
      return {
        requiresTwoFactor: true,
        tempToken: this.generateTempToken(user.id),
      }
    }
    
    // 3. トークン生成
    const tokens = await this.generateTokens(user)
    
    // 4. リフレッシュトークン保存
    await this.saveRefreshToken(user.id, tokens.refreshToken)
    
    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: this.sanitizeUser(user),
    }
  }
  
  private generateTokens(user: User): TokenPair {
    const payload = {
      sub: user.id,
      email: user.email,
      plan: user.plan,
    }
    
    return {
      accessToken: this.jwtService.sign(payload, {
        expiresIn: '15m',
      }),
      refreshToken: this.jwtService.sign(payload, {
        expiresIn: '7d',
      }),
    }
  }
}
```

### 7.2 権限管理

```typescript
// RBAC実装
@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private reflector: Reflector) {}
  
  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    )
    
    if (!requiredPermissions) {
      return true
    }
    
    const { user } = context.switchToHttp().getRequest()
    
    return this.hasPermissions(user, requiredPermissions)
  }
  
  private hasPermissions(user: User, permissions: Permission[]): boolean {
    const userPermissions = this.getUserPermissions(user)
    
    return permissions.every(permission =>
      userPermissions.includes(permission),
    )
  }
  
  private getUserPermissions(user: User): Permission[] {
    const planPermissions: Record<PlanType, Permission[]> = {
      [PlanType.FREE]: [
        Permission.READ_ARTICLES,
        Permission.CREATE_SOURCES_LIMITED,
        Permission.CREATE_TRAYS_LIMITED,
      ],
      [PlanType.PRO]: [
        ...planPermissions[PlanType.FREE],
        Permission.CREATE_SOURCES_UNLIMITED,
        Permission.CREATE_TRAYS_UNLIMITED,
        Permission.EXPORT_ALL_FORMATS,
        Permission.FULL_TEXT_SEARCH,
      ],
      [PlanType.TEAM]: [
        ...planPermissions[PlanType.PRO],
        Permission.SHARE_TRAYS,
        Permission.TEAM_MANAGEMENT,
      ],
      [PlanType.ENTERPRISE]: [
        ...planPermissions[PlanType.TEAM],
        Permission.API_ACCESS,
        Permission.CUSTOM_INTEGRATION,
      ],
    }
    
    return planPermissions[user.plan] || []
  }
}
```

## 8. パフォーマンス最適化設計

### 8.1 キャッシング戦略

```typescript
// Redisキャッシュ実装
@Injectable()
export class CacheService {
  private redis: Redis
  
  constructor(private configService: ConfigService) {
    this.redis = new Redis(configService.get('REDIS_URL'))
  }
  
  async get<T>(key: string): Promise<T | null> {
    const value = await this.redis.get(key)
    return value ? JSON.parse(value) : null
  }
  
  async set<T>(
    key: string,
    value: T,
    ttl?: number,
  ): Promise<void> {
    const serialized = JSON.stringify(value)
    
    if (ttl) {
      await this.redis.setex(key, ttl, serialized)
    } else {
      await this.redis.set(key, serialized)
    }
  }
  
  async invalidate(pattern: string): Promise<void> {
    const keys = await this.redis.keys(pattern)
    
    if (keys.length > 0) {
      await this.redis.del(...keys)
    }
  }
  
  // 記事リストキャッシュ
  async getCachedArticles(
    userId: string,
    filter: ArticleFilter,
  ): Promise<Article[] | null> {
    const cacheKey = `articles:${userId}:${JSON.stringify(filter)}`
    return this.get<Article[]>(cacheKey)
  }
  
  async setCachedArticles(
    userId: string,
    filter: ArticleFilter,
    articles: Article[],
  ): Promise<void> {
    const cacheKey = `articles:${userId}:${JSON.stringify(filter)}`
    await this.set(cacheKey, articles, 300) // 5分間キャッシュ
  }
}
```

### 8.2 データベース最適化

```typescript
// クエリ最適化
@Injectable()
export class OptimizedArticleRepository {
  constructor(private prisma: PrismaService) {}
  
  async findArticlesWithCursor(
    userId: string,
    cursor?: string,
    limit = 20,
  ): Promise<PaginatedArticles> {
    // カーソルベースページネーション
    const articles = await this.prisma.$queryRaw<Article[]>`
      WITH user_sources AS (
        SELECT id FROM sources
        WHERE user_id = ${userId}::uuid
        AND is_active = true
      ),
      ranked_articles AS (
        SELECT
          a.*,
          COALESCE(uas.is_read, false) as is_read,
          ROW_NUMBER() OVER (
            PARTITION BY DATE_TRUNC('hour', a.published_at)
            ORDER BY a.published_at DESC
          ) as hour_rank
        FROM articles a
        INNER JOIN user_sources us ON a.source_id = us.id
        LEFT JOIN user_article_states uas ON
          a.id = uas.article_id AND uas.user_id = ${userId}::uuid
        WHERE
          ${cursor ? sql`a.published_at < ${cursor}::timestamp` : sql`true`}
      )
      SELECT * FROM ranked_articles
      WHERE hour_rank <= 10  -- 時間あたり最大10記事
      ORDER BY published_at DESC
      LIMIT ${limit + 1}
    `
    
    const hasMore = articles.length > limit
    const items = hasMore ? articles.slice(0, -1) : articles
    const nextCursor = hasMore
      ? items[items.length - 1].publishedAt.toISOString()
      : null
    
    return {
      items,
      pageInfo: {
        hasNextPage: hasMore,
        endCursor: nextCursor,
      },
    }
  }
}
```

## 9. 監視・ロギング設計

### 9.1 メトリクス収集

```typescript
// OpenTelemetry設定
import { metrics } from '@opentelemetry/api'
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus'
import { MeterProvider } from '@opentelemetry/sdk-metrics'

export class MetricsService {
  private meter = metrics.getMeter('filterie', '1.0.0')
  
  // カウンターメトリクス
  private articleProcessedCounter = this.meter.createCounter(
    'articles_processed_total',
    {
      description: 'Total number of articles processed',
    },
  )
  
  // ヒストグラムメトリクス
  private processingDuration = this.meter.createHistogram(
    'article_processing_duration_seconds',
    {
      description: 'Duration of article processing',
      unit: 'seconds',
    },
  )
  
  // ゲージメトリクス
  private activeUsers = this.meter.createObservableGauge(
    'active_users',
    {
      description: 'Number of active users',
    },
  )
  
  recordArticleProcessed(source: string, status: 'success' | 'failure') {
    this.articleProcessedCounter.add(1, {
      source,
      status,
    })
  }
  
  recordProcessingDuration(duration: number, operation: string) {
    this.processingDuration.record(duration, {
      operation,
    })
  }
}
```

### 9.2 ログ設計

```typescript
// 構造化ログ実装
import { Logger } from '@nestjs/common'
import { createLogger, format, transports } from 'winston'

export class StructuredLogger {
  private logger = createLogger({
    format: format.combine(
      format.timestamp(),
      format.errors({ stack: true }),
      format.json(),
    ),
    transports: [
      new transports.Console(),
      new transports.File({
        filename: 'error.log',
        level: 'error',
      }),
    ],
  })
  
  logRequest(req: Request, res: Response, duration: number) {
    this.logger.info('HTTP Request', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
      userId: req.user?.id,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    })
  }
  
  logError(error: Error, context?: any) {
    this.logger.error('Application Error', {
      message: error.message,
      stack: error.stack,
      context,
    })
  }
  
  logAIOperation(operation: string, details: any) {
    this.logger.info('AI Operation', {
      operation,
      ...details,
      timestamp: new Date().toISOString(),
    })
  }
}
```

## 10. テスト設計

### 10.1 単体テスト

```typescript
// ArticleService単体テスト
describe('ArticleService', () => {
  let service: ArticleService
  let prisma: DeepMockProxy<PrismaClient>
  let aiService: DeepMockProxy<AIService>
  
  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ArticleService,
        {
          provide: PrismaService,
          useValue: mockDeep<PrismaClient>(),
        },
        {
          provide: AIService,
          useValue: mockDeep<AIService>(),
        },
      ],
    }).compile()
    
    service = module.get(ArticleService)
    prisma = module.get(PrismaService)
    aiService = module.get(AIService)
  })
  
  describe('processNewArticle', () => {
    it('should create article and queue AI processing', async () => {
      const mockArticle = {
        id: 'article-1',
        title: 'Test Article',
        content: 'Test content',
      }
      
      prisma.article.create.mockResolvedValue(mockArticle)
      prisma.article.findFirst.mockResolvedValue(null) // No duplicate
      
      const result = await service.processNewArticle('source-1', {
        title: 'Test Article',
        content: 'Test content',
        url: 'https://example.com',
        publishedAt: new Date(),
      })
      
      expect(result).toEqual(mockArticle)
      expect(prisma.article.create).toHaveBeenCalled()
    })
    
    it('should throw error on duplicate article', async () => {
      prisma.article.findFirst.mockResolvedValue({ id: 'existing' })
      
      await expect(
        service.processNewArticle('source-1', {
          title: 'Duplicate',
          content: 'Content',
          url: 'https://example.com',
          publishedAt: new Date(),
        }),
      ).rejects.toThrow(DuplicateArticleException)
    })
  })
})
```

### 10.2 統合テスト

```typescript
// E2Eテスト
describe('Articles API (e2e)', () => {
  let app: INestApplication
  let prisma: PrismaService
  
  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()
    
    app = moduleFixture.createNestApplication()
    prisma = app.get(PrismaService)
    
    await app.init()
  })
  
  afterAll(async () => {
    await prisma.$disconnect()
    await app.close()
  })
  
  describe('/graphql articles query', () => {
    it('should return paginated articles', async () => {
      const query = `
        query GetArticles($first: Int!, $after: String) {
          articles(first: $first, after: $after) {
            edges {
              node {
                id
                title
                summary
              }
            }
            pageInfo {
              hasNextPage
              endCursor
            }
            totalCount
          }
        }
      `
      
      const response = await request(app.getHttpServer())
        .post('/graphql')
        .set('Authorization', `Bearer ${getTestToken()}`)
        .send({
          query,
          variables: { first: 10 },
        })
        .expect(200)
      
      expect(response.body.data.articles).toBeDefined()
      expect(response.body.data.articles.edges).toHaveLength(10)
      expect(response.body.data.articles.pageInfo).toBeDefined()
    })
  })
})
```

これで基本設計書と詳細設計書の作成が完了しました。