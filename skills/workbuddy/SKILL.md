---
name: yapi-flow-skill
description: "YApi 全流程操作技能。将 YApi 从文档工具升级为研发流调度中心。支持：发布 Swagger 到 YApi（契约发布）、从 YApi 拉取接口生成 TypeScript/Java/Go 代码、导出接口文档为 Markdown、接口质量检查。Use when user mentions: YApi操作、发布接口、生成接口代码、导出API文档、接口质量检查、Swagger导入、yapi-flow。需要配置 YApi 服务器地址和项目 token。"
agent_created: true
---

# YApi Flow Skill (Claude Code)

将 YApi 从文档工具升级为研发流调度中心（Single Source of Truth）。支持契约发布、代码生成、文档导出、质量检查四大能力。

## 前置条件

用户需提供 YApi 配置：
- `YAPI_BASE_URL` — YApi 服务地址（如 `http://yapi.example.com`）
- `YAPI_TOKEN` — 项目 Token（在 YApi 项目设置中获取）
- `YAPI_PROJECT_ID` — 项目 ID

优先从环境变量或项目配置文件 `yapi-flow.config.ts` 读取，没有则询问用户。

## 能力一：契约发布（Swagger → YApi）

将 Swagger/OpenAPI JSON 文件发布到 YApi，自动生成 Mock 数据。

### 触发词
"发布接口文档"、"同步 Swagger"、"导入 YApi"、"发布到 YApi"、"契约发布"

### 执行方式

```bash
node scripts/yapi-publish.mjs --base-url $YAPI_BASE_URL --token $YAPI_TOKEN \
  --file ./swagger.json --merge merge
```

合并策略：
- `merge`（默认）：完全覆盖，适合每次全量同步
- `good`：智能合并，保留人工修改的字段
- `normal`：普通模式

### 输出
- 导入成功/失败状态
- 导入前后接口数量变化
- 新增/修改/删除的接口列表

## 能力二：代码生成（YApi → TypeScript/Java/Go）

从 YApi 拉取接口定义，生成类型声明和请求函数。

### 触发词
"生成接口代码"、"生成 TypeScript 类型"、"从 YApi 生成代码"、"生成前端接口"

### 执行方式

```bash
node scripts/yapi-generate.mjs --base-url $YAPI_BASE_URL --token $YAPI_TOKEN \
  --project-id $YAPI_PROJECT_ID --lang typescript --output ./src/api
```

选项：
- `--lang typescript|java|go` 目标语言
- `--client axios|fetch` HTTP 客户端类型（仅 TS）
- `--output <path>` 输出目录

### 产出文件
- `types.ts` — 完整的接口类型声明
- `client.ts` — 封装好的请求函数
- 按分类组织，含完整 JSDoc 注释

### 示例对话
用户："帮我从 YApi 项目 123 生成 TypeScript 代码，用 axios"
→ 执行生成脚本 → 将生成的文件写入用户项目目录

## 能力三：文档导出（YApi → Markdown）

从 YApi 导出完整接口文档为 Markdown 文件。

### 触发词
"导出接口文档"、"导出 API 文档"、"生成接口文档"、"API 文档"

### 执行方式

```bash
node scripts/yapi-export.mjs --base-url $YAPI_BASE_URL --token $YAPI_TOKEN \
  --project-id $YAPI_PROJECT_ID --output ./api-docs.md
```

### 产出
- 结构化 Markdown 文档，按分类组织
- 含请求参数表格、响应示例
- 目录导航

## 能力四：接口质量检查

扫描 YApi 项目所有接口，检查规范性问题。

### 触发词
"检查接口质量"、"接口规范检查"、"接口 review"

### 执行方式

```bash
node scripts/yapi-check.mjs --base-url $YAPI_BASE_URL --token $YAPI_TOKEN \
  --project-id $YAPI_PROJECT_ID
```

### 检查项
- 接口状态（是否 done）
- HTTP 方法规范性
- 路径格式（是否以 / 开头）
- 响应示例完整性
- 参数类型定义完整性
- 接口描述是否为空

### 产出
- 评分报告（100 分制）
- 按严重级别分类的问题清单

## 配置持久化

首次使用时，将用户的 YApi 配置写入项目配置文件 `yapi-flow.config.json`：

```json
{
  "yapi": {
    "serverUrl": "http://yapi.example.com",
    "token": "xxx",
    "projectId": 123
  },
  "publish": { "mergeStrategy": "merge" },
  "generate": {
    "outDir": "./src/api/generated",
    "targets": [{ "language": "typescript" }]
  }
}
```

后续操作自动读取该配置，无需重复输入。

## 参考

完整 YApi OpenAPI 文档见 `references/api-reference.md`。
