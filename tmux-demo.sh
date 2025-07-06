#!/bin/bash

# tmuxマルチエージェントシステムのデモスクリプト

echo "🎬 Filterie tmuxマルチエージェントシステム デモ"
echo "================================================"
echo ""

# 各エージェントにメッセージを送信
echo "📨 各エージェントにタスクを送信中..."

# ARCHITECTへ
./agent-send-enhanced.sh architect "システム全体の設計レビューをお願いします。情報源管理システムのアーキテクチャを確認してください。"
sleep 1

# TEST_ENGINEERへ
./agent-send-enhanced.sh test_engineer "情報源管理APIのテストケースを作成してください。TDDアプローチで進めてください。"
sleep 1

# BACKEND_DEVへ
./agent-send-enhanced.sh backend_dev "GraphQL APIの情報源管理エンドポイントを実装してください。"
sleep 1

# FRONTEND_DEVへ
./agent-send-enhanced.sh frontend_dev "Next.js 15でダッシュボード画面の初期実装を開始してください。"
sleep 1

# QA_ENGINEERへ
./agent-send-enhanced.sh qa_engineer "コードレビューのチェックリストを作成してください。"
sleep 1

# PROJECT_MANAGERへ
./agent-send-enhanced.sh project_manager "全エージェントにタスクを配布しました。進捗を監視してください。"

echo ""
echo "✅ メッセージ送信完了"
echo ""
echo "📊 送信状況確認:"
echo "  通信ログ: logs/agent_communication.log"
echo "  各エージェントの受信箱: agent_inboxes/"
echo ""
echo "🖥️  tmuxセッションで確認:"
echo "  tmux attach -t multiagent      # エージェントの反応を確認"
echo "  tmux attach -t project_manager # プロジェクトマネージャーを確認"