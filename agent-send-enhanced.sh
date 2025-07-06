#!/bin/bash

# Filterie開発用エージェント通信スクリプト（tmux統合版）
# Usage: ./agent-send-enhanced.sh [recipient] "[message]"
#        ./agent-send-enhanced.sh --list

RECIPIENT=$1
MESSAGE=$2
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
LOG_FILE="./logs/agent_communication.log"

# エージェント名とtmuxペインの対応（実際のペインIDを使用）
case "$RECIPIENT" in
    "architect") PANE="multiagent:agents.%0" ;;
    "test_engineer") PANE="multiagent:agents.%1" ;;
    "backend_dev") PANE="multiagent:agents.%2" ;;
    "frontend_dev") PANE="multiagent:agents.%3" ;;
    "qa_engineer") PANE="multiagent:agents.%4" ;;
    "project_manager") PANE="project_manager:0" ;;
    *) PANE="" ;;
esac

# 利用可能なエージェントをリスト
if [ "$1" == "--list" ]; then
    echo "利用可能なエージェント:"
    echo "  - architect"
    echo "  - test_engineer"
    echo "  - backend_dev"
    echo "  - frontend_dev"
    echo "  - qa_engineer"
    echo "  - project_manager"
    exit 0
fi

# 引数チェック
if [ $# -lt 2 ]; then
    echo "Usage: $0 [recipient] \"[message]\""
    echo "       $0 --list"
    exit 1
fi

# ログディレクトリの作成
mkdir -p ./logs

# メッセージの送信と記録
echo "[$TIMESTAMP] To: $RECIPIENT - Message: $MESSAGE" >> $LOG_FILE

# エージェント別の受信ボックスに保存
INBOX_DIR="./agent_inboxes"
mkdir -p "$INBOX_DIR"
echo "[$TIMESTAMP] $MESSAGE" >> "$INBOX_DIR/${RECIPIENT}_inbox.txt"

# tmuxペインへの通知
if [ -n "$PANE" ]; then
    # tmuxセッションが存在するか確認
    if tmux has-session -t "${PANE%%:*}" 2>/dev/null; then
        # メッセージ通知をペインに送信
        tmux send-keys -t "$PANE" C-m
        tmux send-keys -t "$PANE" "echo ''" C-m
        tmux send-keys -t "$PANE" "echo '📨 新しいメッセージが届きました！'" C-m
        tmux send-keys -t "$PANE" "echo '送信者: $USER'" C-m
        tmux send-keys -t "$PANE" "echo '時刻: $TIMESTAMP'" C-m
        tmux send-keys -t "$PANE" "echo '内容: $MESSAGE'" C-m
        tmux send-keys -t "$PANE" "echo ''" C-m
        tmux send-keys -t "$PANE" "echo '詳細は以下で確認:'" C-m
        tmux send-keys -t "$PANE" "echo 'cat $INBOX_DIR/${RECIPIENT}_inbox.txt'" C-m
        tmux send-keys -t "$PANE" "echo ''" C-m
    fi
fi

# 送信完了メッセージ
echo "✅ Message sent to $RECIPIENT at $TIMESTAMP"
echo "📍 Logged to: $LOG_FILE"
echo "📥 Inbox: $INBOX_DIR/${RECIPIENT}_inbox.txt"

# tmuxペインが見つかった場合は通知
if [ -n "$PANE" ]; then
    echo "🔔 Notification sent to tmux pane: $PANE"
fi