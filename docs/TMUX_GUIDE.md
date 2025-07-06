# tmux操作ガイド - Filterie開発用マルチエージェントシステム

## 🎯 概要
Filterieプロジェクトでは、tmuxを使用して複数のエージェント（Claude Code）を同時に管理し、リアルタイムで開発の進行状況を確認できるシステムを構築しています。

## 📺 tmuxセッション構成

### 1. multiagentセッション（5ペイン）
```
┌─────────────┬─────────────┬─────────────┐
│  ARCHITECT  │TEST_ENGINEER│ BACKEND_DEV │
│   (紫色)    │   (赤色)    │   (青色)    │
├─────────────┴──────┬──────┴─────────────┤
│   FRONTEND_DEV     │    QA_ENGINEER     │
│    (シアン色)      │     (黄色)         │
└────────────────────┴────────────────────┘
```

### 2. project_managerセッション（1ペイン）
```
┌─────────────────────────────────────────┐
│         PROJECT_MANAGER (紫色)          │
│      プロジェクト統括・指示出し         │
└─────────────────────────────────────────┘
```

## 🚀 セットアップ手順

### 1. 環境構築
```bash
# tmuxセッションを自動構築
./setup.sh
```

### 2. セッションアタッチ
```bash
# 開発エージェントを確認
tmux attach-session -t multiagent

# プロジェクトマネージャーを確認
tmux attach-session -t project_manager
```

### 3. Claude Code起動
```bash
# PROJECT_MANAGERの認証を最初に行う
tmux send-keys -t project_manager 'claude' C-m

# 認証完了後、全エージェントを一括起動
tmux list-panes -t multiagent:agents -F '#{pane_id}' | while read pane; do
    tmux send-keys -t "$pane" 'claude' C-m
done
```

## 🎮 基本的なtmux操作

### セッション操作
| コマンド | 説明 |
|---------|------|
| `tmux ls` | セッション一覧表示 |
| `tmux attach -t [session]` | セッションにアタッチ |
| `Ctrl-b d` | セッションからデタッチ |
| `tmux kill-session -t [session]` | セッション削除 |

### ペイン操作
| コマンド | 説明 |
|---------|------|
| `Ctrl-b %` | 垂直分割 |
| `Ctrl-b "` | 水平分割 |
| `Ctrl-b 矢印キー` | ペイン間移動 |
| `Ctrl-b q` | ペイン番号表示 |
| `Ctrl-b x` | 現在のペインを閉じる |
| `Ctrl-b z` | ペインを最大化/元に戻す |

### ウィンドウ操作
| コマンド | 説明 |
|---------|------|
| `Ctrl-b c` | 新規ウィンドウ作成 |
| `Ctrl-b n` | 次のウィンドウ |
| `Ctrl-b p` | 前のウィンドウ |
| `Ctrl-b [0-9]` | 指定番号のウィンドウへ |

### スクロール・コピーモード
| コマンド | 説明 |
|---------|------|
| `Ctrl-b [` | コピーモード開始 |
| `q` | コピーモード終了 |
| `矢印キー` | スクロール |
| `Page Up/Down` | ページ単位スクロール |

## 📨 エージェント間通信

### 基本的なメッセージ送信
```bash
# 通常のメッセージ送信
./agent-send.sh architect "設計レビューをお願いします"

# 拡張版（tmux通知付き）
./agent-send-enhanced.sh backend_dev "APIの実装を開始してください"
```

### メッセージ確認
```bash
# 受信メッセージ確認
cat agent_inboxes/architect_inbox.txt

# 通信ログ確認
cat logs/agent_communication.log
```

### 利用可能なエージェント一覧
```bash
./agent-send-enhanced.sh --list
```

## 🔧 便利なコマンド集

### 全エージェントの状態確認
```bash
# 各ペインの状態を表示
tmux list-panes -t multiagent:agents -F "Pane #{pane_id}: #{pane_title} - #{pane_current_command}"
```

### 特定のエージェントにコマンド送信
```bash
# ARCHITECT に直接コマンド送信
tmux send-keys -t multiagent:agents.0 "ls -la" C-m

# BACKEND_DEV にテスト実行コマンド送信
tmux send-keys -t multiagent:agents.2 "pnpm test" C-m
```

### セッション全体のキャプチャ
```bash
# multiagentセッションの内容をファイルに保存
tmux capture-pane -t multiagent:agents -p > multiagent_capture.txt
```

### レイアウトのリセット
```bash
# ペインレイアウトを均等に再配置
tmux select-layout -t multiagent:agents tiled
```

## 🎯 実践的な使用例

### 1. 開発タスクの開始
```bash
# PROJECT_MANAGERから全体指示
tmux send-keys -t project_manager "新機能の開発を開始します。各エージェントに役割を割り当てます。" C-m

# 各エージェントへのタスク割り当て
./agent-send-enhanced.sh architect "新機能の設計書を作成してください"
./agent-send-enhanced.sh test_engineer "設計に基づいてテストケースを作成してください"
```

### 2. 進捗モニタリング
```bash
# 新しいターミナルウィンドウで
watch -n 5 'tmux list-panes -t multiagent:agents -F "#{pane_title}: #{pane_current_command}"'
```

### 3. デバッグセッション
```bash
# 問題が発生したペインを最大化
tmux resize-pane -t multiagent:agents.2 -Z

# ログを確認
tmux send-keys -t multiagent:agents.2 "tail -f logs/error.log" C-m
```

## 🚨 トラブルシューティング

### セッションが見つからない
```bash
# セッション一覧を確認
tmux ls

# 必要に応じて再セットアップ
./setup.sh
```

### ペインが応答しない
```bash
# ペインを強制終了
tmux kill-pane -t multiagent:agents.3

# 新しいペインを作成
tmux split-window -t multiagent:agents
```

### レイアウトが崩れた
```bash
# デフォルトレイアウトに戻す
tmux select-layout -t multiagent:agents tiled

# または手動で調整
tmux resize-pane -t multiagent:agents.0 -L 10
```

## 📝 カスタマイズ

### tmux設定ファイル（~/.tmux.conf）の推奨設定
```bash
# マウスサポート有効化
set -g mouse on

# ペイン境界線の色設定
set -g pane-border-style fg=colour240
set -g pane-active-border-style fg=colour45

# ステータスバーのカスタマイズ
set -g status-bg colour234
set -g status-fg colour137
set -g status-left '#[fg=colour233,bg=colour245,bold] #S '
set -g status-right '#[fg=colour233,bg=colour241,bold] %Y-%m-%d %H:%M:%S '

# ウィンドウ履歴を増やす
set -g history-limit 50000
```

## 🎬 デモ実行例

```bash
# 1. セットアップ
./setup.sh

# 2. セッションアタッチ（別ターミナルで）
tmux attach -t project_manager

# 3. Claude起動
# project_managerペインで
claude

# 4. マルチエージェント起動（別ターミナルで）
tmux list-panes -t multiagent:agents -F '#{pane_id}' | while read pane; do
    tmux send-keys -t "$pane" 'claude' C-m
    sleep 1
done

# 5. 開発開始
# project_managerから指示を出す
```

---

このガイドを参考に、効率的なマルチエージェント開発を実現してください！ 🚀