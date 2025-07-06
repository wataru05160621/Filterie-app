#!/bin/bash
# マルチエージェントデモの進捗モニタリングスクリプト

echo "=== マルチエージェントシステム デモ進捗状況 ==="
echo ""
echo "開始時刻: $(date)"
echo ""

# 各エージェントの完了報告をチェック
check_completion() {
    local agent=$1
    local file=$2
    if [ -f "$file" ]; then
        echo "✅ $agent: 完了"
        echo "   報告内容:"
        cat "$file" | sed 's/^/   /'
    else
        echo "⏳ $agent: 作業中..."
    fi
    echo ""
}

# 実装ファイルの存在チェック
echo "📁 実装ファイルの状態:"
if [ -f "apps/api/src/modules/health/hello.controller.ts" ]; then
    echo "✅ HelloController実装: 存在"
else
    echo "❌ HelloController実装: 未作成"
fi

if [ -f "apps/api/src/modules/health/hello.controller.spec.ts" ]; then
    echo "✅ Helloテスト: 存在"
else
    echo "❌ Helloテスト: 未作成"
fi
echo ""

echo "📊 エージェント進捗:"
check_completion "ARCHITECT" "demo/architect_completion.txt"
check_completion "TEST_ENGINEER" "demo/test_completion.txt"
check_completion "BACKEND_DEV" "demo/backend_completion.txt"
check_completion "QA_ENGINEER" "demo/qa_completion.txt"

# 全体の完了チェック
if [ -f "demo/completion_report.txt" ]; then
    echo "🎉 デモ完了!"
    echo "最終レポート:"
    cat "demo/completion_report.txt" | sed 's/^/  /'
else
    echo "🔄 デモ進行中..."
fi

echo ""
echo "更新時刻: $(date)"