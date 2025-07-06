# Filterie 情報源Tier分類設計書

## 1. 概要

Filterieの中核機能として、情報源の信頼性と権威性に基づいたTier分類システムを実装します。
ユーザーは一次情報源から直接発信された情報を優先的に取得でき、情報の出所が明確にわかるようになります。

## 2. Tier分類定義

### Tier 1: 一次情報源（Primary Sources）
最も信頼性の高い、直接の情報発信元

#### 1-1. 企業公式チャンネル
- **公式ウェブサイト**: 企業の公式プレスリリース、ニュースルーム
- **公式SNSアカウント**: 認証済み企業アカウント（Twitter/X、LinkedIn等）
- **IR情報**: 決算発表、有価証券報告書、株主向け資料
- **公式ブログ**: 企業が運営する技術ブログ、製品ブログ

#### 1-2. 要人・経営層の発信
- **CEO/CTO/CIO等の個人アカウント**: 認証済みアカウントからの発信
- **役員ブログ**: 企業幹部が公式に運営するブログ
- **基調講演・カンファレンス**: 公式イベントでの発表内容

#### 1-3. 政府・公的機関
- **官公庁発表**: 各省庁の公式発表、統計データ
- **規制当局**: 金融庁、公正取引委員会等の公式情報
- **国際機関**: UN、WHO、IMF等の公式発表

### Tier 2: 信頼できる二次情報源（Trusted Secondary Sources）
一次情報を正確に伝える信頼性の高いメディア

#### 2-1. 大手報道機関
- **通信社**: ロイター、ブルームバーグ、共同通信、時事通信
- **主要新聞**: 日経、読売、朝日、WSJ、NYT等
- **専門メディア**: 業界特化の信頼できるメディア

#### 2-2. 業界アナリスト
- **調査会社**: Gartner、IDC、Forrester等のレポート
- **証券アナリスト**: 大手証券会社の公式レポート
- **シンクタンク**: 有名研究機関の発表

### Tier 3: 一般メディア・キュレーション（General Media）
広く情報を扱う一般的なメディア

#### 3-1. オンラインメディア
- **テックメディア**: TechCrunch、The Verge、ITmedia等
- **ビジネスメディア**: Business Insider、Forbes等
- **ニュースアグリゲーター**: Google News、Yahoo!ニュース

#### 3-2. 専門ブログ・個人メディア
- **影響力のある個人ブログ**: 業界で認知度の高いブロガー
- **Medium等のプラットフォーム**: 専門家による記事

### Tier 4: ソーシャルメディア・UGC（User Generated Content）
一般ユーザーによる情報発信

- **一般ユーザーのSNS投稿**: 非認証アカウントのツイート等
- **掲示板・フォーラム**: Reddit、Stack Overflow等
- **コメント・レビュー**: 各種サービスのユーザーレビュー

## 3. Tier判定ロジック

### 3.1 自動判定システム

```typescript
interface SourceTierClassifier {
  // ドメイン信頼性データベース
  domainTrustDB: Map<string, TierInfo>
  
  // SNSアカウント認証情報
  verifiedAccounts: Map<string, AccountInfo>
  
  // 判定メソッド
  classifySource(source: Source): Promise<TierClassification>
  
  // 信頼性スコア計算
  calculateTrustScore(source: Source): number
}

interface TierClassification {
  tier: 1 | 2 | 3 | 4
  confidence: number // 0.0 - 1.0
  reasoning: string[]
  verificationStatus: VerificationStatus
}

enum VerificationStatus {
  VERIFIED = "verified",           // 検証済み（公式認証等）
  TRUSTED = "trusted",            // 信頼できる（実績ベース）
  UNVERIFIED = "unverified",      // 未検証
  SUSPICIOUS = "suspicious"        // 疑わしい
}
```

### 3.2 判定基準

```typescript
class TierClassificationEngine {
  async classifySource(source: Source): Promise<TierClassification> {
    const checks = await Promise.all([
      this.checkDomainAuthority(source.url),
      this.checkSSLCertificate(source.url),
      this.checkAccountVerification(source),
      this.checkContentPattern(source),
      this.checkHistoricalReliability(source)
    ])
    
    return this.aggregateChecks(checks)
  }
  
  // Tier 1 判定条件
  private isTier1(source: Source): boolean {
    return (
      // 企業公式ドメイン
      this.isOfficialDomain(source.url) ||
      // 認証済み要人アカウント
      this.isVerifiedExecutive(source.author) ||
      // 政府・公的機関
      this.isGovernmentDomain(source.url)
    )
  }
  
  // ドメイン権威性チェック
  private async checkDomainAuthority(url: string): Promise<DomainCheck> {
    const domain = new URL(url).hostname
    
    // 企業公式ドメインリスト
    const officialDomains = await this.getOfficialDomains()
    
    // SSL証明書の組織情報確認
    const sslInfo = await this.getSSLInfo(domain)
    
    // WHOIS情報による所有者確認
    const whoisInfo = await this.getWhoisInfo(domain)
    
    return {
      isOfficial: officialDomains.has(domain),
      sslOrganization: sslInfo.organization,
      domainAge: whoisInfo.age,
      trustScore: this.calculateDomainTrust(domain)
    }
  }
}
```

## 4. UI/UX設計

### 4.1 Tier表示デザイン

```typescript
interface TierBadge {
  tier: number
  label: string
  color: string
  icon: string
  description: string
}

const tierBadges: Record<number, TierBadge> = {
  1: {
    tier: 1,
    label: "一次情報",
    color: "#FFD700",  // ゴールド
    icon: "verified",
    description: "公式発表・要人発信"
  },
  2: {
    tier: 2,
    label: "信頼メディア",
    color: "#C0C0C0",  // シルバー
    icon: "newspaper",
    description: "大手報道・専門機関"
  },
  3: {
    tier: 3,
    label: "一般メディア",
    color: "#CD7F32",  // ブロンズ
    icon: "web",
    description: "オンラインメディア・ブログ"
  },
  4: {
    tier: 4,
    label: "ユーザー投稿",
    color: "#808080",  // グレー
    icon: "people",
    description: "SNS・フォーラム"
  }
}
```

### 4.2 フィルタリングUI

```tsx
// Tier選択コンポーネント
function TierFilter({ selectedTiers, onChange }: TierFilterProps) {
  return (
    <div className="tier-filter">
      <h3>情報源の信頼性で絞り込み</h3>
      
      {Object.values(tierBadges).map(badge => (
        <label key={badge.tier} className="tier-option">
          <input
            type="checkbox"
            checked={selectedTiers.includes(badge.tier)}
            onChange={() => onChange(badge.tier)}
          />
          <TierBadge {...badge} />
          <span className="tier-description">{badge.description}</span>
        </label>
      ))}
      
      <div className="tier-presets">
        <button onClick={() => onChange([1])}>
          一次情報のみ
        </button>
        <button onClick={() => onChange([1, 2])}>
          信頼できる情報のみ
        </button>
        <button onClick={() => onChange([1, 2, 3, 4])}>
          すべて表示
        </button>
      </div>
    </div>
  )
}
```

### 4.3 記事表示での情報源明示

```tsx
// 記事カードでの情報源表示
function ArticleCard({ article }: ArticleCardProps) {
  return (
    <article className="article-card">
      <div className="source-info">
        <TierBadge {...tierBadges[article.source.tier]} />
        <div className="source-details">
          <span className="source-name">{article.source.name}</span>
          {article.source.tier === 1 && article.author && (
            <span className="author-info">
              <VerifiedIcon />
              {article.author.name} - {article.author.title}
            </span>
          )}
        </div>
      </div>
      
      <h2>{article.title}</h2>
      <p>{article.summary}</p>
      
      <div className="source-verification">
        <button onClick={() => showSourceDetails(article.source)}>
          情報源の詳細を確認
        </button>
      </div>
    </article>
  )
}
```

## 5. データベース拡張

### 5.1 追加テーブル

```sql
-- 情報源Tier管理テーブル
CREATE TABLE source_tiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id UUID NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
    tier INTEGER NOT NULL CHECK (tier BETWEEN 1 AND 4),
    confidence FLOAT NOT NULL CHECK (confidence BETWEEN 0 AND 1),
    verification_status VARCHAR(20) NOT NULL,
    reasoning JSONB DEFAULT '[]',
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 信頼ドメインマスタ
CREATE TABLE trusted_domains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    domain VARCHAR(255) UNIQUE NOT NULL,
    organization VARCHAR(255) NOT NULL,
    tier INTEGER NOT NULL,
    category VARCHAR(50), -- 'corporate', 'government', 'media', etc.
    verified BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 認証済みアカウントマスタ
CREATE TABLE verified_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    platform VARCHAR(50) NOT NULL, -- 'twitter', 'linkedin', etc.
    account_id VARCHAR(255) NOT NULL,
    account_name VARCHAR(255) NOT NULL,
    person_name VARCHAR(255),
    title VARCHAR(255), -- 'CEO', 'CTO', etc.
    organization VARCHAR(255),
    tier INTEGER NOT NULL,
    verified_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(platform, account_id)
);

-- 情報源信頼性履歴
CREATE TABLE source_reliability_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id UUID NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
    accuracy_score FLOAT, -- 過去の情報の正確性スコア
    correction_count INTEGER DEFAULT 0, -- 訂正回数
    false_info_count INTEGER DEFAULT 0, -- 誤情報回数
    evaluation_period_start DATE,
    evaluation_period_end DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 5.2 インデックス追加

```sql
CREATE INDEX idx_source_tiers_tier ON source_tiers(tier);
CREATE INDEX idx_source_tiers_source_id ON source_tiers(source_id);
CREATE INDEX idx_trusted_domains_domain ON trusted_domains(domain);
CREATE INDEX idx_verified_accounts_platform_account ON verified_accounts(platform, account_id);
```

## 6. API拡張

### 6.1 GraphQL スキーマ追加

```graphql
# Tier関連の型定義
type SourceTier {
  tier: Int!
  confidence: Float!
  verificationStatus: VerificationStatus!
  reasoning: [String!]!
  badge: TierBadge!
}

type TierBadge {
  label: String!
  color: String!
  icon: String!
  description: String!
}

enum VerificationStatus {
  VERIFIED
  TRUSTED
  UNVERIFIED
  SUSPICIOUS
}

# Source型の拡張
extend type Source {
  tier: SourceTier!
  verificationDetails: VerificationDetails
}

type VerificationDetails {
  domain: DomainVerification
  account: AccountVerification
  reliabilityScore: Float
  lastVerified: DateTime
}

# Query拡張
extend type Query {
  # Tier別の記事取得
  articlesByTier(
    tiers: [Int!]!
    first: Int = 20
    after: String
  ): ArticleConnection!
  
  # 信頼できる情報源の統計
  sourceTierStats: SourceTierStats!
}

type SourceTierStats {
  tierCounts: [TierCount!]!
  verifiedSourceCount: Int!
  totalSourceCount: Int!
}

# Mutation拡張
extend type Mutation {
  # 手動でのTier設定（管理者用）
  updateSourceTier(
    sourceId: ID!
    tier: Int!
    reasoning: String
  ): Source!
  
  # 情報源の検証リクエスト
  requestSourceVerification(sourceId: ID!): VerificationRequest!
}
```

## 7. 実装優先順位

### Phase 1: 基盤構築（1-2週間）
1. データベーススキーマの実装
2. 信頼ドメインの初期データ投入
3. 基本的なTier判定ロジック

### Phase 2: 自動判定システム（2-3週間）
1. ドメイン検証API実装
2. SNSアカウント認証チェック
3. Tier自動分類エンジン

### Phase 3: UI実装（1-2週間）
1. Tierバッジコンポーネント
2. フィルタリングUI
3. 情報源詳細表示

### Phase 4: 運用機能（1週間）
1. 管理画面でのTier手動調整
2. 信頼性スコアの継続的更新
3. レポート機能

## 8. 今後の拡張案

### 8.1 AIによる信頼性向上
- 過去の発信内容との一貫性チェック
- 他の信頼できる情報源との相互参照
- フェイクニュース検出アルゴリズムの統合

### 8.2 ユーザーフィードバック活用
- 情報の正確性に関するユーザー報告機能
- コミュニティベースの信頼性評価
- 専門家による情報源レビュー

### 8.3 ブロックチェーン活用
- 情報源の検証履歴の不変記録
- 分散型信頼性評価システム
- デジタル署名による真正性保証