# AI 文本总结工具

一个简单的 AI 文本总结工具，支持粘贴文本并自动提炼核心内容和关键词。

## 功能

- ✅ 粘贴或输入文本进行 AI 总结
- ✅ 自动提取 3-5 个关键词
- ✅ 一键复制总结结果
- ✅ 支持中长文本（最大 3000 字）
- ✅ 响应式设计，移动端可用

## 技术栈

- **后端**: FastAPI + Python
- **前端**: 原生 HTML/CSS/JavaScript
- **AI**: MiniMax API (abab6.5s-chat)

## 项目结构

```
ai-text-summary/
├── backend/
│   ├── main.py              # FastAPI 入口
│   ├── router/
│   │   └── summary.py       # /api/summary 路由
│   ├── service/
│   │   └── llm.py           # MiniMax API 调用
│   └── prompt/
│       └── summary_prompt.py # Prompt 模板
├── frontend/
│   ├── index.html           # 主页面
│   ├── style.css            # 样式
│   └── app.js               # 前端逻辑
├── requirements.txt
└── README.md
```

## 快速开始

### 1. 安装依赖

```bash
cd ai-text-summary
pip install -r requirements.txt
```

### 2. 配置 API Key

```bash
export MINIMAX_API_KEY="your-api-key-here"
```

### 3. 启动后端

```bash
cd backend
uvicorn main:app --reload --port 8000
```

### 4. 打开前端

直接双击打开 `frontend/index.html`，或者：

```bash
cd frontend
python3 -m http.server 8080
```

然后访问 http://localhost:8080

## API 接口

### POST /api/summary

文本总结接口

**请求参数：**
```json
{
  "text": "要总结的文本内容",
  "mode": "normal"
}
```

**响应：**
```json
{
  "success": true,
  "summary": "总结内容...",
  "keywords": ["关键词1", "关键词2", "关键词3"],
  "word_count": 123
}
```

## 开发笔记

### Prompt 迭代记录

**v1.0** - 初始版本
- 问题：AI 总结过长，不够简洁
- 改进：加入每句不超过 30 字限制

**v1.1** - 格式稳定性
- 问题：输出格式不统一，有时没有"总结："前缀
- 改进：强化输出格式要求，增加解析降级逻辑

## License

MIT
