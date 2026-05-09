#!/bin/bash
# AI 文本总结工具 - 后端启动脚本

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"

# 检查 .env 文件
if [ ! -f "$BACKEND_DIR/.env" ]; then
    echo "❌ 错误：backend/.env 文件不存在"
    echo "   请先创建 backend/.env 文件并设置 MINIMAX_API_KEY"
    exit 1
fi

# 启动后端服务（从项目根目录运行，这样 backend.* 导入路径才能找到）
cd "$SCRIPT_DIR"
echo "🚀 启动后端服务（端口 8000）..."
uvicorn backend.main:app --host 0.0.0.0 --port 8000
