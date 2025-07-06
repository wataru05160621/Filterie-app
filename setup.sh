#!/bin/bash

# 🚀 Filterie開発用マルチエージェントシステム環境構築
# TDD開発フローに基づいたエージェント配置

set -e  # エラー時に停止

# 色付きログ関数
log_info() {
    echo -e "\033[1;32m[INFO]\033[0m $1"
}

log_success() {
    echo -e "\033[1;34m[SUCCESS]\033[0m $1"
}

echo "🤖 Filterie開発用マルチエージェントシステム環境構築"
echo "==================================================="
echo ""

# STEP 1: 既存セッションクリーンアップ
log_info "🧹 既存セッションクリーンアップ開始..."

tmux kill-session -t multiagent 2>/dev/null && log_info "multiagentセッション削除完了" || log_info "multiagentセッションは存在しませんでした"
tmux kill-session -t president 2>/dev/null && log_info "presidentセッション削除完了" || log_info "presidentセッションは存在しませんでした"

# 完了ファイルクリア
mkdir -p ./tmp
rm -f ./tmp/worker*_done.txt 2>/dev/null && log_info "既存の完了ファイルをクリア" || log_info "完了ファイルは存在しませんでした"

log_success "✅ クリーンアップ完了"
echo ""

# STEP 2: multiagentセッション作成（5ペイン：ARCHITECT + TEST_ENGINEER + BACKEND_DEV + FRONTEND_DEV + QA_ENGINEER）
log_info "📺 multiagentセッション作成開始 (5ペイン)..."

# セッション作成
log_info "セッション作成中..."
tmux new-session -d -s multiagent -n "agents"

# セッション作成の確認
if ! tmux has-session -t multiagent 2>/dev/null; then
    echo "❌ エラー: multiagentセッションの作成に失敗しました"
    exit 1
fi

log_info "セッション作成成功"

# 5ペイン作成（3上 + 2下）
log_info "グリッド作成中..."

# まず垂直に分割（上下）
log_info "垂直分割実行中..."
tmux split-window -v -t "multiagent:agents" -p 40

# 上側を3分割
log_info "上側3分割実行中..."
tmux select-pane -t "multiagent:agents" -U
tmux split-window -h -p 66
tmux split-window -h -p 50

# 下側を2分割
log_info "下側2分割実行中..."
tmux select-pane -t "multiagent:agents" -D
tmux split-window -h -p 50

# ペインの配置確認
log_info "ペイン配置確認中..."
PANE_COUNT=$(tmux list-panes -t "multiagent:agents" | wc -l)
log_info "作成されたペイン数: $PANE_COUNT"

if [ "$PANE_COUNT" -ne 5 ]; then
    echo "❌ エラー: 期待されるペイン数(5)と異なります: $PANE_COUNT"
    exit 1
fi

# ペインの物理的な配置を取得（top-leftから順番に）
log_info "ペイン番号取得中..."
# tmuxのペイン番号を位置に基づいて取得
PANE_IDS=($(tmux list-panes -t "multiagent:agents" -F "#{pane_id}" | sort))

log_info "検出されたペイン: ${PANE_IDS[*]}"

# ペインタイトル設定とセットアップ
log_info "ペインタイトル設定中..."
PANE_TITLES=("ARCHITECT" "TEST_ENGINEER" "BACKEND_DEV" "FRONTEND_DEV" "QA_ENGINEER")

for i in {0..4}; do
    PANE_ID="${PANE_IDS[$i]}"
    TITLE="${PANE_TITLES[$i]}"
    
    log_info "設定中: ${TITLE} (${PANE_ID})"
    
    # ペインタイトル設定
    tmux select-pane -t "$PANE_ID" -T "$TITLE"
    
    # 作業ディレクトリ設定
    tmux send-keys -t "$PANE_ID" "cd $(pwd)" C-m
    
    # カラープロンプト設定
    case $i in
        0) # ARCHITECT: 紫色
            tmux send-keys -t "$PANE_ID" "export PS1='(\[\033[1;35m\]${TITLE}\[\033[0m\]) \[\033[1;32m\]\w\[\033[0m\]\$ '" C-m
            ;;
        1) # TEST_ENGINEER: 赤色
            tmux send-keys -t "$PANE_ID" "export PS1='(\[\033[1;31m\]${TITLE}\[\033[0m\]) \[\033[1;32m\]\w\[\033[0m\]\$ '" C-m
            ;;
        2) # BACKEND_DEV: 青色
            tmux send-keys -t "$PANE_ID" "export PS1='(\[\033[1;34m\]${TITLE}\[\033[0m\]) \[\033[1;32m\]\w\[\033[0m\]\$ '" C-m
            ;;
        3) # FRONTEND_DEV: シアン色
            tmux send-keys -t "$PANE_ID" "export PS1='(\[\033[1;36m\]${TITLE}\[\033[0m\]) \[\033[1;32m\]\w\[\033[0m\]\$ '" C-m
            ;;
        4) # QA_ENGINEER: 黄色
            tmux send-keys -t "$PANE_ID" "export PS1='(\[\033[1;33m\]${TITLE}\[\033[0m\]) \[\033[1;32m\]\w\[\033[0m\]\$ '" C-m
            ;;
    esac
    
    # ウェルカムメッセージ
    tmux send-keys -t "$PANE_ID" "echo '=== ${TITLE} エージェント ==='" C-m
done

log_success "✅ multiagentセッション作成完了"
echo ""

# STEP 3: project_managerセッション作成（1ペイン）
log_info "👑 project_managerセッション作成開始..."

tmux new-session -d -s project_manager
tmux send-keys -t project_manager "cd $(pwd)" C-m
tmux send-keys -t project_manager "export PS1='(\[\033[1;35m\]PROJECT_MANAGER\[\033[0m\]) \[\033[1;32m\]\w\[\033[0m\]\$ '" C-m
tmux send-keys -t project_manager "echo '=== PROJECT MANAGER セッション ==='" C-m
tmux send-keys -t project_manager "echo 'Filterie開発プロジェクトマネージャー'" C-m
tmux send-keys -t project_manager "echo '===================================='" C-m

log_success "✅ project_managerセッション作成完了"
echo ""

# STEP 4: 環境確認・表示
log_info "🔍 環境確認中..."

echo ""
echo "📊 セットアップ結果:"
echo "==================="

# tmuxセッション確認
echo "📺 Tmux Sessions:"
tmux list-sessions
echo ""

# ペイン構成表示
echo "📋 ペイン構成:"
echo "  multiagentセッション（5ペイン）:"
tmux list-panes -t "multiagent:agents" -F "    Pane #{pane_id}: #{pane_title}"
echo ""
echo "  project_managerセッション（1ペイン）:"
echo "    Pane: PROJECT_MANAGER (開発プロジェクト管理)"

echo ""
log_success "🎉 Demo環境セットアップ完了！"
echo ""
echo "📋 次のステップ:"
echo "  1. 🔗 セッションアタッチ:"
echo "     tmux attach-session -t multiagent        # 開発エージェント確認"
echo "     tmux attach-session -t project_manager   # プロジェクトマネージャー確認"
echo ""
echo "  2. 🤖 Claude Code起動:"
echo "     # 手順1: Project Manager認証"
echo "     tmux send-keys -t project_manager 'claude' C-m"
echo "     # 手順2: 認証後、multiagent一括起動"
echo "     # 各ペインのIDを使用してclaudeを起動"
echo "     tmux list-panes -t multiagent:agents -F '#{pane_id}' | while read pane; do"
echo "         tmux send-keys -t \"\$pane\" 'claude' C-m"
echo "     done"
echo ""
echo "  3. 📜 指示書確認:"
echo "     ARCHITECT: instructions/architect.md"
echo "     TEST_ENGINEER: instructions/test_engineer.md"
echo "     BACKEND_DEV: instructions/backend_dev.md"
echo "     FRONTEND_DEV: instructions/frontend_dev.md"
echo "     QA_ENGINEER: instructions/qa_engineer.md"
echo "     開発システム: DEVELOPMENT_AGENT_SYSTEM.md"
echo ""
echo "  4. 🎯 デモ実行: PROJECT_MANAGERに開発タスクを指示"

