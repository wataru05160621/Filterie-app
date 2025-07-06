#!/bin/bash

# Filterie開発用エージェント通信スクリプト
# Usage: ./agent-send.sh [recipient] "[message]"

RECIPIENT=$1
MESSAGE=$2
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
LOG_FILE="./logs/agent_communication.log"

# ログディレクトリの作成
mkdir -p ./logs

# メッセージの送信と記録
echo "[$TIMESTAMP] To: $RECIPIENT - Message: $MESSAGE" >> $LOG_FILE

# エージェント別の受信ボックスに保存
INBOX_DIR="./agent_inboxes"
mkdir -p "$INBOX_DIR"
echo "[$TIMESTAMP] $MESSAGE" >> "$INBOX_DIR/${RECIPIENT}_inbox.txt"

# 送信完了メッセージ
echo "Message sent to $RECIPIENT at $TIMESTAMP"