# YApi Flow Skill for Claude Code

在 AI 对话中直接操作 YApi，支持契约发布、代码生成、文档导出、质量检查。

## 安装

```bash
# Claude Code
cp -r skills/yapi-flow ~/.claude/skills/yapi-flow

# 其他兼容 Claude Code skill 规范的 AI 工具同理
```

安装后在对话中直接触发：
- "把 swagger.json 发布到 YApi"
- "从 YApi 项目生成 TypeScript 代码"
- "导出 YApi 接口文档"
- "检查 YApi 接口质量"

## 配置

设置环境变量或在对话中提供：

```bash
export YAPI_BASE_URL=http://yapi.example.com
export YAPI_TOKEN=your-project-token
export YAPI_PROJECT_ID=123
```

## 脚本

| 脚本 | 功能 |
|------|------|
| `yapi-publish.mjs` | Swagger JSON → YApi 契约发布 |
| `yapi-generate.mjs` | YApi → TypeScript 代码生成 |
| `yapi-export.mjs` | YApi → Markdown 文档导出 |
| `yapi-check.mjs` | 接口规范质量检查 |
| `yapi-client.mjs` | YApi 11 个 API 全覆盖的客户端 |
