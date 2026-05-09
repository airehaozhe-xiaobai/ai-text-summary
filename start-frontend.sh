#!/bin/bash
# AI 文本总结工具 - 前端启动脚本

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$SCRIPT_DIR/frontend"
BACKEND_RUNNING=$(curl -s http://localhost:8000/health 2>/dev/null || echo "down")

if [ "$BACKEND_RUNNING" != "down" ]; then
    echo "⚠️  后端服务已在运行（端口 8000）"
else
    echo "⚠️  后端服务未运行，请先执行：./start-backend.sh"
fi

echo "🌐 启动前端服务..."
echo "   打开浏览器访问：http://localhost:8080"
echo "   按 Ctrl+C 停止服务"
echo ""

cd "$FRONTEND_DIR" && python3 -m http.server 8080
