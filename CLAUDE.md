# Filterie Development Guide for Claude Code

## プロジェクト概要
Filterieは、一次情報に素早くアクセスし、AIフィルタリングを通じて価値ある情報のみを抽出できる「情報濾過ハブ」です。

## 開発方針

### 1. 情報源の信頼性を最優先
- Tier 1（一次情報源）: 企業公式サイト、要人の認証済みアカウント
- Tier 2（信頼メディア）: 大手報道機関、専門アナリスト
- Tier 3（一般メディア）: オンラインメディア、ブログ
- Tier 4（UGC）: ユーザー生成コンテンツ

### 2. アーキテクチャ
- **フロントエンド**: Next.js 15 (App Router) + TailwindCSS
- **モバイル**: React Native (Expo)
- **バックエンド**: NestJS + GraphQL + Prisma
- **データベース**: PostgreSQL + Redis
- **AI**: OpenAI GPT-4o + LangChain

### 3. コーディング規約
- TypeScriptを使用
- ESLint + Prettierの設定に従う
- コンポーネントは関数型で記述
- テストを重視（Jest + React Testing Library）

### 4. テスト駆動開発（TDD）方針
このプロジェクトはテスト駆動開発で進めます。以下の手順を厳守してください：

#### TDDサイクル
1. **Red（失敗）**: 実装前に失敗するテストを書く
2. **Green（成功）**: テストを通る最小限の実装を行う
3. **Refactor（改善）**: コードを整理・最適化する

#### 実装手順
1. **機能要件の明確化**
   - 実装する機能の仕様を明確にする
   - 入力・出力・エッジケースを定義する

2. **テストファースト**
   ```typescript
   // 例: ユーザー認証サービスのテスト
   describe('AuthService', () => {
     it('should authenticate user with valid credentials', async () => {
       // Arrange
       const credentials = { email: 'test@example.com', password: 'password123' };
       
       // Act
       const result = await authService.login(credentials);
       
       // Assert
       expect(result.accessToken).toBeDefined();
       expect(result.user.email).toBe(credentials.email);
     });
   });
   ```

3. **最小限の実装**
   - テストを通すための最小限のコードを書く
   - 過度な最適化は避ける

4. **リファクタリング**
   - テストが通ることを確認しながらコードを改善
   - DRY原則、SOLID原則を適用

#### テストの種類と優先順位
1. **単体テスト（Unit Tests）** - 最優先
   - サービス、ユーティリティ関数
   - Reactコンポーネント
   - カバレッジ目標: 80%以上

2. **統合テスト（Integration Tests）** - 重要
   - API エンドポイント
   - データベース操作
   - 外部サービス連携

3. **E2Eテスト（End-to-End Tests）** - 主要フローのみ
   - ユーザー登録・ログイン
   - 記事の取得・表示
   - 検索機能

#### テストファイルの配置
```
src/
├── modules/
│   ├── auth/
│   │   ├── auth.service.ts
│   │   ├── auth.service.spec.ts    # 単体テスト
│   │   └── auth.integration.spec.ts # 統合テスト
│   └── articles/
│       ├── articles.service.ts
│       └── articles.service.spec.ts
└── e2e/
    ├── auth.e2e-spec.ts
    └── articles.e2e-spec.ts
```

#### テストデータとモック
- テストデータは各テストファイルで定義
- 外部依存はモック化
- データベースはインメモリDBまたはテスト用DBを使用

#### CI/CDパイプライン
- プッシュ前に全テストを実行
- GitHub Actionsでテスト自動実行
- テストカバレッジレポートの生成

## 重要なディレクトリ構成
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
# 依存関係のインストール
pnpm install

# 開発サーバーの起動（全アプリ）
pnpm dev

# データベースマイグレーション
pnpm db:migrate

# データベースシード
pnpm db:seed

# テストの実行
pnpm test

# ビルド
pnpm build
```

## 現在の実装状況
- ✅ プロジェクト構造の初期化
- ✅ データベース設計（Prisma）
- ✅ 情報源Tier判定システムの基本実装
- 🚧 認証システム
- 🚧 GraphQL API
- 📝 フロントエンド（Next.js）
- 📝 モバイルアプリ（Expo）

## 次の実装優先順位
1. 認証システム（JWT + OAuth2）の完成
2. GraphQL APIの主要エンドポイント実装
3. フロントエンドの基本画面構築
4. 情報取得システム（RSS/WebSub）の実装
5. AI要約・タグ生成機能の統合

## 設計書の参照
- `/docs/filterie_requirements_v0.2.md` - 要件定義書
- `/docs/basic_design.md` - 基本設計書
- `/docs/detailed_design.md` - 詳細設計書
- `/docs/source_tier_design.md` - 情報源Tier分類設計書

## セキュリティ考慮事項
- 環境変数は `.env.local` に記載（コミットしない）
- 認証トークンは安全に管理
- CORS設定は本番環境で厳格に
- Rate Limitingを実装済み

## パフォーマンス目標
- 新着記事の遅延: 平均5分以内
- API応答時間: p95で200ms以下
- ページロード時間: 3秒以内

## テスト方針
- 単体テスト: 全サービス・コンポーネントに実装
- 統合テスト: API エンドポイントごとに実装
- E2Eテスト: 主要ユーザーフローをカバー

## デプロイメント
- 開発環境: ローカル Docker Compose
- ステージング: AWS EKS
- 本番環境: AWS EKS + CloudFront

## 注意事項
- マスターブランチへの直接プッシュは禁止
- PRレビューを必須とする
- コミットメッセージは明確に記述
- 機密情報は絶対にコミットしない

## マルチエージェントシステム

### エージェント構成とロール
- **PRESIDENT** (別セッション): プロジェクト統括責任者
  - 役割: boss1に「Hello Worldプロジェクト開始指示」を送信し、完了報告を待機
  - 指示書: instructions/president.md
  
- **boss1** (multiagent:0): チームリーダー  
  - 役割: PRESIDENTからの指示を受けて、worker1-3全員に作業指示を配布し、完了報告を集約
  - 指示書: instructions/boss.md
  
- **worker1,2,3** (multiagent:1-3): 実行担当者
  - 役割: boss1からの指示を受けて「Hello World」を出力し、./tmp/worker{n}_done.txtを作成
  - 指示書: instructions/worker.md

### メッセージ送信方法
```bash
./agent-send.sh [相手エージェント名] "[メッセージ内容]"
```

### 実行フロー
1. PRESIDENT → boss1: プロジェクト開始指示
2. boss1 → worker1,2,3: 作業開始指示（並列送信）
3. 各worker: Hello World出力 + 完了ファイル作成
4. 最後のworker → boss1: 全員完了報告
5. boss1 → PRESIDENT: プロジェクト完了報告

### 重要な注意事項
- 各エージェントは自分の指示書を読み、役割を理解してから行動する
- メッセージ送信時は必ず./agent-send.shを使用する
- 完了ファイルは./tmp/ディレクトリに作成する
- ログは./logs/send_log.txtに記録される

## プロジェクトドキュメント

主要なドキュメントは[/docs](./docs)ディレクトリに格納されています：

- [ドキュメント一覧](./docs/DOCUMENTS_INDEX.md) - 全ドキュメントの索引と概要
- [要件定義書](./docs/filterie_requirements_v0.2.md) - 機能要件・非機能要件
- [基本設計書](./docs/basic_design.md) - システム構成・画面設計
- [詳細設計書](./docs/detailed_design.md) - API仕様・処理フロー
- [情報源Tier設計](./docs/source_tier_design.md) - Tier分類基準と評価アルゴリズム

### UIプロトタイプ

[/demo/ui_samples](./demo/ui_samples)に実装済みのHTMLプロトタイプ：
- **filterie_dashboard.html** - ダッシュボード（統計、AI厳選記事）
- **article_detail_ai.html** - AI要約機能付き記事詳細
- **source_management.html** - 情報源管理（Tier評価、一括操作）
- **ai_settings.html** - AI設定ページ
- **saved_articles.html** - 保存済み記事管理
