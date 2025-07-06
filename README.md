# Filterie - 情報濾過ハブ

一次情報に素早くアクセスし、AIフィルタリングを通じて価値ある情報のみを抽出できる「情報濾過ハブ」です。

## 機能

- **情報源Tier管理**: 信頼性に基づいた4段階の情報源分類
- **リアルタイム記事取得**: RSS/WebSubによる最新情報の自動取得
- **AI要約・分析**: GPT-4による記事の要約とタグ抽出
- **パーソナライズ**: ユーザーの好みに基づいた記事推薦
- **GraphQL API**: 効率的なデータ取得と更新
- **リアルタイム更新**: WebSocketによるサブスクリプション

## 技術スタック

### フロントエンド
- Next.js 15 (App Router)
- React 19
- TailwindCSS 4
- Apollo Client

### バックエンド  
- NestJS
- GraphQL (Apollo Server)
- Prisma ORM
- PostgreSQL
- Redis

### AI/ML
- OpenAI GPT-4o
- LangChain

### テスト
- Jest
- React Testing Library
- Playwright (E2E)

## 開発環境のセットアップ

### 前提条件

- Node.js 18以上
- pnpm 10以上
- PostgreSQL 14以上
- Redis 6以上
- Docker & Docker Compose（オプション）

### セットアップ手順

```bash
# リポジトリのクローン
git clone https://github.com/yourusername/filterie-app.git
cd filterie-app

# 依存関係のインストール
pnpm install

# 環境変数の設定
cp .env.example .env.local
# .env.localを編集して必要な値を設定

# データベースのセットアップ
pnpm db:migrate
pnpm db:seed

# 開発サーバーの起動
pnpm dev
```

### 環境変数

必須の環境変数:

```env
# データベース
DATABASE_URL="postgresql://user:password@localhost:5432/filterie"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="7d"

# OpenAI
OPENAI_API_KEY="sk-..."

# アプリケーション
NEXT_PUBLIC_API_URL="http://localhost:4000/graphql"
```

## プロジェクト構成

```
Filterie-App/
├── apps/
│   ├── api/        # NestJS バックエンド
│   ├── web/        # Next.js フロントエンド
│   └── mobile/     # Expo モバイルアプリ
├── libs/
│   ├── database/   # Prisma スキーマ・マイグレーション
│   └── shared/     # 共有型定義・ユーティリティ
└── docs/           # 設計書・ドキュメント
```

## 開発コマンド

```bash
# 全てのアプリケーションを起動
pnpm dev

# 個別に起動
pnpm --filter @filterie/api dev    # バックエンド
pnpm --filter web dev              # フロントエンド

# テスト
pnpm test                          # 全てのテスト
pnpm test:watch                    # ウォッチモード
pnpm --filter web test:e2e         # E2Eテスト
pnpm --filter web test:e2e:ui      # E2Eテスト（UIモード）

# ビルド
pnpm build                         # 全てのアプリケーション

# その他
pnpm lint                          # リント
pnpm typecheck                     # 型チェック
pnpm db:migrate                    # マイグレーション
pnpm db:seed                       # シードデータ投入
```

## API エンドポイント

- GraphQL Playground: http://localhost:4000/graphql
- REST API: http://localhost:4000/api
- Health Check: http://localhost:4000/health

## テスト駆動開発（TDD）

このプロジェクトはTDD方式で開発されています。

### テストの実行

```bash
# 全てのテストを実行
pnpm test

# 単体テストをウォッチモードで実行
pnpm test:watch

# E2Eテストを実行
pnpm --filter web test:e2e

# E2EテストをUIモードで実行
pnpm --filter web test:e2e:ui

# E2Eテストをデバッグモードで実行
pnpm --filter web test:e2e:debug
```

### テストカバレッジ

- 単体テスト: 80%以上
- 統合テスト: 主要なAPIエンドポイント
- E2Eテスト: 主要なユーザーフロー

## デプロイメント

- 開発環境: ローカル Docker Compose
- ステージング: AWS EKS
- 本番環境: AWS EKS + CloudFront

## コントリビューション

1. Issueを作成して機能提案やバグ報告を行う
2. フォークしてブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. Pull Requestを作成

## ライセンス

MIT License - 詳細は[LICENSE](LICENSE)ファイルを参照してください。