# 本番環境セットアップガイド

## 環境変数設定手順

### 1. 秘密鍵の生成

以下のコマンドで本番用の秘密鍵を生成してください：

```bash
# JWT認証用秘密鍵
openssl rand -hex 64  # JWT_SECRET用
openssl rand -hex 64  # JWT_REFRESH_SECRET用
openssl rand -hex 32  # SESSION_SECRET用

# MeiliSearchマスターキー（32文字以上）
openssl rand -base64 32 | tr -d "=+/" | cut -c1-40
```

### 2. 必須環境変数

#### データベース
```bash
# PostgreSQL（SSL有効）
DATABASE_URL="postgresql://user:pass@host:5432/filterie?schema=public&sslmode=require"
```

#### Redis
```bash
# AWS ElastiCache使用推奠
REDIS_URL="redis://:password@your-redis-endpoint.cache.amazonaws.com:6379"
```

#### MeiliSearch
```bash
MEILISEARCH_HOST="https://your-meilisearch-instance.com"
MEILI_MASTER_KEY="your-40-character-master-key-here"
```

### 3. URL設定（本番ドメイン）

```bash
# API
NEXT_PUBLIC_API_URL="https://api.filterie.app"
NEXT_PUBLIC_GRAPHQL_URL="https://api.filterie.app/graphql"
NEXT_PUBLIC_WS_URL="wss://api.filterie.app/graphql"

# CORS
CORS_ORIGINS="https://filterie.app,https://www.filterie.app"
```

### 4. サードパーティ設定

#### OpenAI
```bash
OPENAI_API_KEY="sk-prod-your-openai-key"
OPENAI_MODEL="gpt-4o"
```

#### OAuth（オプション）
- Google Cloud Consoleで本番用OAuth認証情報を作成
- リダイレクトURL: `https://api.filterie.app/auth/google/callback`

### 5. セキュリティチェックリスト

- [ ] 全ての秘密鍵を本番用に変更
- [ ] データベースSSL接続を有効化
- [ ] RedisにTLS/SSL設定
- [ ] MeiliSearchマスターキーを40文字以上に設定
- [ ] CORS設定を本番ドメインのみに制限
- [ ] Rate Limiting設定を調整
- [ ] ログレベルを`info`に設定
- [ ] GraphQL Playgroundを無効化

### 6. デプロイ前確認

```bash
# 環境変数の検証
node scripts/validate-env.js --env=production

# セキュリティチェック
npm audit
```

### 7. 推奨される本番構成

- **Database**: AWS RDS PostgreSQL (Multi-AZ)
- **Cache**: AWS ElastiCache Redis (クラスター構成)
- **Search**: MeiliSearch on ECS or Dedicated Instance
- **CDN**: CloudFront
- **監視**: CloudWatch + Sentry

## サンプル値（開発用に生成）

```bash
# 以下は例です。本番環境では必ず新規生成してください
JWT_SECRET="1b4c2f9bf51de2783cae2768a8bfda7de1c4f906d4731cbbf6502665f507e0230cbf638960b97995e3fb8294eeb8a1cd16c241820c33f84282a331d9f015bdff"
JWT_REFRESH_SECRET="a80feffb18a00a49f0f8f87ec03eb78a18e78aa2f99b354802aa2efd67f5bc783ce427e7d7826e24f4ab5265aedd8e3c9b2e2c67f2df7533a6b9c2117f4be863"
SESSION_SECRET="8135a865e6d175915d15de787924eaaa13244cd2958a628c11c51ba0137fd352"
MEILI_MASTER_KEY="3v4I8OqdZGsBqRrFkN0wNGxgS08VSXXZlb0s88Df"
```