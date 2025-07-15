# Filterie プロジェクト ドキュメント一覧

## 概要
このドキュメントは、Filterieプロジェクトの全ドキュメントの一覧と概要をまとめたものです。

## プロジェクトルート

### 📄 CLAUDE.md
- **概要**: Claude Code用の開発指示書
- **内容**: 
  - プロジェクト概要と開発方針
  - アーキテクチャ説明
  - コーディング規約
  - TDD（テスト駆動開発）方針
  - 開発コマンド一覧
  - マルチエージェントシステムの説明

### 📄 README.md (未作成)
- プロジェクトの概要説明が必要

## 設計ドキュメント (/docs)

### 📄 filterie_requirements_v0.2.md
- **概要**: 要件定義書
- **内容**:
  - プロジェクトコンセプト
  - 機能要件（必須機能、追加機能）
  - 非機能要件（パフォーマンス、セキュリティ等）
  - ユーザーストーリー
  - 制約事項

### 📄 basic_design.md
- **概要**: 基本設計書
- **内容**:
  - システム構成図
  - 機能一覧
  - 画面設計
  - API設計
  - データベース設計
  - セキュリティ設計

### 📄 detailed_design.md
- **概要**: 詳細設計書
- **内容**:
  - API詳細仕様
  - データベーススキーマ詳細
  - 処理フロー図
  - エラー処理設計
  - キャッシュ戦略

### 📄 source_tier_design.md
- **概要**: 情報源Tier分類設計書
- **内容**:
  - Tier分類基準（1-4）
  - 評価アルゴリズム
  - 自動評価システム設計
  - 手動オーバーライド機能

### 📄 architecture_review_20250106.md
- **概要**: アーキテクチャレビュー記録
- **内容**:
  - システム構成の評価
  - パフォーマンス考察
  - スケーラビリティ分析
  - 改善提案

## 実装ガイド

### 📄 FRONTEND_IMPLEMENTATION.md
- **概要**: フロントエンド実装ガイド
- **内容**:
  - Next.js 15のセットアップ
  - コンポーネント構造
  - 状態管理（Zustand）
  - GraphQL統合
  - 認証実装

### 📄 FRONTEND_IMPROVEMENTS.md
- **概要**: フロントエンド改善提案
- **内容**:
  - パフォーマンス最適化
  - UX改善項目
  - アクセシビリティ対応
  - 今後の拡張計画

## 環境設定

### 📄 environment-variables-checklist.md
- **概要**: 環境変数チェックリスト
- **内容**:
  - 必要な環境変数一覧
  - 各環境変数の説明
  - デフォルト値
  - セキュリティ考慮事項

### 📄 production-env-setup.md
- **概要**: 本番環境セットアップガイド
- **内容**:
  - インフラ構成
  - デプロイメント手順
  - 監視設定
  - バックアップ戦略

## アプリケーション固有

### 📄 apps/web/README.md
- **概要**: Webアプリケーション説明書
- **内容**:
  - Next.jsアプリの構造
  - 開発・ビルド手順
  - 環境設定

## UIデザインサンプル (/demo/ui_samples)

### HTMLプロトタイプ
1. **01_top_page.html** - トップページ（記事フィード、Tierバッジ）
2. **02_article_detail.html** - 記事詳細ページ
3. **03_search_results.html** - 検索結果ページ
4. **04_user_settings.html** - ユーザー設定ページ
5. **05_login_register.html** - ログイン/登録ページ
6. **各ページのダークモード版** (*_dark.html)

### モダンデザインサンプル
1. **modern_feedly_style.html** - Feedly風サイドバーナビゲーション
2. **discover_sources_page.html** - 情報源探索ページ
3. **modern_card_view.html** - Pinterest風マンソリーレイアウト

### Filterie特化ページ
1. **filterie_dashboard.html** - ダッシュボード（統計、AI厳選記事）
2. **article_detail_ai.html** - AI要約機能付き記事詳細
3. **source_management.html** - 情報源管理（Tier評価、一括操作）
4. **ai_settings.html** - AI設定（使用状況、カスタムプロンプト）
5. **saved_articles.html** - 保存済み記事（コレクション管理）

## UIモックアップ仕様 (/demo/ui_mockups)

1. **source_list_mockup.md** - 情報源リストUI要件
2. **source_add_form_mockup.md** - 情報源追加フォーム設計
3. **tier_badge_component.md** - Tierバッジコンポーネント仕様

## ドキュメント管理

### 更新履歴
- 2025-01-12: ドキュメント一覧作成
- 2025-01-06: アーキテクチャレビュー追加
- 2024-12-XX: 初期設計ドキュメント作成

### 今後必要なドキュメント
- [ ] プロジェクトREADME.md
- [ ] API仕様書（OpenAPI形式）
- [ ] テスト計画書
- [ ] 運用マニュアル
- [ ] トラブルシューティングガイド