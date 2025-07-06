# Filterie - 情報濾過ハブ

一次情報に素早くアクセスし、AIフィルタリングを通じて価値ある情報のみを抽出できる「情報濾過ハブ」です。

## 技術スタック

- **フロントエンド**: Next.js 15 (App Router) + TailwindCSS + shadcn/ui
- **モバイル**: React Native (Expo)
- **バックエンド**: NestJS + GraphQL + Prisma
- **データベース**: PostgreSQL + Redis
- **AI**: OpenAI GPT-4o + LangChain

## 開発環境のセットアップ

### 前提条件

- Node.js 20+
- pnpm 8+
- Docker & Docker Compose
- PostgreSQL (Dockerで起動)
- Redis (Dockerで起動)

### セットアップ手順

1. リポジトリのクローン
```bash
git clone https://github.com/your-org/filterie.git
cd filterie
```

2. 依存関係のインストール
```bash
pnpm install
```

3. 環境変数の設定
```bash
cp .env.example .env.local
# .env.localを編集して必要な環境変数を設定
```

4. データベースの起動
```bash
docker-compose up -d
```

5. データベースマイグレーション
```bash
pnpm db:migrate
```

6. 開発サーバーの起動
```bash
pnpm dev
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

## 主要コマンド

```bash
# 開発サーバー起動（全アプリ）
pnpm dev

# ビルド
pnpm build

# テスト実行
pnpm test

# テスト（ウォッチモード）
pnpm test:watch

# リント
pnpm lint

# 型チェック
pnpm typecheck

# データベースマイグレーション
pnpm db:migrate

# Prisma Studio起動
cd libs/database && pnpm studio
```

## API エンドポイント

- GraphQL Playground: http://localhost:4000/graphql
- REST API: http://localhost:4000/api
- Health Check: http://localhost:4000/health

## テスト

このプロジェクトはTDD（テスト駆動開発）で開発されています。

```bash
# 単体テスト
pnpm test

# カバレッジ付きテスト
pnpm test:cov

# E2Eテスト
pnpm test:e2e
```

## デプロイメント

- 開発環境: ローカル Docker Compose
- ステージング: AWS EKS
- 本番環境: AWS EKS + CloudFront

## ライセンス

MIT License