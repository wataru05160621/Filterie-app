# Tier表示コンポーネント設計書

## コンポーネント概要
情報源の信頼度レベル（Tier）を視覚的に表示するReactコンポーネント

## コンポーネントAPI

### Props定義
```typescript
interface TierBadgeProps {
  tier: 1 | 2 | 3 | 4;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
  showTooltip?: boolean;
  className?: string;
}
```

### 使用例
```tsx
// 基本使用
<TierBadge tier={1} />

// ラベル付き
<TierBadge tier={2} showLabel />

// 大サイズでツールチップ付き
<TierBadge tier={3} size="large" showTooltip />
```

## ビジュアルデザイン

### サイズバリエーション
```
Small (16px):   ⭐
Medium (20px):  ⭐ (デフォルト)
Large (24px):   ⭐
```

### Tierごとのスタイル
```
Tier 1: ⭐ #FFD700 (ゴールド) - 最高信頼度
Tier 2: ⭐ #C0C0C0 (シルバー) - 高信頼度
Tier 3: ⭐ #CD7F32 (ブロンズ) - 中信頼度
Tier 4: ⭐ #808080 (グレー) - 要検証
```

### ラベル表示
```
+----------+
| ⭐ Tier 1 |
+----------+
```

### ツールチップ内容
- Tier 1: "最高信頼度 - 公式情報源"
- Tier 2: "高信頼度 - 大手メディア"
- Tier 3: "中信頼度 - 一般メディア"
- Tier 4: "要検証 - ユーザー生成コンテンツ"

## コンポーネント実装仕様

### ファイル構成
```
components/
  TierBadge/
    index.tsx       # メインコンポーネント
    TierBadge.tsx   # ロジック
    styles.ts       # スタイル定義
    types.ts        # 型定義
    TierBadge.test.tsx # テスト
```

### スタイル実装（TailwindCSS）
```tsx
const tierStyles = {
  1: 'text-yellow-500 bg-yellow-50 border-yellow-200',
  2: 'text-gray-400 bg-gray-50 border-gray-200',
  3: 'text-orange-600 bg-orange-50 border-orange-200',
  4: 'text-gray-600 bg-gray-50 border-gray-300'
};

const sizeStyles = {
  small: 'w-4 h-4 text-xs',
  medium: 'w-5 h-5 text-sm',
  large: 'w-6 h-6 text-base'
};
```

## アクセシビリティ対応

### ARIA属性
- `role="img"`
- `aria-label="Tier {n} - {説明}"`

### キーボード対応
- ツールチップはフォーカス時にも表示
- Escapeキーでツールチップを閉じる

### カラーコントラスト
- WCAG AA基準を満たす配色
- カラーブラインド対応（形状での区別も可能）

## インタラクション

### ホバー効果
- 軽いスケールアップ（1.1倍）
- トランジション: 200ms ease-in-out

### クリック時
- 詳細情報モーダルを表示（オプション）

## パフォーマンス考慮事項

### メモ化
```tsx
export const TierBadge = React.memo(TierBadgeComponent);
```

### 動的インポート
ツールチップライブラリは遅延ロード

## テスト項目

### 単体テスト
- 各Tierの正しい表示
- サイズバリエーション
- ラベル表示の切り替え
- ツールチップ表示

### アクセシビリティテスト
- スクリーンリーダー対応
- キーボードナビゲーション
- カラーコントラスト

## 使用シーン

### 情報源一覧
- テーブルのカラム内
- カードレイアウト内

### 詳細画面
- ヘッダー部分に大きく表示

### フィルター
- 選択可能なオプションとして

## 将来の拡張性

### アニメーション
- 新規追加時のパルスエフェクト
- Tier変更時のトランジション

### テーマ対応
- ダークモード対応
- カスタムカラーテーマ

### 国際化
- ツールチップテキストの多言語対応