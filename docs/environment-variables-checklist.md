# 環境変数チェックリスト - Filterie

## 必須環境変数

### 1. アプリケーション基本設定
- [x] `NODE_ENV` - development/production
- [x] `PORT` - APIサーバーポート (デフォルト: 4000)

### 2. データベース
- [x] `DATABASE_URL` - PostgreSQL接続文字列
  - 現在: `postgresql://postgres:postgres@localhost:5432/filterie?schema=public`
  - 本番環境では要変更

### 3. Redis
- [x] `REDIS_HOST` - Redisホスト (デフォルト: localhost)
- [x] `REDIS_PORT` - Redisポート (デフォルト: 6379)
- [ ] `REDIS_PASSWORD` - Redisパスワード（本番環境で必須）

### 4. JWT認証
- [x] `JWT_SECRET` - アクセストークン用秘密鍵
- [x] `JWT_EXPIRES_IN` - アクセストークン有効期限
- [x] `JWT_REFRESH_SECRET` - リフレッシュトークン用秘密鍵
- [x] `JWT_REFRESH_EXPIRES_IN` - リフレッシュトークン有効期限
- [ ] `SESSION_SECRET` - セッション用秘密鍵（追加推奨）

### 5. OAuth認証（オプション）
- [ ] `GOOGLE_CLIENT_ID` - Google OAuth クライアントID
- [ ] `GOOGLE_CLIENT_SECRET` - Google OAuth クライアントシークレット
- [ ] `GITHUB_CLIENT_ID` - GitHub OAuth クライアントID
- [ ] `GITHUB_CLIENT_SECRET` - GitHub OAuth クライアントシークレット

### 6. OpenAI
- [ ] `OPENAI_API_KEY` - OpenAI APIキー（要約・タグ生成用）
- [x] `OPENAI_MODEL` - 使用モデル (デフォルト: gpt-4o)

### 7. MeiliSearch
- [x] `MEILISEARCH_HOST` - MeiliSearchホスト
- [x] `MEILISEARCH_KEY` - マスターキー（開発環境: masterKey）
- [x] `MEILISEARCH_SEARCH_KEY` - 検索用APIキー
- [x] `MEILISEARCH_ADMIN_KEY` - 管理用APIキー
- [x] `NEXT_PUBLIC_MEILISEARCH_KEY` - フロントエンド用公開キー

### 8. フロントエンドURL
- [x] `NEXT_PUBLIC_API_URL` - APIエンドポイント
- [x] `NEXT_PUBLIC_GRAPHQL_URL` - GraphQLエンドポイント
- [x] `NEXT_PUBLIC_WS_URL` - WebSocketエンドポイント

### 9. CORS設定
- [x] `CORS_ORIGINS` - 許可するオリジン

### 10. Rate Limiting
- [x] `RATE_LIMIT_TTL` - Rate Limit期間（秒）
- [x] `RATE_LIMIT_MAX` - 最大リクエスト数

## 本番環境で必要な追加設定

### AWS（オプション）
- [ ] `AWS_REGION` - AWSリージョン
- [ ] `AWS_ACCESS_KEY_ID` - AWSアクセスキー
- [ ] `AWS_SECRET_ACCESS_KEY` - AWSシークレットキー
- [ ] `AWS_S3_BUCKET` - S3バケット名
- [ ] `AWS_SQS_QUEUE_URL` - SQSキューURL

### メール送信（オプション）
- [ ] `EMAIL_FROM` - 送信元メールアドレス
- [ ] `SMTP_HOST` - SMTPホスト
- [ ] `SMTP_PORT` - SMTPポート
- [ ] `SMTP_SECURE` - SMTP暗号化
- [ ] `SMTP_USER` - SMTPユーザー
- [ ] `SMTP_PASS` - SMTPパスワード

### 監視・分析（オプション）
- [ ] `SENTRY_DSN` - Sentryエラートラッキング
- [ ] `GOOGLE_ANALYTICS_ID` - Google Analytics ID
- [ ] `MIXPANEL_TOKEN` - Mixpanelトークン

## 推奨される本番環境の変更

1. **マスターキーの変更**
   ```
   MEILISEARCH_KEY=<32文字以上のランダム文字列>
   ```

2. **JWT秘密鍵の強化**
   ```bash
   # 生成コマンド
   openssl rand -hex 64
   ```

3. **データベースURL**
   - SSL接続を有効化
   - 専用ユーザーの使用
   - 接続プールの設定

4. **Redis設定**
   - パスワード設定
   - SSL/TLS有効化
   - クラスター構成検討

## セキュリティ注意事項

1. ⚠️ `.env.local`ファイルは絶対にGitにコミットしない
2. ⚠️ 本番環境では全ての秘密鍵を変更する
3. ⚠️ OAuth設定時はリダイレクトURLを正確に設定
4. ⚠️ CORS設定は必要最小限のオリジンのみ許可

## 環境変数の優先順位

1. 環境変数
2. `.env.local`
3. `.env`
4. デフォルト値（コード内）

## 確認コマンド

```bash
# 環境変数の確認
env | grep -E "DATABASE_URL|REDIS|JWT|MEILISEARCH"

# 設定されていない必須環境変数の確認
node -e "require('dotenv').config({path:'.env.local'}); console.log(process.env)"
```