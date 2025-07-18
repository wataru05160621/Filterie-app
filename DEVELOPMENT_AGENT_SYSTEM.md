# Filterie開発用マルチエージェントシステム

## 概要
Filterieプロジェクトの開発を効率的に進めるため、マルチエージェントシステムを活用します。
各エージェントが専門的な役割を持ち、協調して開発を進めます。

## エージェント構成

### 1. ARCHITECT (設計責任者)
- **役割**: システム設計とアーキテクチャの決定
- **責任範囲**:
  - 技術選定
  - システム構成の設計
  - APIインターフェース設計
  - データベース設計

### 2. TEST_ENGINEER (テストエンジニア)
- **役割**: TDDに基づくテスト設計と実装
- **責任範囲**:
  - テストケースの設計
  - 単体テストの作成
  - 統合テストの作成
  - テストカバレッジの管理

### 3. BACKEND_DEV (バックエンド開発者)
- **役割**: NestJS/GraphQLによるAPI実装
- **責任範囲**:
  - APIエンドポイントの実装
  - ビジネスロジックの実装
  - データベース操作の実装
  - 認証・認可の実装

### 4. FRONTEND_DEV (フロントエンド開発者)
- **役割**: Next.js/Reactによる画面実装
- **責任範囲**:
  - UIコンポーネントの実装
  - 状態管理の実装
  - API統合
  - レスポンシブデザイン

### 5. QA_ENGINEER (品質保証エンジニア)
- **役割**: コード品質とパフォーマンスの確保
- **責任範囲**:
  - コードレビュー
  - パフォーマンステスト
  - セキュリティチェック
  - バグ報告と修正確認

## 開発フロー

### フェーズ1: 設計とテスト準備
1. ARCHITECT: 機能の詳細設計を作成
2. TEST_ENGINEER: 設計に基づいてテストケースを作成
3. 全エージェント: 設計とテストケースをレビュー

### フェーズ2: TDD実装
1. TEST_ENGINEER: 失敗するテストを実装
2. BACKEND_DEV/FRONTEND_DEV: テストを通る最小限の実装
3. QA_ENGINEER: コード品質チェック
4. 全エージェント: リファクタリング

### フェーズ3: 統合とデプロイ
1. TEST_ENGINEER: 統合テストの実行
2. QA_ENGINEER: 最終品質チェック
3. ARCHITECT: デプロイメント承認

## 通信プロトコル

### メッセージフォーマット
```json
{
  "from": "エージェント名",
  "to": "エージェント名",
  "type": "request|response|notification",
  "subject": "件名",
  "content": {
    "task": "タスク内容",
    "status": "pending|in_progress|completed|blocked",
    "details": "詳細情報"
  },
  "timestamp": "2024-01-20T10:00:00Z"
}
```

### 優先度レベル
- **P0**: 緊急（ブロッカー）
- **P1**: 高（今日中に対応）
- **P2**: 中（今週中に対応）
- **P3**: 低（次のスプリントで対応）

## 実装順序（TDD準拠）

### 1. 認証システム
1. TEST_ENGINEER: 認証テストスイート作成
2. BACKEND_DEV: JWT認証実装
3. FRONTEND_DEV: ログイン画面実装

### 2. 情報源管理
1. TEST_ENGINEER: 情報源CRUDテスト作成
2. BACKEND_DEV: 情報源API実装
3. FRONTEND_DEV: 情報源管理画面実装

### 3. RSS/Atom取込み
1. TEST_ENGINEER: フィード取込みテスト作成
2. BACKEND_DEV: RSSパーサー実装
3. FRONTEND_DEV: 取込み状況表示実装

### 4. AI要約・タグ生成
1. TEST_ENGINEER: AI処理テスト作成
2. BACKEND_DEV: OpenAI統合実装
3. FRONTEND_DEV: 要約表示UI実装

### 5. 検索機能
1. TEST_ENGINEER: 検索テスト作成
2. BACKEND_DEV: Meilisearch統合実装
3. FRONTEND_DEV: 検索UI実装

## 品質基準

### コードカバレッジ
- 単体テスト: 80%以上
- 統合テスト: 主要フローをカバー
- E2Eテスト: クリティカルパスをカバー

### パフォーマンス
- API応答時間: p95で200ms以下
- ページロード: 3秒以内
- 検索レスポンス: 100ms以内

### セキュリティ
- 認証必須エンドポイントの保護
- SQLインジェクション対策
- XSS対策
- CSRF対策

## 進捗管理

### 日次スタンドアップ
各エージェントが以下を報告:
- 昨日の完了タスク
- 今日の予定タスク
- ブロッカー

### 週次レビュー
- 完了機能のデモ
- テストカバレッジレポート
- 次週の計画

## エラーハンドリング

### ブロッカー発生時
1. 該当エージェントがP0アラートを発信
2. ARCHITECTが解決策を検討
3. 必要に応じて全エージェントで協議

### 仕様変更時
1. ARCHITECTが影響範囲を分析
2. TEST_ENGINEERがテスト修正
3. 開発エージェントが実装修正