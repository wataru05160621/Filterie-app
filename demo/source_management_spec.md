# 情報源管理機能仕様書

## 概要
Filterieの中核機能である情報源（Source）管理システムの実装仕様

## データモデル
```typescript
interface Source {
  id: string;
  name: string;
  url: string;
  feedUrl?: string;
  tier: number; // 1-4
  category: string;
  language: string;
  isActive: boolean;
  lastFetchedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

## GraphQL API仕様

### Query
```graphql
type Query {
  sources(
    filter: SourceFilterInput
    pagination: PaginationInput
  ): SourceConnection!
  
  source(id: ID!): Source
}

input SourceFilterInput {
  tier: Int
  category: String
  isActive: Boolean
  language: String
}
```

### Mutation
```graphql
type Mutation {
  createSource(input: CreateSourceInput!): Source!
  updateSource(id: ID!, input: UpdateSourceInput!): Source!
  deleteSource(id: ID!): Boolean!
  
  # Tier判定
  evaluateSourceTier(url: String!): TierEvaluation!
}

input CreateSourceInput {
  name: String!
  url: String!
  feedUrl: String
  category: String!
  language: String
}

type TierEvaluation {
  tier: Int!
  confidence: Float!
  reasons: [String!]!
}
```

## Tier判定ロジック

### Tier 1 (最高信頼度)
- 企業公式サイト（.com/.co.jp の企業ドメイン）
- 政府機関（.gov/.go.jp）
- 認証済みソーシャルメディアアカウント

### Tier 2 (高信頼度)
- 大手報道機関
- 業界専門メディア
- 学術機関（.edu/.ac.jp）

### Tier 3 (中信頼度)
- 一般的なニュースサイト
- ブログプラットフォーム（企業運営）
- キュレーションメディア

### Tier 4 (要検証)
- 個人ブログ
- 匿名投稿サイト
- UGCプラットフォーム

## 実装優先順位
1. 基本的なCRUD操作
2. Tier判定ロジック
3. フィルタリング機能
4. ページネーション
5. RSS/Atomフィード検証