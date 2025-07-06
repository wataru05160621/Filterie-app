# Filterie 基本設計書

## 1. システム概要

### 1.1 システム名
Filterie（フィルタリー）

### 1.2 システムの目的
一次情報に素早くアクセスし、AIによるフィルタリングを通じて価値ある情報のみを抽出し、様々な形式で再利用できる情報濾過ハブを提供する。

### 1.3 システムの特徴
- **高速情報取得**: RSS/Atom、WebSub、メールニュースレター等から即座に情報を取得
- **AIフィルタリング**: 日本語特化のAIによるノイズ除去と要約
- **マルチフォーマット出力**: Markdown、HTML、PDF、CSV等での柔軟なエクスポート
- **クロスプラットフォーム**: Web、iOS、Androidで統一されたユーザー体験

## 2. アーキテクチャ設計

### 2.1 システム構成図

```
┌─────────────────────────────────────────────────────────────┐
│                         クライアント層                        │
├─────────────────┬──────────────────┬────────────────────────┤
│   Web (PWA)     │  iOS (Native)    │   Android (Native)     │
│   Next.js 15    │  React Native    │   React Native         │
│                 │     (Expo)       │      (Expo)            │
└────────┬────────┴──────────────────┴────────────────────────┘
         │
         │ GraphQL / REST API
         │
┌────────┴────────────────────────────────────────────────────┐
│                          API層                               │
│                    NestJS + Prisma                          │
│              Apollo GraphQL Server                          │
└────────┬────────────────────────────────────────────────────┘
         │
         ├─────────────────┬──────────────────┬───────────────┐
         │                 │                  │               │
┌────────┴──────┐ ┌───────┴────────┐ ┌──────┴──────┐ ┌──────┴──────┐
│   認証サービス  │ │ コンテンツ取得  │ │ AI処理サービス│ │ 出力サービス │
│   OAuth2/JWT  │ │  RSS/WebSub    │ │ LangChain   │ │ Export API  │
└───────────────┘ └────────────────┘ └─────────────┘ └─────────────┘
         │                 │                  │               │
         └─────────────────┴──────────────────┴───────────────┘
                                   │
┌──────────────────────────────────┴──────────────────────────┐
│                         データ層                             │
├─────────────────┬──────────────────┬───────────────────────┤
│   PostgreSQL    │      Redis       │    Meilisearch       │
│  (メインDB)     │   (キャッシュ)    │    (全文検索)         │
└─────────────────┴──────────────────┴───────────────────────┘
```

### 2.2 技術スタック

#### フロントエンド
- **フレームワーク**: Next.js 15 (App Router) + React Native (Expo)
- **言語**: TypeScript
- **スタイリング**: TailwindCSS
- **状態管理**: TanStack Query + Zustand
- **フォーム**: React Hook Form + Zod

#### バックエンド
- **フレームワーク**: NestJS
- **言語**: TypeScript
- **ORM**: Prisma
- **API**: GraphQL (Apollo Server)
- **認証**: Passport.js + JWT

#### AI/ML
- **フレームワーク**: LangChain
- **モデル**: OpenAI GPT-4o, sentence-transformers (日本語SBERT)
- **ベクトルDB**: pgvector (PostgreSQL拡張)

#### インフラ
- **コンテナ**: Docker + Kubernetes (AWS EKS)
- **メッセージキュー**: AWS SQS
- **CDN**: AWS CloudFront
- **CI/CD**: GitHub Actions + ArgoCD

## 3. データ設計

### 3.1 主要エンティティ

```
User
├── id: UUID
├── email: string
├── name: string
├── plan: enum (free, pro, team, enterprise)
├── createdAt: timestamp
└── updatedAt: timestamp

Source
├── id: UUID
├── userId: UUID
├── type: enum (rss, atom, websub, email)
├── url: string
├── title: string
├── isActive: boolean
└── lastFetchedAt: timestamp

Article
├── id: UUID
├── sourceId: UUID
├── title: string
├── content: text
├── summary: text
├── url: string
├── publishedAt: timestamp
├── tags: Tag[]
└── metadata: JSONB

Tray
├── id: UUID
├── userId: UUID
├── name: string
├── articles: Article[]
├── position: integer
└── createdAt: timestamp

Tag
├── id: UUID
├── name: string
├── color: string
└── articles: Article[]
```

### 3.2 データフロー

1. **情報取得フロー**
   - Cron/WebSubによる定期的な情報取得
   - コンテンツの正規化とデータベース保存
   - Redisによる重複チェックとキャッシング

2. **AI処理フロー**
   - 新規記事の自動要約生成
   - タグ自動分類
   - 類似記事のグルーピング

3. **エクスポートフロー**
   - Trayからの選択記事取得
   - 指定フォーマットへの変換
   - 一時URLの生成とダウンロード

## 4. 機能設計

### 4.1 コア機能

#### ソース管理
- RSS/Atomフィードの登録・管理
- WebSub対応によるリアルタイム更新
- メールニュースレター用エイリアスアドレス生成

#### 情報源信頼性評価システム
- 情報源のTier分類（Tier1: 一次情報源、Tier2: 信頼メディア、Tier3: 一般メディア、Tier4: UGC）
- 企業公式・要人発信の自動識別
- ドメイン・アカウント認証チェック
- 信頼性スコアの継続的評価

#### フィルタリングAI
- 情報源Tierに基づく優先表示
- 重複記事の検出と除去
- 日本語特化の要約生成
- 情報の出所明確化

#### Tray（保存ボード）
- ドラッグ&ドロップによる記事の保存
- 複数Trayの作成・管理（Freeプラン：3件まで）
- Tray内での記事の並び替え

#### エクスポート機能
- Markdown/HTML/PDF/CSV/OPML形式での出力
- 画像カード生成（OGP対応）
- バッチエクスポート対応

### 4.2 ユーザーインターフェース

#### 主要画面
1. **Today画面**: AIが選定した重要記事のカード表示
2. **Feed List画面**: 全記事のリスト/マガジン表示
3. **Article View画面**: 記事詳細（要約/全文タブ切替）
4. **Tray画面**: 保存記事の管理とエクスポート
5. **Settings画面**: ソース管理、FilterAI設定、アカウント設定

## 5. セキュリティ設計

### 5.1 認証・認可
- OAuth2.0による第三者認証（Google, GitHub）
- JWT (JSON Web Token) によるセッション管理
- 2要素認証（2FA）のサポート
- Role-Based Access Control (RBAC)

### 5.2 データ保護
- TLS 1.3による通信暗号化
- データベースレベルの暗号化（at-rest encryption）
- 個人情報のマスキング処理
- GDPR/個人情報保護法準拠

### 5.3 セキュリティ対策
- OWASP Top 10への対応
- Rate limiting実装
- CSRFトークンによる保護
- XSS対策（Content Security Policy）

## 6. パフォーマンス設計

### 6.1 目標値
- 新着記事の遅延: 平均5分以内
- API応答時間: p95で200ms以下
- ページロード時間: 3秒以内
- 同時接続数: 10,000ユーザー

### 6.2 最適化戦略
- Redisによるキャッシング
- CDNによる静的リソース配信
- 画像の遅延読み込み
- GraphQLによる必要データのみの取得

## 7. 拡張性設計

### 7.1 マイクロサービス化
- 各機能を独立したサービスとして設計
- メッセージキューによる非同期処理
- サービス間のAPI通信

### 7.2 スケーラビリティ
- 水平スケーリング対応
- データベースのレプリケーション
- キューワーカーの動的スケーリング

## 8. 監視・運用設計

### 8.1 監視項目
- アプリケーションメトリクス（APM）
- インフラメトリクス
- エラーログ収集
- ユーザー行動分析

### 8.2 使用ツール
- OpenTelemetry: 分散トレーシング
- Grafana: メトリクス可視化
- Loki: ログ収集・分析
- Sentry: エラートラッキング