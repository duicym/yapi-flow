<p align="center">
  <img src="https://img.shields.io/npm/v/yapi-flow?style=flat-square" alt="npm">
  <img src="https://img.shields.io/github/license/duicym/yapi-flow?style=flat-square" alt="license">
  <img src="https://img.shields.io/github/stars/duicym/yapi-flow?style=flat-square" alt="stars">
</p>

<h1 align="center">🔗 YApi Flow</h1>
<p align="center"><strong>AI-powered API Contract Factory + Full-stack Code Generation Engine</strong></p>
<p align="center">YApi Flow 将 YApi 从文档工具升维为研发流程的调度中心（Single Source of Truth）</p>

<p align="center">
  <a href="./README_zh-CN.md">中文文档</a> | 
  <a href="#quick-start">Quick Start</a> | 
  <a href="#pipeline">Pipeline</a> |
  <a href="https://github.com/duicym/yapi-flow/discussions">Discussions</a>
</p>

---

## Why YApi Flow?

传统前端开发中，从接口文档到类型声明的过程是手动的、割裂的。YApi Flow 打通了这个链路：

```
传统方式:
  PRD → 人工读 → 手写 Swagger → 人工导入 YApi → 手写 interface → 手写请求函数

YApi Flow:
  PRD --[AI]--> Swagger --[CLI]--> YApi --[CLI]--> TypeScript / Java / Go
```

| Feature | swagger-typescript-api | yapi-to-typescript | orval | **YApi Flow** |
|---------|----------------------|-------------------|-------|---------------|
| Source | Swagger file | YApi | OpenAPI spec | **PRD / NL / Swagger / YApi** |
| AI Contract Gen | ❌ | ❌ | ❌ | ✅ |
| YApi Integration | ❌ | ✅ | ❌ | ✅ |
| TypeScript | ✅ | ✅ | ✅ | ✅ |
| Java (Spring Boot) | ❌ | ❌ | ❌ | ✅ |
| Go (Gin) | ❌ | ❌ | ❌ | ✅ |
| Node.js | ❌ | ❌ | ❌ | ✅ |
| MSW Mock | ❌ | ❌ | ✅ | ✅ |
| Zod Validation | ❌ | ❌ | ✅ | ✅ |
| Pipeline Mode | ❌ | ❌ | ❌ | ✅ |

## Quick Start

```bash
# Install
npm install -g yapi-flow

# Initialize
yapi-flow init

# Set your YApi credentials in yapi-flow.config.ts, then:
yapi-flow generate
```

## Pipeline

YApi Flow 的四阶段流水线：

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  Stage 1     │    │  Stage 2     │    │  Stage 3     │    │  Stage 4     │
│  Contract    │───>│  Publish     │───>│  Frontend    │───>│  Backend     │
│              │    │              │    │              │    │              │
│  PRD/NL →    │    │  Swagger →   │    │  YApi →      │    │  YApi →      │
│  Swagger JSON│    │  YApi        │    │  TypeScript   │    │  Controller   │
└──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
      (AI)               (CLI)               (CLI)              (CLI)
```

### Stage 1: Contract Generation (AI)
```bash
yapi-flow contract "用户签到接口，入参需要userId和签到类型..."
```

### Stage 2: Publish to YApi
```bash
yapi-flow publish ./swagger.json --merge good
```

### Stage 3: Frontend Code Gen
```bash
yapi-flow generate --lang typescript
```
Generates: `types.ts` (interfaces), `client.ts` (axios/fetch requests), `mocks.ts` (MSW handlers)

### Stage 4: Backend Scaffold
```bash
yapi-flow generate --lang java,go
```
Generates: Controllers, DTOs with validation, ready for business logic.

## Generated Code Example

**Input** (YApi interface):
```json
{
  "path": "/api/user/sign-in",
  "method": "POST",
  "title": "用户签到"
}
```

**Output** (`types.ts`):
```typescript
/** 用户签到 */
export interface UserSignInRequest {
  /** 用户ID */
  userId: string
  /** 签到类型 */
  signType: 'NORMAL' | 'BONUS'
}

export interface UserSignInResponse {
  points: number
  streakDays: number
}
```

**Output** (`client.ts`):
```typescript
import { request } from '@/utils/request'

/** 用户签到 */
export async function userSignIn(data: UserSignInRequest): Promise<UserSignInResponse> {
  return request({ url: '/api/user/sign-in', method: 'POST', data })
}
```

## Configuration

```typescript
// yapi-flow.config.ts
import { defineConfig } from 'yapi-flow'

export default defineConfig({
  yapi: {
    serverUrl: 'http://yapi.example.com',
    token: process.env.YAPI_TOKEN!,
    projectId: 123,
  },
  generate: {
    outDir: './src/api/generated',
    targets: [
      {
        language: 'typescript',
        options: {
          client: 'axios',
          generateMSW: true,
          generateZod: true,
          importRequestFrom: '@/utils/request',
        },
      },
      {
        language: 'java',
        options: {
          framework: 'spring-boot',
          packageName: 'com.example.api',
          useLombok: true,
        },
      },
    ],
  },
})
```

## Commands

| Command | Description |
|---------|-------------|
| `yapi-flow init` | Initialize project config |
| `yapi-flow run` | Run full pipeline |
| `yapi-flow contract <input>` | Generate Swagger from PRD |
| `yapi-flow publish <file>` | Publish Swagger to YApi |
| `yapi-flow generate` | Generate code from YApi |
| `yapi-flow doctor` | Check environment |
| `yapi-flow config show` | View current config |

## Roadmap

- [x] Stage 2: YApi contract publishing
- [x] Stage 3: TypeScript generation (interface + client + MSW + Zod)
- [x] Stage 4: Java (Spring Boot), Go (Gin), Node.js (Express)
- [ ] Stage 1: AI-powered contract generation (GPT-4o / Claude)
- [ ] VS Code Extension
- [ ] Online Playground
- [ ] Feishu / Lark document parsing
- [ ] Custom template marketplace

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). Contributions welcome!

## License

MIT © [duicym](https://github.com/duicym)
